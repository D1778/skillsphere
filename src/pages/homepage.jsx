import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

/* ═══════════════════════════════════════════════════════
   GLOBAL STYLES
═══════════════════════════════════════════════════════ */
const GlobalStyles = () => (
  <style>{`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      background-color: var(--bg-page);
      color: var(--text-primary);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
      transition: background-color 0.3s ease, color 0.3s ease;
    }

    :root, [data-theme="dark"] {
      --bg-page:           #07090f;
      --bg-nav:            rgba(7,9,15,0.85);
      --footer-bg:         #07090f;
      --text-primary:      #ffffff;
      --text-secondary:    #94a3b8;
      --text-muted:        #475569;
      --border-card:       rgba(255,255,255,0.07);
      --divider:           rgba(255,255,255,0.05);
      --card-bg:           rgba(255,255,255,0.035);
      --card-bg-hover:     rgba(255,255,255,0.06);
      --card-inner-bg:     rgba(255,255,255,0.04);
      --card-inner-border: rgba(255,255,255,0.07);
      --bar-track:         rgba(255,255,255,0.07);
      --hero-card-bg:      rgba(14,18,30,0.96);
      --hero-card-border:  rgba(255,255,255,0.1);
      --hero-card-shadow:  0 40px 100px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07);
      --hero-label-color:  rgba(255,255,255,0.4);
      --hero-title-color:  #ffffff;
      --hero-sub-color:    rgba(255,255,255,0.25);
      --chip-bg:           rgba(7,9,15,0.94);
      --chip-border:       rgba(255,255,255,0.1);
      --chip-text:         rgba(255,255,255,0.45);
      --chip-bold:         #ffffff;
      --inner-label:       rgba(255,255,255,0.28);
      --skill-tag-bg:      rgba(255,255,255,0.06);
      --skill-tag-color:   rgba(255,255,255,0.4);
      --footer-divider:    rgba(255,255,255,0.05);
      --section-label-bg:  rgba(34,211,238,0.08);
      --section-label-border: rgba(34,211,238,0.28);
      color-scheme: dark;
    }

    [data-theme="light"] {
      --bg-page:           #f5f7fc;
      --bg-nav:            rgba(255,255,255,0.9);
      --footer-bg:         #e8ecf6;
      --text-primary:      #0f172a;
      --text-secondary:    #1e293b;
      --text-muted:        #64748b;
      --border-card:       rgba(15,23,42,0.1);
      --divider:           rgba(15,23,42,0.08);
      --card-bg:           rgba(255,255,255,0.85);
      --card-bg-hover:     rgba(255,255,255,1);
      --card-inner-bg:     rgba(15,23,42,0.03);
      --card-inner-border: rgba(15,23,42,0.08);
      --bar-track:         rgba(15,23,42,0.08);
      --hero-card-bg:      rgba(255,255,255,0.97);
      --hero-card-border:  rgba(15,23,42,0.1);
      --hero-card-shadow:  0 24px 64px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.06);
      --hero-label-color:  #334155;
      --hero-title-color:  #0f172a;
      --hero-sub-color:    #64748b;
      --chip-bg:           rgba(255,255,255,0.97);
      --chip-border:       rgba(15,23,42,0.1);
      --chip-text:         #475569;
      --chip-bold:         #0f172a;
      --inner-label:       #64748b;
      --skill-tag-bg:      rgba(15,23,42,0.06);
      --skill-tag-color:   #334155;
      --footer-divider:    rgba(15,23,42,0.12);
      --section-label-bg:  rgba(6,182,212,0.08);
      --section-label-border: rgba(6,182,212,0.3);
      color-scheme: light;
    }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #06b6d4, #818cf8); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #22d3ee, #a78bfa); }

    html, body { overflow-x: hidden; }
    section { position: relative; overflow: visible !important; }

    @keyframes fadeUp    { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:none} }
    @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
    @keyframes shimmer   { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
    @keyframes floatBadge {
      0%,100%{transform:translateY(0) rotate(-1deg);opacity:.8}
      50%{transform:translateY(-12px) rotate(1deg);opacity:1}
    }
    @keyframes pulseRing {
      0%  {transform:scale(0.85);opacity:0.5}
      100%{transform:scale(1.7);opacity:0}
    }
    @keyframes morphBlob {
      0%,100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%}
      33%{border-radius:40% 60% 70% 30%/40% 70% 30% 60%}
      66%{border-radius:70% 30% 50% 50%/30% 50% 70% 50%}
    }
    @keyframes ticker  { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
    @keyframes counterIn { from{opacity:0;transform:scale(0.8) translateY(8px)} to{opacity:1;transform:none} }
    @keyframes scanLine {
      0%  {transform:translateY(-100%);opacity:0}
      10% {opacity:1}
      90% {opacity:1}
      100%{transform:translateY(700%);opacity:0}
    }
    @keyframes gridMove {
      0%   {transform:translateY(0)}
      100% {transform:translateY(60px)}
    }
    @keyframes particleFloat {
      0%,100%{transform:translate(0,0) scale(1); opacity:.15}
      33%{transform:translate(60px,-80px) scale(1.2); opacity:.3}
      66%{transform:translate(-40px,40px) scale(.9); opacity:.2}
    }
    @keyframes beam {
      0%{transform:translateX(-120%) scaleX(.4);opacity:0}
      15%{opacity:1}
      85%{opacity:1}
      100%{transform:translateX(120%) scaleX(.4);opacity:0}
    }
    @keyframes gradientShift {
      0%,100%{background-position:0% 50%}
      50%{background-position:100% 50%}
    }
    @keyframes spinSlow { to{transform:rotate(360deg)} }
    @keyframes spinReverse { to{transform:rotate(-360deg)} }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
    /* AirVault-style sweep: a bright band travels left→right on hover */
    @keyframes btnSweep {
      0%   { transform: translateX(-100%) skewX(-15deg); opacity: 0; }
      10%  { opacity: 1; }
      90%  { opacity: 1; }
      100% { transform: translateX(300%) skewX(-15deg); opacity: 0; }
    }
    @keyframes ping {
      0%{transform:scale(1);opacity:1}
      75%,100%{transform:scale(2);opacity:0}
    }
    @keyframes popIn {
      0%{opacity:0;transform:scale(0.8) translateY(10px)}
      100%{opacity:1;transform:scale(1) translateY(0)}
    }
    @keyframes headingReveal {
      0%{opacity:0;transform:translateY(20px)}
      100%{opacity:1;transform:translateY(0)}
    }
    @keyframes textColorShift {
      0%{color:var(--text-primary)}
      50%{color:rgba(34,211,238,0.9)}
      100%{color:var(--text-primary)}
    }

    .gradient-text {
      background-image: linear-gradient(90deg,#22d3ee,#818cf8,#f472b6,#22d3ee);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: shimmer 4s linear infinite;
    }
    .nav-link { text-decoration:none; transition:color 0.2s; }
    .nav-link:hover { color: var(--text-primary) !important; }
    .hidden-mobile { display:flex; }
    @media(max-width:768px){ .hidden-mobile{display:none!important;} }

    /* ── Light-mode background: keep the grid dots visible ── */
    [data-theme="light"] .hero-canvas { opacity: 0.65; }
    
    /* ── Full page particle canvas positioning ── */
    .page-canvas-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    }

    /* ── AirVault-style button sweep effect ── */
    .btn-sweep {
      position: relative;
      overflow: hidden;
    }
    .btn-sweep::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.28) 50%, transparent 80%);
      transform: translateX(-100%) skewX(-15deg);
      transition: none;
    }
    .btn-sweep:hover::after {
      animation: btnSweep 0.65s ease forwards;
    }
    /* Reverse-gradient overlay on hover (AirVault style) */
    .btn-primary-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #6366f1, #3b82f6, #06b6d4);
      opacity: 0;
      transition: opacity 0.45s ease;
    }
    .btn-primary:hover .btn-primary-overlay { opacity: 1; }

    .card-hover {
      transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    }
    .card-hover:hover {
      transform: translateY(-4px);
      border-color: rgba(34,211,238,0.25) !important;
      box-shadow: 0 12px 40px rgba(6,182,212,0.12);
    }
    [data-theme="light"] .card-hover:hover {
      box-shadow: 0 12px 40px rgba(6,182,212,0.15);
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration:0.01ms!important; transition-duration:0.01ms!important; }
    }
  `}</style>
);

/* ═══════════════════════════════════════════════════════
   HOOKS
═══════════════════════════════════════════════════════ */
function useInView(threshold = 0.15) {
  const [vis, setVis] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, vis];
}

function useCountUp(target, active) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) return;
    let s = null, raf;
    const step = ts => {
      if (!s) s = ts;
      const p = Math.min((ts - s) / 1800, 1);
      setV(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, target]);
  return v;
}

function useMousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const fn = e => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', fn);
    return () => window.removeEventListener('mousemove', fn);
  }, []);
  return pos;
}

