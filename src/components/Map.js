"use client";

import React, { useEffect, useRef } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const Map = ({ center = { lat: 18.5204, lng: 73.8567 }, zoom = 12, singleMarker = null, campuses = [], onRefresh = () => { } }) => {
    const mapRef = useRef(null);
    const googleMapRef = useRef(null);
    const { user, loading } = useAuth();
    const [simulating, setSimulating] = React.useState(false);
    const [statusMessage, setStatusMessage] = React.useState('');

    const getHealthColor = (score) => {
        if (score >= 80) return '#4ade80'; // Green
        if (score >= 50) return '#fbbf24'; // Yellow
        return '#f87171'; // Red
    };

    const handleSimulate = async () => {
        if (campuses.length === 0) return;
        setSimulating(true);
        setStatusMessage('Injecting critical anomaly...');
        try {
            const randomCampus = campuses[Math.floor(Math.random() * campuses.length)];
            const res = await fetch('/api/admin/simulate-incident', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campusId: randomCampus.id })
            });
            const data = await res.json();
            if (data.success) {
                setStatusMessage(`Incident injected at ${randomCampus.name}!`);
                onRefresh();
                setTimeout(() => setStatusMessage(''), 3000);
            }
        } catch (err) {
            console.error("Simulation failed:", err);
            setStatusMessage('Simulation failed.');
            setTimeout(() => setStatusMessage(''), 2000);
        } finally {
            setSimulating(false);
        }
    };

    useEffect(() => {
        setOptions({
            apiKey: 'AIzaSyD3bkQoF87V5TtZyAKntH9fM5Zqpf8o38Ao',
            version: 'weekly',
        });

        importLibrary('maps').then(async ({ Map: GoogleMap, InfoWindow }) => {
            const { Marker } = await importLibrary('marker');

            const mapOptions = {
                center: singleMarker ? singleMarker.location : (campuses.length > 0 ? campuses[0].location : center),
                zoom: singleMarker ? 15 : 5,
                styles: [
                    { elementType: 'geometry', stylers: [{ color: '#1a1b1e' }] },
                    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1b1e' }] },
                    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
                    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
                    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2e33' }] },
                ],
                disableDefaultUI: false,
                mapTypeControl: false,
                streetViewControl: false,
            };

            const gMap = new GoogleMap(mapRef.current, mapOptions);
            googleMapRef.current = gMap;

            const infoWindow = new InfoWindow();

            if (singleMarker) {
                new Marker({
                    position: singleMarker.location,
                    map: gMap,
                    title: singleMarker.title,
                });
            }

            if (campuses && campuses.length > 0) {
                campuses.forEach(campus => {
                    if (campus.location) {
                        const score = campus.healthSummary?.score || 100;
                        const color = getHealthColor(score);

                        const marker = new Marker({
                            position: campus.location,
                            map: gMap,
                            title: campus.name,
                            icon: {
                                path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
                                fillColor: color,
                                fillOpacity: 0.9,
                                strokeWeight: 2,
                                strokeColor: "#ffffff",
                                scale: 2,
                                anchor: { x: 12, y: 22 }
                            }
                        });

                        marker.addListener('click', () => {
                            const summary = campus.healthSummary || {};
                            const breakdown = summary.severityBreakdown || { low: 0, medium: 0, high: 0 };

                            const content = `
                                <div style="color: #fff; background: #1a1b1e; padding: 16px; border-radius: 12px; font-family: sans-serif; min-width: 200px;">
                                    <h3 style="margin: 0 0 8px 0; color: ${color}; font-size: 16px;">${campus.name}</h3>
                                    <div style="font-size: 14px; opacity: 0.8; margin-bottom: 12px;">Health Score: <b>${score}%</b></div>
                                    <hr style="border: 0.5px solid rgba(255,255,255,0.1); margin: 8px 0;">
                                    <div style="display: grid; gap: 4px; font-size: 12px;">
                                        <div>Total Issues: <b>${summary.totalIssues || 0}</b></div>
                                        <div style="display: flex; gap: 8px; margin-top: 4px;">
                                            <span style="color: #f87171">High: ${breakdown.high}</span>
                                            <span style="color: #fbbf24">Med: ${breakdown.medium}</span>
                                            <span style="color: #4ade80">Low: ${breakdown.low}</span>
                                        </div>
                                    </div>
                                    <div style="margin-top: 12px; font-size: 11px; opacity: 0.5;">
                                        Last Resolved: ${summary.lastResolvedAt ? new Date(summary.lastResolvedAt).toLocaleDateString() : 'Never'}
                                    </div>
                                    <a href="/campuses/${campus.id}" style="display: block; margin-top: 12px; padding: 6px; background: ${color}20; color: ${color}; text-decoration: none; border-radius: 6px; text-align: center; font-weight: bold; font-size: 12px; border: 1px solid ${color}40;">
                                        View Details
                                    </a>
                                </div>
                            `;

                            infoWindow.setContent(content);
                            infoWindow.open(gMap, marker);

                            // Style the info window (standard GMaps hack to remove white background)
                            setTimeout(() => {
                                const container = document.querySelector('.gm-style-iw-c');
                                if (container) {
                                    container.style.backgroundColor = '#1a1b1e';
                                    container.style.padding = '0';
                                }
                                const closeBtn = document.querySelector('.gm-style-iw-t::after');
                                if (closeBtn) closeBtn.style.background = '#1a1b1e';
                            }, 10);
                        });
                    }
                });
            }

        }).catch(e => {
            console.error("Map loading error:", e);
        });
    }, [center, zoom, singleMarker, campuses]);

    return (
        <div className="map-wrapper" style={{ position: 'relative', width: '100%', height: '500px', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <div
                ref={mapRef}
                style={{
                    width: '100%',
                    height: '100%',
                    filter: user ? 'none' : 'blur(15px)',
                    transition: 'filter 0.5s ease',
                }}
            />

            {user?.role === 'admin' && (
                <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <motion.button
                        className="simulate-btn"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSimulate}
                        disabled={simulating}
                        style={{
                            padding: '10px 24px',
                            background: simulating ? '#333' : 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            boxShadow: '0 10px 20px rgba(248, 113, 113, 0.3)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {simulating ? '☣ Injecting...' : '☣ Simulate Incident'}
                    </motion.button>

                    <AnimatePresence>
                        {statusMessage && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                style={{
                                    background: 'rgba(0, 0, 0, 0.8)',
                                    backdropFilter: 'blur(10px)',
                                    color: '#4ade80',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    border: '1px solid rgba(74, 222, 128, 0.2)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                }}
                            >
                                {statusMessage}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            <AnimatePresence>
                {!user && !loading && (
                    <motion.div
                        className="map-auth-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(5px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 20
                        }}
                    >
                        <div className="overlay-content" style={{ textAlign: 'center', color: '#fff' }}>
                            <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>Live Security View Restricted</h3>
                            <p style={{ opacity: 0.7, marginBottom: '24px' }}>Please authenticate as administrative staff to access campus status.</p>
                            <Link href="/login">
                                <motion.button
                                    className="gradient-btn"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{ padding: '12px 32px' }}
                                >
                                    Log In for Access
                                </motion.button>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Map;
