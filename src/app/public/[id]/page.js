"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SpiralBackground from '@/components/SpiralBackground';
import { motion } from 'framer-motion';
import { Shield, Lock, Download, Activity, CheckCircle, AlertTriangle, Globe } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export default function PublicTransparency() {
    const params = useParams();
    const id = params.id;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) return;

        fetch(`/api/public/stats/${id}`)
            .then(res => {
                if (!res.ok) throw new Error("Transparency data unavailable");
                return res.json();
            })
            .then(setData)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    const downloadReport = () => {
        if (!data) return;
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Metric,Value\n"
            + `Campus,${data.campus.name}\n`
            + `Health Score,${data.transparencyScore}\n`
            + `Resolution Rate,${data.resolutionRate}%\n`
            + `SLA Compliance,${data.slaCompliance}%\n`
            + `Last Updated,${data.meta.generatedAt}`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `transparency_report_${id}_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                <Activity size={48} color="#4ade80" />
            </motion.div>
        </div>
    );

    if (error) return (
        <div style={{ padding: '50px', color: '#ef4444', textAlign: 'center', background: '#000', height: '100vh' }}>
            <h2>Transparency Record Unavailable</h2>
            <p>{error}</p>
        </div>
    );

    // Chart Data
    const pieData = [
        { name: 'Resolved', value: data.resolutionRate, color: '#4ade80' },
        { name: 'Pending', value: 100 - data.resolutionRate, color: '#334155' }
    ];

    return (
        <main className="main-container" style={{ background: '#030712', minHeight: '100vh', color: '#fff' }}>
            <SpiralBackground />

            <div className="section-inner" style={{ paddingTop: '100px', maxWidth: '1200px', margin: '0 auto' }}>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '40px', marginBottom: '40px' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <Globe size={32} color="#4ade80" />
                        <h1 className="gradient-text" style={{ fontSize: '2.5rem', margin: 0 }}>Public Transparency Ledger</h1>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: 0 }}>{data.campus.name}</h2>
                            <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>
                                {data.campus.location.city}, {data.campus.location.state} • Established {data.campus.established}
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(74, 222, 128, 0.1)', padding: '8px 16px', borderRadius: '100px', border: '1px solid rgba(74, 222, 128, 0.2)' }}>
                            <Shield size={16} color="#4ade80" />
                            <span style={{ color: '#4ade80', fontSize: '0.9rem', fontWeight: '600' }}>Verified Open Data • No PII</span>
                        </div>
                    </div>
                </motion.div>

                {/* KPI Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                    {/* Health Score */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}
                    >
                        <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Efficiency Score</h3>
                        <div style={{ fontSize: '4rem', fontWeight: 'bold', margin: '16px 0', color: data.transparencyScore > 80 ? '#4ade80' : '#facc15' }}>
                            {data.transparencyScore}/100
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${data.transparencyScore}%`, height: '100%', background: data.transparencyScore > 80 ? '#4ade80' : '#facc15' }} />
                        </div>
                    </motion.div>

                    {/* Resolution Rate */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                        <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Resolution Rate</h3>
                        <div style={{ height: '120px', marginTop: '16px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value">
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '-75px' }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{data.resolutionRate}%</span>
                        </div>
                    </motion.div>

                    {/* Total Issues */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                        <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Reports</h3>
                        <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: '#fff', marginTop: '10px' }}>
                            {data.totalIssuesLogged.toLocaleString()}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', fontSize: '0.9rem', color: '#94a3b8' }}>
                            <span style={{ color: '#f87171' }}>{data.breakdown.critical} Critical</span> •
                            <span style={{ color: '#fbbf24' }}>{data.breakdown.high} High</span>
                        </div>
                    </motion.div>
                </div>

                {/* Activity Feed */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 2fr) 1fr', gap: '32px' }}>
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '24px' }}>Recent Public Activity</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {data.recentActivity.map((act) => (
                                <div key={act.id + act.timestamp} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '10px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: act.status === 'resolved' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(96, 165, 250, 0.1)',
                                        color: act.status === 'resolved' ? '#4ade80' : '#60a5fa'
                                    }}>
                                        {act.status === 'resolved' ? <CheckCircle size={20} /> : <Activity size={20} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ color: '#fff', fontWeight: '600' }}>
                                                {act.category} Issue
                                                {act.escalated && <span style={{ color: '#f87171', marginLeft: '8px', fontSize: '0.8rem' }}> (ESCALATED)</span>}
                                            </span>
                                            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', background: '#334155', color: '#cbd5e1' }}>#{act.id}</span>
                                        </div>
                                        <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Status: {act.status} • Severity: {act.severity}</div>
                                    </div>
                                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                                        {new Date(act.timestamp).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Meta & Download */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '16px' }}>Open Data Policy</h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '24px' }}>
                                This ledger ensures public accountability. All sensitive personal identifiers (PII) are automatically filtered before publication.
                            </p>
                            <button
                                onClick={downloadReport}
                                className="pulse-btn"
                                style={{
                                    width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
                                    background: '#3b82f6', color: '#fff', fontWeight: 'bold',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                <Download size={20} />
                                Download Report (CSV)
                            </button>
                        </div>

                        <div style={{ padding: '24px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', color: '#fbbf24', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 'bold' }}>
                                <AlertTriangle size={18} />
                                Disclaimer
                            </div>
                            Data is delayed by up to 15 minutes for caching optimization.
                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
}