/* ═══════════════════════════════════════════════════════
   LOGO
═══════════════════════════════════════════════════════ */
function Logo({ size = 36 }) {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id={`la${id}`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22d3ee"/><stop offset="1" stopColor="#818cf8"/>
        </linearGradient>
        <linearGradient id={`lb${id}`} x1="40" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f472b6"/><stop offset="1" stopColor="#a78bfa"/>
        </linearGradient>
        <radialGradient id={`rc${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill={`url(#rc${id})`}/>
      <path d="M20 4 A16 16 0 0 1 36 20" stroke={`url(#la${id})`} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M20 36 A16 16 0 0 1 4 20"  stroke={`url(#lb${id})`} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <circle cx="20" cy="20" r="10" stroke="rgba(99,102,241,0.2)" strokeWidth="1" fill="none"/>
      <circle cx="20" cy="4"  r="2.5" fill="#22d3ee"/>
      <circle cx="36" cy="20" r="2"   fill="#818cf8"/>
      <circle cx="20" cy="36" r="2.5" fill="#f472b6"/>
      <circle cx="4"  cy="20" r="2"   fill="#a78bfa"/>
      <line x1="20" y1="12" x2="20" y2="28" stroke="rgba(99,102,241,0.2)" strokeWidth="1"/>
      <line x1="12" y1="20" x2="28" y2="20" stroke="rgba(99,102,241,0.2)" strokeWidth="1"/>
      <circle cx="20" cy="20" r="4" fill={`url(#la${id})`}/>
      <circle cx="20" cy="20" r="2" fill="white"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   NAVBAR
═══════════════════════════════════════════════════════ */
const NAV_LINKS = [
  { label:'How It Works', href:'#howitworks' },
  { label:'AI Scoring',   href:'#aiscoring'  },
  { label:'Features',     href:'#features'   },
  { label:'Why Us',       href:'#whyus'      },
];

function Navbar() {
  const [isDark, setIsDark]   = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const apply = e => {
      const dark = !e.matches;
      setIsDark(dark);
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    };
    apply(mq); mq.addEventListener('change', apply);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => { mq.removeEventListener('change', apply); window.removeEventListener('scroll', onScroll); };
  }, []);

  const toggle = () => {
    const next = !isDark; setIsDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  };

  return (
    <nav style={{ position:'fixed', top:12, left:'50%', transform:'translateX(-50%)', width:'calc(100% - 2rem)', maxWidth:1200, zIndex:50 }}>
      <div style={{
        backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
        background:'var(--bg-nav)', border:'1px solid var(--border-card)',
        borderRadius:20, padding:'12px 20px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        boxShadow: scrolled
          ? isDark ? '0 8px 40px rgba(0,0,0,0.4)' : '0 8px 40px rgba(15,23,42,0.12)'
          : 'none',
        transition:'box-shadow 0.3s',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <Logo size={32}/>
          <span style={{ fontSize:'1.05rem', fontWeight:800, letterSpacing:'-0.02em', color:'var(--text-primary)' }}>
            Skill<span className="gradient-text">Sphere</span>
          </span>
        </div>

        <div className="hidden-mobile" style={{ alignItems:'center', gap:28 }}>
          {NAV_LINKS.map(l => (
            <a key={l.label} href={l.href} className="nav-link"
              style={{ fontSize:14, fontWeight:600, color:'var(--text-secondary)' }}>{l.label}</a>
          ))}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={toggle} style={{ padding:7, borderRadius:10, background:'var(--card-inner-bg)', border:'1px solid var(--border-card)', cursor:'pointer', color:'var(--text-secondary)', transition:'all 0.2s', display:'flex', alignItems:'center' }} aria-label="Toggle theme">
            {isDark
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            }
          </button>
          <Link to="/signin" className="hidden-mobile" style={{ fontSize:13, fontWeight:600, padding:'7px 14px', borderRadius:9999, background:'none', border:'1px solid var(--border-card)', cursor:'pointer', color:'var(--text-secondary)', transition:'all 0.2s', textDecoration:'none', display:'inline-block' }}
            onMouseEnter={e=>{e.currentTarget.style.background='var(--card-inner-bg)';e.currentTarget.style.color='var(--text-primary)'}}
            onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='var(--text-secondary)'}}>
            Sign in
          </Link>
          <Link to="/get-started" className="btn-sweep" style={{ display:'flex', alignItems:'center', gap:6, background:'linear-gradient(135deg,#06b6d4,#6366f1)', color:'white', fontSize:13, fontWeight:700, padding:'9px 18px', borderRadius:9999, border:'none', cursor:'pointer', boxShadow:'0 4px 20px rgba(6,182,212,0.3)', transition:'all 0.2s', textDecoration:'none' }}
            onMouseEnter={e=>{e.currentTarget.style.opacity='0.9';e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 8px 28px rgba(6,182,212,0.5)'}}
            onMouseLeave={e=>{e.currentTarget.style.opacity='1';e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 4px 20px rgba(6,182,212,0.3)'}}>
            Get Started
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════
   BACKGROUND — grid + particles + cursor glow
   Fixed: much more visible in light mode
═══════════════════════════════════════════════════════ */
function BackgroundCanvas() {
  const ref = useRef(null), frameRef = useRef(null);
  useEffect(() => {
    const c = ref.current, ctx = c.getContext('2d');
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const particleCount = isDark ? 180 : 200; // More particles for better right-side coverage
    const pts = Array.from({ length: particleCount }, () => ({
      x: Math.random()*window.innerWidth, y: Math.random()*window.innerHeight,
      vx:(Math.random()-0.5)*0.65, vy:(Math.random()-0.5)*0.65, // Improved velocity for better coverage
      r: Math.random()*2+0.6, a: isDark ? (Math.random()*0.55+0.15) : (Math.random()*0.7+0.25),
      col:['#22d3ee','#818cf8','#34d399','#f472b6','#fbbf24'][Math.floor(Math.random()*5)],
      pulse:Math.random()*Math.PI*2,
    }));
    function draw() {
      const W=c.width, H=c.height; ctx.clearRect(0,0,W,H);
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      // dot grid — much stronger in light mode
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(15,23,42,0.12)';
      for(let gx=0;gx<W;gx+=56) for(let gy=0;gy<H;gy+=56){
        ctx.beginPath();ctx.arc(gx,gy,isDark?0.8:1.2,0,Math.PI*2);ctx.fill();
      }
      pts.forEach(p=>{
        p.x+=p.vx; p.y+=p.vy; p.pulse+=0.018;
        // Wrap particles and respawn with better distribution
        if(p.x<-40) p.x = W + 40;
        if(p.x>W+40) p.x = -40;
        if(p.y<-40) p.y = H + 40;
        if(p.y>H+40) p.y = -40;
        if(p.y>H+20) p.y = -20;
        const aBase = isDark ? p.a : p.a * 1.6; // brighter in light
        const a=aBase*(0.6+0.4*Math.sin(p.pulse));
        const glowR = isDark ? p.r*7 : p.r*10;
        const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,glowR);
        g.addColorStop(0,p.col+Math.round(a*130).toString(16).padStart(2,'0'));
        g.addColorStop(1,p.col+'00');
        ctx.beginPath();ctx.arc(p.x,p.y,glowR,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=p.col+Math.round(a*(isDark?255:200)).toString(16).padStart(2,'0');ctx.fill();
      });
      // lines between close particles - increased distance for better coverage
      for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){
        const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y, d=Math.sqrt(dx*dx+dy*dy);
        if(d<180){
          const isDark2 = document.documentElement.getAttribute('data-theme') !== 'light';
          const lineA = isDark2 ? (1-d/180)*0.055 : (1-d/180)*0.15;
          const lineColor = isDark2 ? `rgba(34,211,238,${lineA})` : `rgba(6,182,212,${lineA})`;
          ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);
          ctx.strokeStyle=lineColor;ctx.lineWidth=0.8;ctx.stroke();
        }
      }
      frameRef.current=requestAnimationFrame(draw);
    }
    draw();
    return ()=>{cancelAnimationFrame(frameRef.current);window.removeEventListener('resize',resize);};
  },[]);
  return <canvas ref={ref} className="hero-canvas" style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }}/>;
}

/* ═══════════════════════════════════════════════════════
   LIGHT MODE BACKGROUND — minimal animated circles
═══════════════════════════════════════════════════════ */
function LightModeBackground() {
  const ref = useRef(null), frameRef = useRef(null);
  
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    
    // Create animated circles
    const circles = Array.from({ length: 12 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 80 + 40,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.3 + 0.1,
      pulseSpeed: Math.random() * 0.015 + 0.008,
      pulse: Math.random() * Math.PI * 2,
      color: ['#06b6d4', '#34d399', '#a78bfa', '#f472b6'][Math.floor(Math.random() * 4)],
    }));
    
    let time = 0;
    
    function draw() {
      // Clear with clean background
      ctx.fillStyle = '#f5f7fc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add subtle gradient overlay
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'rgba(255,255,255,0)');
      gradient.addColorStop(0.5, 'rgba(250,245,255,0.3)');
      gradient.addColorStop(1, 'rgba(240,253,244,0.2)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      time += 0.01;
      
      // Update and draw circles
      circles.forEach(circle => {
        // Move circle
        circle.x += circle.vx;
        circle.y += circle.vy;
        circle.pulse += circle.pulseSpeed;
        
        // Wrap around edges with smooth transition
        if (circle.x < -100) circle.x = canvas.width + 100;
        if (circle.x > canvas.width + 100) circle.x = -100;
        if (circle.y < -100) circle.y = canvas.height + 100;
        if (circle.y > canvas.height + 100) circle.y = -100;
        
        // Calculate pulsing opacity
        const pulseOpacity = circle.opacity * (0.5 + 0.5 * Math.sin(circle.pulse));
        
        // Draw outer glow
        const glowGradient = ctx.createRadialGradient(
          circle.x, circle.y, 0,
          circle.x, circle.y, circle.radius * 1.5
        );
        glowGradient.addColorStop(0, circle.color + Math.round(pulseOpacity * 60).toString(16).padStart(2, '0'));
        glowGradient.addColorStop(1, circle.color + '00');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw main circle with outline
        ctx.strokeStyle = circle.color + Math.round(pulseOpacity * 80).toString(16).padStart(2, '0');
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        ctx.stroke();
      });
      
      frameRef.current = requestAnimationFrame(draw);
    }
    
    draw();
    
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);
  
  return <canvas ref={ref} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }}/>;
}

