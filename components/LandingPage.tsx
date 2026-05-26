"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Sliders,
  PlayCircle,
  BarChart2,
  FileText,
  CheckCircle2,
  Clock,
  TrendingUp,
  BookOpen,
  Star,
  ArrowRight,
  Target,
  Zap,
  Shield,
  ChevronDown,
  Search,
  Bell,
  Check,
  Plus,
  Play,
  Pause,
  MessageSquare,
  Calendar,
  Lock,
  Layers,
  Layout,
  Code
} from "lucide-react";

// Fade up animation helper
const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay } },
});

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// Unified Brand Logo Emblem (Matches Favicon Squircle)
function BrandLogo({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <svg className={`${className} shrink-0`} viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="180" height="180" rx="46" fill="#090D1A" />
      <path d="M90 35 L145 90 L90 145 L35 90 Z" stroke="#E2E8F0" strokeWidth="12" strokeLinejoin="round" />
      <path d="M90 60 L120 90 L90 120 L60 90 Z" fill="#F1F5F9" />
      <circle cx="90" cy="90" r="14" fill="#090D1A" />
      <circle cx="90" cy="90" r="6" fill="#E2E8F0" />
    </svg>
  );
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isTicking, setIsTicking] = useState(true);
  const [timeVal, setTimeVal] = useState("04:21:58");
  const [checklist, setChecklist] = useState([
    { id: 1, text: "Finish Contract Law questions 🔥", checked: true },
    { id: 2, text: "Solve medium-difficulty reasoning", checked: false },
    { id: 3, text: "Review banking regulations test", checked: false },
  ]);

  // Simulate ticking timer in mock dashboard
  useEffect(() => {
    if (!isTicking) return;
    const interval = setInterval(() => {
      setTimeVal(prev => {
        const parts = prev.split(":").map(Number);
        let seconds = parts[2] + 1;
        let minutes = parts[1];
        let hours = parts[0];

        if (seconds >= 60) {
          seconds = 0;
          minutes += 1;
        }
        if (minutes >= 60) {
          minutes = 0;
          hours += 1;
        }

        const format = (num: number) => String(num).padStart(2, "0");
        return `${format(hours)}:${format(minutes)}:${format(seconds)}`;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTicking]);

  const toggleCheck = (id: number) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  return (
    <div className="landing-root animate-fade-in">
      {/* ── STYLING SYSTEM (Charcoal slate brand matching the platform) ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        .landing-root {
          font-family: 'Inter', sans-serif;
          background-color: #fcfdfe;
          color: #0f172a;
          overflow-x: hidden;
          position: relative;
        }

        .landing-root h1, .landing-root h2, .landing-root h3, .landing-root .font-display {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* Ambient background glow effects matching platform's neutral layout */
        .ambient-glow-1 {
          position: absolute;
          top: -10%;
          left: 5%;
          width: 50vw;
          height: 50vw;
          background: radial-gradient(circle, rgba(15,23,42,0.035) 0%, transparent 70%);
          z-index: 1;
          pointer-events: none;
        }
        .ambient-glow-2 {
          position: absolute;
          top: 40%;
          right: -10%;
          width: 60vw;
          height: 60vw;
          background: radial-gradient(circle, rgba(15,23,42,0.025) 0%, transparent 75%);
          z-index: 1;
          pointer-events: none;
        }

        /* Grid Background pattern */
        .dot-bg {
          background-image: radial-gradient(circle, rgba(9, 13, 26, 0.045) 1px, transparent 1px);
          background-size: 24px 24px;
        }

        /* Glassmorphism containers */
        .glass-card {
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 18px;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.02), 0 1px 3px rgba(0, 0, 0, 0.01);
          backdrop-filter: blur(16px);
        }

        .premium-shadow {
          box-shadow: 
            0 10px 40px -10px rgba(15, 23, 42, 0.04), 
            0 1px 3px rgba(15, 23, 42, 0.01),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }

        .hover-lift {
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease;
        }
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px -12px rgba(15, 23, 42, 0.07), 0 1px 3px rgba(15, 23, 42, 0.02);
          border-color: rgba(15, 23, 42, 0.15);
        }

        /* Pill Badge */
        .pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          background: #ffffff;
          border: 1px solid rgba(15, 23, 42, 0.09);
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02);
        }

        /* Button styling matching the platform's oklch(0.205 0 0) slate black color system */
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 32px;
          background: #0f172a;
          color: #ffffff;
          border-radius: 100px;
          font-size: 15px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
          box-shadow: 0 8px 24px -6px rgba(15, 23, 42, 0.3);
          text-decoration: none;
        }
        .btn-primary:hover {
          background: #1e293b;
          transform: translateY(-2px);
          box-shadow: 0 12px 28px -4px rgba(15, 23, 42, 0.35);
        }

        .btn-outline {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 13px 28px;
          background: #ffffff;
          color: #0f172a;
          border-radius: 100px;
          font-size: 15px;
          font-weight: 600;
          border: 1.5px solid rgba(15, 23, 42, 0.12);
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s, transform 0.2s, background 0.2s;
          text-decoration: none;
        }
        .btn-outline:hover {
          border-color: #0f172a;
          background: #f8fafc;
          transform: translateY(-2px);
        }

        /* Floating widgets keyframe animations */
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-12px) rotate(1deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(-6px) rotate(0.5deg); }
          50% { transform: translateY(6px) rotate(-0.5deg); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }

        .animate-float-1 { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-2 { animation: float-medium 5s ease-in-out infinite; }
        .animate-float-3 { animation: float-fast 4.5s ease-in-out infinite; }

        /* Typography sizing classes */
        .section-title {
          font-size: clamp(34px, 4vw, 54px);
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -1px;
          color: #0f172a;
        }

        /* Bento Grid */
        .bento-layout {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        @media (max-width: 960px) { .bento-layout { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 640px) { .bento-layout { grid-template-columns: 1fr; } }

        .bento-span-2 { grid-column: span 2; }
        @media (max-width: 960px) { .bento-span-2 { grid-column: span 1; } }

        /* Testimonials masonry */
        .masonry-layout {
          column-count: 3;
          column-gap: 24px;
        }
        @media (max-width: 960px) { .masonry-layout { column-count: 2; } }
        @media (max-width: 640px) { .masonry-layout { column-count: 1; } }

        .masonry-item {
          break-inside: avoid;
          margin-bottom: 24px;
          display: inline-block;
          width: 100%;
        }

        /* Custom handwriting font placeholder style */
        .handwriting {
          font-family: 'Kalam', 'Caveat', cursive, sans-serif;
        }

        /* Pushpin detail style */
        .pushpin-dot {
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          position: absolute;
          top: 6px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
        }
        .pushpin-dot::after {
          content: "";
          position: absolute;
          top: 8px;
          left: 3px;
          width: 2px;
          height: 10px;
          background: #991b1b;
          transform: rotate(15deg);
        }

        /* Circular concentric progress rings */
        .progress-circle {
          transition: stroke-dashoffset 0.35s;
          transform: rotate(-90deg);
          transform-origin: 50% 50%;
        }
      `}</style>

      {/* Ambient backgrounds */}
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />

      {/* ══ NAVBAR ══════════════════════════════════════════ */}
      <nav className="fixed top-0 inset-x-0 h-16 bg-white/90 border-b border-gray-100 backdrop-blur-md z-50 flex items-center justify-between px-6 md:px-12 premium-shadow">
        <div className="flex items-center gap-2.5">
          <BrandLogo className="w-8 h-8 shadow-sm" />
          <span className="font-extrabold text-lg text-gray-900 tracking-tight">Test <span className="text-slate-800">Arena</span></span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">Features</a>
          <a href="#challenges" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">Solutions</a>
          <a href="#integrations" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">Integrations</a>
          <a href="#faq" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-3.5">
          <Link href="/signin" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors px-4 py-2">Sign In</Link>
          <Link href="/signin" className="btn-primary" style={{ padding: "9px 22px", fontSize: "14px" }}>Get Started Free</Link>
        </div>
      </nav>

      {/* ══ HERO SECTION ════════════════════════════════════ */}
      <section className="dot-bg pt-28 pb-20 min-h-[96vh] flex flex-col items-center justify-center px-4 relative overflow-hidden">
        
        {/* ──── HERO FLOATING ELEMENTS ──── */}
        {/* Sticky Note Widget (Top-Left) */}
        <div className="hidden lg:block absolute top-[18%] left-[6%] w-[210px] p-5 pb-7 bg-yellow-50 border border-yellow-200/90 rounded shadow-lg animate-float-1 z-20" style={{ transform: "rotate(-3.5deg)" }}>
          <div className="pushpin-dot" />
          <p className="handwriting text-yellow-900 text-base leading-snug mt-2 pt-1 font-medium select-none">
            Prepare smarter — not harder. Target weak categories first. Accuracy is key!
          </p>
        </div>

        {/* Floating Checked Card Widget (Left Center) */}
        <div className="hidden xl:block absolute top-[44%] left-[4%] p-3.5 bg-white border border-gray-100 rounded-2xl shadow-xl animate-float-3 z-20">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
            <Check className="w-5.5 h-5.5 text-slate-800 stroke-[3]" />
          </div>
        </div>

        {/* Today's Target Widget (Bottom-Left) */}
        <div className="hidden lg:block absolute bottom-[12%] left-[5%] w-[230px] p-5 glass-card premium-shadow animate-float-2 z-20">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Today's Targets</p>
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between items-center text-[13px] font-bold text-gray-700 mb-1.5">
                <span>Law — Contracts</span>
                <span className="text-slate-800 font-extrabold">65%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-800 rounded-full" style={{ width: "65%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center text-[13px] font-bold text-gray-700 mb-1.5">
                <span>Finance — Banking</span>
                <span className="text-amber-600 font-extrabold">40%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "40%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Date / Day Floating Tag (Left Bottom Tiny) */}
        <div className="hidden xl:block absolute bottom-[42%] left-[10%] p-4 bg-white border border-gray-100/90 rounded-2xl shadow-lg font-display text-center animate-float-1 z-10 w-[70px]">
          <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest leading-none mb-1">Mon</p>
          <p className="text-2xl font-black text-gray-900 leading-none">20</p>
        </div>

        {/* Today's Paper Reminder Card (Top-Right) */}
        <div className="hidden lg:block absolute top-[16%] right-[6%] w-[230px] p-5 glass-card premium-shadow animate-float-3 z-20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Reminder</span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          </div>
          <p className="font-extrabold text-gray-900 text-sm mb-1 leading-tight">Today's Timed Paper</p>
          <p className="text-xs text-gray-500 font-medium mb-3.5">45 Questions · 45 mins</p>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl">
            <Clock size={13} className="stroke-[2.5]" />
            <span>09:00 AM – 09:45 AM</span>
          </div>
        </div>

        {/* Floating Clock Icon Block (Right Center) */}
        <div className="hidden xl:block absolute top-[45%] right-[4%] p-3.5 bg-white border border-gray-100 rounded-2xl shadow-xl animate-float-2 z-20">
          <div className="w-10 h-10 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center justify-center">
            <Clock className="w-5.5 h-5.5 text-amber-600 stroke-[2.5]" />
          </div>
        </div>

        {/* Performance Accuracy Ring Widget (Bottom-Right) */}
        <div className="hidden lg:block absolute bottom-[14%] right-[5%] w-[210px] p-5 glass-card premium-shadow text-center animate-float-1 z-20">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 block">Accuracy Trend</span>
          <p className="text-4xl font-extrabold text-slate-800 tracking-tight leading-none mb-1.5">78%</p>
          <p className="text-xs text-gray-500 font-semibold mb-3">+6% this week</p>
          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
            <TrendingUp size={11} className="stroke-[2.5]" />
            <span>IMPROVING</span>
          </div>
        </div>

        {/* ──── HERO CENTRAL CONTENT ──── */}
        <div className="max-w-[760px] text-center z-30 px-2 relative flex flex-col items-center">
          
          {/* Pill Badge Announcement */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp(0)} className="mb-6">
            <span className="pill-badge border border-gray-200/90 font-semibold">
              <span className="flex h-2 w-2 rounded-full bg-slate-800" />
              🎯 The Smart Workspace for Exam Aspirants
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp(0.08)} 
            className="text-[44px] sm:text-[60px] md:text-[76px] font-extrabold text-gray-900 leading-[1.05] tracking-tighter mb-4">
            Think, prepare, and <span className="text-slate-800/80 border-b-4 border-slate-800/25">track</span> all in one place.
          </motion.h1>

          {/* Subheading Description */}
          <motion.p initial="hidden" animate="visible" variants={fadeUp(0.16)} 
            className="text-base sm:text-lg md:text-xl text-gray-500 font-medium max-w-[560px] leading-relaxed mb-9">
            A highly focused, distraction-free environment built exclusively for serious candidates. Import custom question banks, configure papers, and master timed mock exams.
          </motion.p>

          {/* Action CTAs */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp(0.24)} 
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-center mb-6">
            <Link href="/signin" className="btn-primary w-full sm:w-auto justify-center text-base">
              Get Started Free <ArrowRight size={16} className="stroke-[2.5]" />
            </Link>
            <Link href="/signin" className="btn-outline w-full sm:w-auto justify-center text-base">
              Explore Dashboard
            </Link>
          </motion.div>

          {/* Benefits Tags */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp(0.32)} 
            className="flex flex-wrap gap-x-6 gap-y-2 justify-center mt-3 text-xs font-semibold text-gray-500">
            {["No credit card required", "Auto-parse JSON / PDF / Word", "Free forever features"].map((item, idx) => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600 stroke-[2.5]" />
                <span>{item}</span>
              </div>
            ))}
          </motion.div>
        </div>

      </section>

      {/* ══ STATS SECTION ═══════════════════════════════════ */}
      <section className="bg-white border-y border-gray-100 py-10 relative z-30">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: "12,000+", label: "Questions Practiced" },
            { value: "3 Format", label: "Auto-Import System" },
            { value: "0.5s", label: "Paper Setup Time" },
            { value: "100%", label: "Private & Secure Pool" },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">{stat.value}</p>
              <p className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CHALLENGES & MOCKUP SECTION ══════════════════════ */}
      <section id="challenges" className="py-24 px-6 md:px-12 max-w-7xl mx-auto relative z-30">
        
        {/* Section Header */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="text-center mb-16">
          <motion.div variants={fadeUp()} className="flex justify-center mb-4">
            <span className="pill-badge bg-slate-50 border-slate-100 text-slate-800 font-bold">SOLUTIONS</span>
          </motion.div>
          <motion.h2 variants={fadeUp(0.05)} className="section-title">
            Solve your preparation's<br />biggest challenges
          </motion.h2>
        </motion.div>

        {/* Feature 3-Column Bullet Points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
          {[
            {
              icon: <Layers size={22} className="text-slate-800" />,
              title: "Scatter No More",
              desc: "Consolidate scattered study guides, question banks, and PDFs into one single, powerful question pool searchable in milliseconds."
            },
            {
              icon: <Sliders size={22} className="text-slate-800" />,
              title: "Custom Paper Presets",
              desc: "Filter by subject, category, and exact difficulties. Set timing and question caps once, then launch a fresh set instantly anytime."
            },
            {
              icon: <BarChart2 size={22} className="text-slate-800" />,
              title: "Know Where You Stand",
              desc: "Get deep, visual analytics of every timed attempt. Unmask your weakest areas, trace score growth, and optimize study routes."
            }
          ].map((item, idx) => (
            <div key={item.title} className="flex flex-col items-start">
              <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4 shadow-sm">
                {item.icon}
              </div>
              <h3 className="font-extrabold text-gray-900 text-lg mb-2">{item.title}</h3>
              <p className="text-sm font-medium text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* ──── MASSIVE MOCKUP DASHBOARD (Color scheme matches oklch minimal system) ──── */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true, margin: "-100px" }} 
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} 
          className="relative max-w-6xl mx-auto rounded-3xl p-5 bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl premium-shadow"
        >
          {/* Inner mock browser frame */}
          <div className="bg-slate-50 rounded-2xl overflow-hidden shadow-inner border border-white/10 select-none">
            
            {/* Window Browser Header */}
            <div className="bg-gray-100/90 border-b border-gray-200/70 px-5 py-3 flex items-center justify-between">
              {/* Traffic control lights */}
              <div className="flex gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-slate-300 border border-slate-400/20" />
                <span className="w-3.5 h-3.5 rounded-full bg-slate-300 border border-slate-400/20" />
                <span className="w-3.5 h-3.5 rounded-full bg-slate-300 border border-slate-400/20" />
              </div>
              
              {/* URL Address Input Bar */}
              <div className="flex-1 max-w-[340px] bg-white border border-gray-200 px-3 py-1 rounded-lg text-center flex items-center justify-center gap-1.5">
                <Lock size={11} className="text-gray-400" />
                <span className="text-[11px] font-bold text-gray-400 select-none">testarena.app/dashboard</span>
              </div>

              {/* Action indicators */}
              <div className="w-16" />
            </div>

            {/* Mock Dashboard Area */}
            <div className="flex flex-col lg:flex-row min-h-[500px] bg-white">
              
              {/* Sidebar */}
              <div className="w-full lg:w-[210px] bg-slate-50 border-r border-gray-100 p-5 flex flex-row lg:flex-col gap-1 flex-wrap lg:flex-nowrap">
                <div className="flex items-center gap-2 mb-4 w-full px-2">
                  <BrandLogo className="w-6.5 h-6.5 shadow-xs" />
                  <span className="font-extrabold text-[13px] text-gray-900 leading-none">Test Arena</span>
                </div>

                {[
                  { name: "Dashboard", active: true },
                  { name: "My Saved Papers", active: false },
                  { name: "Import Banks", active: false },
                  { name: "Attempt History", active: false },
                  { name: "Performance Stats", active: false }
                ].map((sidebarItem, idx) => (
                  <div key={sidebarItem.name} className={`px-3 py-2 w-full text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer ${sidebarItem.active ? "bg-slate-200/60 text-slate-900 border-l-2 border-slate-900 rounded-l-none" : "text-gray-500 hover:bg-gray-100/50"}`}>
                    <span>{sidebarItem.name}</span>
                  </div>
                ))}
              </div>

              {/* Main Content Area */}
              <div className="flex-1 p-6 md:p-8 bg-slate-50/50">
                {/* Greeting & Date Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                  <div>
                    <h4 className="font-extrabold text-xl md:text-2xl text-gray-900 leading-tight">Good morning, Candidate 👋</h4>
                    <p className="text-[12px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Monday, 25 May 2026</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-gray-700 shadow-sm"><Search size={15} /></button>
                    <button className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-gray-700 shadow-sm relative">
                      <Bell size={15} />
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                    </button>
                    <div className="w-8.5 h-8.5 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700">MT</div>
                  </div>
                </div>

                {/* Dashboard Widgets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  
                  {/* WIDGET 1: Checkbox / To-do (Interactive styling) */}
                  <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm md:col-span-1 lg:col-span-1">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="font-extrabold text-[13px] text-gray-900">Today's Practice Targets</h5>
                      <button className="w-6.5 h-6.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-lg flex items-center justify-center transition-colors"><Plus size={13} className="stroke-[3]" /></button>
                    </div>
                    <div className="space-y-2.5">
                      {checklist.map(item => (
                        <div key={item.id} className="flex items-center gap-3 py-1 cursor-pointer" onClick={() => toggleCheck(item.id)}>
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${item.checked ? "bg-slate-900 border-slate-900" : "bg-white border-gray-200"}`}>
                            {item.checked && <Check size={11} className="text-white stroke-[3.5]" />}
                          </div>
                          <span className={`text-[12px] font-semibold transition-all select-none ${item.checked ? "text-gray-400 line-through" : "text-gray-700"}`}>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* WIDGET 2: Live Time Tracker */}
                  <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm text-center">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-widest bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">Practice Timer</span>
                      <span className="text-xs font-bold text-gray-400">Section A Timed</span>
                    </div>
                    
                    {/* Digit clock readout */}
                    <div className="my-4">
                      <p className="font-mono text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight font-display">{timeVal}</p>
                    </div>

                    {/* Clock Controls */}
                    <div className="flex justify-center gap-3.5">
                      <button 
                        onClick={() => setIsTicking(!isTicking)}
                        className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all shadow-sm ${isTicking ? "bg-amber-50 hover:bg-amber-100 border-amber-100 text-amber-600" : "bg-slate-900 hover:bg-slate-800 border-slate-900 text-white"}`}
                      >
                        {isTicking ? <Pause size={14} className="stroke-[3]" /> : <Play size={14} className="stroke-[3]" />}
                      </button>
                      <button 
                        onClick={() => setTimeVal("00:00:00")}
                        className="w-9 h-9 bg-red-50 hover:bg-red-100 border border-red-100 text-red-500 rounded-full flex items-center justify-center transition-all shadow-sm"
                      >
                        <span className="w-2.5 h-2.5 bg-red-500 rounded" />
                      </button>
                    </div>
                  </div>

                  {/* WIDGET 3: Rings progress (SVG Multi-concentric rings) */}
                  <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col items-center justify-center">
                    <div className="flex justify-between items-center w-full mb-3">
                      <h5 className="font-extrabold text-[13px] text-gray-900">Activity Ring</h5>
                      <span className="text-[11px] font-bold text-emerald-600">80% Done</span>
                    </div>

                    {/* SVG concentric progress circles */}
                    <div className="relative w-28 h-28 my-1 flex items-center justify-center">
                      <svg width="100%" height="100%" viewBox="0 0 100 100">
                        {/* Outer slate ring */}
                        <circle cx="50" cy="50" r="40" stroke="#e2e8f0" strokeWidth="6" fill="transparent" />
                        <circle cx="50" cy="50" r="40" stroke="#0f172a" strokeWidth="6" fill="transparent" 
                          strokeDasharray="251.2" strokeDashoffset="50.2" className="progress-circle" />

                        {/* Middle emerald ring */}
                        <circle cx="50" cy="50" r="30" stroke="#e2e8f0" strokeWidth="6" fill="transparent" />
                        <circle cx="50" cy="50" r="30" stroke="#10b981" strokeWidth="6" fill="transparent" 
                          strokeDasharray="188.4" strokeDashoffset="56.5" className="progress-circle" />

                        {/* Inner amber ring */}
                        <circle cx="50" cy="50" r="20" stroke="#e2e8f0" strokeWidth="6" fill="transparent" />
                        <circle cx="50" cy="50" r="20" stroke="#f59e0b" strokeWidth="6" fill="transparent" 
                          strokeDasharray="125.6" strokeDashoffset="37.6" className="progress-circle" />
                      </svg>
                      {/* Ring Center Readout */}
                      <div className="absolute text-center">
                        <p className="text-base font-black text-gray-900 leading-none">29/40</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Solved</p>
                      </div>
                    </div>
                  </div>

                  {/* WIDGET 4: Recent Attempts checklist */}
                  <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm md:col-span-2 lg:col-span-3">
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="font-extrabold text-[13px] text-gray-900">Recent Paper Attempts</h5>
                      <span className="text-xs font-semibold text-gray-400 hover:text-gray-700 cursor-pointer">View all history →</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { title: "Law contracts and legal Mock #3", date: "May 24", score: "84%", pass: true },
                        { title: "Finance Banking Regulations Quick Paper", date: "May 23", score: "62%", pass: false }
                      ].map((attempt, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3.5 bg-slate-50 border border-gray-100/70 rounded-xl">
                          <div>
                            <p className="text-[12px] font-bold text-gray-900 leading-tight mb-1 truncate max-w-[210px]">{attempt.title}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{attempt.date}</p>
                          </div>
                          <div className={`px-2.5 py-1 text-xs font-black rounded-lg ${attempt.pass ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                            {attempt.score}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </motion.div>

      </section>

      {/* ══ BENTO FEATURES GRID SECTION ═════════════════════ */}
      <section id="features" className="py-24 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          
          {/* Section Header */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="text-center mb-16">
            <motion.div variants={fadeUp()} className="flex justify-center mb-4">
              <span className="pill-badge bg-slate-50 border-slate-100 text-slate-800 font-bold">FEATURES</span>
            </motion.div>
            <motion.h2 variants={fadeUp(0.05)} className="section-title">
              Keep everything<br />in one place
            </motion.h2>
            <motion.p variants={fadeUp(0.1)} className="text-base text-gray-400 font-semibold max-w-[480px] mx-auto mt-3">
              Forget offline timers, manual score calculators, and messy Google Drive folders.
            </motion.p>
          </motion.div>

          {/* Bento Grid */}
          <div className="bento-layout">
            
            {/* Bento Card 1: Seamless Importing (Wide Span 2) */}
            <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="bento-span-2 p-8 bg-slate-50/40 border border-slate-100 rounded-3xl hover-lift flex flex-col justify-between overflow-hidden relative min-h-[310px]"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-5"><Upload size={20} className="text-slate-800" /></div>
                <h3 className="font-extrabold text-xl text-gray-900 mb-2.5">Seamless Question Importing</h3>
                <p className="text-sm font-medium text-gray-500 leading-relaxed max-w-[420px]">
                  Drop a JSON, PDF, or Word DOCX. Our intelligent pipeline automatically parses, parses metadata, and lists them into your custom searchable practice pool.
                </p>
              </div>

              {/* Decorative mockup inside card */}
              <div className="mt-8 flex flex-wrap gap-2.5">
                {[
                  { label: "PDF Document", color: "bg-red-50 text-red-500 border-red-100" },
                  { label: "Word DOCX", color: "bg-slate-50 text-slate-800 border-slate-100" },
                  { label: "JSON Scheme", color: "bg-purple-50 text-purple-600 border-purple-100" }
                ].map(fmt => (
                  <span key={fmt.label} className={`px-4 py-2 border rounded-xl text-xs font-bold ${fmt.color}`}>
                    {fmt.label}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Bento Card 2: Advanced Timing Tools */}
            <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
              className="p-8 bg-slate-50/30 border border-slate-100 rounded-3xl hover-lift flex flex-col justify-between min-h-[310px]"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-5"><Clock size={20} className="text-slate-800" /></div>
                <h3 className="font-extrabold text-xl text-gray-900 mb-2.5">Advanced Timing</h3>
                <p className="text-sm font-medium text-gray-500 leading-relaxed">
                  Real-time stopwatch timer, review flagging systems, and automatic cutoff triggers mimic actual exam guidelines.
                </p>
              </div>
              <div className="mt-6 flex items-baseline gap-1 text-2xl font-black text-slate-850 font-mono">
                <span>04:21</span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1.5">stopwatch</span>
              </div>
            </motion.div>

            {/* Bento Card 3: Subject-wise Presets */}
            <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="p-8 bg-slate-50/30 border border-slate-100 rounded-3xl hover-lift flex flex-col justify-between min-h-[310px]"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-5"><Sliders size={20} className="text-slate-800" /></div>
                <h3 className="font-extrabold text-xl text-gray-900 mb-2.5">Saved Presets</h3>
                <p className="text-sm font-medium text-gray-500 leading-relaxed">
                  Configure specific category distribution, time frames, and difficulty ratios once. Launch matching papers in a single tap later.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-1.5">
                {["Easy", "Medium", "Hard"].map(d => (
                  <span key={d} className="px-2.5 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-bold text-slate-800 uppercase">
                    {d}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Bento Card 4: Deep Visual Analytics (Wide Span 2) */}
            <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
              className="bento-span-2 p-8 bg-slate-50/30 border border-slate-100 rounded-3xl hover-lift flex flex-col justify-between min-h-[310px]"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-5"><BarChart2 size={20} className="text-slate-800" /></div>
                <h3 className="font-extrabold text-xl text-gray-900 mb-2.5">Visual Growth Analytics</h3>
                <p className="text-sm font-medium text-gray-500 leading-relaxed max-w-[420px]">
                  Unveil detailed, graphical subject summaries of your active attempts. See your speed trajectory and pin down sections that require direct attention.
                </p>
              </div>

              {/* Simulated mini statistics bars */}
              <div className="mt-8 grid grid-cols-3 gap-3">
                {[
                  { label: "Law Section", pct: "84%", color: "bg-slate-800" },
                  { label: "General Fin", pct: "62%", color: "bg-amber-500" },
                  { label: "Reasoning", pct: "75%", color: "bg-emerald-650" }
                ].map(stat => (
                  <div key={stat.label} className="p-3 bg-white border border-slate-100 rounded-xl text-center">
                    <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1 leading-none">{stat.label}</p>
                    <p className="text-lg font-black text-gray-800 leading-none mb-2">{stat.pct}</p>
                    <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                      <div className={`h-full ${stat.color} rounded-full`} style={{ width: stat.pct }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>

        </div>
      </section>

      {/* ══ CONNECT INTEGRATIONS SECTION ════════════════════ */}
      <section id="integrations" className="py-24 max-w-7xl mx-auto px-6 md:px-12 relative z-30">
        
        {/* Section Header */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="text-center mb-16">
          <motion.div variants={fadeUp()} className="flex justify-center mb-4">
            <span className="pill-badge bg-slate-50 border-slate-100 text-slate-850 font-bold">INTEGRATIONS</span>
          </motion.div>
          <motion.h2 variants={fadeUp(0.05)} className="section-title">
            Connect the sources<br />you study from every day
          </motion.h2>
          <motion.p variants={fadeUp(0.1)} className="text-base text-gray-400 font-semibold max-w-[480px] mx-auto mt-3">
            Quickly ingest practice data directly from standard cloud, formats, or visual document notes.
          </motion.p>
        </motion.div>

        {/* Dynamic network integrations grid */}
        <div className="relative max-w-4xl mx-auto mt-12">
          
          {/* Subtle network lines in background (Dashed SVG Paths) */}
          <div className="absolute inset-0 z-0 pointer-events-none select-none flex items-center justify-center opacity-30">
            <svg width="100%" height="120%" className="text-gray-200">
              <line x1="10%" y1="20%" x2="50%" y2="50%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6,6" />
              <line x1="30%" y1="15%" x2="50%" y2="50%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6,6" />
              <line x1="50%" y1="10%" x2="50%" y2="50%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6,6" />
              <line x1="70%" y1="15%" x2="50%" y2="50%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6,6" />
              <line x1="90%" y1="20%" x2="50%" y2="50%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6,6" />
              <line x1="10%" y1="80%" x2="50%" y2="50%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6,6" />
              <line x1="30%" y1="85%" x2="50%" y2="50%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6,6" />
              <line x1="70%" y1="85%" x2="50%" y2="50%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6,6" />
              <line x1="90%" y1="80%" x2="50%" y2="50%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6,6" />
            </svg>
          </div>

          {/* Central Logo node */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-16 h-16 rounded-2xl bg-slate-900 border-[3px] border-white shadow-xl flex items-center justify-center animate-pulse">
            <BrandLogo className="w-10 h-10" />
          </div>

          {/* Grid nodes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 relative z-10 py-10">
            {[
              { label: "Google PDF", format: "PDF File", icon: <FileText size={18} className="text-red-500" /> },
              { label: "Word Docx", format: "MS Word", icon: <FileText size={18} className="text-slate-800" /> },
              { label: "JSON Scheme", format: "Data Object", icon: <Code size={18} className="text-purple-500" /> },
              { label: "Google Drive", format: "Cloud Folder", icon: <Layout size={18} className="text-emerald-600" /> },
              { label: "Notion Study", format: "Notes Sync", icon: <BookOpen size={18} className="text-gray-800" /> },
              { label: "One Drive", format: "Microsoft Cloud", icon: <Shield size={18} className="text-sky-500" /> },
              { label: "Anki Decks", format: "Flashcards", icon: <Zap size={18} className="text-amber-505" /> },
              { label: "Google Calendar", format: "Schedule API", icon: <Calendar size={18} className="text-slate-600" /> }
            ].map((node, idx) => (
              <div key={node.label} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm text-center flex flex-col items-center hover-lift">
                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
                  {node.icon}
                </div>
                <p className="text-xs font-bold text-gray-900 leading-none mb-1">{node.label}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{node.format}</p>
              </div>
            ))}
          </div>

        </div>

      </section>

      {/* ══ TESTIMONIALS SECTION (Masonry Layout) ════════════ */}
      <section className="py-24 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative">

          {/* Floating dynamic chat bubble pin (Left border) */}
          <div className="hidden lg:block absolute top-[28%] left-[2%] p-2.5 bg-white border border-gray-100 rounded-2xl shadow-xl animate-float-3 z-20">
            <MessageSquare size={16} className="text-slate-800 stroke-[2.5]" />
          </div>

          {/* Section Header */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="text-center mb-16">
            <motion.div variants={fadeUp()} className="flex justify-center mb-4">
              <span className="pill-badge bg-slate-50 border-slate-100 text-slate-800 font-bold">TESTIMONIALS</span>
            </motion.div>
            <motion.h2 variants={fadeUp(0.05)} className="section-title">
              People like you are<br />already using Test Arena
            </motion.h2>
          </motion.div>

          {/* Masonry testimonial columns */}
          <div className="masonry-layout">
            
            {/* Card 1 */}
            <div className="masonry-item">
              <div className="p-6 bg-slate-50/50 border border-gray-100 rounded-2xl premium-shadow">
                <div className="flex gap-0.5 mb-3.5">
                  {[...Array(5)].map((_, i) => <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />)}
                </div>
                <p className="text-sm font-semibold text-gray-700 leading-relaxed mb-4">
                  "Test Arena completely changed how I prepare. Having all my papers saved and accessible in one click saves me hours every week."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm">RM</div>
                  <div>
                    <h5 className="font-extrabold text-[13px] text-gray-900 leading-none mb-1">Rohan M.</h5>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Aspirant</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: VIDEO REVIEW MOCKUP (Image 5 matching) */}
            <div className="masonry-item">
              <div className="p-4 bg-slate-50/50 border border-gray-100 rounded-2xl premium-shadow relative overflow-hidden group select-none">
                
                {/* Visual Video Cover mockup */}
                <div className="relative aspect-video rounded-xl bg-gray-200 overflow-hidden flex items-center justify-center">
                  {/* Backdrop Avatar Picture Mock */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />
                  
                  {/* Simulated student representation */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.4)_0%,transparent_70%)] flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100/20 border border-white/20 flex items-center justify-center backdrop-blur-md">
                      <BrandLogo className="w-10 h-10 opacity-90" />
                    </div>
                  </div>

                  {/* Play circle overlay button */}
                  <div className="absolute z-20 w-11 h-11 bg-white hover:scale-105 rounded-full flex items-center justify-center shadow-lg transition-transform cursor-pointer">
                    <Play size={15} fill="#0f172a" className="text-slate-800 ml-0.5" />
                  </div>

                  {/* Youtube Red Icon Tag Floating at the bottom-right of the video */}
                  <div className="absolute bottom-2.5 right-2.5 z-20 px-2.5 py-1 bg-red-650 border border-red-500 rounded-lg flex items-center justify-center shadow-md shadow-red-500/25">
                    <Play size={8} fill="#fff" className="text-white" />
                  </div>

                  {/* Watch Video Tag bottom-left */}
                  <div className="absolute bottom-2.5 left-2.5 z-20 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] font-bold text-white uppercase tracking-wider">
                    Watch video review
                  </div>
                </div>

                <div className="pt-4 px-1">
                  <p className="text-[12px] font-bold text-gray-800 mb-2 leading-snug">"This dashboard has everything. No stopwatch or messy PDF trackers needed."</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center font-extrabold text-[10px] text-white">JK</div>
                    <span className="text-[11px] font-extrabold text-gray-900 leading-none">John K. · <span className="text-gray-400 font-bold uppercase">Candidate</span></span>
                  </div>
                </div>

              </div>
            </div>

            {/* Card 3 */}
            <div className="masonry-item">
              <div className="p-6 bg-slate-50/50 border border-gray-100 rounded-2xl premium-shadow">
                <div className="flex gap-0.5 mb-3.5">
                  {[...Array(5)].map((_, i) => <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />)}
                </div>
                <p className="text-sm font-semibold text-gray-700 leading-relaxed mb-4">
                  "The analytics showed me I was spending too much time on easy finance questions. I targeted that and my mock scores jumped 12%."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">PS</div>
                  <div>
                    <h5 className="font-extrabold text-[13px] text-gray-900 leading-none mb-1">Priya S.</h5>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Final Year Aspirant</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="masonry-item">
              <div className="p-6 bg-slate-50/50 border border-gray-100 rounded-2xl premium-shadow">
                <div className="flex gap-0.5 mb-3.5">
                  {[...Array(5)].map((_, i) => <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />)}
                </div>
                <p className="text-sm font-semibold text-gray-700 leading-relaxed mb-4">
                  "Saved presets mean I can spin up a Law mock every morning in under a minute. Daily practice has never been so seamless."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">MR</div>
                  <div>
                    <h5 className="font-extrabold text-[13px] text-gray-900 leading-none mb-1">Meena R.</h5>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Working Professional</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 5 */}
            <div className="masonry-item">
              <div className="p-6 bg-slate-50/50 border border-gray-100 rounded-2xl premium-shadow">
                <div className="flex gap-0.5 mb-3.5">
                  {[...Array(5)].map((_, i) => <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />)}
                </div>
                <p className="text-sm font-semibold text-gray-700 leading-relaxed mb-4">
                  "Reviewing wrong answers right after a session — that single feature improved my conceptual retention dramatically."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">VD</div>
                  <div>
                    <h5 className="font-extrabold text-[13px] text-gray-900 leading-none mb-1">Vikram D.</h5>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Serious Aspirant</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══ FAQ SECTION (Accordion) ═══════════════════════════ */}
      <section id="faq" className="py-24 bg-slate-50/30">
        <div className="max-w-[760px] mx-auto px-6">
          
          {/* Section Header */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12">
            <motion.div variants={fadeUp()} className="flex justify-center mb-4">
              <span className="pill-badge bg-slate-50 border-slate-100 text-slate-800 font-bold">FAQ</span>
            </motion.div>
            <motion.h2 variants={fadeUp(0.05)} className="section-title text-[34px] sm:text-[44px]">
              Common questions
            </motion.h2>
          </motion.div>

          {/* Accordion List */}
          <div className="space-y-3.5">
            {[
              { q: "What file formats can I import?", a: "We support JSON, PDF, and DOCX files. JSON offers the richest integration experience (directly parses questions, options, sections, and metadata). PDF and DOCX files are parsed using optimized extraction techniques." },
              { q: "How do saved papers work?", a: "Create a paper preset once by selecting your desired sections, time cap, and difficulties. We save that template. Whenever you want to launch that preset, click 'Start' — we pull a fresh, random set of questions from your bank matching those rules instantly." },
              { q: "Is my imported bank kept private?", a: "Yes. Your question banks, custom mock configurations, and attempt history are tied exclusively to your private account credentials and are never shared with anyone." },
              { q: "Can I retake the same custom paper?", a: "Absolutely. Every time you re-launch a saved paper template, the system pulls a fresh randomized configuration of questions matching your filters, giving you an infinite variety of sessions." },
              { q: "Does the arena work on mobile devices?", a: "The platform is fully responsive and adjusts beautifully to any mobile screen size. However, for a realistic timed exam experience that mimics actual exam center pressures, desktop browser layouts are highly recommended." }
            ].map((faq, idx) => (
              <div key={idx} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <button 
                  className="w-full flex items-center justify-between p-5 text-left font-extrabold text-sm md:text-base text-gray-900"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={18} className={`text-gray-400 transition-transform duration-200 ${openFaq === idx ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-gray-50 bg-slate-50/30"
                    >
                      <p className="p-5 text-[13px] md:text-sm font-medium text-gray-500 leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══ FINAL CTA SECTION ═══════════════════════════════ */}
      <section className="bg-slate-900 py-24 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0%,transparent_70%)] pointer-events-none select-none z-0" />
        <div className="max-w-[620px] mx-auto px-6 relative z-10 flex flex-col items-center">
          <h2 className="text-3xl sm:text-[48px] font-extrabold leading-tight tracking-tight mb-4 font-display">Ready to prep smarter?</h2>
          <p className="text-slate-300 text-sm sm:text-base font-medium max-w-[420px] mb-8 leading-relaxed">
            Join hundreds of serious candidates who are already configuring custom papers and improving daily.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full justify-center">
            <Link href="/signin" className="px-8 py-3.5 bg-white text-slate-950 hover:bg-gray-100 transition-colors font-extrabold rounded-full text-sm sm:text-base shadow-lg shadow-black/10">
              Start Free Today
            </Link>
            <Link href="/signin" className="px-7 py-3 border border-white/40 hover:border-white transition-colors text-white font-semibold rounded-full text-sm sm:text-base">
              Sign In
            </Link>
          </div>
          <p className="text-xs text-slate-400 font-bold mt-5 tracking-wide">No credit card required · Free plan supports core dashboard</p>
        </div>
      </section>

      {/* ══ FOOTER SECTION ══════════════════════════════════ */}
      <footer className="bg-gray-950 py-16 px-6 md:px-12 text-gray-400 border-t border-gray-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <BrandLogo className="w-8 h-8" />
              <span className="font-extrabold text-white text-base tracking-tight">Test Arena</span>
            </div>
            <p className="text-sm font-medium text-gray-500 leading-relaxed max-w-[280px]">
              Distraction-free timed practice and deep growth statistics for successful examinations.
            </p>
          </div>

          <div>
            <h5 className="text-white font-bold text-xs uppercase tracking-wider mb-4">Platform</h5>
            <div className="space-y-3 text-sm font-semibold">
              <a href="#features" className="block hover:text-white transition-colors">Features</a>
              <a href="#challenges" className="block hover:text-white transition-colors">Solutions</a>
              <a href="#integrations" className="block hover:text-white transition-colors">Integrations</a>
            </div>
          </div>

          <div>
            <h5 className="text-white font-bold text-xs uppercase tracking-wider mb-4">Legal</h5>
            <div className="space-y-3 text-sm font-semibold">
              <a href="#" className="block hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="block hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="block hover:text-white transition-colors">Cookie settings</a>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-gray-900/60 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold text-gray-500">
          <p>© 2026 Test Arena. All rights reserved.</p>
          <p className="flex items-center gap-1">Built with 🎯 for successful Candidates</p>
        </div>
      </footer>

    </div>
  );
}
