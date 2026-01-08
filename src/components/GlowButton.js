"use client";

import React from 'react';
import { motion } from 'framer-motion';

export default function GlowButton({ children, onClick, className = "", style = {}, variant = "primary" }) {
    return (
        <motion.button
            onClick={onClick}
            className={`glow-button ${variant} ${className}`}
            style={style}
            whileHover="hover"
            whileTap="tap"
            initial="initial"
        >
            <motion.div
                className="glow-effect"
                variants={{
                    initial: { opacity: 0, scale: 0.8 },
                    hover: { opacity: 1, scale: 1.2 },
                    tap: { scale: 0.9 }
                }}
            />
            <span className="button-label">{children}</span>
            <motion.div
                className="inner-glow"
                variants={{
                    initial: { x: "-100%" },
                    hover: { x: "100%" }
                }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
            />
        </motion.button>
    );
}
