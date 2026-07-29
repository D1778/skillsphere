import { useState, useEffect, useRef, useMemo, useCallback } from "react";

const rand = (a, b) => Math.random() * (b - a) + a;

/**
 * Types `text` out character by character with a blinking cursor.
 * Warmer than a decrypt/scramble effect — fits a hiring platform's tone
 * (writing your career story) better than a security-cipher reveal.
 */
function Typewriter({ text, run, speed = 55, onDone }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!run) return;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setCount(i);
      if (i >= text.length) { clearInterval(iv); onDone?.(); }
    }, speed);
    return () => clearInterval(iv);
  }, [run, text, speed]); // eslint-disable-line react-hooks/exhaustive-deps
  return <>{text.slice(0, count)}</>;
}

const STATUS_STEPS = [
  "Analyzing your profile",
  "Matching skills to roles",
  "Preparing recommendations",
  "Finalizing your dashboard",
];

const RADAR_BLIPS = [
  { angle: 35,  radius: 0.85, pct: 94 },
  { angle: 140, radius: 0.55, pct: 88 },
  { angle: 210, radius: 0.75, pct: 91 },
  { angle: 300, radius: 0.4,  pct: 96 },
  { angle: 15,  radius: 0.6,  pct: 90 },
];

/**
 * Full-screen branded loading state built around what SkillSphere actually
 * does — matching people to opportunities — rather than a generic spinner.
 * Drop in for initial auth resolution, a first dashboard load, or any
 * moment that needs a real "loading" beat.
 *
 * Theme-aware through the app's existing CSS custom properties
 * (--bg-page, --text-primary, --text-secondary, --text-muted,
 * --border-card, --card-inner-bg) — no ThemeContext import required.
 * The accent hues (cyan/indigo/violet) are the same fixed palette used
 * in the OTP email and throughout the dashboard, so it reads as "on
 * brand" regardless of which theme --bg-page currently resolves to.
 */
