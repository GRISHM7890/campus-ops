"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function SpiralBackground() {
    const dots = useMemo(() => {
        const temp = [];
        const count = 200;
        for (let i = 0; i < count; i++) {
            const angle = 0.1 * i;
            const radius = 2 * i;
            temp.push({
                id: i,
                x: radius * Math.cos(angle),
                y: radius * Math.sin(angle),
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.1
            });
        }
        return temp;
    }, []);

    return (
        <div className="spiral-container">
            <motion.div
                className="spiral-inner"
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            >
                {dots.map(dot => (
                    <motion.div
                        key={dot.id}
                        className="spiral-dot"
                        style={{
                            left: `calc(50% + ${dot.x}px)`,
                            top: `calc(50% + ${dot.y}px)`,
                            width: dot.size,
                            height: dot.size,
                            opacity: dot.opacity,
                        }}
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [dot.opacity, 0.8, dot.opacity]
                        }}
                        transition={{
                            duration: Math.random() * 3 + 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                ))}
            </motion.div>
            <div className="spiral-overlay" />
        </div>
    );
}