/* ═══════════════════════════════════════════════════════
   CURSOR GLOW
═══════════════════════════════════════════════════════ */
function CursorGlow() {
  const pos = useMousePosition();
  return (
    <div style={{
      position:'fixed', pointerEvents:'none', zIndex:1,
      width:500, height:500, borderRadius:'50%',
      left: pos.x - 250, top: pos.y - 250,
      background:'radial-gradient(circle, rgba(34,211,238,0.09) 0%, transparent 70%)',
      transition:'left 0.35s ease-out, top 0.35s ease-out',
      mixBlendMode:'screen',
    }}/>
  );
}

/* ═══════════════════════════════════════════════════════
   HERO — SCORE RING
═══════════════════════════════════════════════════════ */
function OverallRing({ score = 88 }) {
  const ref = useRef(null), raf = useRef();
  useEffect(()=>{
    const c=ref.current, ctx=c.getContext('2d');
    const S=160; c.width=S; c.height=S;
    const cx=S/2, cy=S/2, R=S/2-10;
    let prog=0;
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const textCol = isDark ? 'white' : '#0f172a';
    const subCol  = isDark ? 'rgba(255,255,255,0.35)' : '#64748b';
    const trackCol= isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.1)';
    function draw(){
      ctx.clearRect(0,0,S,S);
      ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2);
      ctx.strokeStyle=trackCol; ctx.lineWidth=8; ctx.stroke();
      const g=ctx.createLinearGradient(0,0,S,S);
      g.addColorStop(0,'#22d3ee'); g.addColorStop(1,'#a78bfa');
      ctx.beginPath(); ctx.arc(cx,cy,R,-Math.PI/2,-Math.PI/2+Math.PI*2*(prog/100));
      ctx.strokeStyle=g; ctx.lineWidth=8; ctx.lineCap='round';
      ctx.shadowColor='#22d3ee'; ctx.shadowBlur=12; ctx.stroke(); ctx.shadowBlur=0;
      ctx.fillStyle=textCol;
      ctx.font=`800 ${S*0.24}px system-ui`; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(Math.round(prog)+'%',cx,cy-7);
      ctx.fillStyle=subCol; ctx.font=`700 ${S*0.085}px system-ui`;
      ctx.fillText('OVERALL',cx,cy+S*0.18);
      if(prog<score){prog=Math.min(prog+1.6,score);raf.current=requestAnimationFrame(draw);}
    }
    const t=setTimeout(()=>draw(),300);
    return ()=>{clearTimeout(t);cancelAnimationFrame(raf.current);};
  },[score]);
  return <canvas ref={ref} style={{ width:80, height:80 }}/>;
}

/* ═══════════════════════════════════════════════════════
   DYNAMIC HERO CARD
═══════════════════════════════════════════════════════ */
const CANDIDATES = [
  {
    name:'Priya Sharma', role:'Senior Frontend Engineer', avatar:'PS',
    avatarColor:'#22d3ee', match:91, confidence:96,
    dims:[
      { label:'Technical Skills', pct:94, color:'#22d3ee' },
      { label:'Role Fit',         pct:91, color:'#f472b6' },
      { label:'Culture Align',    pct:87, color:'#a78bfa' },
      { label:'Trajectory',       pct:83, color:'#34d399' },
      { label:'Interview Signal', pct:89, color:'#fbbf24' },
    ],
    skills:['React','TypeScript','System Design'],
    sources:'GitHub · LeetCode · Take-home',
  },
  {
    name:'Aditya Rao', role:'Full-Stack Engineer', avatar:'AR',
    avatarColor:'#a78bfa', match:88, confidence:93,
    dims:[
      { label:'Technical Skills', pct:88, color:'#22d3ee' },
      { label:'Role Fit',         pct:85, color:'#f472b6' },
      { label:'Culture Align',    pct:91, color:'#a78bfa' },
      { label:'Trajectory',       pct:79, color:'#34d399' },
      { label:'Interview Signal', pct:74, color:'#fbbf24' },
    ],
    skills:['Node.js','PostgreSQL','AWS'],
    sources:'GitHub · Portfolio · References',
  },
  {
    name:'Kemal Yilmaz', role:'ML Engineer', avatar:'KY',
    avatarColor:'#34d399', match:86, confidence:91,
    dims:[
      { label:'Technical Skills', pct:92, color:'#22d3ee' },
      { label:'Role Fit',         pct:86, color:'#f472b6' },
      { label:'Culture Align',    pct:78, color:'#a78bfa' },
      { label:'Trajectory',       pct:88, color:'#34d399' },
      { label:'Interview Signal', pct:71, color:'#fbbf24' },
    ],
    skills:['PyTorch','Transformers','MLOps'],
    sources:'HuggingFace · Papers · GitHub',
  },
];

