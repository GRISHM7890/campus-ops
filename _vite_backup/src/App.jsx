import React, { useState, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import './App.css';

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
              {["Intelligent ", "Automation ", "for ", "Modern ", "Businesses."].map((word, i) => (
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
              Streamline your campus operations with AI-powered intelligence.
              Modernize administrative workflows, enhance student engagement,
              and achieve complete operational visibility.
            </motion.p>
          </div>
        </div>
        <motion.div
          className="framer-13fg4xq"
          data-framer-name="CTA"
          whileHover={{ translateZ: 40, scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <button className="cta-button">Transform Your Campus</button>
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

function App() {
  return (
    <div className="main-container">
      <Hero />

      <AnimatedSection name="Logos" className="framer-9r45or">
        <LogoMarquee />
      </AnimatedSection>

      <AnimatedSection name="Services" id="services" className="framer-q8qjq9">
        <div className="section-inner">
          <h2 className="framer-text gradient-text">Our Solutions</h2>
          <p className="framer-text section-subtitle">Precision tools for the modern educational landscape.</p>
          <div className="items-grid">
            <FeatureCard title="Academic AI" desc="Automated grading, personalized learning paths, and curriculum optimization." icon="🎓" />
            <FeatureCard title="Smart Facilities" desc="Energy management, dynamic room booking, and predictive security." icon="🏢" />
            <FeatureCard title="Admin Orchestration" desc="Unified dashboard for staff, payroll, and compliance automation." icon="⚙️" />
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection name="Process" id="process" className="framer-1ja5f3k">
        <div className="section-inner">
          <h2 className="framer-text gradient-text">The Roadmap</h2>
          <div className="process-steps">
            {[
              { t: "Discover", d: "Analysis of your current campus data silos." },
              { t: "Integrate", d: "Seamless connection with legacy systems." },
              { t: "Launch", d: "AI-driven automation goes live across departments." }
            ].map((step, i) => (
              <div key={i} className="process-step">
                <span className="step-num">{i + 1}</span>
                <h4>{step.t}</h4>
                <p>{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection name="Cases" id="cases" className="framer-5y9jte">
        <div className="section-inner">
          <h2 className="framer-text gradient-text">Success Stories</h2>
          <div className="cases-grid">
            <div className="case-card">
              <div className="case-image" style={{ background: "linear-gradient(45deg, #1e1e2e, #2a2a40)" }} />
              <h4>Global Tech Institute</h4>
              <p>Achieved 40% reduction in admin overhead.</p>
            </div>
            <div className="case-card">
              <div className="case-image" style={{ background: "linear-gradient(45deg, #1e1e2e, #402a2a)" }} />
              <h4>Riverside Academy</h4>
              <p>Improved student retention by 25% via AI analytics.</p>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection name="Pricing" id="pricing" className="framer-1lujoq5">
        <div className="section-inner">
          <h2 className="framer-text gradient-text">Scale with Confidence</h2>
          <div className="pricing-grid">
            <div className="price-card">
              <span>Starter</span>
              <h3>$999<span>/mo</span></h3>
              <ul><li>Basic Analytics</li><li>Up to 500 Students</li><li>Email Support</li></ul>
            </div>
            <div className="price-card featured">
              <div className="badge">MOST POPULAR</div>
              <span>Professional</span>
              <h3>$2,499<span>/mo</span></h3>
              <ul><li>Full AI Suite</li><li>Unlimited Students</li><li>24/7 Priority Support</li></ul>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <footer className="framer-745n77-container">
        <div className="footer-content">
          <div className="footer-brand">CampusOPS</div>
          <div className="footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">LinkedIn</a>
          </div>
          <p>© 2025 CampusOPS | Intelligence for Education.</p>
        </div>
      </footer>

      {/* Background shapes */}
      <div className="background-shapes">
        <div className="shape circle-1" />
        <div className="shape circle-2" />
        <div className="shape-orb orb-1" />
      </div>
    </div>
  );
}

export default App;
