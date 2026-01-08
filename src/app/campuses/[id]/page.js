"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCampusById, getHealthStatus, getIssues, createIssue, resolveIssue, updateIssueStatus } from '@/lib/api';
import { calculateHealthSummary } from '@/lib/metrics';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import SpiralBackground from '@/components/SpiralBackground';
import Map from '@/components/Map';
import { MapPin, Activity, Clock, ShieldCheck, AlertCircle, Send, CheckCircle, BarChart3, TrendingUp, Zap, PlusCircle, Shield, Timer, Megaphone } from 'lucide-react';
import AuditTrail from '@/components/AuditTrail';
import SLATimer from '@/components/SLATimer';
import { collection, query, where, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const NotFoundView = ({ id, errorMsg }) => (
    <motion.div
        className="not-found-container"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ textAlign: 'center', padding: '100px 20px' }}
    >
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔍</div>
        <h2 className="gradient-text">Campus Not Found</h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: '10px' }}>
            We couldn't find the location <strong>"{id}"</strong>.
        </p>
        {errorMsg && (
            <div style={{ marginTop: '20px', padding: '10px', background: 'rgba(248, 113, 113, 0.1)', borderRadius: '8px', color: '#f87171', fontSize: '14px' }}>
                Reason: {errorMsg}
            </div>
        )}
        <button
            className="gradient-btn"
            style={{ marginTop: '30px' }}
            onClick={() => window.location.href = `/campuses/${id}?force=true&t=${Date.now()}`}
        >
            Force Sync & Retry
        </button>
    </motion.div>
);

