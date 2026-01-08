# CampusOPS v3 🎓

> **Precision Tools for the Modern Educational Landscape.**  
> *A Hackathon Project by Grishma Mahorkar*

![CampusOPS Banner](https://img.shields.io/badge/Status-Live-success) ![Stack](https://img.shields.io/badge/Stack-Next.js_14_•_Firebase_•_Tailwind-blue)

**Live Demo:** [https://pulxo-campusops-9pvm10l6r-grishm7890s-projects.vercel.app](https://pulxo-campusops-9pvm10l6r-grishm7890s-projects.vercel.app)  
**Transparency Portal:** [https://pulxo-campusops-9pvm10l6r-grishm7890s-projects.vercel.app/public/6f026c03c3cf6fdee2e582f8e6b795e85f2a75869134a4d5d8016276e2ae6167](https://pulxo-campusops-9pvm10l6r-grishm7890s-projects.vercel.app/public/6f026c03c3cf6fdee2e582f8e6b795e85f2a75869134a4d5d8016276e2ae6167)

---

## 🚀 Overview

**CampusOPS** is an intelligent orchestration platform designed to replace legacy, disjointed facility management systems in universities. It unifies incident reporting, maintenance dispatch, and operational analytics into a single, real-time "Glassmorphism" dashboard.

Unlike traditional ticket systems, CampusOPS uses a **Zero Trust** security model and an automated **SLA Engine** to prioritize issues (Critical/High/Medium) dynamically. It also features a "Civic Tech" public transparency layer, ensuring accountability by publishing sanitized operational data to the public.

## ✨ Key Features

### 1. 🛡️ Role-Based Orchestration (Zero Trust)
*   **Students**: Can report issues but only see their own history.
*   **Faculty**: Can escalate issues to "Critical" status with a dedicated **Emergency Interaction Mode**.
*   **Maintenance**: Receive prioritized work orders.
*   **Admin**: Full "God Mode" view of the entire campus topology.

### 2. ⚡ The "Smart" SLA Engine
Automated deadline assignment based on severity calculation:
*   🔴 **Critical**: 1 Hour Response (AC Failure, Security Risk)
*   🟠 **High**: 4 Hour Response
*   🟢 **Medium**: 12 Hour Response
*   *Powered by Vercel Serverless Functions.*

### 3. 🕊️ Public Transparency (Open Data)
A dedicated `/public/[id]` portal that serves **sanitized** operational metrics.
*   **Privacy First**: Automatically strips all PII (names, User IDs) at the API level.
*   **Live Charts**: Client-side rendering of Resolution Rates and Efficiency Scores.
*   **CSV Export**: One-click download of operational datasets for external auditing.

### 4. 🚨 External Escalation Workflow
A dramatic, high-stakes UI for reporting emergencies:
*   **Visual & Audio Alert**: Uses Web Audio API to generate siren tones.
*   **Immutable Audit Log**: Every escalation is recorded in a tamper-proof Firestore ledger (`audit_logs` collection).

---

## 🛠️ Tech Stack

*   **Frontend**: Next.js 14, React Server Components, TailwindCSS, Framer Motion.
*   **Backend**: Next.js API Routes (Serverless), Google Firebase Admin SDK.
*   **Database**: Google Cloud Firestore (NoSQL, Real-time).
*   **Authentication**: Firebase Auth + Custom Claims/Role Management.
*   **Deploy**: Vercel Edge Network.

---

## 📸 Usage / Demo Flow

1.  **Landing Page**: View the 3D Hero and Live Map.
2.  **Transparency Mode**: Click "Transparency" in the footer to see the public ledger without logging in.
3.  **Login**: Use the demo credentials (provided to judges) to access the Admin Dashboard.
4.  **Report & Escalate**: Submit a ticket and use the "Escalate" button to trigger the emergency workflow.

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/your-username/campus-ops.git

# Install dependencies
npm install

# Setup Environment Variables
# Create a .env.local file with your Firebase credentials:
# NEXT_PUBLIC_FIREBASE_API_KEY=...
# FIREBASE_SERVICE_ACCOUNT=...

# Run Development Server
npm run dev
```

---

## 📄 License
MIT License. Built for the 2025 Hackathon. 
