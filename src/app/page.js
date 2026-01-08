"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, useSpring } from 'framer-motion';
import { getCampusData, getCampuses } from '@/lib/api';
import Map from '@/components/Map';
import Link from 'next/link';
import SpiralBackground from '@/components/SpiralBackground';
import GlowButton from '@/components/GlowButton';
import { useAuth } from '@/context/AuthContext';

const AnimatedSection = ({ children, className, id, name }) => {
  return (
    <motion.section
      id={id}
      className={className}
      data-framer-name={name}
      initial={{ opacity: 0, z: -50, y: 50 }}
      whileInView={{ opacity: 1, z: 0, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 1200 }}
    >
      {children}
    </motion.section>
  );
};

const Hero = () => {
  const containerRef = useRef(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotX = ((y - centerY) / centerY) * -5;
    const rotY = ((x - centerX) / centerX) * 5;
    setRotateX(rotX);
    setRotateY(rotY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const springConfig = { stiffness: 100, damping: 30 };
  const sx = useSpring(rotateX, springConfig);
  const sy = useSpring(rotateY, springConfig);

  const { user } = useAuth();

  return (
    <section
      className="framer-12jsqv5 hero-section"
      data-framer-name="Hero section"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="framer-1tugob5"
        data-framer-name="Content"
        style={{
          rotateX: sx,
          rotateY: sy,
          transformStyle: "preserve-3d"
        }}
      >
        <div className="framer-hq82fe" data-framer-name="Heading and subheading">
          <div className="framer-187ailk">
            <h1 className="framer-text hero-title">
              {["Operational ", "Excellence ", "for ", "Modern ", "Businesses."].map((word, i) => (
                <motion.span
                  key={i}
                  className="hero-word"
                  initial={{ opacity: 0, y: 20, z: 40 }}
                  animate={{ opacity: 1, y: 0, z: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * i, ease: "easeOut" }}
                >
                  {word}
                </motion.span>
              ))}
            </h1>
            <motion.p
              className="framer-text subheading"
              initial={{ opacity: 0, z: 20 }}
              animate={{ opacity: 1, z: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Streamline your campus operations with unified operational intelligence.
              Modernize administrative workflows, enhance student engagement,
              and achieve complete operational visibility.
            </motion.p>
          </div>
        </div>
        <motion.div
          className="framer-13fg4xq"
          data-framer-name="CTA"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <GlowButton variant="primary" onClick={() => {
            if (user) {
              window.location.href = "#campus-map";
            } else {
              const loginBtn = document.querySelector('.login-btn');
              if (loginBtn) loginBtn.click();
            }
          }}>
            {user ? "Explore Campus Map" : "Access Campus List"}
          </GlowButton>
        </motion.div>
      </motion.div>
    </section>
  );
};

const LogoMarquee = () => {
  const logos = ["UNIVERSITY", "INSTITUTE", "ACADEMY", "COLLEGE", "CAMPUS", "EDUCATE", "LEARN"];
  return (
    <div className="marquee-container">
      <motion.div
        className="marquee-content"
        animate={{ x: [0, -1000] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {[...logos, ...logos, ...logos].map((l, i) => (
          <span key={i} className="logo-text">{l}</span>
        ))}
      </motion.div>
    </div>
  );
};

const FeatureCard = ({ title, desc, icon }) => (
  <motion.div
    className="item-card"
    whileHover={{ translateY: -10, translateZ: 20, rotateX: 2, rotateY: -2 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <div className="card-glass" />
    <div className="card-content">
      <div className="card-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  </motion.div>
);

export default function Home() {
  const [campuses, setCampuses] = useState([]);
  const { user } = useAuth();

  const refreshCampuses = () => {
    getCampuses().then(setCampuses).catch(err => {
      console.error("Error refreshing campuses:", err);
    });
  };

  useEffect(() => {
    if (user) {
      refreshCampuses();
    }
  }, [user]);

  return (
    <main className="main-container">
      <SpiralBackground />
      <Hero />

      <AnimatedSection name="Logos" className="framer-9r45or">
        <LogoMarquee />
      </AnimatedSection>

      <AnimatedSection name="Map" id="campus-map">
        <div className="section-inner">
          <h2 className="framer-text gradient-text">Live Campus View</h2>
          <p className="framer-text section-subtitle">Real-time operational visibility across all facilities.</p>
          <Map campuses={campuses} onRefresh={refreshCampuses} />
        </div>
      </AnimatedSection>

      <footer className="framer-745n77-container">
        <div className="footer-content">
          <div className="footer-brand">CampusOPS</div>
          <div className="footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <Link href="/public">Transparency</Link>
            <a href="#">LinkedIn</a>
          </div>
          <p>© 2025 CampusOPS | Excellence for Education.</p>
        </div>
      </footer>

      {/* Background shapes */}
      <div className="background-shapes">
        <div className="shape circle-1" />
        <div className="shape circle-2" />
        <div className="shape-orb orb-1" />
      </div>
    </main>
  );
}