// --- SIREN MODAL ---
const SirenModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    useEffect(() => {
        // Sound Effect using Web Audio API (Siren)
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sawtooth';
        oscillator.frequency.value = 800;
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // Siren LFO
        const lfo = audioCtx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 1; // 1Hz siren cycle
        const lfoGain = audioCtx.createGain();
        lfoGain.gain.value = 400; // Modulate frequency by +/- 400Hz
        lfo.connect(lfoGain);
        lfoGain.connect(oscillator.frequency);

        const now = audioCtx.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.1);

        oscillator.start();
        lfo.start();

        const stopTime = now + 4; // Play for 4 seconds loop if not closed
        gainNode.gain.setTargetAtTime(0, stopTime - 0.5, 0.1);
        oscillator.stop(stopTime);
        lfo.stop(stopTime);

        return () => {
            try {
                oscillator.stop();
                audioCtx.close();
            } catch (e) { }
        };
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse-bg 1s infinite alternate'
        }}>
            <style jsx global>{`
                @keyframes pulse-bg {
                    from { background: rgba(50,0,0,0.9); box-shadow: inset 0 0 50px rgba(0,0,0,0.5); }
                    to { background: rgba(100,0,0,0.95); box-shadow: inset 0 0 150px red; }
                }
                @keyframes shake {
                    0% { transform: translate(1px, 1px) rotate(0deg); }
                    10% { transform: translate(-1px, -2px) rotate(-1deg); }
                    20% { transform: translate(-3px, 0px) rotate(1deg); }
                    30% { transform: translate(3px, 2px) rotate(0deg); }
                    40% { transform: translate(1px, -1px) rotate(1deg); }
                    50% { transform: translate(-1px, 2px) rotate(-1deg); }
                    60% { transform: translate(-3px, 1px) rotate(0deg); }
                    70% { transform: translate(3px, 1px) rotate(-1deg); }
                    80% { transform: translate(-1px, -1px) rotate(1deg); }
                    90% { transform: translate(1px, 2px) rotate(0deg); }
                    100% { transform: translate(1px, -2px) rotate(-1deg); }
                }
            `}</style>

            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                    background: '#000',
                    border: '2px solid #ef4444',
                    padding: '40px',
                    borderRadius: '20px',
                    textAlign: 'center',
                    maxWidth: '500px',
                    width: '90%',
                    boxShadow: '0 0 50px #ef4444',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Spinning Siren Light */}
                <div style={{
                    position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
                    background: 'conic-gradient(transparent, rgba(255,0,0,0.3), transparent)',
                    animation: 'spin 2s linear infinite',
                    pointerEvents: 'none'
                }} />

                <Megaphone size={64} color="#ef4444" style={{ marginBottom: '24px', animation: 'shake 0.5s infinite' }} />

                <h2 style={{ fontSize: '2rem', color: '#ef4444', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '2px' }}>
                    Emergency Escalation
                </h2>
                <div style={{ padding: '4px 12px', background: '#ef4444', color: 'white', fontWeight: 'bold', display: 'inline-block', borderRadius: '4px', marginBottom: '24px' }}>
                    DISTRICT AUTHORITY PROTOCOL
                </div>

                <p style={{ color: '#d1d5db', fontSize: '1.1rem', marginBottom: '32px', lineHeight: '1.6' }}>
                    You are about to officially forward this issue to the <strong>District Education Officer</strong>. This action triggers immediate government audit compliance protocols.
                    <br /><br />
                    <em style={{ color: '#ef4444' }}>This action cannot be undone.</em>
                </p>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '12px 24px',
                            background: 'transparent',
                            border: '1px solid #525252',
                            color: '#a3a3a3',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '600'
                        }}
                    >
                        Cancel Protocol
                    </button>
                    <button
                        onClick={onConfirm}
                        className="pulse-btn"
                        style={{
                            padding: '12px 32px',
                            background: '#ef4444',
                            border: 'none',
                            color: 'white',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)'
                        }}
                    >
                        CONFIRM ESCALATION
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default function CampusDetail() {
    const params = useParams();
    const id = params.id;
    const router = useRouter();
    const { user } = useAuth();
    const [campus, setCampus] = useState(null);
    const [health, setHealth] = useState(null);
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Modal state
    const [showEscalationModal, setShowEscalationModal] = useState(false);
    const [escalationTargetId, setEscalationTargetId] = useState(null);

    // Form state
    const [issueTitle, setIssueTitle] = useState('');
    const [issueDesc, setIssueDesc] = useState('');
    const [issueSeverity, setIssueSeverity] = useState('medium');
    const [submitting, setSubmitting] = useState(false);
    const [derivedHealth, setDerivedHealth] = useState(null);

    // ... (rest of useEffects remain the same) ...

    useEffect(() => {
        if (!user) {
            router.push('/');
            // Small delay to ensure redirect happens before trying to click login
            setTimeout(() => {
                const loginBtn = document.querySelector('.login-btn');
                if (loginBtn) loginBtn.click();
            }, 500);
            return;
        }

        if (!id) return;

        // Trigger SLA check (Lazy monitor)
        const triggerSLACheck = async () => {
            try {
                const response = await fetch('/api/admin/sla-check');
                const data = await response.json();
                if (data.breached > 0) {
                    console.log(`[SLA] ${data.breached} breaches processed and escalated.`);
                }
            } catch (e) {
                console.error('SLA Check Error:', e);
            }
        };
        triggerSLACheck();

        let unsubscribeIssues = () => { };
        let unsubscribeCampus = () => { };

        async function initData() {
            try {
                setLoading(true);

                // Set up real-time listener for campus doc (Health Status)
                const campusRef = doc(db, 'campuses', id);
                unsubscribeCampus = onSnapshot(campusRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setCampus({ id: docSnap.id, ...docSnap.data() });
                        console.log(`[FRONTEND] Campus real-time update: ${docSnap.id}`);
                    } else {
                        setError("Campus not found in real-time sync.");
                    }
                });

                // Setup real-time listener for issues
                const q = query(
                    collection(db, 'issues'),
                    where('campusId', '==', id)
                );

                console.log(`Setting up Firestore real-time listener (User role: ${user?.role || 'none'})...`);
                unsubscribeIssues = onSnapshot(q, (snapshot) => {
                    const issuesList = snapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            ...data,
                            createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString())
                        };
                    });

                    // Client-side aging calculation for real-time consistency
                    const now = new Date();
                    const processedIssues = issuesList.map(issue => {
                        const createdAt = new Date(issue.createdAt);
                        const ageInDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
                        return {
                            ...issue,
                            ageInDays,
                            isAged: (issue.status || 'open').toLowerCase() !== 'resolved' && ageInDays > 7
                        };
                    });

                    const sortedIssues = processedIssues.sort((a, b) => {
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    });

                    setIssues(sortedIssues);

                    // --- SELF-HEALING DASHBOARD LOGIC ---
                    const localStats = calculateHealthSummary(sortedIssues);
                    setDerivedHealth(localStats);

                    if (sortedIssues.filter(i => i.status === 'open').length === 0 && localStats.score === 100) {
                        // Force sync backend to match local reality
                        fetch(`/api/campuses/${id}/health`).catch(err => console.error("Self-healing sync failed:", err));
                    }
                    console.log(`Real-time update: ${sortedIssues.length} issues. Local Health: ${localStats.score}`);
                }, (err) => {
                    console.error('Real-time sync error (critical):', err);
                });

            } catch (err) {
                console.error('Error fetching initial data:', err);
                setError(err.message || "Network failure");
            } finally {
                setLoading(false);
            }
        }

        initData();

        return () => {
            if (unsubscribeIssues) unsubscribeIssues();
            if (unsubscribeCampus) unsubscribeCampus();
        };
    }, [id, user?.uid, user?.role]);

    const handleReportIssue = async (e) => {
        e.preventDefault();
        if (!issueTitle || !issueDesc) return;

        try {
            setSubmitting(true);
            const res = await createIssue({
                campusId: id,
                userId: user?.uid || 'user_anonymous',
                reportedBy: user?.name || 'Anonymous User',
                title: issueTitle,
                description: issueDesc,
                severity: issueSeverity
            });
            if (res.success) {
                setIssueTitle('');
                setIssueDesc('');
                setIssueSeverity('medium');
            }
        } catch (err) {
            console.error('Failed to report issue:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleResolve = async (issueId) => {
        try {
            await resolveIssue(issueId, { userId: user?.uid, role: user?.role });
            // Result will sync via onSnapshot
        } catch (err) {
            console.error('Failed to resolve issue:', err);
        }
    };

    const handleStatusUpdate = async (issueId, status) => {
        try {
            await updateIssueStatus(issueId, status, null, { userId: user?.uid, role: user?.role });
        } catch (err) {
            console.error(`Failed to update status to ${status}:`, err);
        }
    };

    // Modified helper to open the custom modal
    const handleEscalateClick = (issueId) => {
        setEscalationTargetId(issueId);
        setShowEscalationModal(true);
    };

    // Actual logic executed on modal confirmation
    const confirmEscalation = async () => {
        if (!escalationTargetId) return;

        // Close modal immediately to stop sound, let optimistics or loading handle usage if needed
        setShowEscalationModal(false);

        try {
            const res = await fetch(`/api/issues/${escalationTargetId}/escalate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.uid, role: user?.role, level: 'district' })
            });
            if (!res.ok) throw new Error("Escalation failed");
            setEscalationTargetId(null);
        } catch (err) {
            alert("Failed to escalate: " + err.message);
        }
    };

    const openIssuesCount = issues.filter(i => i.status === 'open').length;

    return (
        <main className="main-container">
            <SpiralBackground />

            <SirenModal
                isOpen={showEscalationModal}
                onClose={() => setShowEscalationModal(false)}
                onConfirm={confirmEscalation}
            />

            <section className="section-inner" style={{ paddingTop: '120px', minHeight: '80vh' }}>
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="loading-state"
                        >
                            <div className="shimmer-card" style={{ height: '400px', borderRadius: '32px' }} />
                        </motion.div>
                    ) : error || !campus ? (
                        <NotFoundView key="not-found" id={id} errorMsg={error === true ? "Network failure" : error} />
                    ) : (
                        <motion.div
                            key="content"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="campus-detail-content"
                        >
                            <div className="detail-header">
                                <motion.h1
                                    className="gradient-text hero-title"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '16px' }}
                                >
                                    {campus.name}
                                </motion.h1>
                                <div className="location-badge" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    fontSize: '1.2rem'
                                }}>
                                    <MapPin size={20} />
                                    <span>{campus.city}, {campus.state}</span>
                                </div>
                                {user && (
                                    <div style={{
                                        marginTop: '12px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '4px 12px',
                                        background: 'rgba(99, 102, 241, 0.1)',
                                        border: '1px solid rgba(99, 102, 241, 0.2)',
                                        borderRadius: '20px',
                                        fontSize: '0.9rem',
                                        color: '#818cf8'
                                    }}>
                                        <ShieldCheck size={16} />
                                        <span style={{ textTransform: 'capitalize' }}>Authenticated as: <strong>{user.name || 'User'} ({user.role || 'No Role'})</strong></span>
                                    </div>
                                )}
                            </div>

                            <div className="dashboard-grid" style={{
                                display: 'grid',
                                gridTemplateColumns: user?.role === 'admin' ? '1fr' : '1fr 1.5fr',
                                gap: '32px',
                                marginTop: '60px'
                            }}>
                                {/* Health Status Card */}
                                <motion.div
                                    className="glass-card"
                                    whileHover={{ y: -5 }}
                                    style={{ padding: '32px' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Activity size={20} color="#6366f1" />
                                            Operational Status
                                        </h3>
                                        <span className="status-indicator" style={{
                                            background: (derivedHealth?.score ?? campus.healthSummary?.score) >= 80 ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                                            color: (derivedHealth?.score ?? campus.healthSummary?.score) >= 80 ? '#4ade80' : '#f87171',
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            border: `1px solid ${(derivedHealth?.score ?? campus.healthSummary?.score) >= 80 ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.2)'}`
                                        }}>
                                            {(derivedHealth?.score ?? campus.healthSummary?.score) >= 80 ? '✓ Healthy' : '⚠ Action Required'}
                                        </span>
                                    </div>
                                    <div className="metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '16px' }}>
                                        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', textAlign: 'center' }}>
                                            <div style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Health Score</div>
                                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#6366f1' }}>{derivedHealth?.score ?? campus.healthSummary?.score}/100</div>
                                        </div>
                                        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', textAlign: 'center' }}>
                                            <div style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>SLA Compliance</div>
                                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fbbf24' }}>{derivedHealth?.slaCompliance ?? campus.healthSummary?.slaCompliance ?? 100}%</div>
                                        </div>
                                        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', textAlign: 'center' }}>
                                            <div style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Resolution</div>
                                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>{derivedHealth?.resolvedPercentage ?? campus.healthSummary?.resolvedPercentage}%</div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* System Security Card */}
                                <motion.div
                                    className="glass-card"
                                    whileHover={{ y: -5 }}
                                    style={{ padding: '32px' }}
                                >
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                                        <ShieldCheck size={20} color="#4ade80" />
                                        Facility Protection
                                    </h3>
                                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', lineHeight: '1.6' }}>
                                        All campus systems are currently protected by our robust facility operations engine.
                                    </p>
                                    <div style={{ marginTop: '20px', fontSize: '14px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <ShieldCheck size={16} /> Fully Verified Systems
                                    </div>
                                </motion.div>

                                {/* Issues Summary Card */}
                                <motion.div
                                    className="glass-card"
                                    whileHover={{ y: -5 }}
                                    style={{ padding: '32px' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <AlertCircle size={20} color="#f87171" />
                                            Active Issues
                                        </h3>
                                        <span style={{
                                            background: 'rgba(248, 113, 113, 0.2)',
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '14px',
                                            fontWeight: '700',
                                            color: '#f87171'
                                        }}>
                                            {issues.filter(i => i.status === 'open').length} Open
                                        </span>
                                    </div>
                                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
                                        Reported system anomalies or facility maintenance requests are tracked here.
                                    </p>
                                </motion.div>
                            </div>

                            <div className="issues-management-section" style={{ marginTop: '80px' }}>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: user?.role === 'admin' ? '1fr' : '1fr 1.5fr',
                                    gap: '40px'
                                }}>
                                    {/* Report Form - Hidden for Admin */}
                                    {user?.role !== 'admin' && (
                                        <motion.div
                                            className="glass-card"
                                            style={{ padding: '40px' }}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                        >
                                            <h2 className="gradient-text" style={{ fontSize: '1.8rem', marginBottom: '24px' }}>Report Anomaly</h2>
                                            <form onSubmit={handleReportIssue} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                <div className="input-group">
                                                    <label>Title</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Brief issue title..."
                                                        value={issueTitle}
                                                        onChange={(e) => setIssueTitle(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="input-group">
                                                    <label>Description</label>
                                                    <textarea
                                                        rows="4"
                                                        placeholder="Detailed description..."
                                                        value={issueDesc}
                                                        onChange={(e) => setIssueDesc(e.target.value)}
                                                        style={{
                                                            background: 'rgba(255, 255, 255, 0.05)',
                                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                                            borderRadius: '12px',
                                                            padding: '12px',
                                                            color: 'white',
                                                            resize: 'none'
                                                        }}
                                                        required
                                                    />
                                                </div>
                                                <div className="input-group">
                                                    <label>Severity</label>
                                                    <select
                                                        value={issueSeverity}
                                                        onChange={(e) => setIssueSeverity(e.target.value)}
                                                        style={{
                                                            background: 'rgba(255, 255, 255, 0.05)',
                                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                                            borderRadius: '12px',
                                                            padding: '12px',
                                                            color: 'white'
                                                        }}
                                                    >
                                                        <option value="low" style={{ background: '#1a1b1e' }}>Low - Minor inconvenience</option>
                                                        <option value="medium" style={{ background: '#1a1b1e' }}>Medium - Needs attention soon</option>
                                                        <option value="high" style={{ background: '#1a1b1e' }}>High - Critical / Dangerous</option>
                                                    </select>
                                                </div>
                                                <button
                                                    className="gradient-btn"
                                                    type="submit"
                                                    disabled={submitting}
                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                                >
                                                    <Send size={18} />
                                                    {submitting ? 'Submitting...' : 'Send Report'}
                                                </button>
                                            </form>
                                        </motion.div>
                                    )}

                                    {/* Issues List Container */}
                                    <motion.div
                                        className="glass-card"
                                        style={{ padding: '40px' }}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                            <h2 className="gradient-text" style={{ fontSize: '1.8rem', margin: 0 }}>
                                                {user?.role === 'admin' ? 'Admin Issue Dashboard' : 'Issue Log'}
                                            </h2>

                                            {user?.role === 'admin' && (
                                                <div style={{ display: 'flex', gap: '16px' }}>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>Resolution Rate</div>
                                                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4ade80' }}>
                                                            {issues.length > 0 ? Math.round(((issues.length - openIssuesCount) / issues.length) * 100) : 0}%
                                                        </div>
                                                    </div>
                                                    <BarChart3 size={24} color="#6366f1" />
                                                </div>
                                            )}
                                        </div>

                                        {user?.role === 'admin' && (
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                                gap: '20px',
                                                marginBottom: '32px',
                                                padding: '20px',
                                                background: 'rgba(99, 102, 241, 0.05)',
                                                borderRadius: '16px',
                                                border: '1px solid rgba(99, 102, 241, 0.1)'
                                            }}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>{issues.length}</div>
                                                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Total Issues</div>
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#f87171' }}>{openIssuesCount}</div>
                                                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Pending</div>
                                                </div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#4ade80' }}>{issues.length - openIssuesCount}</div>
                                                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>Resolved</div>
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '600px', overflowY: 'auto', paddingRight: '10px' }}>
                                            {issues.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255, 255, 255, 0.2)' }}>
                                                    <AlertCircle size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                                                    <p>Everything looks clear. No active issues in this campus.</p>
                                                </div>
                                            ) : (
                                                issues.map(issue => (
                                                    <motion.div
                                                        key={issue.id}
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        style={{
                                                            padding: '24px',
                                                            background: issue.status === 'open' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(74, 222, 128, 0.02)',
                                                            borderRadius: '20px',
                                                            border: `1px solid ${issue.status === 'open' ? (issue.slaStatus === 'breached' ? 'rgba(248, 113, 113, 0.3)' : 'rgba(255, 255, 255, 0.05)') : 'rgba(74, 222, 128, 0.1)'}`,
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'flex-start',
                                                            transition: 'all 0.3s ease',
                                                            boxShadow: issue.slaStatus === 'breached' ? 'inset 0 0 20px rgba(248, 113, 113, 0.05)' : 'none'
                                                        }}
                                                    >
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                    <h4 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>{issue.title}</h4>
                                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                                        <span style={{
                                                                            fontSize: '10px',
                                                                            background: issue.status === 'open' ? 'rgba(248, 113, 113, 0.1)' : 'rgba(74, 222, 128, 0.1)',
                                                                            color: issue.status === 'open' ? '#f87171' : '#4ade80',
                                                                            padding: '4px 10px',
                                                                            borderRadius: '8px',
                                                                            textTransform: 'uppercase',
                                                                            fontWeight: '800',
                                                                            letterSpacing: '0.05em',
                                                                            border: `1px solid ${issue.status === 'open' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(74, 222, 128, 0.2)'}`
                                                                        }}>
                                                                            {issue.status}
                                                                        </span>
                                                                        <span style={{
                                                                            fontSize: '10px',
                                                                            background: issue.severity === 'high' ? 'rgba(239, 68, 68, 0.1)' :
                                                                                issue.severity === 'medium' ? 'rgba(234, 179, 8, 0.1)' :
                                                                                    'rgba(99, 102, 241, 0.1)',
                                                                            color: issue.severity === 'high' ? '#f87171' :
                                                                                issue.severity === 'medium' ? '#fbbf24' :
                                                                                    '#818cf8',
                                                                            padding: '4px 10px',
                                                                            borderRadius: '8px',
                                                                            textTransform: 'uppercase',
                                                                            fontWeight: '800',
                                                                            border: `1px solid ${issue.severity === 'high' ? 'rgba(239, 68, 68, 0.2)' :
                                                                                issue.severity === 'medium' ? 'rgba(234, 179, 8, 0.2)' :
                                                                                    'rgba(99, 102, 241, 0.2)'
                                                                                }`
                                                                        }}>
                                                                            {issue.severity || 'medium'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <SLATimer
                                                                    deadline={issue.slaDeadline}
                                                                    status={issue.status}
                                                                    onBreach={() => {
                                                                        // Logic for client-side breach flag if needed
                                                                    }}
                                                                />
                                                            </div>
                                                            <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', lineHeight: '1.5' }}>{issue.description}</p>

                                                            <div style={{ marginTop: '16px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.3)', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {new Date(issue.createdAt).toLocaleString()}</span>
                                                                <span style={{ color: '#818cf8', fontWeight: '600' }}>Reporter: {issue.reportedBy}</span>
                                                                <span style={{ opacity: 0.5 }}>ID: {issue.id}</span>
                                                            </div>

                                                            {/* Incident Timeline UI */}
                                                            {issue.timeline && issue.timeline.length > 0 && (
                                                                <div style={{ marginTop: '24px', position: 'relative', paddingLeft: '24px' }}>
                                                                    <div style={{
                                                                        position: 'absolute',
                                                                        left: '7px',
                                                                        top: '8px',
                                                                        bottom: '8px',
                                                                        width: '2px',
                                                                        background: 'linear-gradient(to bottom, #6366f1, transparent)',
                                                                        opacity: 0.2
                                                                    }} />
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                                        {issue.timeline.map((step, idx) => (
                                                                            <div key={idx} style={{ position: 'relative', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                                                                <div style={{
                                                                                    width: '16px',
                                                                                    height: '16px',
                                                                                    borderRadius: '50%',
                                                                                    background: step.status === 'RESOLVED' ? '#4ade80' :
                                                                                        step.status === 'ESCALATED' ? '#f87171' :
                                                                                            step.status === 'ACTIONED' ? '#fbbf24' : '#6366f1',
                                                                                    border: '3px solid rgba(0,0,0,0.5)',
                                                                                    boxShadow: '0 0 10px rgba(99, 102, 241, 0.3)',
                                                                                    flexShrink: 0,
                                                                                    marginTop: '2px',
                                                                                    zIndex: 1
                                                                                }} />
                                                                                <div>
                                                                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', letterSpacing: '0.05em' }}>{step.status}</div>
                                                                                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '2px' }}>{step.message}</div>
                                                                                    <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.2)', marginTop: '2px' }}>{new Date(step.timestamp).toLocaleTimeString()}</div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <AuditTrail issueId={issue.id} userRole={user?.role} />
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                            {/* Escalation Badge */}
                                                            {issue.escalationStatus === 'active' && (
                                                                <div style={{
                                                                    padding: '12px',
                                                                    marginBottom: '10px',
                                                                    background: 'rgba(220, 38, 38, 0.1)',
                                                                    border: '1px solid #ef4444',
                                                                    borderRadius: '12px',
                                                                    textAlign: 'center'
                                                                }}>
                                                                    <div style={{ color: '#f87171', fontSize: '10px', fontWeight: 'bold' }}>OFFICIAL ESCALATION</div>
                                                                    <div style={{ color: '#fff', fontSize: '12px', marginTop: '2px' }}>Forwarded to Authority</div>
                                                                </div>
                                                            )}

                                                            {issue.status !== 'resolved' && user?.role === 'admin' && (
                                                                <>
                                                                    {/* Demo: Allow validation on any active issue */}
                                                                    {issue.escalationStatus !== 'active' && (
                                                                        <motion.button
                                                                            whileHover={{ scale: 1.1 }}
                                                                            whileTap={{ scale: 0.9 }}
                                                                            onClick={() => handleEscalateClick(issue.id)}
                                                                            style={{
                                                                                background: 'rgba(239, 68, 68, 0.1)',
                                                                                border: '1px solid #ef4444',
                                                                                color: '#ef4444',
                                                                                padding: '10px',
                                                                                borderRadius: '12px',
                                                                                cursor: 'pointer',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                gap: '8px'
                                                                            }}
                                                                            title="Escalate to District Authority"
                                                                        >
                                                                            <Megaphone size={16} />
                                                                        </motion.button>
                                                                    )}

                                                                    <motion.button
                                                                        whileHover={{ scale: 1.1 }}
                                                                        whileTap={{ scale: 0.9 }}
                                                                        onClick={() => handleResolve(issue.id)}
                                                                        style={{
                                                                            background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                                                                            border: 'none',
                                                                            color: '#000',
                                                                            padding: '10px',
                                                                            borderRadius: '12px',
                                                                            cursor: 'pointer',
                                                                            boxShadow: '0 4px 15px rgba(74, 222, 128, 0.3)'
                                                                        }}
                                                                        title="Mark as Resolved"
                                                                    >
                                                                        <CheckCircle size={20} />
                                                                    </motion.button>
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.1 }}
                                                                        whileTap={{ scale: 0.9 }}
                                                                        onClick={() => handleStatusUpdate(issue.id, 'ACTIONED')}
                                                                        style={{
                                                                            background: 'rgba(251, 191, 36, 0.1)',
                                                                            border: '1px solid rgba(251, 191, 36, 0.3)',
                                                                            color: '#fbbf24',
                                                                            padding: '10px',
                                                                            borderRadius: '12px',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                        title="Take Action"
                                                                    >
                                                                        <Zap size={20} />
                                                                    </motion.button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                </div>
                            </div>

                            <motion.div
                                className="detail-map-section"
                                style={{ marginTop: '80px' }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h2 className="gradient-text" style={{ fontSize: '1.8rem' }}>Intelligent Mapping</h2>
                                    <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>
                                        Center: {campus.location?.lat?.toFixed(4) || '0'}, {campus.location?.lng?.toFixed(4) || '0'}
                                    </div>
                                </div>
                                <div className="map-wrapper" style={{
                                    height: '500px',
                                    borderRadius: '32px',
                                    overflow: 'hidden',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)'
                                }}>
                                    <Map singleMarker={{ location: campus.location, title: campus.name }} />
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            <div className="background-shapes">
                <div className="shape circle-1" />
                <div className="shape circle-2" />
                <div className="shape-orb orb-1" />
            </div>
        </main>
    );
}
