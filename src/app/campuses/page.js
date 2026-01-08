"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCampuses } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SpiralBackground from '@/components/SpiralBackground';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import GlowButton from '@/components/GlowButton';
import { Database, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const LoadingSkeleton = () => (
    <div className="loading-skeleton">
        {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card" />
        ))}
    </div>
);

const EmptyState = () => (
    <motion.div
        className="empty-state"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
    >
        <div className="empty-icon">📍</div>
        <h3>No Campuses Found</h3>
        <p>We're currently expanding. Please check back later or contact administration for more details.</p>
    </motion.div>
);

export default function CampusList() {
    const [campuses, setCampuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const [seeding, setSeeding] = useState(false);
    const [seedResult, setSeedResult] = useState(null);

    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
            // Small delay to ensure redirect happens before trying to click login
            setTimeout(() => {
                const loginBtn = document.querySelector('.login-btn');
                if (loginBtn) loginBtn.click();
            }, 500);
        }
    }, [user, loading, router]);

    useEffect(() => {
        let isMounted = true;
        async function fetchCampuses() {
            try {
                const data = await getCampuses();
                if (isMounted) setCampuses(data || []);
            } catch (err) {
                console.error('Error fetching campuses:', err);
                if (isMounted) setError('Unable to connect to service. Please try again later.');
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        if (user) {
            fetchCampuses();
        }
        return () => { isMounted = false; };
    }, [user]);

    const handleSeed = async () => {
        try {
            setSeeding(true);
            setSeedResult(null);
            const response = await axios.post('/api/admin/seed');
            setSeedResult({ success: true, summary: response.data.summary });
            // Refresh campuses list after seeding
            const updatedData = await getCampuses();
            setCampuses(updatedData || []);
        } catch (err) {
            console.error('Seeding error:', err);
            setSeedResult({ success: false, error: err.response?.data?.error || err.message });
        } finally {
            setSeeding(false);
        }
    };

    return (
        <main className="main-container">
            <SpiralBackground />

            <section className="framer-q8qjq9" style={{ paddingTop: '120px' }}>
                <div className="section-inner">
                    <motion.h1
                        className="framer-text gradient-text"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        Our Campuses
                    </motion.h1>
                    <motion.p
                        className="framer-text section-subtitle"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        Explore our world-class facilities and centers of excellence.
                    </motion.p>

                    {user?.role === 'admin' && (
                        <motion.div
                            className="admin-tools"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}
                        >
                            <GlowButton
                                onClick={handleSeed}
                                disabled={seeding}
                                className="!py-3 !px-8 flex items-center gap-3"
                            >
                                {seeding ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Seeding Pipeline Active...
                                    </>
                                ) : (
                                    <>
                                        <Database size={18} />
                                        One-Click Seed Pipeline
                                    </>
                                )}
                            </GlowButton>

                            {seedResult && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{
                                        padding: '12px 24px',
                                        borderRadius: '16px',
                                        background: seedResult.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        border: `1px solid ${seedResult.success ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                                        color: seedResult.success ? '#4ade80' : '#f87171',
                                        fontSize: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}
                                >
                                    {seedResult.success ? (
                                        <>
                                            <CheckCircle2 size={16} />
                                            <span>
                                                Seeding Complete! Added: <b>{seedResult.summary.added}</b>, Updated: <b>{seedResult.summary.updated}</b>, Migrated: <b>{seedResult.summary.migrated}</b>
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle size={16} />
                                            <span>Error: {seedResult.error}</span>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <LoadingSkeleton />
                            </motion.div>
                        ) : error ? (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="error-state"
                            >
                                <p>{error}</p>
                            </motion.div>
                        ) : campuses.length === 0 ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <EmptyState />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="grid"
                                className="items-grid"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{ marginTop: '60px' }}
                            >
                                {campuses.map((campus, index) => (
                                    <motion.div
                                        key={campus.id}
                                        className="item-card"
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                        whileHover={{ translateY: -10 }}
                                    >
                                        <Link href={`/campuses/${campus.id}`}>
                                            <div className="card-glass" />
                                            <div className="card-content">
                                                <div className="card-icon">🏢</div>
                                                <h3>{campus.name.trim()}</h3>
                                                <p>{campus.city}, {campus.state}</p>

                                                {campus.healthSummary && (
                                                    <div style={{
                                                        marginTop: '12px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        <span style={{
                                                            padding: '2px 8px',
                                                            borderRadius: '12px',
                                                            background: campus.healthSummary.score >= 80 ? 'rgba(34, 197, 94, 0.1)' :
                                                                campus.healthSummary.score >= 50 ? 'rgba(234, 179, 8, 0.1)' :
                                                                    'rgba(239, 68, 68, 0.1)',
                                                            color: campus.healthSummary.score >= 80 ? '#4ade80' :
                                                                campus.healthSummary.score >= 50 ? '#fbbf24' :
                                                                    '#f87171',
                                                            border: `1px solid ${campus.healthSummary.score >= 80 ? 'rgba(34, 197, 94, 0.2)' :
                                                                campus.healthSummary.score >= 50 ? 'rgba(234, 179, 8, 0.2)' :
                                                                    'rgba(239, 68, 68, 0.2)'
                                                                }`
                                                        }}>
                                                            Score: {campus.healthSummary.score}%
                                                        </span>
                                                        <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                                                            {campus.healthSummary.totalIssues} Issues
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="card-footer" style={{ marginTop: '20px' }}>
                                                    <span className="view-details">Explore Campus</span>
                                                    <span style={{ opacity: 0.3 }}>→</span>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>

            <div className="background-shapes">
                <div className="shape circle-1" />
                <div className="shape circle-2" />
                <div className="shape-orb orb-1" />
            </div>
        </main>
    );
}
