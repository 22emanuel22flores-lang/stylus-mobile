import { useState, useEffect, useCallback } from "react";

// ─── SUPABASE CONFIG ───────────────────────────────────────────────
// Replace these with your actual Supabase project values
const SUPABASE_URL = "https://zrdsrumkwrehnsbotrqg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_eKrHY0ioMwgHSzyick_OEw_CHfE1OvF";
const STRIPE_PUBLISHABLE_KEY = "YOUR_STRIPE_PUBLISHABLE_KEY";

// ─── MOCK DATA (used until Supabase is connected) ──────────────────
const MOCK_USERS = [
  { id: "1", email: "admin@stylus.com", password: "admin123", role: "admin", name: "Admin" },
  { id: "2", email: "carlos@stylus.com", password: "emp123", role: "employee", name: "Carlos" },
  { id: "3", email: "maria@stylus.com", password: "emp123", role: "employee", name: "María" },
  { id: "4", email: "cliente@test.com", password: "cliente123", role: "client", name: "Juan García" },
];

const MOCK_BOOKINGS = [
  { id: "b1", clientName: "Juan García", clientPhone: "+34 612 345 678", address: "Calle Mayor 12, 3°B, Granollers", service: "Combo Corte + Barba", price: 40, date: "2025-07-10", time: "10:00", status: "confirmed", employeeId: "2", employeeName: "Carlos", paid: true },
  { id: "b2", clientName: "Pedro Martínez", clientPhone: "+34 698 765 432", address: "Av. Correos 5, 1°A, Granollers", service: "Corte de pelo", price: 30, date: "2025-07-10", time: "12:30", status: "pending", employeeId: "3", employeeName: "María", paid: false },
  { id: "b3", clientName: "James Smith", clientPhone: "+44 7911 123456", address: "Hotel Granollers, hab 205", service: "Arreglo de barba", price: 15, date: "2025-07-11", time: "09:00", status: "confirmed", employeeId: "2", employeeName: "Carlos", paid: true },
  { id: "b4", clientName: "Juan García", clientPhone: "+34 612 345 678", address: "Calle Mayor 12, 3°B, Granollers", service: "Corte de pelo", price: 30, date: "2025-07-15", time: "11:00", status: "pending", employeeId: "3", employeeName: "María", paid: false },
];

