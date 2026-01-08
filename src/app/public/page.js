"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import SpiralBackground from '@/components/SpiralBackground';
import { motion } from 'framer-motion';
import { Globe, Shield, Activity, CheckCircle, AlertTriangle, ArrowRight, Building } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function GlobalTransparency() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = () => {
        fetch('/api/public/stats/global')
            .then(res => {
                if (!res.ok) throw new Error("Global transparency data unavailable");
                return res.json();
            })
            .then(setData)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3000); // 3s Real-time polling
        return () => clearInterval(interval);
    }, []);

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#030712', color: '#fff' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                <Activity size={48} color="#4ade80" />
            </motion.div>
        </div>
    );

    if (error) return (
        <div style={{ padding: '50px', color: '#ef4444', textAlign: 'center', background: '#000', height: '100vh' }}>
            <h2>Global Ledger Unavailable</h2>
            <p>{error}</p>
        </div>
    );

    const pieData = [
        { name: 'Resolved', value: data.stats.resolutionRate, color: '#4ade80' },
        { name: 'Pending', value: 100 - data.stats.resolutionRate, color: '#334155' }
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
                        <Globe size={40} color="#60a5fa" />
                        <h1 className="gradient-text" style={{ fontSize: '3rem', margin: 0 }}>Global Transparency Hub</h1>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '1.2rem', maxWidth: '600px' }}>
                        Real-time operational visibility across the entire university network.
                        Tracking {data.meta.totalCampuses} campuses live.
                    </p>
                </motion.div>

                {/* Global KPI Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '60px' }}>

                    {/* System Health */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                        <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>System Health</h3>
                        <div style={{ fontSize: '4rem', fontWeight: 'bold', margin: '16px 0', color: '#4ade80' }}>
                            {data.stats.globalHealth}%
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                            Operational Efficiency across all nodes.
                        </div>
                    </motion.div>

                    {/* Global Resolution */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                        <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Global Resolution Rate</h3>
                        <div style={{ height: '120px', marginTop: '16px', position: 'relative' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value">
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                {data.stats.resolutionRate}%
                            </div>
                        </div>
                    </motion.div>

                    {/* Total Volume */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                        <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Network Incidents</h3>
                        <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: '#fff', marginTop: '10px' }}>
                            {data.stats.totalIssues.toLocaleString()}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', fontSize: '0.9rem', color: '#94a3b8' }}>
                            <span style={{ color: '#f87171', background: 'rgba(248, 113, 113, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>{data.stats.breakdown.critical} CRITICAL</span>
                            <span style={{ color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>{data.stats.breakdown.high} HIGH</span>
                        </div>
                    </motion.div>
                </div>

                {/* Content Split: Campuses & Feed */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px' }}>

                    {/* Active Campuses List */}
                    <div>
                        <h2 className="gradient-text" style={{ fontSize: '1.8rem', marginBottom: '24px' }}>Active Campuses</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {data.campuses.map((campus) => (
                                <Link href={`/public/${campus.id}`} key={campus.id}>
                                    <motion.div
                                        whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderRadius: '16px', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                                                <Building size={20} />
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>{campus.name}</h4>
                                                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem' }}>{campus.location.city}, {campus.location.state}</p>
                                            </div>
                                        </div>
                                        <ArrowRight size={16} color="#475569" />
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Global Activity Feed */}
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ color: '#fff', fontSize: '1.2rem', margin: 0 }}>Global Live Feed</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
                                <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 'bold' }}>LIVE</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '600px', overflowY: 'auto', paddingRight: '8px' }}>
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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <span style={{ color: '#fff', fontWeight: '600' }}>{act.category} Event</span>
                                            {act.escalated && <span style={{ color: '#f87171', background: 'rgba(248, 113, 113, 0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>ESCALATED</span>}
                                            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>• ID: {act.id.slice(0, 6)}</span>
                                        </div>
                                        <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
                                            Severity: <span style={{ color: act.severity === 'critical' ? '#ef4444' : '#cbd5e1' }}>{act.severity.toUpperCase()}</span> • {new Date(act.timestamp).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
            <style jsx global>{`
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            `}</style>
        </main>
    );
}
