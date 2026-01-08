"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { reportUserAuth } from '@/lib/api';
import Link from 'next/link';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const userCredential = await login(email, password);
            const user = userCredential.user;

            // Non-blocking background report
            reportUserAuth(user.uid, user.email, 'login').catch(console.error);

            router.push('/');
        } catch (err) {
            console.error('Login error:', err);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('Incorrect email or password');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many failed attempts. Please try again later.');
            } else {
                setError('Failed to log in. Please try again.');
            }
        }
    };

    return (
        <main className="auth-container">
            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="card-glass" />
                <div className="auth-content">
                    <h1 className="gradient-text">Welcome Back</h1>
                    <p className="auth-subtitle">Login to access your campus dashboard</p>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="input-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                placeholder="name@university.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {error && <p className="error-text">{error}</p>}
                        <button type="submit" className="cta-button auth-button">Sign In</button>
                    </form>

                    <p className="auth-footer">
                        Don't have an account? <Link href="/signup">Sign up</Link>
                    </p>
                </div>
            </motion.div>

            <div className="background-shapes">
                <div className="shape circle-1" />
                <div className="shape circle-2" />
                <div className="shape-orb orb-1" />
            </div>
        </main>
    );
}
