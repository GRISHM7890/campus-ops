"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import GlowButton from './GlowButton';

export default function Header() {
    const [scrolled, setScrolled] = useState(false);
    const { user, logout } = useAuth();
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'Campuses', href: '/campuses' },
        { name: 'Transparency', href: '/public' },
        { name: 'Map', href: '/#campus-map' },
    ];

    return (
        <motion.header
            className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'py-3' : 'py-6'}`}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6 }}
        >
            <div className={`mx-auto max-w-7xl px-6 flex items-center justify-between transition-all duration-300 ${scrolled ? 'bg-black/40 backdrop-blur-xl border border-white/10 py-3 rounded-full mt-2 shadow-2xl shadow-indigo-500/10' : ''}`}>
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-2xl font-bold gradient-text">CampusOPS</span>
                    <span style={{ fontSize: '10px', color: '#6366f1', opacity: 0.5, border: '1px solid #6366f130', padding: '2px 6px', borderRadius: '4px' }}>V3</span>
                </Link>

                <nav className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="text-sm font-medium text-slate-300 hover:text-white transition-colors relative group"
                        >
                            {link.name}
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all group-hover:w-full" />
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end mr-2">
                                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{user.role || 'User'}</span>
                                <span className="text-sm text-slate-200 font-medium hidden sm:inline">{user.name || user.email}</span>
                            </div>
                            <GlowButton
                                onClick={logout}
                                variant="secondary"
                                className="!py-2 !px-5"
                            >
                                Log Out
                            </GlowButton>
                        </div>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                                Log In
                            </Link>
                            <Link href="/signup">
                                <GlowButton variant="primary" className="!py-2 !px-6 text-sm">
                                    Sign Up
                                </GlowButton>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </motion.header>
    );
}