export default function LoadingScreen({ isLoading, onLoadingComplete, doneLabel = "You're all set" }) {
  // Controlled mode: caller passes `isLoading` (real auth/data state) and this
  // screen tracks it — climbs toward a ceiling while true, finishes the moment
  // it goes false. Uncontrolled/demo mode (isLoading omitted): falls back to
  // the original fixed ~5.3s scripted timeline.
  const isControlled = typeof isLoading === "boolean";

  const [pct, setPct]           = useState(0);
  const [done, setDone]         = useState(false);
  const [wordDone, setWordDone] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);
  const [mouse, setMouse]       = useState({ x: 0.5, y: 0.5 });
  // Minimum time the screen stays up before it's allowed to finish, so a
  // near-instant auth resolution doesn't just flash the screen on/off.
  const [minTimeElapsed, setMinTimeElapsed] = useState(!isControlled);

  const nodes = useMemo(() => [...Array(20)].map((_, i) => ({
    id: i, x: rand(4, 96), y: rand(4, 96), size: rand(1.4, 2.8),
    delay: rand(0, 4), dur: rand(3, 6),
  })), []);

  const links = useMemo(() => {
    const out = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 17) out.push({ id: `${i}-${j}`, x1: nodes[i].x, y1: nodes[i].y, x2: nodes[j].x, y2: nodes[j].y, o: Math.max(0.03, 0.16 - dist / 140) });
      }
    }
    return out;
  }, [nodes]);

  const onMouseMove = useCallback((e) => {
    setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
  }, []);
  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [onMouseMove]);

  // Status line always cycles for as long as the screen is up (both modes).
  useEffect(() => {
    const statusIv = setInterval(() => setStatusIdx(i => (i + 1) % STATUS_STEPS.length), 1150);
    return () => clearInterval(statusIv);
  }, []);

  // Uncontrolled/demo fallback: original fixed scripted timeline.
  useEffect(() => {
    if (isControlled) return;
    const pctIv  = setInterval(() => setPct(p => { if (p >= 100) { clearInterval(pctIv); return 100; } return p + 1; }), 42);
    const doneTo = setTimeout(() => setDone(true), 4500);
    const endTo  = setTimeout(() => onLoadingComplete?.(), 5300);
    return () => { clearInterval(pctIv); clearTimeout(doneTo); clearTimeout(endTo); };
  }, [isControlled, onLoadingComplete]);

  // Controlled/real mode: enforce a minimum visible time so a fast auth
  // resolution doesn't just flash the screen.
  useEffect(() => {
    if (!isControlled) return;
    const t = setTimeout(() => setMinTimeElapsed(true), 900);
    return () => clearTimeout(t);
  }, [isControlled]);

  // Controlled/real mode: climb toward a ceiling while still loading; once
  // real loading is done AND the minimum time has elapsed, snap to 100 and
  // flip to the done state. Exit (unmount) is signalled via onLoadingComplete
  // only after the done beat + exit animation have had time to play.
  useEffect(() => {
    if (!isControlled) return;

    if (!isLoading && minTimeElapsed) {
      let raf;
      const finish = () => {
        setPct(p => {
          const next = Math.min(100, p + 6);
          if (next < 100) raf = requestAnimationFrame(finish);
          return next;
        });
      };
      finish();
      setDone(true);
      const endTo = setTimeout(() => onLoadingComplete?.(), 1000);
      return () => { cancelAnimationFrame(raf); clearTimeout(endTo); };
    }

    // Still loading (or below minimum time) — climb toward 92%, never lock.
    const ceiling = 92;
    const iv = setInterval(() => {
      setPct(p => {
        if (p >= ceiling) return p;
        const remaining = ceiling - p;
        const step = Math.max(0.25, remaining * 0.045);
        return Math.min(ceiling, p + step);
      });
    }, 42);
    return () => clearInterval(iv);
  }, [isControlled, isLoading, minTimeElapsed, onLoadingComplete]);

  const px = (depth) => `${(mouse.x - 0.5) * depth * -22}px`;
  const py = (depth) => `${(mouse.y - 0.5) * depth * -22}px`;
  const sweepDur = 3.1;

  return (
    <div className={`sk-root${done ? " sk-root--done" : ""}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        .sk-root{
          position:fixed;inset:0;background:var(--bg-page);
          display:flex;align-items:center;justify-content:center;overflow:hidden;
          font-family:'Outfit','Helvetica Neue',sans-serif;z-index:9999;
        }
        .sk-root--done{animation:skOut .65s .35s cubic-bezier(.7,0,1,1) both}
        @keyframes skOut{to{opacity:0;transform:scale(1.03);filter:blur(10px)}}

        .sk-wash{position:absolute;inset:0;pointer-events:none;background:
          radial-gradient(ellipse 65% 55% at 18% 15%, rgba(34,211,238,.13) 0%, transparent 60%),
          radial-gradient(ellipse 60% 55% at 85% 85%, rgba(192,132,252,.11) 0%, transparent 60%),
          radial-gradient(ellipse 45% 40% at 60% 100%, rgba(129,140,248,.08) 0%, transparent 55%);
        }
        .sk-noise{position:absolute;inset:0;pointer-events:none;opacity:.3;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.05'/%3E%3C/svg%3E");
          background-size:180px;
        }

        .sk-net{position:absolute;inset:0;pointer-events:none;transition:transform .15s linear ease-out}
        .sk-net-node{fill:#22d3ee;animation:skNodePulse var(--dur) ease-in-out var(--del) infinite}
        @keyframes skNodePulse{0%,100%{opacity:.25}50%{opacity:.75}}
        .sk-net-link{stroke:#818cf8;stroke-width:.15}

        .sk-center{position:relative;z-index:5;display:flex;flex-direction:column;align-items:center;width:min(90vw,460px);gap:clamp(1rem,3vh,1.9rem)}

        /* ── Radar mark ── */
        .sk-radar{position:relative;width:clamp(96px,18vw,132px);height:clamp(96px,18vw,132px);animation:skRadarIn .7s cubic-bezier(.22,1,.36,1) both}
        @keyframes skRadarIn{from{opacity:0;transform:scale(.6)}}
        .sk-rglow{position:absolute;inset:-25%;border-radius:50%;background:radial-gradient(circle,rgba(34,211,238,.28),transparent 68%);animation:skGlow 2.6s ease-in-out infinite alternate}
        @keyframes skGlow{from{opacity:.45;transform:scale(.9)}to{opacity:1;transform:scale(1.08)}}
        .sk-rring{position:absolute;border-radius:50%;border:1px solid rgba(34,211,238,.22)}
        .sk-rdisc{position:absolute;inset:0;border-radius:50%;overflow:hidden;border:1px solid rgba(34,211,238,.3);background:var(--card-inner-bg)}
        .sk-rsweep{position:absolute;inset:0;border-radius:50%;
          background:conic-gradient(from 0deg, transparent 0deg, rgba(34,211,238,.4) 22deg, transparent 55deg);
          animation:skSweep ${sweepDur}s linear infinite;
        }
        @keyframes skSweep{to{transform:rotate(360deg)}}
        .sk-blip{position:absolute;width:6px;height:6px;border-radius:50%;background:#22d3ee;box-shadow:0 0 8px #22d3ee;
          animation:skBlip ${sweepDur}s linear infinite;transform:translate(-50%,-50%)
        }
        @keyframes skBlip{0%,88%,100%{opacity:0;transform:translate(-50%,-50%) scale(.4)}92%{opacity:1;transform:translate(-50%,-50%) scale(1.5)}96%{opacity:.5;transform:translate(-50%,-50%) scale(1)}}
        .sk-blip-pct{position:absolute;bottom:100%;left:50%;transform:translateX(-50%);margin-bottom:5px;
          font-family:'JetBrains Mono',monospace;font-size:.5rem;font-weight:600;color:#22d3ee;white-space:nowrap;
          opacity:0;animation:skBlipPct ${sweepDur}s linear infinite;text-shadow:0 0 6px rgba(34,211,238,.6)
        }
        @keyframes skBlipPct{0%,88%,100%{opacity:0}92%,96%{opacity:1}}
        .sk-rcenter{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:3}
        .sk-rcenter-glow{position:absolute;width:34%;height:34%;border-radius:50%;background:radial-gradient(circle,rgba(34,211,238,.5),transparent 70%);animation:skGlow 2.2s ease-in-out infinite alternate}
        .sk-rcenter svg{width:30%;height:30%;position:relative;z-index:1;stroke:#22d3ee;stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 6px rgba(34,211,238,.7))}
        .sk-rcenter.sk-rcenter--done svg{stroke:#5eead4;filter:drop-shadow(0 0 10px #5eead4);animation:skCheckIn .55s cubic-bezier(.34,1.56,.64,1) both}
        @keyframes skCheckIn{from{opacity:0;transform:scale(0)}}

        /* ── Wordmark ── */
        .sk-wmark{display:flex;flex-direction:column;align-items:center;animation:skFadeUp .7s .2s ease both}
        @keyframes skFadeUp{from{opacity:0;transform:translateY(12px)}}
        .sk-wname{
          font-size:clamp(1.7rem,6vw,2.7rem);font-weight:800;letter-spacing:-.03em;line-height:1;
          background:linear-gradient(120deg,var(--text-primary) 0%,#22d3ee 45%,#818cf8 100%);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
          min-height:1.2em;
        }
        .sk-cursor{display:inline-block;width:2px;height:.8em;background:#22d3ee;margin-left:2px;vertical-align:-.05em;animation:skBlink .9s step-end infinite}
        @keyframes skBlink{0%,49%{opacity:1}50%,100%{opacity:0}}
        .sk-wsub{font-family:'JetBrains Mono',monospace;font-size:clamp(.52rem,1.3vw,.64rem);letter-spacing:.28em;text-transform:uppercase;color:var(--text-muted);margin-top:.6em;opacity:0;animation:skFadeIn .5s .9s ease forwards}
        @keyframes skFadeIn{to{opacity:1}}

        /* ── Progress ── */
        .sk-prog{width:100%;display:flex;flex-direction:column;gap:.5rem;animation:skFadeUp .7s .4s ease both}
        .sk-pmeta{display:flex;align-items:baseline;justify-content:space-between}
        .sk-pcount{font-family:'JetBrains Mono',monospace;font-size:clamp(.6rem,1.5vw,.72rem);color:var(--text-secondary);letter-spacing:.02em}
        .sk-pcount b{color:#22d3ee;font-weight:700}
        .sk-ppct{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:clamp(.75rem,2vw,.95rem);color:#22d3ee}
        .sk-ptrack{width:100%;height:3px;border-radius:99px;background:var(--border-card);overflow:hidden}
        .sk-pfill{height:100%;border-radius:99px;background:linear-gradient(90deg,#22d3ee,#818cf8,#c084fc);transition:width .35s ease;box-shadow:0 0 10px rgba(34,211,238,.5)}

        /* ── Bottom row ── */
        .sk-bottom{display:flex;align-items:center;justify-content:space-between;width:100%;animation:skFadeUp .7s .7s ease both}
        .sk-btag{font-family:'JetBrains Mono',monospace;font-size:clamp(.46rem,1.1vw,.56rem);letter-spacing:.14em;text-transform:uppercase;color:var(--text-muted);display:flex;align-items:center;gap:.4rem}
        .sk-btag-dot{width:5px;height:5px;border-radius:50%;background:#c084fc;box-shadow:0 0 5px #c084fc;animation:skPip 1.4s ease-in-out infinite}
        @keyframes skPip{0%,100%{transform:scale(1)}50%{transform:scale(1.6)}}
        .sk-done-tag{color:#22d3ee;font-weight:700;letter-spacing:.1em;animation:skFadeUp .4s ease both}
        .sk-dots{display:flex;gap:.35rem}
        .sk-dot{width:5px;height:5px;border-radius:50%;animation:skBounce .8s ease-in-out infinite}
        .sk-dot:nth-child(1){background:#22d3ee}
        .sk-dot:nth-child(2){background:#818cf8;animation-delay:.14s}
        .sk-dot:nth-child(3){background:#c084fc;animation-delay:.28s}
        @keyframes skBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}

        @media (prefers-reduced-motion: reduce) {
          .sk-root *{animation:none!important;transition:none!important}
        }
      `}</style>

      <div className="sk-wash" />
      <div className="sk-noise" />

      <svg className="sk-net" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ transform: `translate(${px(0.5)}, ${py(0.5)})` }}>
        {links.map(l => <line key={l.id} className="sk-net-link" x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} style={{ stroke: `rgba(129,140,248,${l.o})` }} />)}
        {nodes.map(n => <circle key={n.id} className="sk-net-node" cx={n.x} cy={n.y} r={n.size / 10} style={{ "--dur": `${n.dur}s`, "--del": `${n.delay}s` }} />)}
      </svg>

      <div className="sk-center">

        <div className="sk-radar">
          <div className="sk-rglow" />
          <div className="sk-rring" style={{ inset: "-14%" }} />
          <div className="sk-rring" style={{ inset: "8%" }} />
          <div className="sk-rdisc">
            {!done && <div className="sk-rsweep" />}
            {!done && RADAR_BLIPS.map((b, i) => {
              const rad = (b.angle * Math.PI) / 180;
              const cx = 50 + Math.cos(rad) * b.radius * 46;
              const cy = 50 + Math.sin(rad) * b.radius * 46;
              const delay = -((b.angle / 360) * sweepDur);
              return (
                <div key={i}>
                  <div className="sk-blip" style={{ left: `${cx}%`, top: `${cy}%`, animationDelay: `${delay}s` }} />
                  <div className="sk-blip-pct" style={{ left: `${cx}%`, top: `${cy}%`, animationDelay: `${delay}s` }}>{b.pct}%</div>
                </div>
              );
            })}
          </div>
          <div className={`sk-rcenter${done ? " sk-rcenter--done" : ""}`}>
            <div className="sk-rcenter-glow" />
            {done
              ? <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
              : <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>
            }
          </div>
        </div>

        <div className="sk-wmark">
          <div className="sk-wname">
            <Typewriter text="SkillSphere" run={true} speed={65} onDone={() => setWordDone(true)} />
            {!wordDone && <span className="sk-cursor" />}
          </div>
          <div className="sk-wsub">AI · Powered · Hiring · Intelligence</div>
        </div>

        <div className="sk-prog">
          <div className="sk-pmeta">
            <div className="sk-pcount">Status: <b>{STATUS_STEPS[statusIdx]}</b></div>
            <div className="sk-ppct">{Math.round(pct)}%</div>
          </div>
          <div className="sk-ptrack"><div className="sk-pfill" style={{ width: `${pct}%` }} /></div>
        </div>

        <div className="sk-bottom">
          <div className="sk-btag"><span className="sk-btag-dot" />Powered by Gemini AI</div>
          {done
            ? <div className="sk-btag sk-done-tag">● {doneLabel}</div>
            : <div className="sk-dots"><span className="sk-dot" /><span className="sk-dot" /><span className="sk-dot" /></div>
          }
        </div>

      </div>
    </div>
  );
}