const MOCK_GALLERY = [
  { id: "g1", url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80", caption: "Fade clásico", category: "corte" },
  { id: "g2", url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&q=80", caption: "Barba perfilada", category: "barba" },
  { id: "g3", url: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&q=80", caption: "Estilo moderno", category: "corte" },
  { id: "g4", url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&q=80", caption: "Combo completo", category: "combo" },
];

const SERVICES = [
  { id: "corte", name: "Corte de pelo", nameEn: "Haircut", price: 30, duration: "45 min", desc: "Corte profesional adaptado a tu estilo" },
  { id: "barba", name: "Arreglo de barba", nameEn: "Beard trim", price: 15, duration: "30 min", desc: "Perfilado, rasurado y definición" },
  { id: "combo", name: "Combo Corte + Barba", nameEn: "Cut + Beard Combo", price: 40, duration: "70 min", desc: "El pack completo al mejor precio" },
];

// ─── STYLES ────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Epilogue:wght@200;300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink: #0d0d0b;
    --cream: #f5f0e8;
    --gold: #c9a84c;
    --gold-dim: rgba(201,168,76,0.2);
    --warm: #faf8f4;
    --muted: #7a7468;
    --surface: #ffffff;
    --border: rgba(0,0,0,0.08);
    --success: #2d7a4f;
    --danger: #a83232;
    --pending: #a86b32;
  }

  body { font-family: 'Epilogue', sans-serif; font-weight: 300; background: var(--warm); color: var(--ink); min-height: 100vh; }

  /* ── NAV ── */
  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    background: var(--ink); height: 60px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 28px;
    border-bottom: 1px solid rgba(201,168,76,0.15);
  }
  .nav-logo { font-family: 'Cormorant Garamond', serif; font-size: 22px; color: var(--cream); letter-spacing:.05em; }
  .nav-logo em { color: var(--gold); font-style: italic; }
  .nav-right { display: flex; align-items: center; gap: 16px; }
  .nav-role { font-size: 10px; letter-spacing:.15em; text-transform:uppercase; color: var(--gold); background: rgba(201,168,76,.12); padding: 4px 10px; }
  .nav-user { font-size: 13px; color: rgba(245,240,232,.6); }
  .nav-btn { background: none; border: 1px solid rgba(201,168,76,.3); color: var(--gold); padding: 6px 14px; font-size: 11px; letter-spacing:.1em; text-transform: uppercase; cursor: pointer; font-family: 'Epilogue',sans-serif; transition: all .2s; }
  .nav-btn:hover { background: var(--gold); color: var(--ink); }

  /* ── LAYOUT ── */
  .app-shell { display: flex; min-height: 100vh; padding-top: 60px; }
  .sidebar {
    width: 220px; background: #161412; flex-shrink: 0;
    padding: 32px 0; position: fixed; top: 60px; bottom: 0; left: 0;
    overflow-y: auto;
  }
  .sidebar-item {
    display: flex; align-items: center; gap: 12px;
    padding: 13px 24px; font-size: 13px; color: rgba(245,240,232,.5);
    cursor: pointer; transition: all .2s; border-left: 2px solid transparent;
    letter-spacing:.02em;
  }
  .sidebar-item:hover { color: var(--cream); background: rgba(255,255,255,.04); }
  .sidebar-item.active { color: var(--gold); border-left-color: var(--gold); background: rgba(201,168,76,.06); }
  .sidebar-icon { font-size: 16px; width: 20px; text-align: center; }
  .main { margin-left: 220px; flex: 1; padding: 36px 40px; min-height: calc(100vh - 60px); }

  /* ── CARDS ── */
  .card { background: var(--surface); border: 1px solid var(--border); padding: 28px; margin-bottom: 20px; }
  .card-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 400; margin-bottom: 20px; }
  .page-title { font-family: 'Cormorant Garamond', serif; font-size: 38px; font-weight: 300; margin-bottom: 6px; }
  .page-sub { color: var(--muted); font-size: 13px; margin-bottom: 32px; }

  /* ── STATS ── */
  .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 28px; }
  @media(max-width:900px){ .stats-grid { grid-template-columns: repeat(2,1fr); } }
  .stat-card { background: var(--surface); border: 1px solid var(--border); padding: 24px; }
  .stat-label { font-size: 10px; letter-spacing:.15em; text-transform:uppercase; color: var(--muted); margin-bottom: 8px; }
  .stat-value { font-family: 'Cormorant Garamond', serif; font-size: 42px; font-weight: 300; line-height:1; }
  .stat-value.gold { color: var(--gold); }
  .stat-sub { font-size: 11px; color: var(--muted); margin-top: 4px; }

  /* ── TABLE ── */
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; font-size: 10px; letter-spacing:.12em; text-transform: uppercase; color: var(--muted); padding: 10px 14px; border-bottom: 1px solid var(--border); font-weight: 400; }
  td { padding: 14px; border-bottom: 1px solid var(--border); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #faf9f7; }

  /* ── BADGES ── */
  .badge { display: inline-block; padding: 3px 10px; font-size: 10px; letter-spacing:.08em; text-transform: uppercase; font-weight: 500; }
  .badge-confirmed { background: rgba(45,122,79,.12); color: var(--success); }
  .badge-pending { background: rgba(168,107,50,.12); color: var(--pending); }
  .badge-cancelled { background: rgba(168,50,50,.12); color: var(--danger); }
  .badge-paid { background: rgba(201,168,76,.15); color: #8a6a1a; }
  .badge-unpaid { background: rgba(168,50,50,.08); color: var(--danger); }

  /* ── BUTTONS ── */
  .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 22px; font-family: 'Epilogue',sans-serif; font-size: 12px; letter-spacing:.1em; text-transform: uppercase; cursor: pointer; border: none; transition: all .2s; }
  .btn-primary { background: var(--ink); color: var(--cream); }
  .btn-primary:hover { background: #2a2420; }
  .btn-gold { background: var(--gold); color: var(--ink); }
  .btn-gold:hover { background: #d4b45a; }
  .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--ink); }
  .btn-outline:hover { border-color: var(--ink); }
  .btn-danger { background: transparent; border: 1px solid rgba(168,50,50,.3); color: var(--danger); }
  .btn-danger:hover { background: var(--danger); color: #fff; }
  .btn-sm { padding: 6px 14px; font-size: 10px; }
  .btn-whatsapp { background: #25D366; color: #fff; }
  .btn-whatsapp:hover { background: #1ebe5d; }

  /* ── FORMS ── */
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .form-grid.single { grid-template-columns: 1fr; }
  @media(max-width:600px){ .form-grid { grid-template-columns: 1fr; } }
  .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 4px; }
  .field label { font-size: 10px; letter-spacing:.12em; text-transform: uppercase; color: var(--muted); }
  .field input, .field select, .field textarea {
    background: var(--warm); border: 1px solid var(--border);
    padding: 12px 14px; font-family: 'Epilogue',sans-serif; font-size: 14px;
    color: var(--ink); outline: none; transition: border-color .2s;
    border-radius: 0; -webkit-appearance: none; appearance: none;
  }
  .field input:focus, .field select:focus, .field textarea:focus { border-color: var(--gold); }
  .field textarea { resize: vertical; min-height: 90px; }
  .field-full { grid-column: 1 / -1; }

  /* ── SERVICE CARDS ── */
  .service-pick-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 24px; }
  @media(max-width:700px){ .service-pick-grid { grid-template-columns: 1fr; } }
  .service-pick {
    border: 2px solid var(--border); padding: 24px 20px; cursor: pointer;
    transition: all .2s; position: relative;
  }
  .service-pick:hover { border-color: var(--gold-dim); }
  .service-pick.selected { border-color: var(--gold); background: rgba(201,168,76,.04); }
  .service-pick-name { font-family: 'Cormorant Garamond', serif; font-size: 20px; margin-bottom: 6px; }
  .service-pick-desc { font-size: 12px; color: var(--muted); margin-bottom: 14px; line-height: 1.5; }
  .service-pick-price { font-family: 'Cormorant Garamond', serif; font-size: 32px; color: var(--gold); }
  .service-pick-price span { font-size: 14px; color: var(--muted); }
  .service-pick-check { position: absolute; top: 14px; right: 14px; width: 20px; height: 20px; background: var(--gold); display: none; align-items: center; justify-content: center; font-size: 11px; color: var(--ink); }
  .service-pick.selected .service-pick-check { display: flex; }

  /* ── GALLERY ── */
  .gallery-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
  @media(max-width:700px){ .gallery-grid { grid-template-columns: repeat(2,1fr); } }
  .gallery-item { position: relative; aspect-ratio: 1; overflow: hidden; cursor: pointer; }
  .gallery-item img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s ease; }
  .gallery-item:hover img { transform: scale(1.06); }
  .gallery-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(13,13,11,.7) 0%, transparent 50%); opacity: 0; transition: opacity .3s; display: flex; align-items: flex-end; padding: 14px; }
  .gallery-item:hover .gallery-overlay { opacity: 1; }
  .gallery-caption { font-size: 13px; color: var(--cream); }

  /* ── BOOKING ITEM ── */
  .booking-card { border: 1px solid var(--border); padding: 20px 24px; margin-bottom: 12px; display: flex; align-items: center; gap: 20px; background: var(--surface); }
  .booking-date-block { background: var(--ink); color: var(--cream); padding: 10px 14px; text-align: center; min-width: 64px; flex-shrink: 0; }
  .booking-date-day { font-family: 'Cormorant Garamond', serif; font-size: 30px; line-height: 1; }
  .booking-date-month { font-size: 10px; letter-spacing:.1em; text-transform: uppercase; color: var(--gold); }
  .booking-time { font-family: 'Cormorant Garamond', serif; font-size: 18px; margin-top: 4px; }
  .booking-info { flex: 1; }
  .booking-client { font-size: 15px; font-weight: 400; margin-bottom: 4px; }
  .booking-service { font-size: 12px; color: var(--muted); }
  .booking-address { font-size: 12px; color: var(--muted); margin-top: 4px; display: flex; align-items: center; gap: 4px; }
  .booking-actions { display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }

  /* ── EMPLOYEE VIEW ── */
  .today-header { background: var(--ink); color: var(--cream); padding: 20px 28px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; }
  .today-title { font-family: 'Cormorant Garamond', serif; font-size: 28px; }
  .today-count { font-size: 13px; color: var(--gold); }

  /* ── PUBLIC LANDING ── */
  .public-hero { min-height: 100vh; background: var(--ink); display: flex; align-items: center; justify-content: center; text-align: center; position: relative; overflow: hidden; }
  .public-hero-bg { position: absolute; inset: 0; background: radial-gradient(ellipse at 30% 50%, rgba(201,168,76,.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, rgba(201,168,76,.04) 0%, transparent 50%); }
  .public-hero-content { position: relative; z-index: 2; padding: 40px 24px; max-width: 700px; }
  .public-logo { font-family: 'Cormorant Garamond', serif; font-size: clamp(60px,10vw,110px); font-weight: 300; color: var(--cream); line-height: .9; }
  .public-logo em { color: var(--gold); font-style: italic; display: block; }
  .public-tagline { font-size: 13px; letter-spacing:.2em; text-transform:uppercase; color: rgba(245,240,232,.45); margin: 20px 0 44px; }
  .pub-services { display: grid; grid-template-columns: repeat(3,1fr); gap: 2px; margin: 60px 0; }
  @media(max-width:600px){ .pub-services { grid-template-columns: 1fr; } }
  .pub-service { background: #161412; padding: 32px 24px; text-align: left; }
  .pub-service-name { font-family: 'Cormorant Garamond', serif; font-size: 22px; color: var(--cream); margin-bottom: 8px; }
  .pub-service-price { font-family: 'Cormorant Garamond', serif; font-size: 38px; color: var(--gold); }
  .pub-service-price span { font-size: 16px; color: rgba(201,168,76,.6); }

  /* ── LOGIN ── */
  .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--ink); }
  .login-box { background: #161412; border: 1px solid rgba(201,168,76,.15); padding: 52px 48px; width: 100%; max-width: 420px; }
  .login-logo { font-family: 'Cormorant Garamond', serif; font-size: 36px; color: var(--cream); text-align: center; margin-bottom: 32px; }
  .login-logo em { color: var(--gold); font-style: italic; }
  .login-title { font-size: 11px; letter-spacing:.2em; text-transform:uppercase; color: var(--muted); text-align: center; margin-bottom: 32px; }

  /* ── MODAL ── */
  .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.6); z-index: 999; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .modal { background: var(--surface); max-width: 600px; width: 100%; padding: 40px; max-height: 90vh; overflow-y: auto; }
  .modal-title { font-family: 'Cormorant Garamond', serif; font-size: 28px; margin-bottom: 24px; }
  .modal-actions { display: flex; gap: 12px; margin-top: 28px; justify-content: flex-end; }

  /* ── MISC ── */
  .divider { height: 1px; background: var(--border); margin: 24px 0; }
  .empty-state { text-align: center; padding: 60px 20px; color: var(--muted); }
  .empty-state-icon { font-size: 40px; margin-bottom: 12px; }
  .empty-state p { font-size: 14px; }
  .tabs { display: flex; gap: 0; margin-bottom: 28px; border-bottom: 1px solid var(--border); }
  .tab { padding: 12px 24px; font-size: 12px; letter-spacing:.1em; text-transform:uppercase; cursor: pointer; color: var(--muted); border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all .2s; }
  .tab.active { color: var(--gold); border-bottom-color: var(--gold); }
  .alert { padding: 14px 18px; font-size: 13px; margin-bottom: 20px; }
  .alert-success { background: rgba(45,122,79,.1); color: var(--success); border: 1px solid rgba(45,122,79,.2); }
  .alert-error { background: rgba(168,50,50,.1); color: var(--danger); border: 1px solid rgba(168,50,50,.2); }
  .flex { display: flex; } .items-center { align-items: center; } .justify-between { justify-content: space-between; }
  .gap-12 { gap: 12px; } .mb-20 { margin-bottom: 20px; } .mb-8 { margin-bottom: 8px; }
  .text-muted { color: var(--muted); font-size: 13px; }
  .section-pub { padding: 80px 24px; }
  .container-pub { max-width: 1100px; margin: 0 auto; }
  .section-label-pub { font-size: 10px; letter-spacing:.22em; text-transform:uppercase; color: var(--gold); margin-bottom: 12px; }
  .section-title-pub { font-family: 'Cormorant Garamond', serif; font-size: clamp(32px,5vw,52px); font-weight: 300; margin-bottom: 40px; }
