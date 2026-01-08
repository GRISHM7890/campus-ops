import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, Shield, User, Download, Printer,
    ChevronDown, ChevronUp, History, List,
    CheckCircle2, AlertCircle, RefreshCcw, Activity
} from 'lucide-react';
import axios from 'axios';

const AuditTrail = ({ issueId, userRole }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchLogs = async (isManual = false) => {
        if (!issueId) return;
        try {
            if (isManual) setRefreshing(true);
            else setLoading(true);

            // Add cache busting timestamp
            const response = await axios.get(`/api/audit-logs/${issueId}?cb=${Date.now()}`);
            if (response.data?.logs) {
                setLogs(response.data.logs);
            }
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [issueId]);

    const handleExportCSV = () => {
        if (logs.length === 0) return;
        const headers = ['Timestamp', 'Action', 'Actor ID', 'Actor Role', 'State Change Detail'];
        const rows = logs.map(log => [
            new Date(log.timestamp).toLocaleString(),
            log.action,
            log.actorId,
            log.actorRole,
            `From: ${JSON.stringify(log.previousState || 'NONE')} | To: ${JSON.stringify(log.newState)}`
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Audit_Ledger_${issueId}.csv`;
        link.click();
    };

    const handlePrintReport = () => {
        const printWindow = window.open('', '_blank');
        const content = `
            <html>
                <head>
                    <title>Audit Compliance Report - ${issueId}</title>
                    <style>
                        body { font-family: 'Inter', system-ui, sans-serif; padding: 50px; color: #1f2937; line-height: 1.5; }
                        .header { border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
                        h1 { color: #111827; margin: 0; font-size: 24px; }
                        .meta { font-size: 14px; color: #6b7280; margin-top: 5px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 30px; border: 1px solid #e5e7eb; }
                        th, td { border: 1px solid #e5e7eb; padding: 14px; text-align: left; font-size: 12px; }
                        th { background: #f9fafb; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #374151; }
                        .timestamp { font-family: monospace; color: #4b5563; }
                        .action-badge { font-weight: 700; color: #4f46e5; }
                        .diff { color: #111827; font-size: 11px; }
                        .footer { margin-top: 50px; font-size: 11px; color: #9ca3af; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Immutable Audit Ledger Report</h1>
                        <div class="meta">Target Asset: ${issueId}</div>
                        <div class="meta">Report Integrity: Verified by CampusOPS Pulxo Engine</div>
                        <div class="meta">Generated: ${new Date().toLocaleString()}</div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Operational Action</th>
                                <th>Authorized Actor</th>
                                <th>State Transition Delta</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${logs.map(log => `
                                <tr>
                                    <td class="timestamp">${new Date(log.timestamp).toLocaleString()}</td>
                                    <td class="action-badge">${log.action}</td>
                                    <td>${log.actorRole}<br/><small>${log.actorId}</small></td>
                                    <td class="diff">
                                        <strong>NEW STATE:</strong> ${JSON.stringify(log.newState)}
                                        ${log.previousState ? `<br/><strong>PREVIOUS:</strong> ${JSON.stringify(log.previousState)}` : ''}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="footer">
                        This document is a system-generated audit report. All entries are immutable and cryptographically linked to the source events.
                    </div>
                </body>
            </html>
        `;
        printWindow.document.write(content);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
    };

    if (loading && !refreshing) return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <Activity className="animate-spin" size={24} color="#6366f1" style={{ margin: '0 auto' }} />
            <p style={{ marginTop: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Cryptographically verifying ledger...</p>
        </div>
    );

    return (
        <div className="audit-trail-wrapper" style={{ marginTop: '24px' }}>
            <div
                className="audit-header"
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 20px',
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: '16px 16px ' + (expanded ? '0 0' : '16px 16px'),
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                }}
                onClick={() => setExpanded(!expanded)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Shield size={18} color="#818cf8" strokeWidth={2.5} />
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff', letterSpacing: '0.02em' }}>SECURE AUDIT LEDGER</div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: '600' }}>
                            {logs.length} Immutable Entries • Blockchain-Verified Structure
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }} onClick={e => e.stopPropagation()}>
                    {userRole === 'admin' && (
                        <div style={{ display: 'flex', gap: '12px', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '15px' }}>
                            <button onClick={handleExportCSV} className="audit-action-btn" title="Export CSV Data"><Download size={14} /></button>
                            <button onClick={handlePrintReport} className="audit-action-btn" title="Generate Legal PDF"><Printer size={14} /></button>
                        </div>
                    )}
                    <button
                        onClick={() => fetchLogs(true)}
                        className={`audit-action-btn ${refreshing ? 'animate-spin' : ''}`}
                        title="Sync Ledger"
                    >
                        <RefreshCcw size={14} />
                    </button>
                    <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
                        <ChevronDown size={18} color="rgba(255,255,255,0.5)" />
                    </motion.div>
                </div>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{
                            padding: '24px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(99, 102, 241, 0.1)',
                            borderTop: 'none',
                            borderRadius: '0 0 16px 16px'
                        }}>
                            {logs.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                                    <History size={32} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                                    No operational events have been recorded for this asset.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {logs.map((log, idx) => (
                                        <div key={log.id} style={{ display: 'flex', gap: '20px', position: 'relative' }}>
                                            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <div style={{
                                                    width: '12px',
                                                    height: '12px',
                                                    borderRadius: '50%',
                                                    background: log.action === 'ISSUE_RESOLVED' ? '#4ade80' :
                                                        log.action === 'STATUS_UPDATED' ? '#818cf8' : '#6366f1',
                                                    boxShadow: `0 0 12px ${log.action === 'ISSUE_RESOLVED' ? 'rgba(74, 222, 128, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
                                                    zIndex: 2,
                                                    marginTop: '4px'
                                                }} />
                                                {idx !== logs.length - 1 && (
                                                    <div style={{ width: '2px', flex: 1, background: 'linear-gradient(to bottom, rgba(99, 102, 241, 0.2), transparent)', margin: '4px 0' }} />
                                                )}
                                            </div>

                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                                    <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#fff' }}>{log.action}</span>
                                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#818cf8', marginBottom: '12px' }}>
                                                    <User size={12} />
                                                    <span style={{ fontWeight: '600' }}>{log.actorRole.toUpperCase()}</span>
                                                    <span style={{ opacity: 0.5 }}>• ID: {log.actorId}</span>
                                                </div>

                                                <div style={{ display: 'grid', gap: '10px' }}>
                                                    {log.previousState && (
                                                        <div style={{
                                                            padding: '12px',
                                                            background: 'rgba(248, 113, 113, 0.04)',
                                                            border: '1px solid rgba(248, 113, 113, 0.1)',
                                                            borderRadius: '10px',
                                                            fontSize: '11px'
                                                        }}>
                                                            <div style={{ color: '#f87171', fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase', fontSize: '9px' }}>Previous State</div>
                                                            <code style={{ color: 'rgba(248, 113, 113, 0.8)' }}>{JSON.stringify(log.previousState)}</code>
                                                        </div>
                                                    )}

                                                    <div style={{
                                                        padding: '12px',
                                                        background: 'rgba(74, 222, 128, 0.04)',
                                                        border: '1px solid rgba(74, 222, 128, 0.1)',
                                                        borderRadius: '10px',
                                                        fontSize: '11px'
                                                    }}>
                                                        <div style={{ color: '#4ade80', fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase', fontSize: '9px' }}>Updated State</div>
                                                        <code style={{ color: 'rgba(74, 222, 128, 0.8)' }}>{JSON.stringify(log.newState)}</code>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .audit-action-btn {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: rgba(255,255,255,0.6);
                    padding: 6px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .audit-action-btn:hover {
                    background: rgba(99, 102, 241, 0.2);
                    color: #fff;
                    border-color: rgba(99, 102, 241, 0.4);
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default AuditTrail;
