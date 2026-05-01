import React, { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { ShieldAlert, Activity, LayoutDashboard, KeyRound, ArrowRight, Mail, MessageSquare, AlertTriangle, Globe, Server, CheckCircle, XCircle, Search, LogOut, ShieldCheck, Zap, BarChart3, Fingerprint, Loader, CloudOff, Trash2, Bug, Check, Home as HomeIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { ComposableMap, Geographies, Geography } from "react-simple-maps"
// import { Analytics } from '@vercel/analytics/react'; // Potential conflict on Netlify
import logo from './assets/logo.svg'
import './index.css'

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Skeleton Loading Component
const SkeletonLoader = ({ count = 1, type = 'card' }) => {
  if (type === 'chart') {
    return (
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', padding: '1rem', border: '1px solid var(--border-color)' }}>
        <div style={{ height: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '1rem', animation: 'pulse 2s infinite' }}></div>
        <div style={{ height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', animation: 'pulse 2s infinite' }}></div>
      </div>
    );
  }
  if (type === 'row') {
    return (
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0.8rem 0.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', gap: '1rem' }}>
        <div style={{ height: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', animation: 'pulse 2s infinite' }}></div>
        <div style={{ height: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', animation: 'pulse 2s infinite' }}></div>
        <div style={{ height: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', animation: 'pulse 2s infinite' }}></div>
        <div style={{ height: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', animation: 'pulse 2s infinite' }}></div>
        <div style={{ height: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', animation: 'pulse 2s infinite' }}></div>
      </div>
    );
  }
  return (
    <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
      {Array(count).fill(0).map((_, i) => (
        <div key={i} style={{ height: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '0.5rem', animation: 'pulse 2s infinite' }}></div>
      ))}
    </div>
  );
};

// Context for Authentication
const AuthContext = createContext();
const BugContext = createContext();
const API_URL = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== "undefined") 
? import.meta.env.VITE_API_URL 
: (window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://cyberguard-ai-7zdf.onrender.com');

const useAuth = () => useContext(AuthContext);

// Interactive Map Background Component
const InteractiveBackground = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    fetch(geoUrl)
      .then(res => {
        if (!res.ok) throw new Error("Map Fail");
        return res.json();
      })
      .then(setGeoData)
      .catch(err => console.error("Map Download Error (Shielded):", err));
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', zIndex: -1, backgroundColor: '#020617' }}>
      <motion.div
        animate={{ x: mousePos.x, y: mousePos.y, scale: 1.05 }}
        transition={{ type: "spring", damping: 100, stiffness: 400, mass: 1 }}
        style={{ width: '100%', height: '100%', position: 'absolute', opacity: 0.6 }}
      >
        <ComposableMap projectionConfig={{ scale: 200 }} style={{ width: "100%", height: "100%" }}>
          {geoData && (
            <Geographies geography={geoData}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography 
                    key={geo.rsmKey} 
                    geography={geo} 
                    style={{
                      default: { fill: "#0f172a", stroke: "#60a5fa", strokeWidth: 0.6, outline: "none" },
                      hover: { fill: "#10b981", stroke: "#34d399", strokeWidth: 1.5, outline: "none", transition: "all 0.2s ease-in-out", cursor: "pointer", filter: "drop-shadow(0px 0px 8px #10b981)" },
                      pressed: { fill: "#3b82f6", outline: "none" }
                    }}
                  />
                ))
              }
            </Geographies>
          )}
        </ComposableMap>
      </motion.div>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(circle at center, rgba(2, 6, 23, 0) 0%, rgba(2, 6, 23, 0.9) 100%)',
        pointerEvents: 'none',
        zIndex: 1
      }} />
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('urgent');
  const [scanStatus, setScanStatus] = useState('idle');
  const [isSystemOffline, setIsSystemOffline] = useState(false);
  const [riskLevel, setRiskLevel] = useState('Malicious');
  const [urlInput, setUrlInput] = useState('');
  const [auditPath, setAuditPath] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [auditResults, setAuditResults] = useState(null);
  const [breachResult, setBreachResult] = useState(null);
  
  const [analytics, setAnalytics] = useState({ total_scans: 0, safe_count: 0, suspicious_count: 0, malicious_count: 0 });
  const [historyData, setHistoryData] = useState([]);
  const [explanations, setExplanations] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [nodeStatus, setNodeStatus] = useState({ latency: null, pinging: false });
  const [showIdentityPanel, setShowIdentityPanel] = useState(false);
  const [threatHistory, setThreatHistory] = useState([]);

  const API_BASE_URL = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== "undefined") 
    ? import.meta.env.VITE_API_URL 
    : (window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://cyberguard-ai-7zdf.onrender.com');

  const pingNodes = async () => {
    setNodeStatus({ latency: null, pinging: true });
    const t0 = Date.now();
    try {
      await fetch(`${API_BASE_URL}/`);
      setNodeStatus({ latency: Date.now() - t0, pinging: false });
    } catch {
      setNodeStatus({ latency: -1, pinging: false });
    }
  };

    useEffect(() => {
      fetchAnalytics();
      fetchHistory();

      // Handle auto-scan from Home Page redirect
      const params = new URLSearchParams(location.search);
      const urlToScan = params.get('url');
      if (urlToScan) {
        setActiveTab('urgent');
        setUrlInput(urlToScan);
        handleScan(urlToScan);
      }
    }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics`);
      if (!response.ok) return;
      const data = await response.json();
      if (data) setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchHistory = async () => {
    setIsDataLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/history`);
      if (!response.ok) throw new Error("API_OFFLINE");
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
         console.warn("Backend still waking up or route missing.");
         return; // Don't crash
      }

      const data = await response.json();
      const historyList = Array.isArray(data) ? data : [];
      const sliced = historyList.slice(0, 20);
      setHistoryData(sliced);

      const grouped = {};
      sliced.forEach(entry => {
        if (!entry) return;
        const t = entry.created_at ? new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now';
        if (!grouped[t]) grouped[t] = { time: t, Safe: 0, Suspicious: 0, Malicious: 0 };
        const res = entry.result || 'Safe';
        if (grouped[t].hasOwnProperty(res)) grouped[t][res]++;
      });
      setThreatHistory(Object.values(grouped).reverse());
      setIsSystemOffline(false);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsDataLoading(false);
    }
  };

  const getPieData = () => {
    // 1. Batch URL Scanning Complete
    if (activeTab === 'email' && scanResult?.results) {
      let safe = 0, suspicious = 0, malicious = 0;
      scanResult.results.forEach(r => {
        if (r.result === 'Safe') safe++;
        else if (r.result === 'Suspicious') suspicious++;
        else if (r.result === 'Malicious') malicious++;
      });
      if (safe + suspicious + malicious > 0) {
        return [
          { name: 'Batch Safe Ratio', value: safe, color: '#10b981' },
          { name: 'Batch Suspicious', value: suspicious, color: '#f59e0b' },
          { name: 'Batch Malicious', value: malicious, color: '#ef4444' }
        ];
      }
    }

    // 2. Single URL Active Analysis
    if ((activeTab === 'urgent' || activeTab === 'heuristic') && scanResult?.risk_score !== undefined) {
      const score = scanResult.risk_score;
      const safeScore = Math.max(0, 100 - score);
      
      if (scanResult.result === 'Malicious') {
        return [
          { name: 'Safe Margin', value: safeScore, color: '#10b981' },
          { name: 'Malicious Factor', value: score, color: '#ef4444' }
        ];
      } else if (scanResult.result === 'Suspicious') {
        return [
          { name: 'Safe Margin', value: safeScore, color: '#10b981' },
          { name: 'Suspicious Factor', value: score, color: '#f59e0b' }
        ];
      } else {
        return [
          { name: 'Safe Factor', value: safeScore, color: '#10b981' },
          { name: 'Background Noise', value: score, color: '#64748b' }
        ];
      }
    }

    // 3. Email Breach Active Analysis
    if (activeTab === 'breach' && breachResult?.risk_score !== undefined) {
       const score = breachResult.risk_score;
       const safeScore = Math.max(0, 100 - score);
       return [
         { name: 'Secure Surface', value: safeScore, color: '#10b981' },
         { name: 'Leak Exposure', value: score, color: '#ef4444' }
       ];
    }

    // 4. Default Standby: Global Intelligence Aggregates
    return [
      { name: 'Global Safe', value: analytics.safe_count || 1, color: '#10b981' },
      { name: 'Global Suspicious', value: analytics.suspicious_count || 0, color: '#f59e0b' },
      { name: 'Global Malicious', value: analytics.malicious_count || 0, color: '#ef4444' }
    ];
  };

  const pieData = getPieData();

  const handleScan = async (forcedUrl = null) => {
    const targetUrl = forcedUrl || urlInput;
    if (!targetUrl.trim()) {
      alert('Please enter a URL to scan');
      return;
    }

    setScanStatus('scanning');
    try {
      const isBatch = targetUrl.includes(',') || activeTab === 'email';
      const endpoint = isBatch ? '/batch-analyze' : '/analyze';
      const payload = isBatch 
        ? { urls: targetUrl.split(',').map(u => u.trim()).filter(Boolean) }
        : { url: targetUrl };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        setScanResult({ ...data, isBatch });
        setRiskLevel(data.result || 'Safe');
        setExplanations(data.explanations || []);
        setScanStatus('result');
        if (data.updated_analytics) setAnalytics(data.updated_analytics);
        else fetchAnalytics();

        // ⚡ Instant history update - no extra network call needed
        if (isBatch && data.results) {
          const batchEntries = data.results.filter(r => r.valid).map(r => ({
            url: r.url, result: r.result, confidence: r.confidence,
            risk_score: r.risk_score, created_at: new Date().toISOString()
          }));
          setHistoryData(prev => [...batchEntries, ...prev].slice(0, 20));
        } else if (data.url) {
          setHistoryData(prev => [{
            url: data.url, result: data.result, confidence: data.confidence,
            risk_score: data.risk_score, created_at: new Date().toISOString()
          }, ...prev].slice(0, 20));
          // Sync threat history graph
          const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setThreatHistory(prev => {
            const existing = prev.find(p => p.time === t);
            if (existing) return prev.map(p => p.time === t ? { ...p, [data.result]: (p[data.result] || 0) + 1 } : p);
            return [...prev, { time: t, Safe: data.result === 'Safe' ? 1 : 0, Suspicious: data.result === 'Suspicious' ? 1 : 0, Malicious: data.result === 'Malicious' ? 1 : 0 }].slice(-10);
          });
        }
      } else {
        alert('Error analyzing URL: ' + data.error);
        setScanStatus('idle');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error connecting to backend Node.');
      setScanStatus('idle');
    }
  };

  const handleAudit = async () => {
    if (!auditPath.trim()) {
      alert('Please enter a directory path');
      return;
    }
    setScanStatus('scanning');
    try {
      const response = await fetch(`${API_BASE_URL}/system/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: auditPath })
      });
      const data = await response.json();
      if (response.ok) {
        setAuditResults(data);
        setScanStatus('result');
        if (data.updated_analytics) setAnalytics(data.updated_analytics);
        else fetchAnalytics();
        // ⚡ Instant log update from audit findings
        if (data.findings?.length > 0) {
          const auditEntries = data.findings.slice(0, 5).map(f => ({
            url: f.url, result: f.result, confidence: 90,
            risk_score: f.score, created_at: new Date().toISOString()
          }));
          setHistoryData(prev => [...auditEntries, ...prev].slice(0, 10));
        }
      } else {
        alert('Audit Error: ' + data.error);
        setScanStatus('idle');
      }
    } catch (error) {
      console.error(error);
      alert('Error connecting to scanner API.');
      setScanStatus('idle');
    }
  };

  const handleEmailCheck = async (forcedEmail = null) => {
    const emailToUse = forcedEmail || emailInput;
    if (!emailToUse.trim()) {
      alert('Please enter an email address');
      return;
    }
    setScanStatus('scanning');
    try {
      const response = await fetch(`${API_BASE_URL}/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse })
      });
      const data = await response.json();
      if(response.ok) {
        setBreachResult(data);
        setScanStatus('result');
        if (data.updated_analytics) setAnalytics(data.updated_analytics);
        else fetchAnalytics();
        
        // Refresh history to include new scan
        fetchHistory();
      } else {
        alert('Email Check Error: ' + data.error);
        setScanStatus('idle');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to connect to email verification node.');
      setScanStatus('idle');
    }
  };

    const handleHistoryClick = (item) => {
      const target = item.url || item.target;
      
      // Scroll to the main result div area immediately
      const topEl = document.getElementById('top');
      if (topEl) topEl.scrollIntoView({ behavior: 'smooth' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });

      if (target.startsWith('Identity Check: ')) {
        const email = target.replace('Identity Check: ', '');
        setActiveTab('breach');
        setEmailInput(email);
        handleEmailCheck(email);
      } else {
        setActiveTab('urgent');
        setUrlInput(target);
        handleScan(target);
      }
    };

    const deleteHistoryItem = async (e, item) => {
      e.stopPropagation(); 
      if(!window.confirm('Clear this intelligence entry?')) return;
      
      // Get the identifier (either id or exact target string)
      const targetStr = item.url || item.target;

      try {
        // Step 1: Optimistic UI Update (remove instantly from view)
        setHistoryData(prev => prev.filter(h => {
           if (item.id && h.id) return h.id !== item.id;
           return (h.url || h.target) !== targetStr;
        }));

        // Step 2: Backend Sync
        const response = await fetch(`${API_BASE_URL}/history/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target: targetStr, id: item.id })
        });
        
        if (!response.ok) throw new Error("Delete failed");
        
        // Final background refresh to ensure sync
        fetchHistory();
      } catch (err) {
        console.error('Delete error:', err);
        fetchHistory(); // Revert UI if server fails
      }
    };

  const handleReset = () => {
    setScanStatus('idle');
    setScanResult(null);
    setAuditResults(null);
    setBreachResult(null);
    setShowIdentityPanel(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="dash-container" style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '0 1rem', boxSizing: 'border-box', overflowX: 'hidden', pointerEvents: 'auto' }}>
      
      {/* Dashboard Header */}
      <div className="dash-header">
        <div className="dash-title-row">
          <div style={{ width: '68px', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src={logo} alt="CyberGuard AI Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' }} />
          </div>
          <div>
            <h2 style={{ fontSize: 'clamp(1.3rem, 4vw, 2rem)', textShadow: '0 0 10px rgba(59, 130, 246, 0.3)', margin: 0 }}>Intelligence Analysis Dashboard</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>Forensic Command Center.</p>
          </div>
        </div>
        <div
          className="card glass-panel"
          onClick={pingNodes}
          style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid rgba(16, 185, 129, 0.3)', cursor: 'pointer', userSelect: 'none' }}
          title="Click to ping backend nodes"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--accent-green)', fontWeight: 600 }}>
            <Server size={18} className="animate-pulse-green" />
            {nodeStatus.pinging ? 'Pinging...' : 'Nodes Active'}
          </div>
          {nodeStatus.latency !== null && !nodeStatus.pinging && (
            <span style={{ fontSize: '0.75rem', color: nodeStatus.latency === -1 ? 'var(--accent-red)' : 'var(--accent-green)', opacity: 0.8 }}>
              {nodeStatus.latency === -1 ? 'OFFLINE' : `${nodeStatus.latency}ms`}
            </span>
          )}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid-cols-tools" style={{ marginBottom: '3rem' }}>
        
        {/* Sidebar */}
        <div className="dash-sidebar">
          <button onClick={() => { setActiveTab('email'); handleReset(); setUrlInput(''); setAuditPath(''); }} className={`card ${activeTab === 'email' ? 'glass-panel' : ''}`} style={{ flex: 1, borderLeft: activeTab === 'email' ? '3px solid var(--accent-blue)' : '1px solid var(--border-color)', background: activeTab === 'email' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-card)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0 1.25rem' }}>
            <Zap size={22} style={{ color: activeTab === 'email' ? 'var(--accent-blue)' : 'var(--text-secondary)' }} />
            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.1rem', color: activeTab === 'email' ? 'white' : 'var(--text-primary)' }}>Batch URL Processor</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Analyze multiple URL structures</p>
            </div>
          </button>
          
          <button onClick={() => { setActiveTab('breach'); handleReset(); setEmailInput(''); }} className={`card ${activeTab === 'breach' ? 'glass-panel' : ''}`} style={{ flex: 1, borderLeft: activeTab === 'breach' ? '3px solid var(--accent-pink)' : '1px solid var(--border-color)', background: activeTab === 'breach' ? 'rgba(236, 72, 153, 0.1)' : 'var(--bg-card)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0 1.25rem' }}>
            <Mail size={22} style={{ color: activeTab === 'breach' ? 'var(--accent-pink)' : 'var(--text-secondary)' }} />
            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.1rem', color: activeTab === 'breach' ? 'white' : 'var(--text-primary)' }}>Email Leak Checker</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Check data breaches & exposures</p>
            </div>
          </button>
          
          <button onClick={() => { setActiveTab('urgent'); handleReset(); setUrlInput(''); setAuditPath(''); }} className={`card ${activeTab === 'urgent' ? 'glass-panel' : ''}`} style={{ flex: 1, borderLeft: activeTab === 'urgent' ? '3px solid var(--accent-red)' : '1px solid var(--border-color)', background: activeTab === 'urgent' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-card)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0 1.25rem' }}>
            <ShieldAlert size={22} style={{ color: activeTab === 'urgent' ? 'var(--accent-red)' : 'var(--text-secondary)' }} />
            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.1rem', color: activeTab === 'urgent' ? 'white' : 'var(--text-primary)' }}>Threat Explorer</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Deep-scan malicious behavior</p>
            </div>
          </button>
          
          <button onClick={() => { setActiveTab('heuristic'); handleReset(); setUrlInput(''); }} className={`card ${activeTab === 'heuristic' ? 'glass-panel' : ''}`} style={{ flex: 1, borderLeft: activeTab === 'heuristic' ? '3px solid var(--accent-blue)' : '1px solid var(--border-color)', background: activeTab === 'heuristic' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-card)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0 1.25rem' }}>
            <Fingerprint size={22} style={{ color: activeTab === 'heuristic' ? 'var(--accent-blue)' : 'var(--text-secondary)' }} />
            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.1rem', color: activeTab === 'heuristic' ? 'white' : 'var(--text-primary)' }}>Heuristic Engine</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ML Pattern Recognition</p>
            </div>
          </button>
 
          <button onClick={() => { setActiveTab('sms'); handleReset(); setUrlInput(''); setAuditPath(''); setAuditResults(null); }} className={`card ${activeTab === 'sms' ? 'glass-panel' : ''}`} style={{ flex: 1, borderLeft: activeTab === 'sms' ? '3px solid #a855f7' : '1px solid var(--border-color)', background: activeTab === 'sms' ? 'rgba(168, 85, 247, 0.1)' : 'var(--bg-card)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0 1.25rem' }}>
            <Search size={22} style={{ color: activeTab === 'sms' ? '#a855f7' : 'var(--text-secondary)' }} />
            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.1rem', color: activeTab === 'sms' ? 'white' : 'var(--text-primary)' }}>System Auditor</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Scan project directories</p>
            </div>
          </button>
        </div>
        
        {/* Main Intelligence Viewport */}
        <div className="card glass-panel dash-viewport" style={{ 
          background: 'rgba(10, 14, 23, 0.3)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          boxShadow: '0 0 40px rgba(59, 130, 246, 0.1)'
        }}>
          {scanStatus === 'scanning' && <div className="scanner-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', opacity: 0.5, zIndex: 0 }} />}
          
          <div className="viewport-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.2rem', color: 'white', margin: 0 }}>
              {activeTab === 'breach' ? <Mail size={22} color="var(--accent-pink)" /> :
               activeTab === 'urgent' ? <ShieldAlert size={22} color="var(--accent-red)" /> :
               activeTab === 'sms' ? <Search size={22} color="var(--accent-green)" /> :
               activeTab === 'email' ? <Zap size={22} color="var(--accent-blue)" /> :
               <Fingerprint size={22} color="var(--accent-blue)" />}
              
              {activeTab === 'email' ? 'Batch URL Processor' : 
               activeTab === 'breach' ? 'Breach Analysis Module' : 
               activeTab === 'urgent' ? 'Intelligent URL Input Module' : 
               activeTab === 'sms' ? 'System Auditor' : 'Heuristic Engine'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
              </div>
              <button onClick={handleReset} className="btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>Reset Session</button>
            </div>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, minHeight: 0 }}>
            
            {/* Input Phase */}
            {scanStatus !== 'result' && (
              <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', background: 'rgba(10, 14, 23, 0.6)', borderRadius: 'var(--radius-full)', padding: '0.3rem', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', width: '100%', maxWidth: '800px' }}>
                  <Search size={20} style={{ margin: '0 0.5rem 0 1rem', opacity: 0.5, alignSelf: 'center', flexShrink: 0 }} />
                  <input 
                    type="text" 
                    disabled={scanStatus === 'scanning'}
                    value={activeTab === 'sms' ? auditPath : activeTab === 'breach' ? emailInput : urlInput}
                    onChange={(e) => {
                      if (activeTab === 'sms') setAuditPath(e.target.value);
                      else if (activeTab === 'breach') setEmailInput(e.target.value);
                      else setUrlInput(e.target.value);
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && (activeTab === 'sms' ? handleAudit() : activeTab === 'breach' ? handleEmailCheck() : handleScan())}
                    placeholder={
                      activeTab === 'sms' ? "Enter absolute path to project directory..." : 
                      activeTab === 'breach' ? "Enter email address to check for leaks..." : 
                      "Paste URL(s) for Pattern & Behavior Classification..."
                    }
                    style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '0.6rem 1rem', outline: 'none', minWidth: 0, fontSize: '1rem' }} 
                  />
                  <button 
                    disabled={scanStatus === 'scanning'} 
                    onClick={() => activeTab === 'sms' ? handleAudit() : activeTab === 'breach' ? handleEmailCheck() : handleScan()} 
                    className="btn-primary" 
                    style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem 1.5rem', fontSize: '0.9rem', width: 'auto', flexShrink: 0 }}
                  >
                    {scanStatus === 'scanning' ? <Activity size={16} className="animate-pulse-green" /> : 'Execute'}
                  </button>
                </div>
                <div style={{ marginTop: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.5, fontSize: '0.75rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-blue)', animation: 'pulse 2s infinite' }} />
                    <span>Intelligence nodes may require ~30s to initialize on first request. Please standby if initial scan delays.</span>
                </div>
              </div>
            )}
            
            {/* Result Viewport */}
            <div style={{ flex: 1, position: 'relative', overflowY: 'auto', minHeight: 0 }} className="custom-scrollbar">
               {scanStatus === 'scanning' ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block', marginBottom: '1rem' }}>
                    <Activity size={48} style={{ color: 'var(--accent-blue)' }} />
                  </motion.div>
                  <p style={{ color: 'var(--accent-blue)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    {activeTab === 'sms' ? 'Recursively scanning local directory...' : 
                     activeTab === 'breach' ? 'Searching global data breach indices...' : 
                     'Extracting features & calculating risk classification...'}
                  </p>
                </div>
              ) : scanStatus === 'result' ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '1rem' }}>
                    
                    {/* 1. URGENT / THREAT EXPLORER */}
                    {activeTab === 'urgent' && scanResult ? (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ padding: '0.8rem', background: scanResult.risk_color ? `${scanResult.risk_color}1a` : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${scanResult.risk_color || 'var(--accent-red)'}4d`, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                           <div style={{ padding: '0.6rem', background: `${scanResult.risk_color || 'var(--accent-red)'}33`, borderRadius: '50%', color: scanResult.risk_color || 'var(--accent-red)' }}>
                              <ShieldAlert size={24} />
                           </div>
                           <div>
                              <h4 style={{ color: scanResult.risk_color || 'var(--accent-red)', fontWeight: 700, margin: 0, fontSize: '0.9rem', textTransform: 'uppercase' }}>{scanResult.result} CLASSIFICATION</h4>
                              <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.7 }}>AI Confidence Score: {scanResult.confidence}%</p>
                           </div>
                        </div>

                        <div className="result-grid-2col">
                           <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                              <span style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 600, display: 'block', marginBottom: '0.6rem' }}>IDENTIFIED RISK LEVEL</span>
                              <h3 style={{ fontSize: '2.4rem', fontWeight: 800, color: scanResult.risk_color || 'white', margin: '0.2rem 0' }}>
                                 {scanResult.risk_score} <span style={{ fontSize: '0.9rem', opacity: 0.5 }}>/100</span>
                              </h3>
                              <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '0.8rem', overflow: 'hidden' }}>
                                 <div style={{ width: `${scanResult.risk_score}%`, height: '100%', background: scanResult.risk_color || 'var(--accent-blue)' }} />
                              </div>
                              <p style={{ fontSize: '0.7rem', marginTop: '0.8rem', color: 'var(--accent-blue)', fontWeight: 600 }}>Forensic Signal Strength: {scanResult.confidence}%</p>
                           </div>

                           <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem' }}>
                              <h5 style={{ fontSize: '0.85rem', marginBottom: '0.8rem', margin: 0 }}>Intelligence Insights</h5>
                              <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                 {scanResult.reasons && scanResult.reasons.slice(0, 3).map((reason, idx) => (
                                    <li key={idx} style={{ fontSize: '0.75rem', opacity: 0.6, display: 'flex', gap: '0.4rem' }}>
                                       <span style={{ color: scanResult.risk_color || 'var(--accent-blue)' }}>•</span> {reason}
                                    </li>
                                 ))}
                              </ul>
                              <div style={{ marginTop: '1rem', fontSize: '0.75rem' }}>
                                 <span style={{ opacity: 0.5 }}>Threat: </span>
                                 <span style={{ fontWeight: 600, color: scanResult.risk_color }}>{(scanResult.threat_type || []).join(', ')}</span>
                              </div>
                           </div>
                        </div>
                     </div>

                    /* 2. HEURISTIC ENGINE */
                    ) : activeTab === 'heuristic' && scanResult ? (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <div className="heuristic-stats-grid">
                           <div className="stat-box" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '0.5rem', borderRadius: '10px', textAlign: 'center' }}>
                              <span style={{ fontSize: '0.55rem', opacity: 0.5, display: 'block', marginBottom: '0.2rem' }}>ENTROPY</span>
                              <div style={{ height: '3px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', margin: '0.3rem 0', overflow: 'hidden' }}>
                                 <div style={{ height: '100%', width: `${(scanResult.forensics?.entropy / 8) * 100}%`, background: scanResult.forensics?.entropy > 4.2 ? 'var(--accent-red)' : 'var(--accent-blue)' }} />
                              </div>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{scanResult.forensics?.entropy || '0.00'}</span>
                           </div>
                           <div className="stat-box" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '0.5rem', borderRadius: '10px', textAlign: 'center' }}>
                              <span style={{ fontSize: '0.55rem', opacity: 0.5, display: 'block', marginBottom: '0.2rem' }}>DGA RISK</span>
                              <div style={{ padding: '0.1rem 0', marginTop: '0.3rem' }}>
                                 <span style={{ fontSize: '0.7rem', fontWeight: 700, color: scanResult.forensics?.dga_risk === 'High' ? 'var(--accent-red)' : 'var(--accent-green)' }}>{scanResult.forensics?.dga_risk || 'Low'}</span>
                              </div>
                           </div>
                           <div className="stat-box" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '0.5rem', borderRadius: '10px', textAlign: 'center' }}>
                              <span style={{ fontSize: '0.55rem', opacity: 0.5, display: 'block', marginBottom: '0.2rem' }}>SUBDOMAINS</span>
                              <span style={{ fontSize: '0.9rem', fontWeight: 700, display: 'block', marginTop: '0.3rem' }}>{scanResult.forensics?.subdomain_depth || 0}</span>
                           </div>
                           <div className="stat-box" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '0.5rem', borderRadius: '10px', textAlign: 'center' }}>
                              <span style={{ fontSize: '0.55rem', opacity: 0.5, display: 'block', marginBottom: '0.2rem' }}>CHARSET</span>
                              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent-blue)', display: 'block', marginTop: '0.3rem' }}>{scanResult.forensics?.character_set?.split(' (')[0] || 'Standard'}</span>
                           </div>
                        </div>
                        
                        <div className="card glass-panel" style={{ padding: '0.75rem', background: 'rgba(2, 6, 23, 0.4)', borderRadius: '12px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, maxHeight: '240px', overflow: 'hidden' }}>
                           <h5 style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', margin: '0 0 0.6rem 0', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                             <Fingerprint size={12} /> HEURISTIC FEATURE MAPPING
                           </h5>
                           <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto', paddingRight: '0.3rem' }} className="custom-scrollbar">
                              {scanResult.reasons && scanResult.reasons.length > 0 ? scanResult.reasons.map((reason, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.02)', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                   <div style={{ marginTop: '0.2rem' }}><Search size={14} color={reason.includes('High') || reason.includes('Malicious') || reason.includes('Flag') ? 'var(--accent-red)' : 'var(--accent-blue)'} /></div>
                                   <span style={{ opacity: 0.8, lineHeight: '1.4' }}>{reason}</span>
                                </div>
                              )) : (
                                <div style={{ textAlign: 'center', padding: '1.5rem', opacity: 0.3 }}>
                                   <ShieldCheck size={32} style={{ margin: '0 auto 0.5rem' }} />
                                   <p>No heuristic anomalies detected for this pattern.</p>
                                </div>
                              )}
                           </div>
                        </div>
                     </div>

                    /* 3. BREACH ANALYSIS */
                    ) : activeTab === 'breach' && breachResult ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem' }}>
                         <div style={{ textAlign: 'center' }}>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', margin: 0 }}>Leaked Email Details for {emailInput}</h4>
                         </div>
                         
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="breach-row">
                               <span style={{ opacity: 0.5 }}>Email Address</span>
                               <span style={{ fontWeight: 500, color: 'white' }}>{emailInput}</span>
                            </div>
                            <div className="breach-row">
                               <span style={{ opacity: 0.5 }}>Leaked Status</span>
                               <span style={{ fontWeight: 700, color: breachResult.is_breached ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                                  {breachResult.is_breached ? 'Confirmed Exposure' : 'Not Exposed Online'}
                               </span>
                            </div>
                            <div className="breach-row">
                               <span style={{ opacity: 0.5 }}>Breaches Found</span>
                               <span style={{ fontWeight: 700, color: breachResult.num_leaks > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{breachResult.num_leaks}</span>
                            </div>
                            <div className="breach-row">
                               <span style={{ opacity: 0.5 }}>Risk Score</span>
                               <span style={{ fontWeight: 700, color: breachResult.risk_score > 60 ? 'var(--accent-red)' : breachResult.risk_score > 0 ? '#f59e0b' : 'var(--accent-green)' }}>{breachResult.risk_score}/100</span>
                            </div>
                         </div>

                         <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button
                              className="btn-primary"
                              onClick={() => setShowIdentityPanel(p => !p)}
                              style={{ background: 'linear-gradient(135deg, #ef4444, #991b1b)', border: 'none', padding: '0.7rem 2rem', borderRadius: '8px', fontWeight: 600, boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)', width: '100%', maxWidth: '300px', cursor: 'pointer' }}
                            >
                              {showIdentityPanel ? '▲ Collapse Details' : '🔍 Reverse Identity Lookup'}
                            </button>
                         </div>

                         {showIdentityPanel && (
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                             <h5 style={{ fontSize: '0.75rem', color: 'var(--accent-red)', letterSpacing: '1px', margin: '0 0 0.3rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                               <AlertTriangle size={12} /> BREACH INTELLIGENCE REPORT
                             </h5>
                             {breachResult.breach_details && breachResult.breach_details.length > 0 ? (
                               breachResult.breach_details.map((detail, i) => {
                                 const parts = detail.match(/^(.+?)\s+\((.+?)\)\s+-\s+(.+)$/);
                                 const source = parts ? parts[1] : detail;
                                 const date = parts ? parts[2] : 'Unknown';
                                 const impact = parts ? parts[3] : 'Credentials';
                                 return (
                                   <div key={i} style={{ padding: '0.8rem 1rem', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                       <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'white' }}>{source}</span>
                                       <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 600 }}>{date}</span>
                                     </div>
                                     <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                                       <span style={{ color: 'var(--accent-red)' }}>Leaked: </span>{impact}
                                     </div>
                                   </div>
                                 );
                               })
                             ) : (
                               <div style={{ textAlign: 'center', padding: '1rem', opacity: 0.4, fontSize: '0.85rem' }}>No breach records found for this email.</div>
                             )}
                             <div style={{ marginTop: '0.5rem', padding: '0.8rem', background: 'rgba(239,68,68,0.08)', borderRadius: '10px', fontSize: '0.8rem', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.15)' }}>
                               ⚠️ {breachResult.recommendation}
                             </div>
                           </div>
                         )}
                      </div>

                    /* 4. SYSTEM AUDITOR */
                    ) : activeTab === 'sms' && auditResults ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                         <div className="result-grid-2col">
                            <div style={{ padding: '0.8rem', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', textAlign: 'center' }}>
                               <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-blue)', margin: 0 }}>{auditResults.total_scanned || 0}</h3>
                               <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.6 }}>Files Scanned</p>
                            </div>
                            <div style={{ padding: '0.8rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', textAlign: 'center' }}>
                               <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-red)', margin: 0 }}>{auditResults.total_findings || 0}</h3>
                               <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.6 }}>Threats Detected</p>
                            </div>
                         </div>

                         <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '180px' }}>
                            <div className="auditor-table-head" style={{ padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem', fontWeight: 600 }}>
                               <span>Asset</span><span>Risk</span><span>Indicator</span>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                               {auditResults.findings && auditResults.findings.map((f, i) => (
                                 <div key={i} className="auditor-table-row" style={{ padding: '0.5rem 0.8rem', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem' }}>
                                    <span style={{ color: 'var(--accent-blue)', opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis' }}>{(f.file || '').split(/[\\\/]/).pop()}</span>
                                    <span style={{ color: f.result === 'Malicious' ? 'var(--accent-red)' : '#f59e0b', fontWeight: 600 }}>{(f.result || '').toUpperCase()}</span>
                                    <span style={{ opacity: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.url}</span>
                                 </div>
                               ))}
                            </div>
                         </div>
                      </div>

                    /* 5. BATCH URL PROCESSOR (DEFAULT) */
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div className="batch-stats-row">
                             <div className="stat-box" style={{ flex: 1, background: 'rgba(59, 130, 246, 0.05)', border: '1px solid var(--accent-blue)', padding: '0.8rem', borderRadius: '10px', textAlign: 'center' }}>
                                <h3 style={{ fontSize: '1.4rem', margin: 0 }}>{scanResult?.summary?.total || scanResult?.results?.length || 0}</h3>
                                <p style={{ fontSize: '0.65rem', opacity: 0.6, margin: 0 }}>TOTAL ANALYZED</p>
                             </div>
                             <div className="stat-box" style={{ flex: 1, background: 'rgba(239, 68, 68, 0.05)', border: '1px solid var(--accent-red)', padding: '0.8rem', borderRadius: '10px', textAlign: 'center' }}>
                                <h3 style={{ fontSize: '1.4rem', margin: 0 }}>{scanResult?.results ? scanResult.results.filter(r => r.result === 'Malicious').length : 0}</h3>
                                <p style={{ fontSize: '0.65rem', opacity: 0.6, margin: 0 }}>THREATS DETECTED</p>
                             </div>
                          </div>
                          
                          <div className="card glass-panel" style={{ flex: 1, padding: '0', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
                             <div style={{ maxHeight: '180px', overflowY: 'auto' }} className="custom-scrollbar">
                                {scanResult?.results && scanResult.results.map((res, i) => (
                                  <div key={i} style={{ padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                     <span style={{ fontSize: '0.75rem', opacity: 0.7, maxWidth: '65%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{res.url}</span>
                                     <span style={{ color: res.result === 'Malicious' ? 'var(--accent-red)' : 'var(--accent-green)', fontSize: '0.75rem', fontWeight: 700 }}>{res.result.toUpperCase()}</span>
                                  </div>
                                ))}
                             </div>
                          </div>
                       </div>
                    )}
                </motion.div>
              ) : (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <Activity size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
                  <h4 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 500 }}>System Ready for Input</h4>
                  <p style={{ opacity: 0.5, fontSize: '0.9rem', textAlign: 'center', maxWidth: '300px' }}>Awaiting parameters for system feature extraction and risk classification...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Threat Stats Graph ── */}
      <div className="card glass-panel" style={{ maxWidth: '1200px', margin: '2rem auto', padding: '1.5rem' }}>
        <div className="stats-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem', margin: 0, lineHeight: 1.5 }}>
            <Activity size={18} color="var(--accent-blue)" style={{ verticalAlign: 'middle', marginRight: '0.5rem', marginTop: '-2px' }} />
            <span style={{ verticalAlign: 'middle' }}>Live Threat Intelligence Graph</span>
            <span style={{ verticalAlign: 'middle', display: 'inline-block', marginLeft: '0.6rem', fontSize: '0.65rem', color: 'var(--accent-green)', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '20px', padding: '0.15rem 0.6rem', letterSpacing: '1px', fontWeight: 700 }}>SYNCED</span>
          </h3>
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {[['Safe', '#10b981'], ['Suspicious', '#f59e0b'], ['Malicious', '#ef4444']].map(([label, col]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: col }} />
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        {threatHistory.length === 0 ? (
          <div style={{ height: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.4, gap: '0.5rem' }}>
            <BarChart3 size={32} />
            <p style={{ fontSize: '0.85rem' }}>No scan data yet — run a scan to populate the graph.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={threatHistory} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSafe" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSusp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <RechartsTooltip
                contentStyle={{ background: '#0f172a', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', fontSize: '0.78rem' }}
                itemStyle={{ color: '#fff' }}
                labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}
              />
              <Area type="monotone" dataKey="Safe" stroke="#10b981" strokeWidth={2} fill="url(#colorSafe)" dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
              <Area type="monotone" dataKey="Suspicious" stroke="#f59e0b" strokeWidth={2} fill="url(#colorSusp)" dot={false} activeDot={{ r: 4, fill: '#f59e0b' }} />
              <Area type="monotone" dataKey="Malicious" stroke="#ef4444" strokeWidth={2} fill="url(#colorMal)" dot={false} activeDot={{ r: 4, fill: '#ef4444' }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid-cols-stats" style={{ maxWidth: '1200px', margin: '0 auto 2rem auto' }}>
        <div className="card glass-panel stats-pie-panel">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {scanResult ? (scanResult.isBatch ? <BarChart3 size={18} color="var(--accent-blue)" /> : <Activity size={18} color="var(--accent-blue)" />) : <Search size={18} color="var(--accent-blue)" />}
            {scanResult ? (scanResult.isBatch ? `Batch Profile (${scanResult.summary?.total || 1} URLs)` : 'Forensic Risk Gauge') : 'Global Intelligence Feed'}
          </h3>
          {isDataLoading ? (
             <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                 <SkeletonLoader type="chart" />
             </div>
          ) : (
            <div style={{ width: '100%', height: '220px', flex: 1, minWidth: 0, minHeight: '180px' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }} itemStyle={{ color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card glass-panel stats-log-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Persistent Forensic Logs</h3>
            {historyData.length > 0 && (
              <button 
                onClick={() => {
                  const headers = "ID,Time,Target,State,Confidence\n";
                  const rows = historyData.map((r, i) => `${i+1},${r.created_at},${r.url},${r.result},${r.confidence}`).join("\n");
                  const blob = new Blob([headers + rows], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `CyberGuard_Forensics_${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                }}
                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: 'var(--accent-blue)', borderRadius: '6px', padding: '0.3rem 0.6rem', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                📥 Export CSV
              </button>
            )}
          </div>
          <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }} className="custom-scrollbar">
            {isDataLoading ? (
               <SkeletonLoader type="row" count={5} />
            ) : historyData.length === 0 ? (
               <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No logs recorded yet.</div>
            ) : (
               <div className="forensic-table-wrap"><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                 <thead style={{ position: 'sticky', top: 0, zIndex: 20, backgroundColor: 'var(--bg-card)' }}>
                   <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
                     <th style={{ padding: '0.8rem 0.5rem', backgroundColor: 'var(--bg-card)' }}>ID</th>
                     <th style={{ padding: '0.8rem 0.5rem', backgroundColor: 'var(--bg-card)' }}>Time</th>
                     <th style={{ padding: '0.8rem 0.5rem', backgroundColor: 'var(--bg-card)' }}>Target</th>
                     <th style={{ padding: '0.8rem 0.5rem', backgroundColor: 'var(--bg-card)' }}>State</th>
                     <th style={{ padding: '0.8rem 0.5rem', backgroundColor: 'var(--bg-card)' }}>Confidence</th>
                     <th style={{ padding: '0.8rem 0.5rem', backgroundColor: 'var(--bg-card)', textAlign: 'right' }}>Action</th>
                   </tr>
                 </thead>
                 <tbody>
                   {historyData.map((row, idx) => (
                     <tr 
                       key={row.id || idx} 
                       onClick={() => handleHistoryClick(row)}
                       style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.2s' }}
                       onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                       onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                     >
                       <td style={{ padding: '0.8rem 0.5rem', color: 'var(--text-secondary)' }}>#{idx + 1}</td>
                       <td style={{ padding: '0.8rem 0.5rem', color: 'var(--accent-blue)' }}>{row.created_at ? new Date(row.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) : 'Real-time'}</td>
                       <td style={{ padding: '0.8rem 0.5rem', fontFamily: 'monospace', color: '#fff', wordBreak: 'break-all' }}>{row.url || row.target}</td>
                       <td style={{ padding: '0.8rem 0.5rem', color: row.result === 'Safe' ? '#10b981' : row.result === 'Suspicious' ? '#f59e0b' : '#ef4444' }}>{row.result || row.status}</td>
                       <td style={{ padding: '0.8rem 0.5rem' }}>{row.confidence || row.confidence}%</td>
                       <td style={{ padding: '0.8rem 0.5rem', textAlign: 'right' }}>
                          <button 
                            onClick={(e) => deleteHistoryItem(e, row)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: '0.4rem', opacity: 0.6 }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
                          >
                            <Trash2 size={16} />
                          </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table></div>
            )}
          </div>
        </div>
      </div>

      {/* Maintenance Overlay Force-Disconnected */}
    </motion.div>
  );
}

const BugReportModal = () => {
  const { isBugModalOpen, setBugModalOpen } = useContext(BugContext);
  const [formData, setFormData] = useState({ email: '', subject: 'UI Glitch', description: '' });
  const [status, setStatus] = useState('idle'); // idle, sending, success

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch(`${API_URL}/report-bug`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setStatus('success');
        setTimeout(() => {
          setBugModalOpen(false);
          setStatus('idle');
          setFormData({ email: '', subject: 'UI Glitch', description: '' });
        }, 2500);
      }
    } catch (err) {
      alert('Transmission failed. Check neural link.');
      setStatus('idle');
    }
  };

  if (!isBugModalOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card glass-panel" style={{ maxWidth: '500px', width: '100%', padding: '2rem', border: '1px solid var(--border-color)' }}>
        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
              <CheckCircle size={64} color="var(--accent-green)" style={{ margin: '0 auto 1rem' }} />
            </motion.div>
            <h2 style={{ color: 'white', marginBottom: '1rem' }}>Report Logged</h2>
            <p style={{ opacity: 0.7 }}>Our engineers have been notified. Thank you for securing the grid.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'white' }}>
                <Bug color="var(--accent-blue)" /> Report Bug
              </h2>
              <button onClick={() => setBugModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><XCircle size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', opacity: 0.7 }}>Reporter Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: 'white', outline: 'none' }} placeholder="your@email.com" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', opacity: 0.7 }}>Incident Subject</label>
                <select value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: 'white', outline: 'none' }}>
                  <option value="UI Glitch">UI Glitch</option>
                  <option value="Scanner Failure">Scanner Failure</option>
                  <option value="Authentication Error">Authentication Error</option>
                  <option value="Performance Lag">Performance Lag</option>
                  <option value="Other">Other Security Concern</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', opacity: 0.7 }}>Description</label>
                <textarea required rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.8rem', color: 'white', outline: 'none', resize: 'none' }} placeholder="What happened on the grid?" />
              </div>
              <button disabled={status === 'sending'} type="submit" className="btn-primary" style={{ marginTop: '0.5rem', padding: '1rem' }}>
                {status === 'sending' ? <Activity className="animate-pulse-green" /> : 'Transmit Report'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};

const Footer = () => {
  const { setBugModalOpen } = useContext(BugContext);
  return (
  <footer style={{ 
    padding: '4rem 2rem', 
    marginTop: '4rem', 
    borderTop: '1px solid rgba(255,255,255,0.05)', 
    textAlign: 'center',
    background: 'rgba(10, 14, 23, 0.8)',
    backdropFilter: 'blur(10px)',
    pointerEvents: 'auto'
  }}>
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="footer-links">
        <Link to="/privacy" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>Privacy Protocol</Link>
        <Link to="/terms" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>Terms of Operation</Link>
        <button onClick={() => setBugModalOpen(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--accent-blue)'} onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}>🐛 Report Bug</button>
      </div>
      <div className="footer-contact">
        <span><strong>Contact:</strong></span>
        <a href="mailto:rishikhadiyar@gmail.com" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>rishikhadiyar@gmail.com</a>
        <span style={{ opacity: 0.5 }}>|</span>
        <a href="tel:+917389280244" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>+91 7389280244</a>
      </div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
        &copy; {new Date().getFullYear()} CyberGuard AI. Engineered by <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>Glitched Guys</span>.
      </div>
    </div>
  </footer>
  );
};

const Home = () => {
   const navigate = useNavigate();
   const [searchVal, setSearchVal] = useState('');
   const [isSearching, setIsSearching] = useState(false);
   const [showScanLine, setShowScanLine] = useState(false);

   const handleDivClick = () => {
     if (!showScanLine) {
       setShowScanLine(true);
       setTimeout(() => setShowScanLine(false), 3000);
     }
   };

   const handleAnalyze = async () => {
      if(!searchVal) return;
      navigate(`/dashboard?url=${encodeURIComponent(searchVal)}`);
   };

   return (
    <div style={{ width: '100%' }}>
    <motion.div 
      initial={{ opacity: 0, y: 40, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="card glass-panel hero-card" 
      onClick={handleDivClick}
      style={{ background: 'rgba(17, 24, 39, 0.3)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', maxWidth: '850px', margin: '2rem auto', textAlign: 'center', position: 'relative', overflow: 'hidden', pointerEvents: 'auto' }}
    >
      <motion.div animate={{ filter: ["drop-shadow(0px 0px 5px rgba(59, 130, 246, 0.3))", "drop-shadow(0px 0px 25px rgba(59, 130, 246, 0.5))", "drop-shadow(0px 0px 5px rgba(59, 130, 246, 0.3))"] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
        <div style={{ width: '90px', height: '90px', margin: '0 auto 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={logo} alt="CyberGuard AI Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      </motion.div>
      
      <h1 style={{ marginBottom: '1rem', background: 'linear-gradient(90deg, #fff, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Intelligent Malicious Link Detection
      </h1>
      
      <p style={{ marginTop: '0.8rem', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
        AI-Powered URL Threat Analysis & Real-Time Protection.
        Identify Phishing, Malware, and Suspicious Patterns.
      </p>

      {/* Quick Analyzer Input Bar */}
      <div style={{ marginTop: '1.8rem', marginBottom: '1.8rem', display: 'flex', justifyContent: 'center' }}>
         <div style={{ display: 'flex', width: '100%', maxWidth: '600px', background: 'rgba(10, 14, 23, 0.6)', borderRadius: 'var(--radius-full)', padding: '0.3rem', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '1rem', color: 'var(--text-secondary)' }}>
               <Search size={18} />
            </div>
            <input 
               type="text" 
               disabled={isSearching}
               value={searchVal}
               onChange={(e) => setSearchVal(e.target.value)}
               placeholder="Analyze URL formats..." 
               style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', color: 'white', padding: '0.6rem 1rem', outline: 'none', fontSize: '1rem' }} 
            />
            <button disabled={isSearching} onClick={handleAnalyze} className="btn-primary home-search-btn" style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem 1.5rem', fontSize: '0.9rem', width: 'auto', flexShrink: 0 }}>
              {isSearching ? <Activity size={16} className="animate-pulse-green" /> : 'Deep Analyze'}
            </button>
         </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <Link to="/login" style={{ textDecoration: 'none' }}>
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px var(--accent-blue-glow)" }} 
            whileTap={{ scale: 0.95 }} 
            className="btn-primary" 
            style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}
          >
            System Access Gate <ArrowRight size={20} />
          </motion.button>
        </Link>
        <Link to="/dashboard" style={{ textDecoration: 'none' }}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
            <Activity size={20} /> Real-Time Scanner
          </motion.button>
        </Link>
      </div>
      
      {showScanLine && <div className="scanner-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', opacity: 0.2 }} />}
    </motion.div>

    <div style={{ maxWidth: '1100px', margin: '2.5rem auto 3rem auto', padding: '0 2rem', pointerEvents: 'auto' }}>

      {/* ── Live Stats Ticker ── */}
      <div style={{ overflow: 'hidden', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.15)', background: 'rgba(59,130,246,0.04)', marginBottom: '2rem', padding: '0.5rem 0', position: 'relative' }}>
        <div style={{ display: 'flex', animation: 'ticker-scroll 20s linear infinite', whiteSpace: 'nowrap', gap: '3rem' }}>
          {[
            '⚡ 2.4M URLs Scanned', '🛡️ 99.2% Detection Rate', '🔴 147K Threats Blocked Today',
            '🌐 196 Countries Covered', '⚡ 38ms Avg. Response', '🧠 ML Model v4.2 Active',
            '⚡ 2.4M URLs Scanned', '🛡️ 99.2% Detection Rate', '🔴 147K Threats Blocked Today',
            '🌐 196 Countries Covered', '⚡ 38ms Avg. Response', '🧠 ML Model v4.2 Active',
          ].map((item, i) => (
            <span key={i} style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '1px', color: 'var(--text-secondary)', padding: '0 1rem' }}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Section Header ── */}
      <div className="dash-header">
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-full)', padding: '0.25rem 0.9rem', fontSize: '0.65rem', letterSpacing: '2.5px', color: 'var(--accent-blue)', marginBottom: '0.7rem', textTransform: 'uppercase' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-blue)', animation: 'pulse 2s infinite' }} />
            Active Intelligence Suite
          </div>
          <h2 style={{ fontSize: '2rem', margin: 0, lineHeight: 1.2 }}>
            Core{' '}
            <span style={{ background: 'linear-gradient(100deg, #60a5fa, #a78bfa, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Intelligence
            </span>
            {' '}Modules
          </h2>
        </div>
        <div className="hero-stats-row" style={{ display: 'flex', gap: '1.5rem', paddingBottom: '0.2rem' }}>
          {[['6', 'MODULES'], ['99.2%', 'ACCURACY'], ['38ms', 'LATENCY']].map(([val, lbl]) => (
            <div key={lbl} style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: '0.55rem', opacity: 0.4, letterSpacing: '1.5px', marginTop: '2px' }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Asymmetric Grid ── */}
      <div className="intel-grid">

        {/* ─── FEATURED CARD: Threat Detection Engine (spans 2 rows) ─── */}
        <motion.div
        initial={{ opacity: 0, x: -30, scale: 0.98 }} animate={{ opacity: 1, x: 0, scale: 1 }} 
        transition={{ type: "spring", stiffness: 200, damping: 25, mass: 1 }}
          className="grad-border-card"
          style={{ gridRow: 'span 2', animation: 'glow-pulse-blue 4s ease-in-out infinite' }}
        >
          <div className="grad-border-inner shimmer-card" style={{ padding: '1.8rem', display: 'flex', flexDirection: 'column', height: '100%', '--shimmer-delay': '0s' }}>
            {/* Corner brackets */}
            {[['top:0,left:0', 'borderTop,borderLeft'], ['top:0,right:0', 'borderTop,borderRight'], ['bottom:0,left:0', 'borderBottom,borderLeft'], ['bottom:0,right:0', 'borderBottom,borderRight']].map((_, i) => {
              const pos = [{ top: 8, left: 8 }, { top: 8, right: 8 }, { bottom: 8, left: 8 }, { bottom: 8, right: 8 }][i];
              const brd = [{ borderTop: '1.5px solid #3b82f6', borderLeft: '1.5px solid #3b82f6' }, { borderTop: '1.5px solid #3b82f6', borderRight: '1.5px solid #3b82f6' }, { borderBottom: '1.5px solid #3b82f6', borderLeft: '1.5px solid #3b82f6' }, { borderBottom: '1.5px solid #3b82f6', borderRight: '1.5px solid #3b82f6' }][i];
              return <div key={i} style={{ position: 'absolute', width: '10px', height: '10px', ...pos, ...brd, opacity: 0.6 }} />;
            })}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}>
                  <Fingerprint size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'white', margin: 0 }}>Threat Detection Engine</h3>
                  <p style={{ fontSize: '0.65rem', color: '#10b981', margin: 0, letterSpacing: '1px' }}>HEURISTIC · ML · PATTERN</p>
                </div>
              </div>
              <div style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: 700, letterSpacing: '1px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', padding: '0.3rem 0.6rem' }}>LIVE</div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.2rem' }}>
              Multi-layered heuristic analysis engine leveraging ML models to detect typosquatting, obfuscated scripts, and zero-day domain threats with precision.
            </p>

            {/* Progress signals */}
            {[['Entropy Analysis', 87, '#3b82f6'], ['DGA Detection', 94, '#a78bfa'], ['Subdomain Depth', 72, '#10b981']].map(([label, val, col]) => (
              <div key={label} style={{ marginBottom: '0.7rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>{label}</span>
                  <span style={{ fontSize: '0.65rem', color: col, fontWeight: 700 }}>{val}%</span>
                </div>
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ duration: 1.2, delay: 0.5 }} style={{ height: '100%', borderRadius: '10px', background: `linear-gradient(90deg, ${col}88, ${col})` }} />
                </div>
              </div>
            ))}

            {/* Mock terminal */}
            <div style={{ marginTop: '1rem', flex: 1, background: 'rgba(0,0,0,0.4)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)', padding: '0.8rem', fontFamily: 'monospace', overflow: 'hidden' }}>
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem' }}>
                {['#ef4444', '#f59e0b', '#10b981'].map(c => <div key={c} style={{ width: '8px', height: '8px', borderRadius: '50%', background: c, opacity: 0.7 }} />)}
                <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)', marginLeft: '0.3rem', lineHeight: '8px' }}>threat-scanner.exe</span>
              </div>
              {['> SCANNING domain entropy...', '> ENTROPY: 4.82 [HIGH RISK]', '> DGA_PATTERN: DETECTED', '> CLASSIFICATION: MALICIOUS'].map((line, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 + i * 0.4 }} style={{ fontSize: '0.62rem', color: i === 3 ? '#ef4444' : i === 1 ? '#f59e0b' : '#10b981', marginBottom: '0.25rem', letterSpacing: '0.3px' }}>
                  {line}
                </motion.div>
              ))}
              <span style={{ fontSize: '0.62rem', color: '#3b82f6', animation: 'blink 1s infinite' }}>█</span>
            </div>
          </div>
        </motion.div>

        {/* ─── Small cards ─── */}
        {[
          { icon: <Zap size={20} />, label: 'Intelligent URL Input', desc: 'Batch ingestion with automated validation across multi-format URL structures.', color: '#3b82f6', glow: 'rgba(59,130,246,0.12)', tag: 'BATCH READY', pct: 91 },
          { icon: <ShieldCheck size={20} />, label: 'AI Classification', desc: 'Deep Learning tri-class risk scoring: Safe / Suspicious / Malicious.', color: '#ef4444', glow: 'rgba(239,68,68,0.12)', tag: '99.2% ACC', pct: 99 },
          { icon: <MessageSquare size={20} />, label: 'Explainability Engine', desc: 'XAI layer surfaces human-readable signals per flagged domain.', color: '#a78bfa', glow: 'rgba(167,139,250,0.12)', tag: 'XAI ACTIVE', pct: 88 },
          { icon: <BarChart3 size={20} />, label: 'Live Forensic Logs', desc: 'Real-time risk charts, redirect chains & persistent incident logs.', color: '#10b981', glow: 'rgba(16,185,129,0.12)', tag: 'STREAMING', pct: 76 },
          { icon: <Globe size={20} />, label: 'Global Reputation', desc: 'Zero-manual vetting via integrated international threat blacklists.', color: '#f59e0b', glow: 'rgba(245,158,11,0.12)', tag: '196 NATIONS', pct: 83 },
        ].map((mod, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} 
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 + i * 0.05 }}
            className="grad-border-card"
            whileHover={{ scale: 1.03, y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="grad-border-inner shimmer-card" style={{ padding: '1.2rem', position: 'relative', '--shimmer-delay': i % 2 === 0 ? '1.3s' : '2.6s' }}>
              {/* Top gradient line */}
              <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px', background: `linear-gradient(90deg, transparent, ${mod.color}, transparent)` }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.7rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: mod.glow, border: `1px solid ${mod.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: mod.color }}>
                  {mod.icon}
                </div>
                <div style={{ fontSize: '0.55rem', fontWeight: 700, color: mod.color, background: mod.glow, border: `1px solid ${mod.color}30`, borderRadius: '4px', padding: '0.15rem 0.4rem', letterSpacing: '0.8px' }}>
                  {mod.tag}
                </div>
              </div>

              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white', marginBottom: '0.35rem' }}>{mod.label}</h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 0.8rem 0' }}>{mod.desc}</p>

              {/* Activity bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${mod.pct}%` }} transition={{ duration: 1, delay: 0.8 + i * 0.1 }} style={{ height: '100%', background: `linear-gradient(90deg, ${mod.color}60, ${mod.color})`, borderRadius: '10px' }} />
                </div>
                <span style={{ fontSize: '0.55rem', color: mod.color, fontWeight: 700 }}>{mod.pct}%</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
    </div>
  );
}

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', fullName: '', password: '' });

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'transparent' };
    if (pass.length < 6) return { score: 20, label: 'Too Short', color: 'var(--accent-red)' };
    let score = 0;
    if (pass.length >= 8) score += 20;
    if (/[A-Z]/.test(pass)) score += 20;
    if (/[0-9]/.test(pass)) score += 20;
    if (/[^A-Za-z0-9]/.test(pass)) score += 20;
    
    if (score <= 40) return { score: 40, label: 'Weak', color: '#f87171' };
    if (score <= 60) return { score: 65, label: 'Moderate', color: '#fbbf24' };
    if (score <= 80) return { score: 85, label: 'Strong', color: '#34d399' };
    return { score: 100, label: 'Military Grade', color: '#60a5fa' };
  };

  const strength = getPasswordStrength(formData.password);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!formData.email) return alert('Please enter your Admin Email first to request a reset link.');
    setIsAuthenticating(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await response.json();
      if(response.ok) {
        alert('Password reset instructions have been securely dispatched to your email.');
        setIsForgotPassword(false);
      } else {
        alert(data.error || 'Failed to dispatch reset instructions.');
      }
    } catch(err) {
      alert('Network error communicating with backend.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsAuthenticating(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if(response.ok) {
        login({ name: data.name || formData.email.split('@')[0], id: data.user });
        navigate('/dashboard');
      } else {
        alert(data.error || 'Authentication failed');
      }
    } catch(err) {
      alert('Network error communicating with backend for Handshake');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '75vh', pointerEvents: 'none' }}>
      <div className="card glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '3rem 2.5rem', position: 'relative', overflow: 'hidden', pointerEvents: 'auto' }}>
        {isAuthenticating && <div className="scanner-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', opacity: 0.6 }} />}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <motion.div animate={isAuthenticating ? { rotate: 360, color: 'var(--accent-blue)' } : {}} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} style={{ display: 'inline-block' }}>
            <KeyRound size={48} style={{ color: isAuthenticating ? 'var(--accent-blue)' : 'var(--text-secondary)', transition: 'color 0.3s' }} />
          </motion.div>
          <h2 style={{ marginTop: '1rem', fontSize: '1.8rem' }}>{isAuthenticating ? 'Processing...' : (isForgotPassword ? 'Reset Passphrase' : (isLogin ? 'Secure Access' : 'Create Identity'))}</h2>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>{isForgotPassword ? 'Submit your email to receive recovery instructions.' : 'Military-grade encrypted protocol connection'}</p>
        </div>
        <form onSubmit={isForgotPassword ? handleForgotPassword : handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {!isLogin && !isForgotPassword && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <input 
                type="text" 
                name="fullName"
                placeholder="Full Name" 
                className="input-field" 
                required 
                disabled={isAuthenticating}
                value={formData.fullName}
                onChange={handleInputChange}
              />
            </motion.div>
          )}
          <input 
            type="email" 
            name="email"
            placeholder="Admin Email / Operator ID" 
            className="input-field" 
            required 
            disabled={isAuthenticating}
            value={formData.email}
            onChange={handleInputChange}
          />
          {!isForgotPassword && (
            <input 
              type="password" 
              name="password"
              placeholder="Passphrase" 
              className="input-field" 
              required 
              disabled={isAuthenticating}
              value={formData.password}
              onChange={handleInputChange}
            />
          )}
          {!isLogin && !isForgotPassword && formData.password && (
            <div style={{ marginTop: '-0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Security Entropy</span>
                <span style={{ fontSize: '0.65rem', color: strength.color, fontWeight: 700 }}>{strength.label}</span>
              </div>
              <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${strength.score}%` }} transition={{ type: 'spring', stiffness: 100 }} style={{ height: '100%', background: strength.color }} />
              </div>
            </div>
          )}
          <motion.button whileHover={!isAuthenticating ? { scale: 1.02 } : {}} whileTap={!isAuthenticating ? { scale: 0.98 } : {}} className="btn-primary" style={{ marginTop: '1rem', padding: '1rem', width: '100%' }} disabled={isAuthenticating}>
            {isAuthenticating ? 'Processing...' : (isForgotPassword ? 'Dispatch Reset Link' : (isLogin ? 'Authenticate' : 'Register Operator'))}
          </motion.button>
        </form>
        <div style={{ marginTop: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isLogin && !isForgotPassword && (
            <button type="button" onClick={() => setIsForgotPassword(true)} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '0.85rem' }} disabled={isAuthenticating}>
              Lost access? Request a passphrase reset
            </button>
          )}
          <button type="button" onClick={() => { setIsLogin(!isLogin); setIsForgotPassword(false); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }} disabled={isAuthenticating}>
            {isLogin && !isForgotPassword ? "New Operator? Initialize Registration" : "Return to Authentication Terminal"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleMobileLogout = () => { setMobileOpen(false); logout(); navigate('/'); };

  return (
    <>
    <motion.nav initial={{ y: -50 }} animate={{ y: 0 }} transition={{ duration: 0.5 }} className="glass-panel nav-container">
      <Link to="/" className="navbar-brand">
        <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={logo} alt="CyberGuard AI Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--accent-blue)', textShadow: '0 0 10px rgba(59, 130, 246, 0.4)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>CyberGuard</span>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--accent-green)', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <div className="animate-pulse-green" style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-green)' }}></div>
            LIVE
          </div>
        </div>
      </Link>

      {/* Desktop nav links */}
      <div className="navbar-links">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', color: location.pathname === '/' ? 'white' : 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, transition: 'var(--transition)' }}><HomeIcon size={18} /> Home</Link>
        <Link to="/dashboard" style={{ color: location.pathname === '/dashboard' ? 'white' : 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, transition: 'var(--transition)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <LayoutDashboard size={18} /> Dashboard
        </Link>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)' }}></div>
              Welcome, <span style={{ color: 'white', fontWeight: 600 }}>{user.name}</span>
            </span>
            <AnimatePresence mode="wait">
              {showLogoutConfirm ? (
                <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button onClick={logout} className="btn-primary" style={{ background: 'var(--accent-red)', padding: '0.4rem 1rem', fontSize: '0.75rem' }}>Confirm Sign Out</button>
                  <button onClick={() => setShowLogoutConfirm(false)} className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }}>Cancel</button>
                </motion.div>
              ) : (
                <motion.button key="button" onClick={() => setShowLogoutConfirm(true)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-secondary" style={{ padding: '0.6rem 1.5rem', fontSize: '0.85rem' }}>
                  <LogOut size={16} /> Sign Out
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-primary" style={{ padding: '0.6rem 1.5rem' }}>
              <KeyRound size={16} /> Login / Register
            </motion.button>
          </Link>
        )}
      </div>

      {/* Hamburger (mobile) */}
      <button className="hamburger" onClick={() => setMobileOpen(o => !o)} aria-label="Toggle menu">
        <span /><span /><span />
      </button>
    </motion.nav>

    {/* Mobile slide-down menu */}
    <div className={`mobile-nav-menu${mobileOpen ? ' open' : ''}`}>
      <Link to="/" onClick={() => setMobileOpen(false)} style={{ color: location.pathname === '/' ? 'white' : 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><HomeIcon size={18} /> Home</Link>
      <Link to="/dashboard" onClick={() => setMobileOpen(false)} style={{ color: location.pathname === '/dashboard' ? 'white' : 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <LayoutDashboard size={18} /> Dashboard
      </Link>
      {user ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Signed in as <strong style={{ color: 'white' }}>{user.name}</strong></span>
          <button onClick={handleMobileLogout} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      ) : (
        <Link to="/login" onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none' }}>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            <KeyRound size={16} /> Login / Register
          </button>
        </Link>
      )}
    </div>
    </>
  )
}



const PrivacyPolicy = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="legal-page">
    <div className="legal-header">
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-full)', padding: '0.25rem 0.9rem', fontSize: '0.65rem', letterSpacing: '2.5px', color: 'var(--accent-blue)', marginBottom: '0.7rem', textTransform: 'uppercase' }}>
        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-blue)', animation: 'pulse 2s infinite' }} />
        Compliance Protocol
      </div>
      <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Privacy <span style={{ background: 'linear-gradient(100deg, #60a5fa, #a78bfa, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Protocol</span></h1>
      <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Effective Revision: May 2026.01</p>
    </div>

    <div className="legal-content">
      <section className="legal-section">
        <h3><ShieldCheck size={20} color="var(--accent-blue)" /> Data Encryption & Sovereignty</h3>
        <p>CyberGuard AI employs military-grade SHA-256 hashing for all URL telemetry. Your search history is encrypted at rest and anonymized before being processed by our heuristic nodes.</p>
        <p>We do not store plain-text URLs beyond the duration of the active analysis session, ensuring your reconnaissance activities remain private.</p>
      </section>

      <section className="legal-section">
        <h3><Fingerprint size={20} color="var(--accent-green)" /> Operator Information</h3>
        <p>We collect minimal metadata required for system stability:</p>
        <ul>
          <li>Anonymized session tokens for authentication</li>
          <li>System performance metrics to optimize scan latency</li>
          <li>Cryptographic hashes of detected malicious payloads for global threat intelligence</li>
        </ul>
      </section>

      <section className="legal-section">
        <h3><Activity size={20} color="var(--accent-pink)" /> Third-Party Node Integration</h3>
        <p>While our core heuristic engine is proprietary, we may query trusted external threat feeds (Google Safe Browsing, VirusTotal) to verify results. These queries are proxied through our encrypted gateway to hide your IP address.</p>
      </section>
    </div>
  </motion.div>
);

const TermsOfService = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="legal-page">
    <div className="legal-header">
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-full)', padding: '0.25rem 0.9rem', fontSize: '0.65rem', letterSpacing: '2.5px', color: 'var(--accent-red)', marginBottom: '0.7rem', textTransform: 'uppercase' }}>
        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-red)', animation: 'pulse 2s infinite' }} />
        Operational Mandate
      </div>
      <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Terms of <span style={{ background: 'linear-gradient(100deg, #ef4444, #f59e0b, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Operation</span></h1>
      <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>System version: 4.2.0-Alpha</p>
    </div>

    <div className="legal-content">
      <section className="legal-section">
        <h3><Zap size={20} color="var(--accent-red)" /> Authorized Usage</h3>
        <p>CyberGuard AI is a defensive intelligence tool. By initializing this terminal, you agree to use it exclusively for threat detection and academic security research.</p>
        <p>Unauthorized automated scraping of our heuristic models or attempting to bypass rate limits will result in an immediate permanent hardware ID ban.</p>
      </section>

      <section className="legal-section">
        <h3><ShieldAlert size={20} color="var(--accent-pink)" /> Liability Disclaimer</h3>
        <p>CyberGuard AI provides probability-based risk scores. While our accuracy rate exceeds 99%, we are not liable for any security breaches resulting from false negatives or system downtime.</p>
        <p>The "Intelligent Void" architecture is provided "as is" without warranties of any kind.</p>
      </section>
    </div>
  </motion.div>
);

const CookieConsent = () => {
  const [show, setShow] = useState(() => !localStorage.getItem('cookie_consent'));
  if(!show) return null;
  return (
    <div className="cookie-bar">
      <p style={{ color: 'white', margin: 0, fontSize: '0.9rem' }}>We use cookies strictly for operator authentication and platform security. By continuing, you consent to our <Link to="/privacy" style={{color: 'var(--accent-blue)'}}>Privacy Protocol</Link>.</p>
      <button className="btn-primary" onClick={() => { localStorage.setItem('cookie_consent', 'true'); setShow(false); }}>Accept & Proceed</button>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [runtimeError, setRuntimeError] = useState(null);
  const [isBugModalOpen, setBugModalOpen] = useState(false);
  
  // Internal component to handle scroll reset on navigation
  const ScrollToTop = () => {
    const { pathname } = useLocation();
    useEffect(() => {
      window.scrollTo(0, 0);
    }, [pathname]);
    return null;
  };
  
  useEffect(() => {
    const catchError = (e) => {
      console.error("🕵️ Runtime Crash Debug:", e);
      // Detailed error breakdown
      const msg = e.message || "";
      const stack = e.error?.stack || "No stack trace available.";
      const source = e.filename ? ` at ${e.filename.split('/').pop()}:${e.lineno}` : "";
      setRuntimeError(`${msg}${source}\n\nSTACK: ${stack.slice(0, 200)}...`);
    };
    window.addEventListener('error', catchError);
    return () => window.removeEventListener('error', catchError);
  }, []);

  const login = (userData) => setUser(userData);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <BugContext.Provider value={{ isBugModalOpen, setBugModalOpen }}>
        <Router>
          <ScrollToTop />
          <InteractiveBackground />
          <div id="top" style={{ position: 'absolute', top: 0 }} />
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10, pointerEvents: 'auto' }}>
            <Navbar />
            <main style={{ flex: 1, padding: '2rem' }}>
              {runtimeError ? (
                <div style={{ padding: '4rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-red)', borderRadius: '12px' }}>
                  <ShieldAlert size={48} color="var(--accent-red)" style={{ margin: '0 auto 1.5rem' }} />
                  <h2 style={{ color: 'white' }}>System Shield Engaged</h2>
                  <p style={{ opacity: 0.6, maxWidth: '400px', margin: '1rem auto' }}> A sub-system has crashed. We've isolated the fault. Error: {runtimeError}</p>
                  <button onClick={() => window.location.reload()} className="btn-primary">Restart Grid</button>
                </div>
              ) : (
                <AnimatePresence mode='wait'>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                  </Routes>
                </AnimatePresence>
              )}
            </main>
            <Footer />
          </div>
          <CookieConsent />
          <BugReportModal />
          {/* <Analytics /> */}
        </Router>
      </BugContext.Provider>
    </AuthContext.Provider>
  )
}

export default App