`;

// ─── UTILITIES ─────────────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];
const formatDate = (d) => {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
};
const dayNum = (d) => new Date(d + "T00:00:00").getDate();
const monthAbbr = (d) => new Date(d + "T00:00:00").toLocaleDateString("es-ES", { month: "short" });
const whatsappLink = (booking) =>
  `https://wa.me/${booking.clientPhone?.replace(/\s+/g, "")}?text=${encodeURIComponent(
    `Hola ${booking.clientName}, te confirmamos tu cita con Stylus Mobile: ${booking.service} el ${formatDate(booking.date)} a las ${booking.time}. Dirección: ${booking.address}. 💈`
  )}`;

// ─── AUTH CONTEXT (mock) ────────────────────────────────────────────
function useAuth() {
  const [user, setUser] = useState(null);
  const login = (email, password) => {
    const found = MOCK_USERS.find((u) => u.email === email && u.password === password);
    if (found) { setUser(found); return true; }
    return false;
  };
  const logout = () => setUser(null);
  return { user, login, logout };
}

// ─── COMPONENTS ────────────────────────────────────────────────────

function LoginPage({ onLogin, onGuest }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handle = () => {
    const ok = onLogin(email, password);
    if (!ok) setError("Credenciales incorrectas. Intenta de nuevo.");
  };

  return (
    <div className="login-wrap">
      <div className="login-box">
        <div className="login-logo">Stylus<em>Mobile</em></div>
        <div className="login-title">Accede a tu cuenta</div>
        {error && <div className="alert alert-error" style={{marginBottom:20}}>{error}</div>}
        <div className="field" style={{marginBottom:16}}>
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com"
            onKeyDown={e => e.key === "Enter" && handle()} />
        </div>
        <div className="field" style={{marginBottom:28}}>
          <label>Contraseña</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
            onKeyDown={e => e.key === "Enter" && handle()} />
        </div>
        <button className="btn btn-gold" style={{width:"100%",justifyContent:"center",marginBottom:16}} onClick={handle}>
          Entrar
        </button>
        <button className="btn btn-outline" style={{width:"100%",justifyContent:"center"}} onClick={onGuest}>
          Ver la web pública →
        </button>
        <div style={{marginTop:24,fontSize:11,color:"#555",lineHeight:1.7}}>
          <strong style={{color:"#c9a84c"}}>Demo:</strong><br/>
          admin@stylus.com / admin123<br/>
          carlos@stylus.com / emp123<br/>
          cliente@test.com / cliente123
        </div>
      </div>
    </div>
  );
}

function Nav({ user, onLogout, onLogin }) {
  const roleLabel = { admin: "Admin", employee: "Estilista", client: "Cliente" };
  return (
    <nav className="nav">
      <div className="nav-logo">Stylus<em>Mobile</em></div>
      <div className="nav-right">
        {user ? (
          <>
            <span className="nav-role">{roleLabel[user.role]}</span>
            <span className="nav-user">{user.name}</span>
            <button className="nav-btn" onClick={onLogout}>Salir</button>
          </>
        ) : (
          <button className="nav-btn" onClick={onLogin}>Acceder</button>
        )}
      </div>
    </nav>
  );
}

// ─── PUBLIC LANDING ─────────────────────────────────────────────────
function PublicLanding({ onBook, onLogin }) {
  const [lang, setLang] = useState("es");
  const t = (es, en) => lang === "es" ? es : en;

  return (
    <div style={{paddingTop:60}}>
      {/* Lang toggle */}
      <div style={{position:"fixed",top:0,right:100,zIndex:300,display:"flex",gap:4,padding:"14px 0",height:60,alignItems:"center"}}>
        {["es","en"].map(l => (
          <button key={l} onClick={() => setLang(l)} style={{
            background:"none",border:"none",cursor:"pointer",
            fontFamily:"'Epilogue',sans-serif",fontSize:11,letterSpacing:".12em",
            textTransform:"uppercase",padding:"4px 8px",
            color: lang===l ? "#c9a84c" : "#7a7468",
            borderBottom: lang===l ? "1px solid #c9a84c" : "none"
          }}>{l}</button>
        ))}
      </div>

      {/* Hero */}
      <div className="public-hero">
        <div className="public-hero-bg"/>
        <div className="public-hero-content">
          <div className="public-logo">Stylus<em>Mobile</em></div>
          <p className="public-tagline">{t("Estilo que llega a ti", "Style that comes to you")}</p>
          <div style={{display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap"}}>
            <button className="btn btn-gold" style={{padding:"16px 40px",fontSize:13}} onClick={onBook}>
              {t("Reservar ahora", "Book now")}
            </button>
            <button className="btn btn-outline" style={{padding:"16px 40px",fontSize:13,color:"#f5f0e8",borderColor:"rgba(201,168,76,.3)"}} onClick={onLogin}>
              {t("Mi cuenta", "My account")}
            </button>
          </div>
          <div className="pub-services">
            {SERVICES.map(s => (
              <div className="pub-service" key={s.id}>
                <div className="pub-service-name">{lang==="es" ? s.name : s.nameEn}</div>
                <div style={{fontSize:12,color:"rgba(245,240,232,.4)",marginBottom:16,lineHeight:1.5}}>{s.desc}</div>
                <div className="pub-service-price">{s.price}<span>€</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gallery preview */}
      <div className="section-pub" style={{background:"#0d0d0b"}}>
        <div className="container-pub">
          <p className="section-label-pub">{t("Nuestro trabajo","Our work")}</p>
          <p className="section-title-pub" style={{color:"#f5f0e8"}}>{t("Galería","Gallery")}</p>
          <div className="gallery-grid">
            {MOCK_GALLERY.map(g => (
              <div className="gallery-item" key={g.id}>
                <img src={g.url} alt={g.caption}/>
                <div className="gallery-overlay"><span className="gallery-caption">{g.caption}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA bottom */}
      <div className="section-pub" style={{background:"#c9a84c",textAlign:"center"}}>
        <div className="container-pub">
          <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(28px,5vw,52px)",fontWeight:300,color:"#0d0d0b",marginBottom:24}}>
            {t("¿Listo para reservar?","Ready to book?")}
          </p>
          <button className="btn btn-primary" style={{fontSize:13,padding:"16px 48px"}} onClick={onBook}>
            {t("Reservar ahora","Book now")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── BOOKING MODAL ───────────────────────────────────────────────────
function BookingModal({ onClose, user }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    service: "", date: "", time: "", name: user?.name || "", phone: "", address: "", notes: ""
  });
  const [success, setSuccess] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = () => {
    const msg = `Hola, quiero reservar:\n👤 ${form.name}\n📞 ${form.phone}\n✂️ ${SERVICES.find(s=>s.id===form.service)?.name}\n📅 ${formatDate(form.date)} ${form.time}\n📍 ${form.address}${form.notes ? "\n📝 " + form.notes : ""}`;
    window.open(`https://wa.me/34600000000?text=${encodeURIComponent(msg)}`, "_blank");
    setSuccess(true);
  };

  if (success) return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{textAlign:"center",padding:"60px 40px"}}>
        <div style={{fontSize:48,marginBottom:20}}>✅</div>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,marginBottom:12}}>¡Solicitud enviada!</h2>
        <p style={{color:"#7a7468",marginBottom:32,lineHeight:1.7}}>Te hemos abierto WhatsApp con todos los datos de tu reserva. Te confirmaremos en menos de 2 horas.</p>
        <button className="btn btn-primary" onClick={onClose}>Volver</button>
      </div>
    </div>
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div className="modal-title">Reservar cita</div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#7a7468"}}>✕</button>
        </div>
        <div style={{display:"flex",gap:0,marginBottom:28}}>
          {["Servicio","Detalles","Confirmar"].map((s,i) => (
            <div key={s} style={{flex:1,textAlign:"center",padding:"8px 0",fontSize:10,letterSpacing:".1em",textTransform:"uppercase",
              borderBottom: step===i+1 ? "2px solid #c9a84c" : "2px solid #eee",
              color: step===i+1 ? "#c9a84c" : "#aaa", cursor:"pointer"
            }} onClick={() => step > i+1 && setStep(i+1)}>{s}</div>
          ))}
        </div>

        {step === 1 && (
          <div>
            <div className="service-pick-grid">
              {SERVICES.map(s => (
                <div key={s.id} className={`service-pick${form.service===s.id?" selected":""}`} onClick={() => set("service", s.id)}>
                  <div className="service-pick-check">✓</div>
                  <div className="service-pick-name">{s.name}</div>
                  <div className="service-pick-desc">{s.desc}<br/><span style={{color:"#c9a84c"}}>{s.duration}</span></div>
                  <div className="service-pick-price">{s.price}<span>€</span></div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"flex-end"}}>
              <button className="btn btn-primary" disabled={!form.service} onClick={() => setStep(2)}
                style={{opacity:form.service?1:.4}}>Continuar →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="form-grid" style={{marginBottom:16}}>
              <div className="field"><label>Tu nombre</label><input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Nombre completo"/></div>
              <div className="field"><label>Teléfono / WhatsApp</label><input value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+34 600 000 000"/></div>
              <div className="field"><label>Fecha preferida</label><input type="date" value={form.date} min={today()} onChange={e=>set("date",e.target.value)}/></div>
              <div className="field"><label>Hora preferida</label><input type="time" value={form.time} onChange={e=>set("time",e.target.value)}/></div>
              <div className="field field-full"><label>Dirección completa</label><input value={form.address} onChange={e=>set("address",e.target.value)} placeholder="Calle, número, piso, ciudad"/></div>
              <div className="field field-full"><label>Notas (opcional)</label><textarea value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Cualquier detalle especial..."/></div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <button className="btn btn-outline" onClick={() => setStep(1)}>← Atrás</button>
              <button className="btn btn-primary" disabled={!form.name||!form.phone||!form.date||!form.address}
                style={{opacity:(form.name&&form.phone&&form.date&&form.address)?1:.4}}
                onClick={() => setStep(3)}>Continuar →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{background:"#faf8f4",padding:24,marginBottom:24}}>
              <div style={{display:"grid",gap:12}}>
                {[
                  ["Servicio", SERVICES.find(s=>s.id===form.service)?.name],
                  ["Precio", `${SERVICES.find(s=>s.id===form.service)?.price}€`],
                  ["Fecha", formatDate(form.date)],
                  ["Hora", form.time],
                  ["Nombre", form.name],
                  ["Teléfono", form.phone],
                  ["Dirección", form.address],
                  form.notes && ["Notas", form.notes],
                ].filter(Boolean).map(([k,v]) => (
                  <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                    <span style={{color:"#7a7468"}}>{k}</span>
                    <span style={{fontWeight:400}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <button className="btn btn-outline" onClick={() => setStep(2)}>← Atrás</button>
              <div style={{display:"flex",gap:10}}>
                <button className="btn btn-whatsapp" onClick={submit}>💬 Confirmar por WhatsApp</button>
              </div>
            </div>
            <p style={{fontSize:11,color:"#aaa",marginTop:16,textAlign:"center"}}>
              Al confirmar, abriremos WhatsApp con tu reserva. Pago disponible en efectivo o por transferencia.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ADMIN DASHBOARD ─────────────────────────────────────────────────
function AdminDashboard({ user }) {
  const [tab, setTab] = useState("overview");
  const [bookings, setBookings] = useState(MOCK_BOOKINGS);
  const [gallery, setGallery] = useState(MOCK_GALLERY);
  const [showNewBooking, setShowNewBooking] = useState(false);

  const todayBookings = bookings.filter(b => b.date === today());
  const pendingCount = bookings.filter(b => b.status === "pending").length;
  const totalRevenue = bookings.filter(b => b.paid).reduce((s, b) => s + b.price, 0);
  const unpaidCount = bookings.filter(b => !b.paid).length;

  const updateStatus = (id, status) => setBookings(bs => bs.map(b => b.id === id ? { ...b, status } : b));
  const markPaid = (id) => setBookings(bs => bs.map(b => b.id === id ? { ...b, paid: true } : b));

  return (
    <div className="app-shell">
      <div className="sidebar">
        {[
          ["overview", "📊", "Resumen"],
          ["bookings", "📅", "Reservas"],
          ["employees", "✂️", "Estilistas"],
          ["gallery", "🖼️", "Galería"],
        ].map(([id, icon, label]) => (
          <div key={id} className={`sidebar-item${tab===id?" active":""}`} onClick={() => setTab(id)}>
            <span className="sidebar-icon">{icon}</span>{label}
          </div>
        ))}
      </div>

      <main className="main">
        {tab === "overview" && (
          <>
            <div className="page-title">Bienvenido, {user.name} 👑</div>
            <p className="page-sub">{formatDate(today())} · Panel de administración</p>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Citas hoy</div>
                <div className="stat-value">{todayBookings.length}</div>
                <div className="stat-sub">De {bookings.length} totales</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Pendientes</div>
                <div className="stat-value" style={{color:"#a86b32"}}>{pendingCount}</div>
                <div className="stat-sub">Requieren confirmación</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Ingresos cobrados</div>
                <div className="stat-value gold">{totalRevenue}€</div>
                <div className="stat-sub">{unpaidCount} citas sin cobrar</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Estilistas activos</div>
                <div className="stat-value">2</div>
                <div className="stat-sub">Carlos · María</div>
              </div>
            </div>

            <div className="card">
              <div className="card-title">Citas de hoy</div>
              {todayBookings.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon">📭</div><p>No hay citas para hoy</p></div>
              ) : todayBookings.map(b => <BookingRow key={b.id} b={b} admin onStatus={updateStatus} onPaid={markPaid}/>)}
            </div>
          </>
        )}

        {tab === "bookings" && (
          <>
            <div className="flex justify-between items-center mb-20">
              <div>
                <div className="page-title">Reservas</div>
                <p className="page-sub">Todas las citas del sistema</p>
              </div>
              <button className="btn btn-gold" onClick={() => setShowNewBooking(true)}>+ Nueva reserva</button>
            </div>
            {bookings.sort((a,b) => a.date > b.date ? 1 : -1).map(b => (
              <BookingRow key={b.id} b={b} admin onStatus={updateStatus} onPaid={markPaid}/>
            ))}
            {showNewBooking && <NewBookingModal onClose={() => setShowNewBooking(false)} onSave={nb => { setBookings(bs => [...bs, {...nb, id:"b"+Date.now(), paid:false}]); setShowNewBooking(false); }}/>}
          </>
        )}

        {tab === "employees" && (
          <>
            <div className="page-title">Estilistas</div>
            <p className="page-sub">Equipo actual</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              {MOCK_USERS.filter(u => u.role === "employee").map(emp => {
                const empBookings = bookings.filter(b => b.employeeId === emp.id);
                const empToday = empBookings.filter(b => b.date === today());
                return (
                  <div className="card" key={emp.id}>
                    <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
                      <div style={{width:52,height:52,background:"#c9a84c",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                        ✂️
                      </div>
                      <div>
                        <div style={{fontSize:18,fontFamily:"'Cormorant Garamond',serif",fontWeight:400}}>{emp.name}</div>
                        <div style={{fontSize:12,color:"#7a7468"}}>{emp.email}</div>
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                      <div style={{background:"#faf8f4",padding:"16px"}}>
                        <div style={{fontSize:10,letterSpacing:".12em",textTransform:"uppercase",color:"#7a7468",marginBottom:4}}>Citas hoy</div>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32}}>{empToday.length}</div>
                      </div>
                      <div style={{background:"#faf8f4",padding:"16px"}}>
                        <div style={{fontSize:10,letterSpacing:".12em",textTransform:"uppercase",color:"#7a7468",marginBottom:4}}>Total citas</div>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32}}>{empBookings.length}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === "gallery" && (
          <GalleryAdmin gallery={gallery} setGallery={setGallery}/>
        )}
      </main>
    </div>
  );
}

function BookingRow({ b, admin, employee, onStatus, onPaid }) {
  return (
    <div className="booking-card">
      <div className="booking-date-block">
        <div className="booking-date-day">{dayNum(b.date)}</div>
        <div className="booking-date-month">{monthAbbr(b.date)}</div>
        <div className="booking-time">{b.time}</div>
      </div>
      <div className="booking-info">
        <div className="booking-client">{b.clientName}</div>
        <div className="booking-service">{b.service} · {b.price}€ · {b.employeeName}</div>
        <div className="booking-address">📍 {b.address}</div>
        {b.clientPhone && <div className="booking-address">📞 {b.clientPhone}</div>}
      </div>
      <div className="booking-actions">
        <span className={`badge badge-${b.status}`}>{b.status === "confirmed" ? "Confirmada" : b.status === "pending" ? "Pendiente" : "Cancelada"}</span>
        <span className={`badge badge-${b.paid ? "paid" : "unpaid"}`}>{b.paid ? "Cobrada" : "Sin cobrar"}</span>
        {admin && (
          <>
            {b.status === "pending" && <button className="btn btn-outline btn-sm" onClick={() => onStatus(b.id, "confirmed")}>✓ Confirmar</button>}
            {!b.paid && <button className="btn btn-gold btn-sm" onClick={() => onPaid(b.id)}>Cobrada</button>}
            <a href={whatsappLink(b)} target="_blank" rel="noreferrer" className="btn btn-whatsapp btn-sm">💬</a>
          </>
        )}
        {employee && (
          <a href={whatsappLink(b)} target="_blank" rel="noreferrer" className="btn btn-whatsapp btn-sm">💬 WhatsApp</a>
        )}
      </div>
    </div>
  );
}

function NewBookingModal({ onClose, onSave }) {
  const [form, setForm] = useState({ clientName:"", clientPhone:"", address:"", service:"corte", date:today(), time:"10:00", employeeId:"2", employeeName:"Carlos", status:"confirmed" });
  const set = (k,v) => setForm(f => ({...f,[k]:v}));
  const save = () => {
    const svc = SERVICES.find(s => s.id === form.service);
    onSave({...form, price: svc.price, service: svc.name });
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">Nueva reserva manual</div>
        <div className="form-grid">
          <div className="field"><label>Nombre cliente</label><input value={form.clientName} onChange={e=>set("clientName",e.target.value)}/></div>
          <div className="field"><label>Teléfono</label><input value={form.clientPhone} onChange={e=>set("clientPhone",e.target.value)}/></div>
          <div className="field field-full"><label>Dirección</label><input value={form.address} onChange={e=>set("address",e.target.value)}/></div>
          <div className="field"><label>Servicio</label>
            <select value={form.service} onChange={e=>set("service",e.target.value)}>
              {SERVICES.map(s => <option key={s.id} value={s.id}>{s.name} — {s.price}€</option>)}
            </select>
          </div>
          <div className="field"><label>Estilista</label>
            <select value={form.employeeId} onChange={e => { const emp = MOCK_USERS.find(u=>u.id===e.target.value); set("employeeId",e.target.value); set("employeeName",emp?.name||""); }}>
              {MOCK_USERS.filter(u=>u.role==="employee").map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="field"><label>Fecha</label><input type="date" value={form.date} onChange={e=>set("date",e.target.value)}/></div>
          <div className="field"><label>Hora</label><input type="time" value={form.time} onChange={e=>set("time",e.target.value)}/></div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={save}>Guardar reserva</button>
        </div>
      </div>
    </div>
  );
}

function GalleryAdmin({ gallery, setGallery }) {
  const [url, setUrl] = useState(""); const [caption, setCaption] = useState("");
  const add = () => { if(!url) return; setGallery(g => [...g, {id:"g"+Date.now(), url, caption, category:"corte"}]); setUrl(""); setCaption(""); };
  const remove = (id) => setGallery(g => g.filter(i => i.id !== id));
  return (
    <>
      <div className="page-title">Galería</div>
      <p className="page-sub">Gestiona las fotos del portafolio</p>
      <div className="card" style={{marginBottom:28}}>
        <div className="card-title" style={{marginBottom:16}}>Añadir foto</div>
        <div className="form-grid">
          <div className="field field-full"><label>URL de imagen</label><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://..."/></div>
          <div className="field"><label>Descripción</label><input value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Ej: Fade clásico"/></div>
          <div style={{display:"flex",alignItems:"flex-end"}}><button className="btn btn-primary" onClick={add}>+ Añadir</button></div>
        </div>
        <p style={{fontSize:11,color:"#aaa",marginTop:12}}>💡 Conecta Supabase Storage para subir fotos desde tu dispositivo.</p>
      </div>
      <div className="gallery-grid">
        {gallery.map(g => (
          <div key={g.id} style={{position:"relative"}}>
            <div className="gallery-item">
              <img src={g.url} alt={g.caption}/>
              <div className="gallery-overlay"><span className="gallery-caption">{g.caption}</span></div>
            </div>
            <button onClick={() => remove(g.id)} style={{position:"absolute",top:8,right:8,background:"rgba(168,50,50,.9)",border:"none",color:"#fff",width:28,height:28,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── EMPLOYEE DASHBOARD ───────────────────────────────────────────────
function EmployeeDashboard({ user }) {
  const [tab, setTab] = useState("today");
  const myBookings = MOCK_BOOKINGS.filter(b => b.employeeId === user.id);
  const todayBookings = myBookings.filter(b => b.date === today());
  const upcomingBookings = myBookings.filter(b => b.date > today()).sort((a,b) => a.date>b.date?1:-1);

  return (
    <div className="app-shell">
      <div className="sidebar">
        {[["today","📅","Hoy"],["upcoming","🗓️","Próximas"]].map(([id,icon,label]) => (
          <div key={id} className={`sidebar-item${tab===id?" active":""}`} onClick={() => setTab(id)}>
            <span className="sidebar-icon">{icon}</span>{label}
          </div>
        ))}
      </div>
      <main className="main">
        {tab === "today" && (
          <>
            <div className="today-header">
              <div className="today-title">Tus citas de hoy ✂️</div>
              <div className="today-count">{todayBookings.length} cita{todayBookings.length !== 1 ? "s" : ""} · {formatDate(today())}</div>
            </div>
            {todayBookings.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">🎉</div><p>No tienes citas para hoy. ¡Descansa!</p></div>
            ) : todayBookings.map(b => <BookingRow key={b.id} b={b} employee/>)}
          </>
        )}
        {tab === "upcoming" && (
          <>
            <div className="page-title">Próximas citas</div>
            <p className="page-sub">Tus reservas futuras</p>
            {upcomingBookings.length === 0
              ? <div className="empty-state"><div className="empty-state-icon">📭</div><p>No tienes citas próximas</p></div>
              : upcomingBookings.map(b => <BookingRow key={b.id} b={b} employee/>)
            }
          </>
        )}
      </main>
    </div>
  );
}

// ─── CLIENT DASHBOARD ─────────────────────────────────────────────────
function ClientDashboard({ user, onBook }) {
  const myBookings = MOCK_BOOKINGS.filter(b => b.clientName === user.name);
  const upcoming = myBookings.filter(b => b.date >= today()).sort((a,b) => a.date>b.date?1:-1);
  const past = myBookings.filter(b => b.date < today());

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="sidebar-item active"><span className="sidebar-icon">📅</span>Mis citas</div>
      </div>
      <main className="main">
        <div className="flex justify-between items-center mb-20">
          <div>
            <div className="page-title">Hola, {user.name} 👋</div>
            <p className="page-sub">Tus reservas con Stylus Mobile</p>
          </div>
          <button className="btn btn-gold" onClick={onBook}>+ Nueva reserva</button>
        </div>

        <div className="card">
          <div className="card-title">Próximas citas</div>
          {upcoming.length === 0
            ? <div className="empty-state"><div className="empty-state-icon">📭</div><p>No tienes citas próximas.<br/>¡Reserva una ahora!</p></div>
            : upcoming.map(b => <BookingRow key={b.id} b={b}/>)
          }
        </div>

        {past.length > 0 && (
          <div className="card">
            <div className="card-title" style={{color:"#7a7468"}}>Historial</div>
            {past.map(b => <BookingRow key={b.id} b={b}/>)}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── SETUP GUIDE ─────────────────────────────────────────────────────
function SetupGuide({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{maxWidth:680}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div className="modal-title">🚀 Guía de activación real</div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#7a7468"}}>✕</button>
        </div>
        {[
          ["1️⃣ Supabase (base de datos + login)", [
            "Ve a supabase.com → Crea una cuenta gratis",
            "Crea un nuevo proyecto",
            "Ve a Settings → API → copia 'Project URL' y 'anon key'",
            "Pégalos en el código donde dice YOUR_SUPABASE_URL y YOUR_SUPABASE_ANON_KEY",
            "Ve a Authentication → Enable Email signups",
          ]],
          ["2️⃣ Stripe (pagos)", [
            "Ve a stripe.com → Crea cuenta gratis",
            "Dashboard → Developers → API Keys",
            "Copia la Publishable key (pk_live_...)",
            "Pégala donde dice YOUR_STRIPE_PUBLISHABLE_KEY",
            "Comisión: 1.5% + 0.25€ por transacción en Europa",
          ]],
          ["3️⃣ Vercel (hosting gratis)", [
            "Ve a vercel.com → Conecta con GitHub",
            "Sube el código a un repositorio de GitHub",
            "Importa el repo en Vercel → Deploy automático",
            "Tu web estará en tuapp.vercel.app (gratis)",
            "Puedes conectar tu dominio personalizado más adelante",
          ]],
          ["4️⃣ WhatsApp Business", [
            "Actualiza el número +34600000000 en el código con el tuyo real",
            "Activa WhatsApp Business en tu móvil",
            "Las reservas llegarán como mensajes pre-formateados",
          ]],
        ].map(([title, steps]) => (
          <div key={title} style={{marginBottom:24}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,marginBottom:10}}>{title}</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {steps.map((s,i) => (
                <div key={i} style={{display:"flex",gap:10,fontSize:13,color:"#3a3530",lineHeight:1.5}}>
                  <span style={{color:"#c9a84c",flexShrink:0}}>→</span>{s}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{background:"rgba(201,168,76,.1)",border:"1px solid rgba(201,168,76,.25)",padding:16,fontSize:13,lineHeight:1.6}}>
          <strong>💡 Coste total mensual:</strong> 0€ — Supabase, Vercel y Stripe son gratuitos hasta cierto volumen. Para Stylus Mobile en fase MVP, no pagarás nada.
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────
export default function App() {
  const { user, login, logout } = useAuth();
  const [view, setView] = useState("public"); // public | login | app
  const [showBooking, setShowBooking] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    if (user) setView("app");
  }, [user]);

  const handleLogin = (email, password) => {
    const ok = login(email, password);
    if (ok) setView("app");
    return ok;
  };

  const handleLogout = () => { logout(); setView("public"); };

  return (
    <>
      <style>{styles}</style>
      <Nav user={user} onLogout={handleLogout} onLogin={() => setView("login")}/>

      {view === "public" && (
        <PublicLanding onBook={() => setShowBooking(true)} onLogin={() => setView("login")}/>
      )}

      {view === "login" && (
        <LoginPage onLogin={handleLogin} onGuest={() => setView("public")}/>
      )}

      {view === "app" && user && (
        <>
          {user.role === "admin" && <AdminDashboard user={user}/>}
          {user.role === "employee" && <EmployeeDashboard user={user}/>}
          {user.role === "client" && <ClientDashboard user={user} onBook={() => setShowBooking(true)}/>}
        </>
      )}

      {showBooking && <BookingModal onClose={() => setShowBooking(false)} user={user}/>}

      {/* Setup guide button */}
      <div style={{position:"fixed",bottom:24,right:24,zIndex:500}}>
        <button className="btn btn-gold" style={{padding:"12px 20px",boxShadow:"0 4px 20px rgba(201,168,76,.3)"}}
          onClick={() => setShowSetup(true)}>
          🚀 Guía de activación
        </button>
      </div>
      {showSetup && <SetupGuide onClose={() => setShowSetup(false)}/>}
    </>
  );
}
