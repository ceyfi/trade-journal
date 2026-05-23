import { useState, useEffect } from "react";

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const FREE_LIMIT = 5; // broj besplatnih trejdova
// ─────────────────────────────────────────────────────────────────────────────

// Supabase client with auth support
const supabase = {
  _token: null,

  async query(table, method = "GET", body = null, filter = "") {
    const token = supabase._token || SUPABASE_ANON_KEY;
    const url = `${SUPABASE_URL}/rest/v1/${table}${filter}`;
    const res = await fetch(url, {
      method,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: method === "POST" ? "return=representation" : "",
      },
      body: body ? JSON.stringify(body) : null,
    });
    if (!res.ok) throw new Error(await res.text());
    return method === "DELETE" ? null : res.json();
  },

  from: (table) => ({
    select: (filter = "") => supabase.query(table, "GET", null, `?select=*${filter}&order=created_at.desc`),
    insert: (data) => supabase.query(table, "POST", data),
    update: (data, filter) => supabase.query(table, "PATCH", data, filter),
  }),

  auth: {
    async signUp(email, password) {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: "POST",
        headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      return res.json();
    },
    async signIn(email, password) {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.access_token) {
        supabase._token = data.access_token;
        localStorage.setItem("sb_token", data.access_token);
        localStorage.setItem("sb_user", JSON.stringify({ id: data.user?.id, email: data.user?.email }));
      }
      return data;
    },
    signOut() {
      supabase._token = null;
      localStorage.removeItem("sb_token");
      localStorage.removeItem("sb_user");
    },
    getSession() {
      const token = localStorage.getItem("sb_token");
      const user = localStorage.getItem("sb_user");
      if (token && user) {
        supabase._token = token;
        return { token, user: JSON.parse(user) };
      }
      return null;
    },
  },
};