function HeroCard({ show }) {
  const [idx, setIdx] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!show) return;
    const t = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setIdx(i => (i+1) % CANDIDATES.length);
        setAnimating(false);
      }, 300);
    }, 3500);
    return () => clearInterval(t);
  }, [show]);

  const c = CANDIDATES[idx];
  const top = c.dims.reduce((a,b) => a.pct > b.pct ? a : b);

  return (
    <div style={{
      position:'relative', borderRadius:22, overflow:'hidden',
      background:'var(--hero-card-bg)',
      border:'1px solid var(--hero-card-border)',
      backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)',
      boxShadow:'var(--hero-card-shadow)',
      opacity: show ? 1 : 0,
      transform: show ? 'translateY(0) scale(1)' : 'translateY(28px) scale(0.96)',
      transition:'opacity 0.7s ease 0.2s,transform 0.7s ease 0.2s',
      minWidth:300,
    }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(to right,transparent,rgba(34,211,238,0.6),transparent)' }}/>
      <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:1 }}>
        <div style={{ position:'absolute', left:0, right:0, height:60, background:'linear-gradient(to bottom,transparent,rgba(34,211,238,0.035),transparent)', animation:'scanLine 4s ease-in-out 1.4s 1' }}/>
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 18px 12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:'50%', background:c.avatarColor+'22', border:`1.5px solid ${c.avatarColor}55`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:c.avatarColor, transition:'all 0.3s', opacity: animating ? 0 : 1, transform: animating ? 'scale(0.8)' : 'scale(1)' }}>
            {c.avatar}
          </div>
          <div style={{ opacity: animating ? 0 : 1, transform: animating ? 'translateX(-8px)' : 'none', transition:'all 0.3s' }}>
            <p style={{ fontSize:13, fontWeight:700, color:'var(--hero-title-color)', lineHeight:1.2 }}>{c.name}</p>
            <p style={{ fontSize:10, color:'var(--hero-sub-color)', fontWeight:500 }}>{c.role}</p>
          </div>
        </div>
        <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, fontWeight:700, padding:'4px 10px', borderRadius:9999, background:'rgba(167,139,250,0.14)', border:'1px solid rgba(167,139,250,0.32)', color:'#a78bfa' }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
          AI SCORED
        </span>
      </div>

      <div style={{ padding:'0 18px 16px' }}>
        <div style={{ borderRadius:14, padding:13, background:'var(--card-inner-bg)', border:'1px solid var(--card-inner-border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
            <div style={{ position:'relative', flexShrink:0, width:80, height:80, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {[0,0.7,1.4].map((d,i)=>(
                <div key={i} style={{ position:'absolute', inset:0, borderRadius:'50%', border:'1px solid rgba(34,211,238,0.18)', animation:`pulseRing 3s ease-out ${d}s infinite` }}/>
              ))}
              <OverallRing score={c.match}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--inner-label)', marginBottom:6 }}>Strongest Signal</p>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', flexShrink:0, background:top.color, boxShadow:`0 0 6px ${top.color}` }}/>
                <span style={{ fontSize:12, fontWeight:700, color:'var(--hero-title-color)', flex:1, opacity: animating ? 0 : 1, transition:'opacity 0.25s' }}>{top.label}</span>
                <span style={{ fontSize:12, fontWeight:900, color:top.color }}>{top.pct}%</span>
              </div>
              <p style={{ fontSize:10, color:'var(--hero-sub-color)', marginBottom:8 }}>{c.sources}</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {c.skills.map(sk=>(
                  <span key={sk} style={{ fontSize:9, fontWeight:600, padding:'2px 7px', borderRadius:5, background:'var(--skill-tag-bg)', color:'var(--skill-tag-color)', border:'1px solid var(--card-inner-border)' }}>{sk}</span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
            {c.dims.map((d,i)=>(
              <div key={d.label} style={{ opacity:show && !animating ? 1:0, transform:show && !animating ?'none':'translateX(10px)', transition:`opacity .4s ease ${0.3+i*0.07}s,transform .4s ease ${0.3+i*0.07}s` }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:10, fontWeight:600, color:'var(--hero-label-color)' }}>{d.label}</span>
                  <span style={{ fontSize:10, fontWeight:900, color:d.color }}>{d.pct}%</span>
                </div>
                <div style={{ height:3, borderRadius:9999, background:'var(--bar-track)' }}>
                  <div style={{ height:'100%', borderRadius:9999, width:show && !animating ? `${d.pct}%`:'0%', background:`linear-gradient(to right,${d.color},${d.color}88)`, boxShadow:`0 0 5px ${d.color}44`, transition:`width 0.9s ease ${0.4+i*0.08}s` }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', justifyContent:'center', gap:5, marginTop:12 }}>
          {CANDIDATES.map((_,i)=>(
            <button key={i} onClick={()=>setIdx(i)} style={{ height:4, borderRadius:2, background:i===idx?'#22d3ee':'var(--bar-track)', width:i===idx?18:5, border:'none', cursor:'pointer', padding:0, transition:'all 0.3s' }}/>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', borderTop:'1px solid var(--card-inner-border)' }}>
        {[{label:'Dimensions',value:'5',color:'#22d3ee'},{label:'Data Sources',value:'12',color:'#a78bfa'},{label:'Confidence',value:`${c.confidence}%`,color:'#34d399'}].map((s,i)=>(
          <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 0', gap:2, borderRight:i<2?'1px solid var(--card-inner-border)':'none' }}>
            <span style={{ fontSize:16, fontWeight:900, color:s.color, opacity: animating ? 0 : 1, transition:'opacity 0.3s' }}>{s.value}</span>
            <span style={{ fontSize:9, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--inner-label)' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   HERO SECTION — taller, more impactful
═══════════════════════════════════════════════════════ */
function Hero() {
  const [entered, setEntered] = useState(false);
  useEffect(()=>{const t=setTimeout(()=>setEntered(true),100);return()=>clearTimeout(t);},[]);

  // const BADGES = [
  //   { text:'▲ 94% Match Accuracy', color:'#22d3ee', delay:0,   side:'left',  top:'18%' },
  //   { text:'⚡ 3× Faster Shortlist', color:'#34d399', delay:1.5, side:'right', top:'52%' },
  // ];

  return (
    <section style={{ position:'relative', minHeight:'100vh', display:'flex', alignItems:'center', overflow:'hidden', paddingTop:110, paddingBottom:80, paddingLeft:24, paddingRight:24 }}>
      {/* ambient orbs — more visible in light mode */}
      <div style={{ position:'absolute', top:'-10%', left:'-10%', width:700, height:700, borderRadius:'50%', filter:'blur(100px)', background:'radial-gradient(ellipse,rgba(6,182,212,0.18),transparent 70%)', pointerEvents:'none', animation:'morphBlob 14s ease-in-out infinite' }}/>
      <div style={{ position:'absolute', bottom:'-12%', right:'-10%', width:650, height:650, borderRadius:'50%', filter:'blur(100px)', background:'radial-gradient(ellipse,rgba(129,140,248,0.16),transparent 70%)', pointerEvents:'none', animation:'morphBlob 18s ease-in-out 3s infinite' }}/>
      <div style={{ position:'absolute', top:'40%', left:'40%', width:400, height:400, borderRadius:'50%', filter:'blur(120px)', background:'radial-gradient(ellipse,rgba(244,114,182,0.09),transparent 70%)', pointerEvents:'none' }}/>

      <div style={{ width:'100%', maxWidth:1400, margin:'0 auto', position:'relative', zIndex:10, display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:56, alignItems:'center' }}>

        {/* LEFT */}
        <div style={{ opacity:entered?1:0, transform:entered?'none':'translateY(32px)', transition:'opacity 0.8s ease,transform 0.8s ease' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'6px 14px', borderRadius:9999, border:'1px solid rgba(6,182,212,0.35)', background:'rgba(6,182,212,0.08)', marginBottom:24 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'#22d3ee', display:'inline-block', boxShadow:'0 0 6px #22d3ee', animation:'ping 2s infinite' }}/>
            <span style={{ fontSize:11, fontWeight:700, color:'#22d3ee', letterSpacing:'0.12em', textTransform:'uppercase' }}>Smart Hiring Platform</span>
          </div>
          <h1 style={{ fontSize:'clamp(2.8rem,5vw,5rem)', fontWeight:800, letterSpacing:'-0.03em', lineHeight:1.03, marginBottom:22, color:'var(--text-primary)', animation:'headingReveal 0.8s ease 0.3s both' }}>
            Hire on what<br/>people can <span className="gradient-text">actually do.</span>
          </h1>
          <p style={{ fontSize:18, lineHeight:1.75, marginBottom:34, maxWidth:500, color:'var(--text-secondary)' }}>
            SkillSphere reads real signals — code, projects, assessments — and surfaces the candidates most likely to succeed in your specific role. No keyword matching, no resume bias.
          </p>
          {/* Single CTA — no "Request demo" */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginBottom:28 }}>

<Link 
  to="/get-started"
  className="btn-sweep btn-primary"
  style={{ 
    position:'relative',
    overflow:'hidden',
    color:'white',
    padding:'16px 32px',
    borderRadius:14,
    fontWeight:700,
    fontSize:15,
    display:'flex',
    alignItems:'center',
    gap:8,
    border:'none',
    cursor:'pointer',
    background:'linear-gradient(135deg,#06b6d4,#6366f1)',
    boxShadow:'0 0 40px rgba(6,182,212,0.4)',
    transition:'transform 0.2s,box-shadow 0.2s'
  }}
  onMouseEnter={e=>{
    e.currentTarget.style.transform='translateY(-2px)';
    e.currentTarget.style.boxShadow='0 8px 48px rgba(6,182,212,0.55)';
  }}
  onMouseLeave={e=>{
    e.currentTarget.style.transform='none';
    e.currentTarget.style.boxShadow='0 0 40px rgba(6,182,212,0.4)';
  }}
>
  <div className="btn-primary-overlay"/>
  <span style={{ position:'relative', zIndex:1 }}>Start for free</span>
  <svg style={{ position:'relative', zIndex:1 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
</Link>

          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:18, fontSize:12, fontWeight:500, color:'var(--text-muted)' }}>
            {['No credit card','5-min setup','SOC 2 Type II','Cancel anytime'].map(t=>(
              <span key={t} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ position:'relative', opacity:entered?1:0, transform:entered?'none':'translateY(40px)', transition:'opacity 0.8s ease 0.25s,transform 0.8s ease 0.25s' }}>
          <div style={{ position:'absolute', inset:'-10%', filter:'blur(50px)', borderRadius:'50%', background:'radial-gradient(ellipse,rgba(6,182,212,0.12),rgba(129,140,248,0.09),transparent 70%)', pointerEvents:'none' }}/>
          
          <HeroCard show={entered}/>
          <div style={{ position:'absolute', bottom:-22, left:'50%', transform:'translateX(-50%)', display:'flex', alignItems:'center', gap:8, padding:'9px 18px', borderRadius:14, fontSize:11, fontWeight:700, whiteSpace:'nowrap', background:'var(--chip-bg)', border:'1px solid var(--chip-border)', backdropFilter:'blur(16px)', boxShadow:'0 6px 28px rgba(0,0,0,0.15)' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#a78bfa', display:'inline-block', flexShrink:0, boxShadow:'0 0 6px #a78bfa' }}/>
            <span style={{ color:'var(--chip-text)' }}>5 dimensions</span>
            <span style={{ color:'var(--chip-bold)' }}>· 94% confidence</span>
            <span style={{ color:'#22d3ee' }}>· transparent AI</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   USE CASES / INDUSTRIES
═══════════════════════════════════════════════════════ */
const USE_CASES = [
  {
    title:'Tech & AI Startups',
    desc:'Find engineers who understand your stack and can ship fast in high-growth environments.',
    color:'#22d3ee',
    icon:<svg style={{width:28,height:28}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20m0 0l-.75 3M9 20H5m4 0h10m0 0l.75 3M19 20l.75 3m0 0v.01M12 6v6m0 0v6m0-6a3 3 0 100-6 3 3 0 000 6z"/></svg>
  },
  {
    title:'Enterprise & Fortune 500',
    desc:'Build world-class teams with verified credentials, compliance tracking, and enterprise security.',
    color:'#a78bfa',
    icon:<svg style={{width:28,height:28}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/></svg>
  },
  {
    title:'Scale-ups (50-500 ppl)',
    desc:'Hire specialists fast without the noise. Culture fit + technical depth = sustainable growth.',
    color:'#34d399',
    icon:<svg style={{width:28,height:28}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
  },
  {
    title:'Product & Design Teams',
    desc:'Hire full-stack engineers, PMs, and designers who understand shipping, user empathy, and iteration.',
    color:'#f472b6',
    icon:<svg style={{width:28,height:28}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>
  },
];

function UseCases() {
  const [ref, vis] = useInView(0.12);
  return (
    <div ref={ref} style={{ position:'relative', padding:'64px 24px', borderTop:'1px solid var(--divider)', borderBottom:'1px solid var(--divider)', background:'var(--bg-page)' }}>
      <div style={{ maxWidth:1400, margin:'0 auto' }}>
        <div style={{ opacity:vis?1:0, transform:vis?'none':'translateY(24px)', transition:'opacity 0.65s ease,transform 0.65s ease', marginBottom:48, textAlign:'center' }}>
          <SectionLabel color="#22d3ee">Perfect for Every Team</SectionLabel>
          <h2 style={{ fontSize:'clamp(2rem,4vw,3.5rem)', fontWeight:800, letterSpacing:'-0.02em', lineHeight:1.2, marginBottom:18, color:'#22d3ee', textAlign:'center', animation:'headingReveal 0.8s ease 0.4s both', wordBreak:'break-word' }}>
            Built for scale-ups<br/>and enterprises alike.
          </h2>
          <p style={{ fontSize:16, maxWidth:'100%', lineHeight:1.6, color:'var(--text-secondary)', textAlign:'center' }}>
            Whether you're a 10-person startup or a Fortune 500 company, SkillSphere adapts to your hiring needs.
          </p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:14 }}>
          {USE_CASES.map((uc,i)=>(
            <div key={uc.title} style={{
              opacity:vis?1:0,
              transform:vis?'none':'translateY(20px)',
              transition:`opacity 0.5s ease ${i*0.1}s,transform 0.5s ease ${i*0.1}s`,
              padding:'20px 18px',
              borderRadius:16,
              background:'var(--card-bg)',
              border:'1px solid var(--border-card)',
              display:'flex',
              flexDirection:'column',
              gap:10,
              cursor:'default',
              transition:'border-color 0.3s ease'
            }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=uc.color+'45'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border-card)'}>
              <div style={{ width:44, height:44, borderRadius:12, background:uc.color+'12', border:`1.5px solid ${uc.color}28`, display:'flex', alignItems:'center', justifyContent:'center', color:uc.color }}>
                {uc.icon}
              </div>
              <h4 style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)', lineHeight:1.3 }}>{uc.title}</h4>
              <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.5, margin:0 }}>{uc.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SHARED LABEL
═══════════════════════════════════════════════════════ */
function SectionLabel({ children, color='#22d3ee' }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'5px 13px', borderRadius:9999, border:`1px solid ${color}35`, background:color+'0D', marginBottom:16, width:'fit-content', margin:'0 auto 16px' }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background:color, display:'inline-block', boxShadow:`0 0 6px ${color}` }}/>
      <span style={{ fontSize:11, fontWeight:700, color, letterSpacing:'0.12em', textTransform:'uppercase' }}>{children}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PIPELINE — HOW IT WORKS
═══════════════════════════════════════════════════════ */
const STEPS = [
  { num:'01', title:'Define your Role DNA', desc:'Set skills, culture signals and must-haves. SkillSphere builds a precision blueprint that drives everything downstream.', color:'#22d3ee', grad:'linear-gradient(135deg,#06b6d4,#3b82f6)', tags:['Role DNA','Culture mapping','Skill weights'],
    icon:<svg style={{width:22,height:22}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> },
  { num:'02', title:'AI scores every signal', desc:'Code, projects, assessments, endorsements — five dimensions, all verifiable. No keyword matching, no resume inflation.', color:'#a78bfa', grad:'linear-gradient(135deg,#7c3aed,#4f46e5)', tags:['5-dimension score','Verified sources','Transparent AI'],
    icon:<svg style={{width:22,height:22}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg> },
  { num:'03', title:'Pipeline, ranked and ready', desc:'Every applicant arrives pre-sorted. Advance, pass or schedule — one click. Your team spends time on the right conversations.', color:'#34d399', grad:'linear-gradient(135deg,#10b981,#14b8a6)', tags:['Auto-sort','One-click actions','Team sync'],
    icon:<svg style={{width:22,height:22}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"/></svg> },
];

const PIPELINE_STATS = [
  { value:'< 48h', label:'Average time to shortlist',    color:'#22d3ee' },
  { value:'94%',   label:'Hiring manager satisfaction',  color:'#a78bfa' },
  { value:'3×',    label:'Faster than manual screening', color:'#34d399' },
  { value:'68%',   label:'Reduction in unconscious bias',color:'#fbbf24' },
];

function Pipeline() {
  const [hRef, hVis] = useInView(0.1);
  return (
    <section id="howitworks" style={{ position:'relative', padding:'100px 24px 80px' }}>
      <div style={{ position:'absolute', top:0, right:0, width:600, height:600, filter:'blur(120px)', borderRadius:'50%', background:'radial-gradient(ellipse,rgba(34,211,238,0.08),transparent)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:0, left:0, width:500, height:500, filter:'blur(110px)', borderRadius:'50%', background:'radial-gradient(ellipse,rgba(167,139,250,0.08),transparent)', pointerEvents:'none' }}/>
      <div style={{ maxWidth:1400, margin:'0 auto', position:'relative', zIndex:10 }}>
        <div ref={hRef} style={{ opacity:hVis?1:0, transform:hVis?'none':'translateY(24px)', transition:'opacity 0.65s ease,transform 0.65s ease', marginBottom:48, textAlign:'center' }}>
          <SectionLabel color="#a78bfa">How It Works</SectionLabel>
          <h2 style={{ fontSize:'clamp(2rem,4vw,3.5rem)', fontWeight:800, letterSpacing:'-0.02em', lineHeight:1.2, marginBottom:18, color:'#a78bfa', textAlign:'center', animation:'headingReveal 0.8s ease 0.4s both', wordBreak:'break-word' }}>
            Three steps.<br/>Zero noise.
          </h2>
          <p style={{ fontSize:17, maxWidth:'100%', lineHeight:1.7, color:'var(--text-secondary)', textAlign:'center' }}>
            SkillSphere turns a job brief into a ranked, interview-ready shortlist — automatically.
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16, marginBottom:16 }}>
          {STEPS.map((step,idx)=>{
            const [cRef,cVis]=useInView(0.12);
            return (
              <div key={step.num} ref={cRef} className="card-hover" style={{ position:'relative', borderRadius:20, padding:'28px 26px', display:'flex', flexDirection:'column', gap:18, background:'var(--card-bg)', border:'1px solid var(--border-card)', backdropFilter:'blur(16px)', overflow:'hidden', cursor:'default', opacity:cVis?1:0, transform:cVis?'none':'translateY(24px)', transition:`opacity .55s ease ${idx*0.13}s,transform .55s ease ${idx*0.13}s` }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:step.grad, borderRadius:'20px 20px 0 0' }}/>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ width:48, height:48, borderRadius:14, border:`1px solid ${step.color}28`, background:step.color+'10', display:'flex', alignItems:'center', justifyContent:'center', color:step.color }}>{step.icon}</div>
                  <span style={{ fontSize:44, fontWeight:900, color:step.color, opacity:0.09, lineHeight:1 }}>{step.num}</span>
                </div>
                <div>
                  <h3 style={{ fontSize:17, fontWeight:700, lineHeight:1.3, marginBottom:8, color:'var(--text-primary)' }}>{step.title}</h3>
                  <p style={{ fontSize:13.5, lineHeight:1.65, color:'var(--text-secondary)' }}>{step.desc}</p>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:'auto' }}>
                  {step.tags.map(t=>(
                    <span key={t} style={{ fontSize:10, fontWeight:600, padding:'3px 9px', borderRadius:6, color:step.color, background:step.color+'12', border:`1px solid ${step.color}25` }}>{t}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8, marginBottom:16, opacity:0.22, userSelect:'none' }}>
          {['DEFINE','SCORE','RANK'].map((l,i)=>(
            <React.Fragment key={l}>
              <span style={{ fontSize:9, fontWeight:900, letterSpacing:'0.16em', color:'var(--text-muted)' }}>{l}</span>
              {i<2&&<div style={{ width:44, height:1, background:'linear-gradient(to right,var(--text-muted),transparent)' }}/>}
            </React.Fragment>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
          {PIPELINE_STATS.map((s,i)=>{
            const [sRef,sVis]=useInView(0.25);
            const num=parseFloat(s.value), suf=s.value.replace(/[\d.]/g,'');
            const cnt=useCountUp(num||0,sVis);
            const disp=isNaN(num)?s.value:(cnt+suf);
            return (
              <div key={s.label} ref={sRef} style={{ position:'relative', borderRadius:16, padding:'22px 20px', display:'flex', flexDirection:'column', gap:6, background:'var(--card-bg)', border:'1px solid var(--border-card)', overflow:'hidden', opacity:sVis?1:0, transform:sVis?'none':'translateY(18px)', transition:`opacity .5s ease ${i*0.1}s,transform .5s ease ${i*0.1}s` }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:2, borderRadius:'16px 16px 0 0', background:`linear-gradient(to right,${s.color},transparent)` }}/>
                <span style={{ fontSize:'clamp(1.6rem,2.5vw,2.1rem)', fontWeight:900, color:s.color, animation:sVis?`counterIn 0.4s ease ${i*0.1}s both`:'none' }}>{disp}</span>
                <span style={{ fontSize:12.5, lineHeight:1.4, color:'var(--text-secondary)' }}>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   AI SCORING
═══════════════════════════════════════════════════════ */
const SCORE_DIMS = [
  { label:'Technical Skills',    color:'#22d3ee', pct:88, desc:'Code commits, test coverage, architecture decisions — all from real outputs.', src:'GitHub · LeetCode · Take-home assessment' },
  { label:'Career Trajectory',   color:'#34d399', pct:76, desc:'Growth rate, scope increase and promotion velocity across roles.',              src:'Role history · LinkedIn · Self-reported' },
  { label:'Culture Alignment',   color:'#a78bfa', pct:82, desc:'Values, working style and team preferences mapped to your org profile.',        src:'Survey · Peer endorsements · Work-style quiz' },
  { label:'Role Fit',            color:'#f472b6', pct:91, desc:'Direct overlap between candidate strengths and your Role DNA blueprint.',        src:'Skill overlap · Industry match · Tool stack' },
  { label:'Interview Likelihood',color:'#fbbf24', pct:74, desc:'Predicted engagement based on signal strength and match quality.',               src:'Response signals · Match score · Engagement' },
];

function RadarCanvas() {
  const ref=useRef(null), rafRef=useRef();
  const SCORES=[.88,.76,.82,.91,.74];
  useEffect(()=>{
    const c=ref.current, ctx=c.getContext('2d');
    const SIZE=600; c.width=SIZE; c.height=SIZE;
    const cx=SIZE/2, cy=SIZE/2, R=SIZE*.35, N=SCORES.length;
    let t=0;
    function draw(){
      const isDark=document.documentElement.getAttribute('data-theme')!=='light';
      ctx.clearRect(0,0,SIZE,SIZE); 
      t+=.009;
      const angles=SCORES.map((_,i)=>(i/N)*Math.PI*2-Math.PI/2);
      const pulse=.035*Math.sin(t);
      const rotation=t*0.15; // Slow rotation animation
      
      // Save context state for rotation
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.translate(-cx, -cy);
      
      // Draw concentric rings with enhanced glow
      [.25,.5,.75,1].forEach(f=>{
        ctx.beginPath();
        angles.forEach((a,i)=>{const x=cx+f*R*Math.cos(a),y=cy+f*R*Math.sin(a);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});
        ctx.closePath();
        ctx.strokeStyle=isDark?`rgba(255,255,255,${f===1?.08:.045})`:`rgba(15,23,42,${f===1?.14:.065})`;
        ctx.lineWidth=1.2;ctx.stroke();
      });
      
      // Draw radii
      angles.forEach(a=>{
        ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+R*Math.cos(a),cy+R*Math.sin(a));
        ctx.strokeStyle=isDark?'rgba(255,255,255,0.06)':'rgba(15,23,42,0.1)';ctx.lineWidth=1;ctx.stroke();
      });
      
      // Draw filled pentagon with enhanced glow
      ctx.beginPath();
      SCORES.forEach((s,i)=>{const sc=s+pulse;const x=cx+sc*R*Math.cos(angles[i]),y=cy+sc*R*Math.sin(angles[i]);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});
      ctx.closePath();
      const fill=ctx.createRadialGradient(cx,cy,0,cx,cy,R);
      fill.addColorStop(0,'rgba(6,182,212,0.28)');fill.addColorStop(1,'rgba(99,102,241,0.09)');
      ctx.fillStyle=fill;ctx.fill();
      
      // Enhanced glow effect with animation
      const glowIntensity = 0.5 + 0.3*Math.sin(t*1.5);
      ctx.strokeStyle=`rgba(34,211,238,${0.5 + glowIntensity*0.3})`;
      ctx.lineWidth=2.5;
      ctx.shadowColor=`rgba(34,211,238,${0.6 + glowIntensity*0.4})`;
      ctx.shadowBlur=16 + glowIntensity*8;
      ctx.stroke();
      ctx.shadowBlur=0;
      
      // Draw data points with enhanced glow
      const cols=['#22d3ee','#34d399','#a78bfa','#f472b6','#fbbf24'];
      SCORES.forEach((s,i)=>{
        const sc=s+pulse, x=cx+sc*R*Math.cos(angles[i]), y=cy+sc*R*Math.sin(angles[i]);
        
        // Larger outer glow
        const g=ctx.createRadialGradient(x,y,0,x,y,20);
        g.addColorStop(0,cols[i]+'70');g.addColorStop(1,cols[i]+'00');
        ctx.beginPath();ctx.arc(x,y,20,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
        
        // Main point
        ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fillStyle=cols[i];ctx.fill();
        
        // Inner highlight
        ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fillStyle='white';ctx.fill();
      });
      
      ctx.restore();
      
      // Labels (not rotated)
      const labs=['Technical','Trajectory','Culture','Role Fit','Interview'];
      labs.forEach((l,i)=>{
        const x=cx+(R+50)*Math.cos(angles[i]),y=cy+(R+50)*Math.sin(angles[i]);
        ctx.font=`700 12px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillStyle=isDark?'rgba(255,255,255,0.65)':'rgba(15,23,42,0.75)';
        ctx.fillText(l,x,y);
      });
      
      rafRef.current=requestAnimationFrame(draw);
    }
    draw();
    return ()=>cancelAnimationFrame(rafRef.current);
  },[]);
  return <canvas ref={ref} style={{ width:380, height:380, flexShrink:0, filter:'drop-shadow(0 20px 40px rgba(34,211,238,0.15))' }}/>;
}

function AIScoring() {
  const [hRef,hVis]=useInView(0.1);
  const [active,setActive]=useState(0);
  return (
    <section id="aiscoring" style={{ position:'relative', padding:'100px 24px 80px' }}>
      <div style={{ position:'absolute', top:'30%', left:'50%', transform:'translateX(-50%)', width:700, height:700, filter:'blur(140px)', borderRadius:'50%', background:'radial-gradient(ellipse,rgba(129,140,248,0.08),rgba(6,182,212,0.06),transparent)', pointerEvents:'none' }}/>
      <div style={{ maxWidth:1400, margin:'0 auto', position:'relative', zIndex:10 }}>
        <div ref={hRef} style={{ opacity:hVis?1:0, transform:hVis?'none':'translateY(24px)', transition:'opacity 0.65s ease,transform 0.65s ease', marginBottom:48, textAlign:'center' }}>
          <SectionLabel color="#a78bfa">AI Scoring</SectionLabel>
          <h2 style={{ fontSize:'clamp(2rem,4vw,3.5rem)', fontWeight:800, letterSpacing:'-0.02em', lineHeight:1.2, marginBottom:18, color:'#34d399', textAlign:'center', animation:'headingReveal 0.8s ease 0.4s both', wordBreak:'break-word' }}>
            Five dimensions.<br/>One honest score.
          </h2>
          <p style={{ fontSize:17, maxWidth:'100%', lineHeight:1.7, color:'var(--text-secondary)', textAlign:'center' }}>
            No black boxes. Every sub-score links back to a real, verifiable source — so your team always knows why.
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:20, alignItems:'center' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {SCORE_DIMS.map((d,i)=>{
              const [dr,dv]=useInView(0.1);
              const isActive = active===i;
              return (
                <div key={d.label} ref={dr} onClick={()=>setActive(i)} style={{ position:'relative', borderRadius:16, padding:'18px 20px', background: isActive ? 'var(--card-bg)' : 'transparent', border:`1px solid ${isActive ? d.color+'40' : 'var(--border-card)'}`, cursor:'pointer', opacity:dv?1:0, transform:dv?'none':'translateY(14px)', transition:`opacity .5s ease ${i*0.07}s,transform .5s ease ${i*0.07}s,border-color 0.2s,background 0.2s` }}>
                  {isActive && <div style={{ position:'absolute', top:0, left:0, right:0, height:2, borderRadius:'16px 16px 0 0', background:`linear-gradient(to right,${d.color},transparent)` }}/>}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: isActive ? 10 : 0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:d.color, flexShrink:0, boxShadow: isActive ? `0 0 8px ${d.color}` : 'none', transition:'box-shadow 0.2s' }}/>
                      <span style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>{d.label}</span>
                    </div>
                    <span style={{ fontSize:15, fontWeight:900, color:d.color }}>{d.pct}%</span>
                  </div>
                  {isActive && (
                    <div style={{ paddingLeft:18 }}>
                      <p style={{ fontSize:13, lineHeight:1.65, color:'var(--text-secondary)', marginBottom:7 }}>{d.desc}</p>
                      <p style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', letterSpacing:'0.04em' }}>Source: {d.src}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Radar — larger, centred */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'32px 0' }}>
            <div style={{ position:'relative' }}>
              <div style={{ position:'absolute', inset:'-20%', filter:'blur(48px)', borderRadius:'50%', background:'radial-gradient(ellipse,rgba(34,211,238,0.12),rgba(167,139,250,0.08),transparent)', pointerEvents:'none' }}/>
              <RadarCanvas/>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   FEATURES
═══════════════════════════════════════════════════════ */
const FEATURES = [
  { title:'Role DNA builder', desc:'Define the exact skills, culture signals and deal-breakers for every role — your blueprint drives all downstream scoring.', color:'#22d3ee',
    icon:<svg style={{width:20,height:20}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
  { title:'Verified skill signals', desc:'Pull real evidence from GitHub, LeetCode, portfolios and assessments — no resume inflation, no keyword gaming.', color:'#a78bfa',
    icon:<svg style={{width:20,height:20}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg> },
  { title:'Auto-ranked pipeline', desc:'Every applicant arrives sorted. One-click advance, pass or schedule — your team focuses on decisions, not admin.', color:'#34d399',
    icon:<svg style={{width:20,height:20}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> },
  { title:'Collaborative review', desc:'Share candidate profiles, add notes and align with your team — all in one place, with audit trails for every decision.', color:'#f472b6',
    icon:<svg style={{width:20,height:20}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg> },
  { title:'Bias-reduction guardrails', desc:'Signal-based scoring removes demographic proxies. Redacted views and audit modes keep teams accountable.', color:'#fbbf24',
    icon:<svg style={{width:20,height:20}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/></svg> },
  { title:'Explainable AI', desc:'Every score shows its reasoning. Confidence levels are always displayed. No black boxes in your hiring decisions.', color:'#06b6d4',
    icon:<svg style={{width:20,height:20}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg> },
];

function Features() {
  const [hRef,hVis]=useInView(0.1);
  return (
    <section id="features" style={{ position:'relative', padding:'100px 24px 80px' }}>
      <div style={{ position:'absolute', bottom:0, right:0, width:500, height:500, filter:'blur(110px)', borderRadius:'50%', background:'radial-gradient(ellipse,rgba(244,114,182,0.08),transparent)', pointerEvents:'none' }}/>
      <div style={{ maxWidth:1400, margin:'0 auto', position:'relative', zIndex:10 }}>
        <div ref={hRef} style={{ opacity:hVis?1:0, transform:hVis?'none':'translateY(24px)', transition:'opacity 0.65s ease,transform 0.65s ease', marginBottom:48, textAlign:'center' }}>
          <SectionLabel color="#f472b6">Features</SectionLabel>
          <h2 style={{ fontSize:'clamp(2rem,4vw,3.5rem)', fontWeight:800, letterSpacing:'-0.02em', lineHeight:1.2, marginBottom:18, color:'#f472b6', textAlign:'center', animation:'headingReveal 0.8s ease 0.4s both', wordBreak:'break-word' }}>
            Everything your team needs.
          </h2>
          <p style={{ fontSize:17, maxWidth:'100%', lineHeight:1.7, color:'var(--text-secondary)', textAlign:'center' }}>
            Built for speed without sacrificing signal quality or fairness.
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:14 }}>
          {FEATURES.map((f,i)=>{
            const [fr,fv]=useInView(0.1);
            return (
              <div key={f.title} ref={fr} className="card-hover" style={{ borderRadius:18, padding:'24px 22px', display:'flex', flexDirection:'column', gap:14, background:'var(--card-bg)', border:'1px solid var(--border-card)', backdropFilter:'blur(12px)', cursor:'default', opacity:fv?1:0, transform:fv?'none':'translateY(20px)', transition:`opacity .5s ease ${i*0.08}s,transform .5s ease ${i*0.08}s` }}>
                <div style={{ width:44, height:44, borderRadius:13, border:`1px solid ${f.color}28`, background:f.color+'10', display:'flex', alignItems:'center', justifyContent:'center', color:f.color }}>{f.icon}</div>
                <div>
                  <h3 style={{ fontSize:15, fontWeight:700, marginBottom:7, color:'var(--text-primary)' }}>{f.title}</h3>
                  <p style={{ fontSize:13, lineHeight:1.65, color:'var(--text-secondary)' }}>{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   WHY US
═══════════════════════════════════════════════════════ */
const STATS = [
  { num:94, suffix:'%', label:'Match accuracy',      sub:'At 90-day review',         color:'#22d3ee' },
  { num:3,  suffix:'×', label:'Faster to shortlist', sub:'vs manual screening',      color:'#a78bfa' },
  { num:68, suffix:'%', label:'Bias reduction',      sub:'Signal-based scoring',     color:'#34d399' },
  { num:12, suffix:'h', label:'Saved per open role', sub:'Hours reclaimed per hire', color:'#fbbf24' },
];
const PILLARS = [
  { title:'Signal-based, not resume-based', desc:'Every dimension traces back to a real output — a repo, a test score, a shipped project. We never guess without labelling it.', color:'#22d3ee',
    icon:<svg style={{width:20,height:20}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg> },
  { title:'Built for velocity', desc:'Auto-sort on arrival, one-click shortlisting, integrated scheduling. Hiring moves as fast as your team can decide.', color:'#fbbf24',
    icon:<svg style={{width:20,height:20}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> },
  { title:'Radically transparent AI', desc:'AI estimates are clearly labeled. Confidence levels are always shown. You always know what the system knows vs. what it inferred.', color:'#a78bfa',
    icon:<svg style={{width:20,height:20}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg> },
];

function Candidates() {
  const [hRef,hVis]=useInView(0.1);
  return (
    <section id="whyus" style={{ position:'relative', padding:'100px 24px 80px' }}>
      <div style={{ position:'absolute', bottom:0, left:0, width:500, height:500, filter:'blur(120px)', borderRadius:'50%', background:'radial-gradient(ellipse,rgba(34,211,238,0.07),transparent)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', top:0, right:0, width:480, height:480, filter:'blur(110px)', borderRadius:'50%', background:'radial-gradient(ellipse,rgba(167,139,250,0.07),transparent)', pointerEvents:'none' }}/>
      <div style={{ maxWidth:1400, margin:'0 auto', position:'relative', zIndex:10 }}>
        <div ref={hRef} style={{ opacity:hVis?1:0, transform:hVis?'none':'translateY(24px)', transition:'opacity 0.65s ease,transform 0.65s ease', marginBottom:48, textAlign:'center' }}>
          <SectionLabel color="#22d3ee">Why SkillSphere</SectionLabel>
          <h2 style={{ fontSize:'clamp(2rem,4vw,3.5rem)', fontWeight:800, letterSpacing:'-0.02em', lineHeight:1.2, marginBottom:18, color:'#fbbf24', textAlign:'center', animation:'headingReveal 0.8s ease 0.4s both', wordBreak:'break-word' }}>
            Numbers that tell the story.
          </h2>
          <p style={{ fontSize:17, maxWidth:'100%', lineHeight:1.7, color:'var(--text-secondary)', textAlign:'center' }}>
            Talent teams that switch to SkillSphere close roles faster, with fewer regrets and more confidence.
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:14, marginBottom:14 }}>
          {STATS.map((s,i)=>{
            const [sr,sv]=useInView(0.2);
            const n=useCountUp(s.num,sv);
            return (
              <div key={s.label} ref={sr} style={{ position:'relative', borderRadius:18, padding:'26px 22px', display:'flex', flexDirection:'column', gap:6, background:'var(--card-bg)', border:'1px solid var(--border-card)', overflow:'hidden', opacity:sv?1:0, transform:sv?'none':'translateY(18px)', transition:`opacity .5s ease ${i*0.1}s,transform .5s ease ${i*0.1}s` }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:2, borderRadius:'18px 18px 0 0', background:`linear-gradient(to right,${s.color},transparent)` }}/>
                <span style={{ fontSize:'clamp(2rem,3vw,2.6rem)', fontWeight:900, color:s.color, fontVariantNumeric:'tabular-nums' }}>{n}{s.suffix}</span>
                <span style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>{s.label}</span>
                <span style={{ fontSize:12, color:'var(--text-muted)' }}>{s.sub}</span>
              </div>
            );
          })}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))', gap:14 }}>
          {PILLARS.map((p,i)=>{
            const [pr,pv]=useInView(0.1);
            return (
              <div key={p.title} ref={pr} className="card-hover" style={{ position:'relative', borderRadius:18, padding:'26px 22px', display:'flex', flexDirection:'column', gap:14, background:'var(--card-bg)', border:'1px solid var(--border-card)', opacity:pv?1:0, transform:pv?'none':'translateY(20px)', transition:`opacity .55s ease ${i*0.12}s,transform .55s ease ${i*0.12}s` }}>
                <div style={{ width:44, height:44, borderRadius:13, border:`1px solid ${p.color}28`, background:p.color+'10', display:'flex', alignItems:'center', justifyContent:'center', color:p.color }}>{p.icon}</div>
                <h3 style={{ fontSize:15, fontWeight:700, lineHeight:1.3, color:'var(--text-primary)' }}>{p.title}</h3>
                <p style={{ fontSize:13, lineHeight:1.65, color:'var(--text-secondary)' }}>{p.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   CTA
═══════════════════════════════════════════════════════ */
function CTA() {
  const [ref, vis] = useInView(0.2);
  return (
    <section style={{ position:'relative', padding:'100px 24px 120px' }}>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
        <div style={{ width:900, height:900, filter:'blur(140px)', borderRadius:'50%', background:'radial-gradient(ellipse,rgba(6,182,212,0.13) 0%,rgba(124,58,237,0.11) 40%,transparent 70%)', animation:'morphBlob 18s ease-in-out infinite' }}/>
      </div>
      <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:288, height:1, background:'linear-gradient(to right,transparent,rgba(34,211,238,0.4),transparent)' }}/>

      <div ref={ref} style={{ maxWidth:860, margin:'0 auto', textAlign:'center', position:'relative', zIndex:10, opacity:vis?1:0, transform:vis?'translateY(0)':'translateY(32px)', transition:'opacity 0.7s ease,transform 0.7s ease' }}>
        <SectionLabel color="#34d399">Get Started</SectionLabel>
        <h2 style={{ fontSize:'clamp(2.6rem,6vw,5.2rem)', fontWeight:800, letterSpacing:'-0.03em', lineHeight:1.04, marginBottom:22, color:'var(--text-primary)' }}>
          Ready to hire on<br/><span className="gradient-text">real ability?</span>
        </h2>
        <p style={{ fontSize:'clamp(15px,2vw,18px)', lineHeight:1.75, marginBottom:40, maxWidth:500, margin:'0 auto 40px', color:'var(--text-secondary)' }}>
          Join talent teams using SkillSphere to hire faster, fairer and with more confidence at every stage.
        </p>
        <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:14, marginBottom:26 }}>
          <Link 
  to="/get-started"
  className="btn-sweep btn-primary"
  style={{ 
    position:'relative',
    overflow:'hidden',
    color:'white',
    padding:'18px 40px',
    borderRadius:14,
    fontWeight:700,
    fontSize:16,
    display:'flex',
    alignItems:'center',
    gap:8,
    border:'none',
    cursor:'pointer',
    background:'linear-gradient(135deg,#06b6d4,#7c3aed)',
    boxShadow:'0 0 48px rgba(6,182,212,0.4)',
    transition:'transform 0.2s,box-shadow 0.2s'
  }}
  onMouseEnter={e=>{
    e.currentTarget.style.transform='translateY(-2px)';
    e.currentTarget.style.boxShadow='0 8px 56px rgba(6,182,212,0.55)';
  }}
  onMouseLeave={e=>{
    e.currentTarget.style.transform='none';
    e.currentTarget.style.boxShadow='0 0 48px rgba(6,182,212,0.4)';
  }}
>
  <div className="btn-primary-overlay"/>
  <span style={{ position:'relative', zIndex:1 }}>Start for free</span>
  <svg style={{ position:'relative', zIndex:1 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
</Link>
        </div>
        <p style={{ fontSize:12, letterSpacing:'0.04em', color:'var(--text-muted)' }}>No credit card · 5-min setup · Cancel anytime</p>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════════════ */
const FOOTER_COLS = [
  { title:'Platform', links:['How It Works','AI Scoring','Features','Pricing'] },
  { title:'For Companies', links:['Post a job','Discover talent','Hiring solutions','Enterprise'] },
  { title:'Resources', links:['Blog','Help center','API docs','Changelog'] },
];

function Footer() {
  return (
    <footer style={{ position:'relative', zIndex:2, borderTop:'1px solid var(--divider)', paddingTop:60, paddingBottom:40, paddingLeft:24, paddingRight:24, background:'var(--footer-bg)' }}>
      <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:256, height:1, background:'linear-gradient(to right,transparent,rgba(6,182,212,0.2),transparent)' }}/>
      <div style={{ maxWidth:1400, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:36, marginBottom:52 }}>
        <div style={{ gridColumn:'span 1', display:'flex', flexDirection:'column', gap:18 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Logo size={30}/>
            <span style={{ fontSize:15, fontWeight:800, letterSpacing:'-0.02em', color:'var(--text-primary)' }}>
              Skill<span className="gradient-text">Sphere</span>
            </span>
          </div>
          <p style={{ fontSize:13, lineHeight:1.7, maxWidth:220, color:'var(--text-muted)' }}>
            Hire on proven ability. AI-powered career intelligence for the next generation of talent teams.
          </p>
          <div style={{ display:'flex', gap:10 }}>
            {['twitter','linkedin','github'].map(s=>(
              <a key={s} href="#" style={{ width:32, height:32, borderRadius:8, border:'1px solid var(--border-card)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', textDecoration:'none', transition:'all 0.2s' }}
                onMouseEnter={e=>{e.currentTarget.style.color='var(--text-primary)';e.currentTarget.style.borderColor='var(--text-muted)'}}
                onMouseLeave={e=>{e.currentTarget.style.color='var(--text-muted)';e.currentTarget.style.borderColor='var(--border-card)'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  {s==='twitter'&&<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>}
                  {s==='linkedin'&&<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>}
                  {s==='github'&&<path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>}
                </svg>
              </a>
            ))}
          </div>
        </div>

        {FOOTER_COLS.map(col=>(
          <div key={col.title} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <h4 style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-secondary)' }}>{col.title}</h4>
            <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:10 }}>
              {col.links.map(link=>(
                <li key={link}>
                  <a href="#" style={{ fontSize:13, color:'var(--text-muted)', textDecoration:'none', transition:'color 0.2s' }}
                    onMouseEnter={e=>e.currentTarget.style.color='var(--text-secondary)'}
                    onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>{link}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ maxWidth:1400, margin:'0 auto', paddingTop:26, display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'center', gap:16, borderTop:'1px solid var(--divider)' }}>
        <p style={{ fontSize:13, color:'var(--text-muted)' }}>© 2026 SkillSphere. All rights reserved.</p>
        <div style={{ display:'flex', gap:20 }}>
          {['Privacy','Terms','Security'].map(l=>(
            <a key={l} href="#" style={{ fontSize:12, color:'var(--text-muted)', textDecoration:'none', transition:'color 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.color='var(--text-secondary)'}
              onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>{l}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}

function SectionDivider() {
  return <div style={{ width:'100%', height:1, background:'linear-gradient(to right,transparent,var(--divider),transparent)', maxWidth:1400, margin:'0 auto' }}/>;
}

/* ═══════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════ */
export default function HomePage() {
  const [isDark, setIsDark] = useState(true);
  
  useEffect(() => {
    // Listen to system preference changes
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const apply = (e) => {
      const dark = !e.matches;
      setIsDark(dark);
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    };
    apply(mq);
    mq.addEventListener('change', apply);
    
    // Listen to data-theme attribute changes (from navbar toggle)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          const theme = document.documentElement.getAttribute('data-theme');
          setIsDark(theme === 'dark');
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    
    return () => {
      mq.removeEventListener('change', apply);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <GlobalStyles/>
      <div style={{ background:'var(--bg-page)', minHeight:'100vh', position:'relative' }}>
        <div className="page-canvas-container">
          {isDark ? <BackgroundCanvas/> : <LightModeBackground/>}
          <CursorGlow/>
        </div>
        <Navbar/>
        <main style={{ position:'relative', zIndex:2 }}>
          <Hero/>
          <UseCases/>
          <Pipeline/>
          <SectionDivider/>
          <AIScoring/>
          <SectionDivider/>
          <Features/>
          <SectionDivider/>
          <Candidates/>
          <CTA/>
        </main>
        <Footer/>
      </div>
    </>
  );
}