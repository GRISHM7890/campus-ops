import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle, Flame } from 'lucide-react';

const SLATimer = ({ deadline, status, onBreach }) => {
    const [timeLeft, setTimeLeft] = useState(null);
    const [isBreached, setIsBreached] = useState(false);

    useEffect(() => {
        if (status === 'resolved') {
            setTimeLeft(null);
            return;
        }

        const calculateTime = () => {
            const target = new Date(deadline?.toDate ? deadline.toDate() : deadline);
            const now = new Date();
            const diff = target - now;

            if (diff <= 0) {
                setTimeLeft(0);
                setIsBreached(true);
                if (onBreach) onBreach();
                return;
            }

            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft({ h, m, s });
            setIsBreached(false);
        };

        calculateTime();
        const timer = setInterval(calculateTime, 1000);
        return () => clearInterval(timer);
    }, [deadline, status]);

    if (status === 'resolved') {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontSize: '11px', fontWeight: 'bold' }}>
                <CheckCircle size={12} />
                <span>SLA MET</span>
            </div>
        );
    }

    if (timeLeft === null) return null;

    const getColor = () => {
        if (isBreached) return '#f87171';
        if (timeLeft.h < 1) return '#fbbf24';
        return '#60a5fa';
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                background: `${getColor()}15`,
                border: `1px solid ${getColor()}40`,
                borderRadius: '20px',
                color: getColor()
            }}
        >
            {isBreached ? <Flame size={12} className="animate-pulse" /> : <Clock size={12} />}
            <span style={{ fontSize: '11px', fontWeight: '800', fontFamily: 'monospace' }}>
                {isBreached ? 'SLA BREACHED' : `${String(timeLeft.h).padStart(2, '0')}:${String(timeLeft.m).padStart(2, '0')}:${String(timeLeft.s).padStart(2, '0')}`}
            </span>
            {!isBreached && timeLeft.h < 1 && <AlertTriangle size={10} />}
        </motion.div>
    );
};

export default SLATimer;