// Claude AI call — goes through Vercel API route
async function askClaude(prompt) {
  try {
    const res = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const text = await res.text();
    const data = JSON.parse(text);
    return data.content?.[0]?.text || "No response.";
  } catch (err) {
    console.error("Claude error:", err);
    return "Could not get feedback.";
  }
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #080b0f;
    --bg2: #0e1318;
    --bg3: #141c24;
    --border: #1e2a35;
    --border2: #243040;
    --text: #e8edf2;
    --text2: #7a8fa0;
    --text3: #3d5060;
    --green: #00e5a0;
    --green-dim: #00e5a015;
    --red: #ff4060;
    --red-dim: #ff406015;
    --amber: #f5a623;
    --amber-dim: #f5a62315;
    --blue: #4090ff;
    --blue-dim: #4090ff12;
  }

  body { background: var(--bg); color: var(--text); font-family: 'Syne', sans-serif; min-height: 100vh; }

  .app { max-width: 520px; margin: 0 auto; padding: 0 0 80px; min-height: 100vh; }

  .header { padding: 28px 20px 0; display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
  .logo { font-family: 'Space Mono', monospace; font-size: 13px; color: var(--green); letter-spacing: 0.12em; }
  .header-actions { display: flex; gap: 8px; }
  .tab-btn { background: none; border: 1px solid var(--border2); color: var(--text2); font-family: 'Syne', sans-serif; font-size: 12px; padding: 6px 14px; border-radius: 20px; cursor: pointer; transition: all 0.15s; }
  .tab-btn.active, .tab-btn:hover { border-color: var(--green); color: var(--green); }

  .card { background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; padding: 20px; margin: 0 16px 16px; }
  .card-sm { background: var(--bg3); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; }

  .metrics { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin: 0 16px 16px; }
  .metric { background: var(--bg2); border: 1px solid var(--border); border-radius: 14px; padding: 18px 14px; }
  .metric-label { font-size: 12px; color: var(--text2); letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 10px; font-family: 'Syne', sans-serif; font-weight: 600; }
  .metric-value { font-size: 28px; font-weight: 700; line-height: 1; font-family: 'Space Mono', monospace; }
  .metric-value.green { color: var(--green); }
  .metric-value.amber { color: var(--amber); }
  .metric-value.neutral { color: var(--text); }

  .cta { display: flex; align-items: center; justify-content: center; gap: 10px; width: calc(100% - 32px); margin: 0 16px 20px; padding: 16px; background: var(--green-dim); border: 1px solid var(--green); border-radius: 14px; color: var(--green); font-family: 'Syne', sans-serif; font-weight: 600; font-size: 15px; cursor: pointer; transition: all 0.15s; }
  .cta:hover { background: #00e5a022; }

  .section-label { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text3); letter-spacing: 0.12em; text-transform: uppercase; padding: 0 20px; margin-bottom: 10px; }

  .trade-list { display: flex; flex-direction: column; gap: 8px; padding: 0 16px; }
  .trade-row { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: border-color 0.15s; }
  .trade-row:hover { border-color: var(--border2); }
  .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .dot.green { background: var(--green); box-shadow: 0 0 6px var(--green); }
  .dot.red { background: var(--red); box-shadow: 0 0 6px var(--red); }
  .dot.amber { background: var(--amber); box-shadow: 0 0 6px var(--amber); }
  .dot.open { background: var(--blue); box-shadow: 0 0 6px var(--blue); }
  .trade-asset { font-weight: 700; font-size: 13px; min-width: 80px; font-family: 'Space Mono', monospace; }
  .trade-date { font-size: 12px; color: var(--text2); flex: 1; }
  .trade-pnl { font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 700; }
  .trade-pnl.pos { color: var(--green); }
  .trade-pnl.neg { color: var(--red); }
  .badge { font-size: 10px; padding: 3px 8px; border-radius: 20px; font-family: 'Space Mono', monospace; }
  .badge.yes { background: var(--green-dim); color: var(--green); border: 1px solid #00e5a030; }
  .badge.no { background: var(--red-dim); color: var(--red); border: 1px solid #ff406030; }
  .badge.partial { background: var(--amber-dim); color: var(--amber); border: 1px solid #f5a62330; }
  .badge.open { background: var(--blue-dim); color: var(--blue); border: 1px solid #4090ff30; }

  .form { display: flex; flex-direction: column; gap: 14px; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field.full { grid-column: 1 / -1; }
  .field label { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text3); letter-spacing: 0.1em; text-transform: uppercase; }
  .field input, .field textarea, .field select {
    background: var(--bg3); border: 1px solid var(--border2); border-radius: 10px;
    padding: 10px 12px; color: var(--text); font-family: 'Syne', sans-serif; font-size: 14px;
    outline: none; transition: border-color 0.15s; width: 100%;
  }
  .field input:focus, .field textarea:focus, .field select:focus { border-color: var(--green); }
  .field textarea { resize: none; min-height: 80px; line-height: 1.5; }
  .field select option { background: var(--bg3); }

  .claude-box { background: var(--blue-dim); border: 1px solid #4090ff25; border-radius: 12px; padding: 14px 16px; }
  .claude-label { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--blue); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px; }
  .claude-text { font-size: 13px; color: #8ab4f8; line-height: 1.6; }

  .btn { padding: 12px 20px; border-radius: 12px; font-family: 'Syne', sans-serif; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.15s; border: none; }
  .btn-primary { background: var(--green); color: #000; }
  .btn-primary:hover { opacity: 0.9; }
  .btn-secondary { background: var(--bg3); border: 1px solid var(--border2); color: var(--text2); }
  .btn-secondary:hover { border-color: var(--text2); color: var(--text); }
  .btn-row { display: flex; gap: 10px; }
  .btn-row .btn { flex: 1; }

  .review-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 0 16px 16px; }
  .review-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 14px; padding: 16px; }
  .review-card-label { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text3); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 12px; }
  .stat-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .stat-name { font-size: 12px; color: var(--text2); }
  .stat-val { font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 700; }
  .bar-bg { height: 4px; background: var(--border); border-radius: 2px; margin-top: 2px; margin-bottom: 10px; }
  .bar-fill { height: 4px; border-radius: 2px; transition: width 0.6s ease; }

  .detail-field { margin-bottom: 14px; }
  .detail-label { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text3); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px; }
  .detail-value { font-size: 14px; color: var(--text); line-height: 1.5; }
  .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }

  .loading { display: flex; align-items: center; gap: 8px; color: var(--text2); font-size: 13px; padding: 12px 0; }
  .spinner { width: 16px; height: 16px; border: 2px solid var(--border2); border-top-color: var(--green); border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .empty { text-align: center; padding: 40px 20px; color: var(--text3); font-size: 13px; line-height: 1.8; }

  .back-btn { display: flex; align-items: center; gap: 8px; background: none; border: none; color: var(--text2); font-family: 'Syne', sans-serif; font-size: 14px; cursor: pointer; padding: 0 20px; margin-bottom: 20px; }
  .back-btn:hover { color: var(--text); }

  .page-title { font-size: 22px; font-weight: 700; padding: 0 20px; margin-bottom: 20px; }

  .divider { height: 1px; background: var(--border); margin: 16px 0; }
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (n) => n > 0 ? `+$${n.toFixed(0)}` : n < 0 ? `-$${Math.abs(n).toFixed(0)}` : "$0";
const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const planLabel = (v) => v === "yes" ? "Followed" : v === "no" ? "Deviated" : v === "open" ? "Open" : "Partial";

// ─── STRATEGIES ──────────────────────────────────────────────────────────────
const STRATEGIES = {
  "": { label: "— Select strategy —", thesis: "", exit_conditions: "" },
  "us_daily_open": {
    label: "US Daily Open",
    thesis: "BTC US Daily Open setup. Watching 5min chart at 15:30, 15:35, 15:40 candles. 2 green candles closing up → long on US open high. 2 red candles closing down → short on US open low.",
    exit_conditions: "Long: SL on US open low. Short: SL on US open high. Exit at 1:2 R/R or if setup invalidated within first 15min.",
  },
  "asian_range": {
    label: "Asian Range Breakout",
    thesis: "Asian session range identified (02:00–06:00 UTC). Waiting for breakout when London opens. Enter on confirmed close above/below range with volume confirmation.",
    exit_conditions: "SL just inside the Asian range. Target 1.5–2x the range size. Exit if price returns inside range after breakout.",
  },
  "htf_sr": {
    label: "Higher Timeframe S/R",
    thesis: "Key support/resistance level identified on daily or 4H chart. Price has reached the level. Waiting for confirmation candle (engulfing or pin bar) before entry.",
    exit_conditions: "SL just beyond the S/R level. Target next major S/R. Exit if price breaks and closes beyond level without bouncing.",
  },
  "custom": {
    label: "Custom setup",
    thesis: "",
    exit_conditions: "",
  },
};

// ─── PAYWALL SCREEN ──────────────────────────────────────────────────────────
function PaywallScreen({ user, tradesCount, onSubscribed, onBack }) {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  async function goToCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/lemon-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Could not create checkout. Try again.");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  }

  async function checkSubscription() {
    setChecking(true);
    const token = localStorage.getItem("sb_token");
    try {
      const res = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=subscription_status`,
        {
          headers: {
            apikey: process.env.REACT_APP_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (data?.[0]?.subscription_status === "active") {
        onSubscribed();
      } else {
        alert("Subscription not found yet. If you just paid, wait a moment and try again.");
      }
    } catch (err) {
      alert("Error checking subscription.");
    }
    setChecking(false);
  }

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="header">
          <div className="logo">TRADE//LOG</div>
          {onBack && <button className="tab-btn" onClick={onBack}>← Back</button>}
        </div>

        <div style={{ padding: "32px 16px 0" }}>

          {/* Naslov */}
          <div style={{ marginBottom: 28, padding: "0 4px" }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "var(--text3)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
              Upgrade
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 26, fontWeight: 700, color: "var(--text)", lineHeight: 1.25, marginBottom: 10 }}>
              You've reached<br />the free limit
            </div>
            <div style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.7 }}>
              You've logged all {FREE_LIMIT} free trades. Upgrade to Pro to keep going.
            </div>
          </div>

          {/* Kartica s cijenom */}
          <div className="card" style={{ marginBottom: 12, marginLeft: 0, marginRight: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
                  TRADE//LOG PRO
                </div>
                <div style={{ fontSize: 13, color: "var(--text3)" }}>Monthly subscription</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 28, fontWeight: 700, color: "var(--green)", lineHeight: 1 }}>
                  $5
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "var(--text3)" }}>/month</div>
              </div>
            </div>

            <div style={{ height: 1, background: "var(--border)", marginBottom: 18 }} />

            {[
              ["Unlimited trade logging", "Log as many trades as you want"],
              ["AI feedback on every entry", "Claude analyses each trade before you submit"],
              ["Pre-trade challenge questions", "Stay disciplined with guided reflection"],
              ["Pattern analysis", "Spot what's working across your journal"],
            ].map(([title, desc]) => (
              <div key={title} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: "var(--green)", marginTop: 1, flexShrink: 0 }}>✓</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{title}</div>
                  <div style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Dugmad */}
          <button className="cta" onClick={goToCheckout} disabled={loading} style={{ marginLeft: 0, marginRight: 0, width: "100%", marginBottom: 10 }}>
            {loading ? "Loading..." : "Upgrade to Pro — $5/month →"}
          </button>
          <button className="tab-btn" onClick={checkSubscription} disabled={checking} style={{ width: "100%", padding: "12px", fontSize: 13 }}>
            {checking ? "Checking..." : "I already paid — check my subscription"}
          </button>

        </div>
      </div>
    </>
  );
}

// ─── AUTH SCREEN ─────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  async function submit() {
    if (!email || !password) return setError("Enter email and password.");
    setLoading(true);
    setError("");
    setMsg("");
    if (mode === "signup") {
      const data = await supabase.auth.signUp(email, password);
      if (data.error) {
        setError(data.error.message || "Signup failed.");
      } else {
        setMsg("Check your email to confirm your account, then log in.");
        setMode("login");
      }
    } else {
      const data = await supabase.auth.signIn(email, password);
      if (data.error) {
        setError(data.error.message || "Login failed.");
      } else if (data.access_token) {
        onAuth({ id: data.user?.id, email: data.user?.email });
      } else {
        setError("Login failed. Check your credentials.");
      }
    }
    setLoading(false);
  }

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="header">
          <div className="logo">TRADE//LOG</div>
        </div>
        <div style={{ padding: "40px 16px 0" }}>
          <div className="page-title" style={{ fontSize: 18, marginBottom: 8 }}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </div>
          <p style={{ color: "var(--text2)", fontSize: 13, marginBottom: 28 }}>
            {mode === "login" ? "Log in to your journal" : "Start tracking your trades"}
          </p>
          <div className="card" style={{ margin: 0 }}>
            <div className="form">
              <div className="field full">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submit()}
                />
              </div>
              <div className="field full">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submit()}
                />
              </div>
              {error && <div style={{ color: "var(--red)", fontSize: 13 }}>{error}</div>}
              {msg && <div style={{ color: "var(--green)", fontSize: 13 }}>{msg}</div>}
              <button className="btn btn-primary" style={{ width: "100%" }} onClick={submit} disabled={loading}>
                {loading ? "Loading..." : mode === "login" ? "Log in" : "Sign up"}
              </button>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 20, color: "var(--text2)", fontSize: 13 }}>
            {mode === "login" ? (
              <>No account? <button onClick={() => { setMode("signup"); setError(""); }} style={{ background: "none", border: "none", color: "var(--green)", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>Sign up</button></>
            ) : (
              <>Already have one? <button onClick={() => { setMode("login"); setError(""); }} style={{ background: "none", border: "none", color: "var(--green)", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>Log in</button></>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function TradeJournal() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [screen, setScreen] = useState("dashboard");
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const session = supabase.auth.getSession();
    if (session) setUser(session.user);
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (user) {
      checkSubscription();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function checkSubscription() {
    // Check if returned from Lemon Squeezy with ?subscribed=true
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscribed") === "true") {
      window.history.replaceState({}, "", "/");
    }
    try {
      const token = localStorage.getItem("sb_token");
      const res = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=subscription_status`,
        {
          headers: {
            apikey: process.env.REACT_APP_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      setSubscribed(data?.[0]?.subscription_status === "active");
    } catch (e) {
      console.error("Sub check error:", e);
    }
    loadTrades();
  }

  useEffect(() => {
    if (user) loadTrades();
  }, [user]);

  async function loadTrades() {
    try {
      setLoading(true);
      const data = await supabase.from("trades").select();
      setTrades(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function handleSignOut() {
    supabase.auth.signOut();
    setUser(null);
    setTrades([]);
    setScreen("dashboard");
  }

  if (!authChecked) return null;
  if (!user) return <AuthScreen onAuth={(u) => setUser(u)} />;

  const atLimit = !subscribed && trades.length >= FREE_LIMIT;

  const closedTrades = trades.filter(t => t.status === "closed");
  const openTrades = trades.filter(t => t.status === "open");
  const adherenceRate = closedTrades.length
    ? Math.round((closedTrades.filter(t => t.followed_plan === "yes").length / closedTrades.length) * 100)
    : null;
  const winRate = closedTrades.length
    ? Math.round((closedTrades.filter(t => (t.pnl || 0) > 0).length / closedTrades.length) * 100)
    : null;

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="header">
          <div className="logo">TRADE//LOG</div>
          <div className="header-actions">
            <button className={`tab-btn ${screen === "dashboard" ? "active" : ""}`} onClick={() => setScreen("dashboard")}>Journal</button>
            <button className={`tab-btn ${screen === "review" ? "active" : ""}`} onClick={() => setScreen("review")}>Review</button>
            {!subscribed && (
              <span
                onClick={() => atLimit && setScreen("paywall")}
                title={atLimit ? "Upgrade to Pro" : `${FREE_LIMIT - trades.length} free trades remaining`}
                style={{ fontSize: 12, color: atLimit ? "var(--red, #ff4d4d)" : "var(--text2)", cursor: atLimit ? "pointer" : "default", padding: "4px 8px", border: "1px solid currentColor", borderRadius: 4 }}
              >
                {trades.length}/{FREE_LIMIT} free
              </span>
            )}
            <button className="tab-btn" onClick={handleSignOut} title={user.email}>Sign out</button>
          </div>
        </div>

        {screen === "dashboard" && (
          <Dashboard
            trades={trades} openTrades={openTrades} closedTrades={closedTrades}
            adherenceRate={adherenceRate} winRate={winRate} loading={loading}
            onNew={() => atLimit ? setScreen("paywall") : setScreen("log")}
            onSelect={(t) => { setSelected(t); setScreen("detail"); }}
          />
        )}
        {screen === "log" && (
          <LogTrade userId={user.id} onSave={async () => { await loadTrades(); setScreen("dashboard"); }} onBack={() => setScreen("dashboard")} />
        )}
        {screen === "paywall" && (
          <PaywallScreen user={user} tradesCount={trades.length} onSubscribed={() => { setSubscribed(true); setScreen("log"); }} onBack={() => setScreen("dashboard")} />
        )}
        {screen === "detail" && selected && (
          <TradeDetail trade={selected} onBack={() => { setSelected(null); setScreen("dashboard"); }} onClose={async () => { await loadTrades(); setSelected(null); setScreen("dashboard"); }} />
        )}
        {screen === "review" && (
          <Review trades={closedTrades} />
        )}
      </div>
    </>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function Dashboard({ trades, openTrades, closedTrades, adherenceRate, winRate, loading, onNew, onSelect }) {
  return (
    <>
      <div className="metrics">
        <div className="metric">
          <div className="metric-label">Adherence</div>
          <div className={`metric-value ${adherenceRate >= 70 ? "green" : adherenceRate >= 50 ? "amber" : "neutral"}`}>
            {adherenceRate !== null ? `${adherenceRate}%` : "—"}
          </div>
        </div>
        <div className="metric">
          <div className="metric-label">Trades</div>
          <div className="metric-value neutral">{closedTrades.length}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Win rate</div>
          <div className={`metric-value ${winRate >= 55 ? "green" : winRate >= 40 ? "amber" : "neutral"}`}>
            {winRate !== null ? `${winRate}%` : "—"}
          </div>
        </div>
      </div>

      <button className="cta" onClick={onNew}>
        <span style={{ fontSize: 18 }}>+</span> Log new trade
      </button>

      {openTrades.length > 0 && (
        <>
          <div className="section-label">Open positions</div>
          <div className="trade-list" style={{ marginBottom: 16 }}>
            {openTrades.map(t => (
              <div key={t.id} className="trade-row" onClick={() => onSelect(t)}>
                <div className="dot open" />
                <div className="trade-asset">{t.asset}</div>
                <div className="trade-date">{fmtDate(t.created_at)} · {t.direction}</div>
                <div className="badge open">Open</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="section-label">Recent trades</div>
      <div className="trade-list">
        {loading && <div className="loading"><div className="spinner" /> Loading...</div>}
        {!loading && trades.length === 0 && (
          <div className="empty">No trades yet.<br />Log your first trade to get started.</div>
        )}
        {!loading && closedTrades.map(t => (
          <div key={t.id} className="trade-row" onClick={() => onSelect(t)}>
            <div className={`dot ${(t.pnl || 0) > 0 ? "green" : (t.pnl || 0) < 0 ? "red" : "amber"}`} />
            <div className="trade-asset">{t.asset}</div>
            <div className="trade-date">{fmtDate(t.created_at)}</div>
            <div className={`badge ${t.followed_plan}`}>{planLabel(t.followed_plan)}</div>
            <div className={`trade-pnl ${(t.pnl || 0) >= 0 ? "pos" : "neg"}`}>{fmt(t.pnl || 0)}</div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── LOG TRADE ────────────────────────────────────────────────────────────────
function LogTrade({ userId, onSave, onBack }) {
  const [form, setForm] = useState({ asset: "", direction: "Long", entry_price: "", target_price: "", stop_loss: "", position_size: "", thesis: "", exit_conditions: "" });
  const [strategy, setStrategy] = useState("");
  const [claudeQ, setClaudeQ] = useState("");
  const [loadingQ, setLoadingQ] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function selectStrategy(key) {
    setStrategy(key);
    setClaudeQ("");
    if (key && key !== "custom") {
      setForm(f => ({
        ...f,
        thesis: STRATEGIES[key].thesis,
        exit_conditions: STRATEGIES[key].exit_conditions,
      }));
    } else if (key === "custom") {
      setForm(f => ({ ...f, thesis: "", exit_conditions: "" }));
    }
  }

  async function generateQuestion() {
    if (!form.thesis) return;
    setLoadingQ(true);
    const q = await askClaude(`You are a sharp trading coach. A trader is about to enter this trade:
Asset: ${form.asset}, Direction: ${form.direction}, Entry: ${form.entry_price}, Target: ${form.target_price}, Stop: ${form.stop_loss}
Strategy: ${STRATEGIES[strategy]?.label || "Custom"}
Thesis: ${form.thesis}
Exit conditions: ${form.exit_conditions || "not specified"}

Ask ONE sharp, specific question that challenges their reasoning or exposes a gap in their plan. Be direct. Max 2 sentences.`);
    setClaudeQ(q);
    setLoadingQ(false);
  }

  async function save() {
    if (!form.asset || !form.thesis) return alert("Fill in asset and thesis at minimum.");
    setSaving(true);
    try {
      await supabase.from("trades").insert({
        ...form,
        user_id: userId,
        entry_price: parseFloat(form.entry_price) || null,
        target_price: parseFloat(form.target_price) || null,
        stop_loss: parseFloat(form.stop_loss) || null,
        position_size: parseFloat(form.position_size) || null,
        status: "open",
        followed_plan: "open",
        claude_pre_question: claudeQ,
        strategy: strategy,
      });
      onSave();
    } catch (e) { console.error("Error saving:", e.message); }
    setSaving(false);
  }

  return (
    <>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <div className="page-title">Log trade</div>
      <div className="card">
        <div className="form">
          <div className="field full">
            <label>Strategy</label>
            <select value={strategy} onChange={e => selectStrategy(e.target.value)}>
              {Object.entries(STRATEGIES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Asset</label>
              <input placeholder="BTC/USDT" value={form.asset} onChange={e => set("asset", e.target.value)} />
            </div>
            <div className="field">
              <label>Direction</label>
              <select value={form.direction} onChange={e => set("direction", e.target.value)}>
                <option>Long</option>
                <option>Short</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Entry price</label>
              <input placeholder="62400" value={form.entry_price} onChange={e => set("entry_price", e.target.value)} />
            </div>
            <div className="field">
              <label>Target price</label>
              <input placeholder="65000" value={form.target_price} onChange={e => set("target_price", e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Stop loss</label>
              <input placeholder="61000" value={form.stop_loss} onChange={e => set("stop_loss", e.target.value)} />
            </div>
            <div className="field">
              <label>Position size ($)</label>
              <input placeholder="500" value={form.position_size} onChange={e => set("position_size", e.target.value)} />
            </div>
          </div>
          <div className="field full">
            <label>Thesis</label>
            <textarea value={form.thesis} onChange={e => set("thesis", e.target.value)} onBlur={generateQuestion} placeholder="Describe your setup..." />
          </div>
          <div className="field full">
            <label>Exit conditions</label>
            <textarea value={form.exit_conditions} onChange={e => set("exit_conditions", e.target.value)} style={{ minHeight: 60 }} placeholder="When will you exit?" />
          </div>
        </div>

        {(loadingQ || claudeQ) && (
          <>
            <div className="divider" />
            <div className="claude-box">
              <div className="claude-label">Claude asks</div>
              {loadingQ ? <div className="loading"><div className="spinner" /> Thinking...</div> : <div className="claude-text">{claudeQ}</div>}
            </div>
          </>
        )}

        <div className="divider" />
        <div className="btn-row">
          <button className="btn btn-secondary" onClick={onBack}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Saving..." : "Log trade →"}</button>
        </div>
      </div>
    </>
  );
}

// ─── TRADE DETAIL / CLOSE ─────────────────────────────────────────────────────
function TradeDetail({ trade, onBack, onClose }) {
  const [closing, setClosing] = useState(false);
  const [closeForm, setCloseForm] = useState({ exit_price: "", followed_plan: "yes", what_happened: "" });
  const [claudeFeedback, setClaudeFeedback] = useState(trade.claude_feedback || "");
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setCloseForm(f => ({ ...f, [k]: v }));

  async function closeTrade() {
    if (!closeForm.exit_price) return alert("Enter exit price.");
    setSaving(true);
    setLoadingFeedback(true);

    const pnl = trade.position_size
      ? ((parseFloat(closeForm.exit_price) - trade.entry_price) / trade.entry_price) * trade.position_size * (trade.direction === "Short" ? -1 : 1)
      : 0;

    const feedback = await askClaude(`You are a blunt trading coach reviewing a closed trade. Be honest, specific, and concise. Max 3 sentences.

Trade: ${trade.asset} ${trade.direction}
Entry: $${trade.entry_price} → Exit: $${closeForm.exit_price}
Target was: $${trade.target_price}, Stop was: $${trade.stop_loss}
Position: $${trade.position_size}, P&L: ${fmt(pnl)}
Original thesis: ${trade.thesis}
Exit conditions planned: ${trade.exit_conditions || "none"}
Followed plan: ${closeForm.followed_plan}
What happened: ${closeForm.what_happened}
${trade.claude_pre_question ? `Pre-trade question asked: ${trade.claude_pre_question}` : ""}

Give feedback on what they did well or poorly, and one actionable takeaway.`);

    setLoadingFeedback(false);
    setClaudeFeedback(feedback);

    try {
      await supabase.from("trades").update({
        exit_price: parseFloat(closeForm.exit_price),
        followed_plan: closeForm.followed_plan,
        what_happened: closeForm.what_happened,
        pnl: Math.round(pnl),
        status: "closed",
        claude_feedback: feedback,
      }, `?id=eq.${trade.id}`);
    } catch (e) {
      console.error("Save error:", e.message);
    } finally {
      setSaving(false);
      onClose();
    }
  }

  return (
    <>
      <button className="back-btn" onClick={onBack}>← Back</button>
      <div className="page-title">{trade.asset} · {trade.direction}</div>
      <div className="card">
        <div className="detail-grid">
          <div className="detail-field">
            <div className="detail-label">Entry price</div>
            <div className="detail-value">${trade.entry_price}</div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Target</div>
            <div className="detail-value">${trade.target_price || "—"}</div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Stop loss</div>
            <div className="detail-value">${trade.stop_loss || "—"}</div>
          </div>
          <div className="detail-field">
            <div className="detail-label">Position size</div>
            <div className="detail-value">${trade.position_size || "—"}</div>
          </div>
        </div>
        <div className="detail-field">
          <div className="detail-label">Thesis</div>
          <div className="detail-value">{trade.thesis}</div>
        </div>
        {trade.exit_conditions && (
          <div className="detail-field">
            <div className="detail-label">Exit conditions</div>
            <div className="detail-value">{trade.exit_conditions}</div>
          </div>
        )}
        {trade.claude_pre_question && (
          <>
            <div className="divider" />
            <div className="claude-box">
              <div className="claude-label">Claude's pre-trade question</div>
              <div className="claude-text">{trade.claude_pre_question}</div>
            </div>
          </>
        )}

        {trade.status === "closed" && (
          <>
            <div className="divider" />
            <div className="detail-grid">
              <div className="detail-field">
                <div className="detail-label">Exit price</div>
                <div className="detail-value">${trade.exit_price}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">P&L</div>
                <div className="detail-value" style={{ color: trade.pnl >= 0 ? "var(--green)" : "var(--red)", fontWeight: 700 }}>{fmt(trade.pnl)}</div>
              </div>
            </div>
            <div className="detail-field">
              <div className="detail-label">Followed plan</div>
              <div className="detail-value"><span className={`badge ${trade.followed_plan}`}>{planLabel(trade.followed_plan)}</span></div>
            </div>
            {trade.what_happened && (
              <div className="detail-field">
                <div className="detail-label">What happened</div>
                <div className="detail-value">{trade.what_happened}</div>
              </div>
            )}
            {trade.claude_feedback && (
              <>
                <div className="divider" />
                <div className="claude-box">
                  <div className="claude-label">Claude's feedback</div>
                  <div className="claude-text">{trade.claude_feedback}</div>
                </div>
              </>
            )}
          </>
        )}

        {trade.status === "open" && (
          <>
            <div className="divider" />
            {!closing ? (
              <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setClosing(true)}>Close this trade</button>
            ) : (
              <div className="form">
                <div className="field full">
                  <label>Actual exit price</label>
                  <input placeholder="63100" value={closeForm.exit_price} onChange={e => set("exit_price", e.target.value)} />
                </div>
                <div className="field full">
                  <label>Did you follow your plan?</label>
                  <select value={closeForm.followed_plan} onChange={e => set("followed_plan", e.target.value)}>
                    <option value="yes">Yes — followed the plan</option>
                    <option value="partial">Partially</option>
                    <option value="no">No — deviated</option>
                  </select>
                </div>
                <div className="field full">
                  <label>One honest sentence — what happened?</label>
                  <textarea placeholder="I saw red candles and panicked before target..." value={closeForm.what_happened} onChange={e => set("what_happened", e.target.value)} style={{ minHeight: 60 }} />
                </div>
                {(loadingFeedback || claudeFeedback) && (
                  <div className="claude-box">
                    <div className="claude-label">Claude's feedback</div>
                    {loadingFeedback ? <div className="loading"><div className="spinner" /> Analyzing...</div> : <div className="claude-text">{claudeFeedback}</div>}
                  </div>
                )}
                <div className="btn-row">
                  <button className="btn btn-secondary" onClick={() => setClosing(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={closeTrade} disabled={saving}>{saving ? "Saving..." : "Close trade"}</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

// ─── REVIEW ───────────────────────────────────────────────────────────────────
function Review({ trades }) {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  const followed = trades.filter(t => t.followed_plan === "yes");
  const deviated = trades.filter(t => t.followed_plan === "no");
  const followedWR = followed.length ? Math.round((followed.filter(t => t.pnl > 0).length / followed.length) * 100) : null;
  const deviatedWR = deviated.length ? Math.round((deviated.filter(t => t.pnl > 0).length / deviated.length) * 100) : null;

  const assetPnl = trades.reduce((acc, t) => {
    acc[t.asset] = (acc[t.asset] || 0) + (t.pnl || 0);
    return acc;
  }, {});
  const topAssets = Object.entries(assetPnl).sort((a, b) => b[1] - a[1]).slice(0, 3);

  async function getAnalysis() {
    if (!trades.length) return;
    setLoading(true);
    const summary = trades.map(t => `${t.asset} ${t.direction}: plan=${t.followed_plan}, pnl=${t.pnl}, note="${t.what_happened || ""}"`).join("\n");
    const text = await askClaude(`You are a trading coach. Analyze this trader's journal and give 3 specific pattern observations. Be direct and data-driven. Each observation 1-2 sentences. Format as numbered list.\n\nTrades:\n${summary}`);
    setAnalysis(text);
    setLoading(false);
  }

  return (
    <>
      <div className="page-title">Review</div>
      {trades.length === 0 ? (
        <div className="empty">Close some trades first to see your review.</div>
      ) : (
        <>
          <div className="review-grid">
            <div className="review-card">
              <div className="review-card-label">Win rate by adherence</div>
              {followedWR !== null && (
                <>
                  <div className="stat-row"><span className="stat-name">Followed plan</span><span className="stat-val" style={{ color: "var(--green)" }}>{followedWR}%</span></div>
                  <div className="bar-bg"><div className="bar-fill" style={{ width: `${followedWR}%`, background: "var(--green)" }} /></div>
                </>
              )}
              {deviatedWR !== null && (
                <>
                  <div className="stat-row"><span className="stat-name">Deviated</span><span className="stat-val" style={{ color: "var(--red)" }}>{deviatedWR}%</span></div>
                  <div className="bar-bg"><div className="bar-fill" style={{ width: `${deviatedWR}%`, background: "var(--red)" }} /></div>
                </>
              )}
            </div>
            <div className="review-card">
              <div className="review-card-label">P&L by asset</div>
              {topAssets.map(([asset, pnl]) => (
                <div key={asset} className="stat-row">
                  <span className="stat-name">{asset}</span>
                  <span className="stat-val" style={{ color: pnl >= 0 ? "var(--green)" : "var(--red)" }}>{fmt(pnl)}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: "0 16px", marginBottom: 16 }}>
            <div className="card-sm">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: analysis ? 14 : 0 }}>
                <div className="review-card-label" style={{ margin: 0 }}>Claude's pattern analysis</div>
                <button className="btn btn-secondary" style={{ padding: "6px 14px", fontSize: 12 }} onClick={getAnalysis} disabled={loading}>
                  {loading ? "Analyzing..." : analysis ? "Refresh" : "Analyze"}
                </button>
              </div>
              {loading && <div className="loading"><div className="spinner" /> Reading your trades...</div>}
              {analysis && !loading && (
                <div className="claude-text" style={{ marginTop: 12, fontSize: 13, color: "var(--text2)", lineHeight: 1.7, whiteSpace: "pre-line" }}>{analysis}</div>
              )}
            </div>
          </div>

          <div className="section-label">All closed trades</div>
          <div className="trade-list">
            {trades.map(t => (
              <div key={t.id} className="trade-row" style={{ cursor: "default" }}>
                <div className={`dot ${(t.pnl || 0) > 0 ? "green" : "red"}`} />
                <div className="trade-asset">{t.asset}</div>
                <div className="trade-date">{fmtDate(t.created_at)}</div>
                <div className={`badge ${t.followed_plan}`}>{planLabel(t.followed_plan)}</div>
                <div className={`trade-pnl ${(t.pnl || 0) >= 0 ? "pos" : "neg"}`}>{fmt(t.pnl || 0)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
