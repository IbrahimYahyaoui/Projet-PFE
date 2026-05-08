// frontend/src/pages/Home.tsx
import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { C } from "../theme";

export const Home = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ fontFamily: "Inter, sans-serif", bgcolor: "#FFFFFF", minHeight: "100vh" }}>

      {/* ══════ NAVBAR ══════ */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 6, py: 2, borderBottom: `1px solid ${C.border}`, bgcolor: "rgba(255,255,255,0.95)", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(8px)" }}>
        {/* Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, bgcolor: C.navy, borderRadius: "8px", border: `2px solid ${C.accent}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 34 34" fill="none">
              <polygon points="17,5 30,28 4,28" fill="#5FC2BA" opacity="0.95"/>
              <circle cx="17" cy="17" r="4" fill="white" opacity="0.9"/>
            </svg>
          </Box>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1rem", color: C.navy, letterSpacing: "-0.3px" }}>
            TicketFlow
          </Typography>
        </Box>

        {/* Links */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
          {["Fonctionnalités", "Analytics", "Équipe", "À propos"].map((link) => (
            <Typography key={link} sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.875rem", color: C.textMuted, fontWeight: 500, cursor: "pointer", transition: "color 0.2s", "&:hover": { color: C.accent } }}>
              {link}
            </Typography>
          ))}
        </Box>

        {/* CTA */}
        <Box
          onClick={() => navigate("/login")}
          sx={{ bgcolor: C.navy, color: "#FFFFFF", borderRadius: "8px", px: 2.5, py: 1.1, fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.2s", "&:hover": { bgcolor: C.accent, color: C.navy } }}
        >
          Se connecter →
        </Box>
      </Box>

      {/* ══════ HERO ══════ */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 8, px: 6, py: 10, background: "linear-gradient(135deg, #FFFFFF 0%, #F0FAFA 50%, #FFFFFF 100%)" }}>

        {/* Content */}
        <Box sx={{ flex: 1, maxWidth: 580 }}>
          {/* Badge */}
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, bgcolor: C.accentLight, border: `1px solid ${C.accent}30`, borderRadius: "20px", px: 1.75, py: 0.6, mb: 3 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: C.accent }} />
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "#0E9188" }}>
              Plateforme nouvelle génération
            </Typography>
          </Box>

          {/* Title */}
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "3rem", color: C.navy, lineHeight: 1.15, letterSpacing: "-1px", mb: 2.5 }}>
            Gérez vos tickets<br />
            avec{" "}
            <Box component="span" sx={{ color: C.accent }}>intelligence</Box>
            <br />et efficacité
          </Typography>

          {/* Description */}
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "1.05rem", color: C.textMuted, lineHeight: 1.7, mb: 4.5, maxWidth: 480 }}>
            TicketFlow transforme la gestion des incidents en expérience fluide. Notifications temps réel, analytics avancés, collaboration d'équipe — tout en un.
          </Typography>

          {/* Buttons */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.75, mb: 6 }}>
            <Box
              onClick={() => navigate("/login")}
              sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: C.accent, color: C.navy, borderRadius: "10px", px: 3.5, py: 1.75, fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.2s", "&:hover": { bgcolor: C.accentHover, transform: "translateY(-1px)" } }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              Commencer maintenant
            </Box>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: "transparent", color: C.navy, borderRadius: "10px", px: 3.5, py: 1.75, fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", border: `1.5px solid ${C.border}`, transition: "all 0.2s", "&:hover": { borderColor: C.accent, color: C.accent } }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
              Voir la démo
            </Box>
          </Box>

          {/* Stats */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
            {[
              { value: "500+", label: "Tickets gérés" },
              { value: "98%", label: "Satisfaction" },
              { value: "3x", label: "Plus rapide" },
            ].map((stat, i) => (
              <Box key={stat.label} sx={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1.4rem", color: C.navy }}>{stat.value}</Typography>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: C.textMuted, mt: 0.3 }}>{stat.label}</Typography>
                </Box>
                {i < 2 && <Box sx={{ width: 1, height: 36, bgcolor: C.border }} />}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Dashboard Preview */}
        <Box sx={{ flex: "0 0 480px", position: "relative" }}>
          {/* Floating notification */}
          <Box sx={{ position: "absolute", top: -16, right: -16, bgcolor: "#FFFFFF", border: `1.5px solid ${C.border}`, borderRadius: "12px", p: "10px 14px", display: "flex", alignItems: "center", gap: 1.5, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", zIndex: 10, minWidth: 200 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5FC2BA" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </Box>
            <Box>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", fontWeight: 600, color: C.navy }}>Ticket assigné !</Typography>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", color: C.textMuted }}>Serveur VPN — Critique</Typography>
            </Box>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#EF4444", flexShrink: 0 }} />
          </Box>

          {/* Main dashboard card */}
          <Box sx={{ bgcolor: "#FFFFFF", border: `1.5px solid ${C.border}`, borderRadius: "16px", overflow: "hidden", boxShadow: "0 24px 64px rgba(11,22,44,0.12), 0 4px 16px rgba(95,194,186,0.1)" }}>
            {/* Topbar */}
            <Box sx={{ bgcolor: C.navy, p: "10px 14px", display: "flex", alignItems: "center", gap: 1 }}>
              {["#EF4444", "#F97316", "#22C55E"].map((color) => (
                <Box key={color} sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color }} />
              ))}
              <Box sx={{ flex: 1, bgcolor: "rgba(255,255,255,0.1)", borderRadius: "16px", height: 18, mx: 1.5 }} />
              <Box sx={{ width: 20, height: 20, borderRadius: "50%", bgcolor: C.accent, opacity: 0.8 }} />
            </Box>

            {/* Body */}
            <Box sx={{ p: 2, bgcolor: C.bgPage }}>
              {/* Stats row */}
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, mb: 1.5 }}>
                {[
                  { num: "24", label: "Total", color: C.accent },
                  { num: "8", label: "Ouverts", color: "#3B82F6" },
                  { num: "5", label: "En cours", color: "#F97316" },
                  { num: "11", label: "Résolus", color: "#22C55E" },
                ].map((s) => (
                  <Box key={s.label} sx={{ bgcolor: "#FFFFFF", borderRadius: "8px", p: 1.25, border: `1px solid ${C.border}` }}>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1.1rem", color: s.color }}>{s.num}</Typography>
                    <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.6rem", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", mt: 0.3 }}>{s.label}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Content row */}
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                {/* Tickets */}
                <Box sx={{ bgcolor: "#FFFFFF", borderRadius: "8px", p: 1.5, border: `1px solid ${C.border}` }}>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", fontWeight: 600, color: C.navy, mb: 1 }}>Tickets récents</Typography>
                  {[
                    { dot: "#EF4444", text: "Serveur VPN inaccessible", badge: "Critique", bg: "rgba(239,68,68,0.1)", color: "#DC2626" },
                    { dot: "#F97316", text: "Accès réseau refusé", badge: "Haute", bg: "rgba(249,115,22,0.1)", color: "#EA580C" },
                    { dot: "#3B82F6", text: "Config imprimante B301", badge: "Moyenne", bg: "rgba(59,130,246,0.1)", color: "#2563EB" },
                  ].map((t) => (
                    <Box key={t.text} sx={{ display: "flex", alignItems: "center", gap: 0.75, py: 0.6, borderBottom: `1px solid ${C.bgPage}` }}>
                      <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: t.dot, flexShrink: 0 }} />
                      <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.6rem", color: C.textMuted, flex: 1 }}>{t.text}</Typography>
                      <Box sx={{ bgcolor: t.bg, color: t.color, fontSize: "0.55rem", fontWeight: 600, px: 0.6, py: 0.2, borderRadius: "4px", fontFamily: "Inter, sans-serif", flexShrink: 0 }}>{t.badge}</Box>
                    </Box>
                  ))}
                </Box>

                {/* Performance */}
                <Box sx={{ bgcolor: "#FFFFFF", borderRadius: "8px", p: 1.5, border: `1px solid ${C.border}` }}>
                  <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", fontWeight: 600, color: C.navy, mb: 1 }}>Performance équipe</Typography>
                  {[
                    { name: "Iheb B.", val: 87 },
                    { name: "Wassim Y.", val: 72 },
                    { name: "Mohamed G.", val: 65 },
                  ].map((p) => (
                    <Box key={p.name} sx={{ mb: 0.75 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.4 }}>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.6rem", color: C.textMuted }}>{p.name}</Typography>
                        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.6rem", fontWeight: 600, color: C.navy }}>{p.val}%</Typography>
                      </Box>
                      <Box sx={{ height: 4, bgcolor: C.border, borderRadius: 2, overflow: "hidden" }}>
                        <Box sx={{ height: "100%", bgcolor: C.accent, borderRadius: 2, width: `${p.val}%` }} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Floating badge */}
          <Box sx={{ position: "absolute", bottom: -12, left: -12, bgcolor: C.navy, borderRadius: "10px", p: "8px 14px", display: "flex", alignItems: "center", gap: 1, boxShadow: "0 8px 24px rgba(11,22,44,0.15)", zIndex: 10 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5FC2BA" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.7rem", fontWeight: 600, color: "#FFFFFF" }}>Taux résolution</Typography>
            <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "1rem", fontWeight: 700, color: C.accent }}>94%</Typography>
          </Box>
        </Box>
      </Box>

      {/* ══════ FEATURES ══════ */}
      <Box sx={{ px: 6, py: 10, bgcolor: "#FFFFFF" }}>
        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: "1px", textAlign: "center", mb: 1.5 }}>
          Fonctionnalités
        </Typography>
        <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "2.25rem", color: C.navy, textAlign: "center", letterSpacing: "-0.5px", mb: 1.5 }}>
          Tout ce dont votre équipe a besoin
        </Typography>
        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "1rem", color: C.textMuted, textAlign: "center", maxWidth: 520, mx: "auto", lineHeight: 1.7, mb: 7 }}>
          Une plateforme complète pensée pour les équipes techniques modernes
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2.5 }}>
          {[
            { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5FC2BA" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>, bg: C.accentLight, title: "Gestion tickets", desc: "Créez, assignez et suivez vos tickets avec priorités, catégories et statuts en temps réel." },
            { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>, bg: "rgba(59,130,246,0.1)", title: "Notifications temps réel", desc: "Alertes instantanées pour chaque assignation, commentaire ou changement de statut." },
            { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, bg: "rgba(124,58,237,0.1)", title: "My Team", desc: "Espace collaboratif avec chat d'équipe, charge de travail et suivi des performances." },
            { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, bg: "rgba(234,88,12,0.1)", title: "Analytics avancés", desc: "Tableaux de bord, graphiques de performance et export PDF pour vos rapports." },
          ].map((f) => (
            <Box key={f.title} sx={{ bgcolor: C.bgPage, border: `1px solid ${C.border}`, borderRadius: "14px", p: 3, transition: "all 0.2s", cursor: "default", "&:hover": { borderColor: C.accent, bgcolor: "#FFFFFF", transform: "translateY(-3px)" } }}>
              <Box sx={{ width: 44, height: 44, borderRadius: "10px", bgcolor: f.bg, display: "flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
                {f.icon}
              </Box>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.95rem", color: C.navy, mb: 1 }}>{f.title}</Typography>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.825rem", color: C.textMuted, lineHeight: 1.6 }}>{f.desc}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ══════ HOW IT WORKS ══════ */}
      <Box sx={{ px: 6, py: 10, bgcolor: C.bgPage }}>
        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: "1px", textAlign: "center", mb: 1.5 }}>
          Comment ça marche
        </Typography>
        <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "2.25rem", color: C.navy, textAlign: "center", letterSpacing: "-0.5px", mb: 7 }}>
          Simple, rapide, efficace
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4, position: "relative" }}>
          {/* Connecting line */}
          <Box sx={{ position: "absolute", top: 28, left: "calc(100%/6)", right: "calc(100%/6)", height: 2, bgcolor: `${C.accent}30`, zIndex: 0 }} />

          {[
            { num: "1", title: "Créez votre équipe", desc: "Invitez vos techniciens et configurez votre espace collaboratif en quelques minutes." },
            { num: "2", title: "Gérez vos tickets", desc: "Soumettez, assignez et suivez chaque incident avec priorités et historique complet." },
            { num: "3", title: "Analysez & améliorez", desc: "Consultez les analytics, exportez vos rapports et optimisez les performances." },
          ].map((step) => (
            <Box key={step.num} sx={{ textAlign: "center", position: "relative", zIndex: 1 }}>
              <Box sx={{ width: 56, height: 56, borderRadius: "50%", bgcolor: C.navy, border: `3px solid ${C.accent}`, display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2.5 }}>
                <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1.125rem", color: C.accent }}>{step.num}</Typography>
              </Box>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1rem", color: C.navy, mb: 1 }}>{step.title}</Typography>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.825rem", color: C.textMuted, lineHeight: 1.6, maxWidth: 220, mx: "auto" }}>{step.desc}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ══════ STATS ══════ */}
      <Box sx={{ px: 6, py: 7.5, bgcolor: C.navy }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
          {[
            { value: "500+", label: "Tickets traités" },
            { value: "94%", label: "Taux de résolution" },
            { value: "3x", label: "Gain de productivité" },
            { value: "24/7", label: "Disponibilité" },
          ].map((s) => (
            <Box key={s.label} sx={{ textAlign: "center" }}>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "2.5rem", color: C.accent, lineHeight: 1 }}>{s.value}</Typography>
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.825rem", color: "rgba(255,255,255,0.6)", mt: 1 }}>{s.label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ══════ TECH STACK ══════ */}
      <Box sx={{ px: 6, py: 6, bgcolor: "#FFFFFF", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "1px", textAlign: "center", mb: 3 }}>
          Construit avec des technologies modernes
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, flexWrap: "wrap" }}>
          {["React + TypeScript", "Node.js + Express", "MongoDB", "Material UI", "JWT Auth", "Recharts"].map((tech) => (
            <Box key={tech} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: C.accent }} />
              <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.875rem", fontWeight: 600, color: C.textMuted }}>{tech}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ══════ FOOTER ══════ */}
      <Box sx={{ px: 6, py: 4, bgcolor: C.navy, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 32, height: 32, bgcolor: C.navy, borderRadius: "8px", border: `2px solid ${C.accent}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="17" height="17" viewBox="0 0 34 34" fill="none">
              <polygon points="17,5 30,28 4,28" fill="#5FC2BA" opacity="0.95"/>
              <circle cx="17" cy="17" r="4" fill="white" opacity="0.9"/>
            </svg>
          </Box>
          <Typography sx={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "#FFFFFF" }}>TicketFlow</Typography>
        </Box>
        <Typography sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>
          © 2026 TicketFlow — Projet PFE Tuskens
        </Typography>
        <Box sx={{ display: "flex", gap: 3 }}>
          {["Confidentialité", "Contact", "GitHub"].map((link) => (
            <Typography key={link} sx={{ fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", cursor: "pointer", "&:hover": { color: C.accent } }}>
              {link}
            </Typography>
          ))}
        </Box>
      </Box>
    </Box>
  );
};