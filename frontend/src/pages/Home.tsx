import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";
import { C } from "../theme";

export const Home = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Étoiles animées ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars: { x: number; y: number; r: number; speed: number; opacity: number }[] = [];

    for (let i = 0; i < 180; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        speed: Math.random() * 0.3 + 0.05,
        opacity: Math.random() * 0.8 + 0.2,
      });
    }

    let animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();
        star.y += star.speed;
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }
        star.opacity = 0.2 + Math.abs(Math.sin(Date.now() * 0.001 + star.x)) * 0.8;
      });
      animId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <Box sx={{
      minHeight: "100vh",
      bgcolor: "#000000",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* ── Canvas étoiles ── */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0, left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      />

      {/* ── Navbar ── */}
      <Box sx={{
        position: "relative",
        zIndex: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 5,
        py: 2.5,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        {/* Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="9" fill={C.navy} />
            <polygon points="18,7 30,29 6,29" fill={C.accent} opacity="0.95" />
            <polygon points="18,12 27,29 9,29" fill="white" opacity="0.15" />
            <circle cx="18" cy="18" r="3.8" fill="white" opacity="0.95" />
          </svg>
          <Typography
            fontSize={16}
            fontWeight={700}
            color="#FFFFFF"
            fontFamily="Inter, sans-serif"
            letterSpacing={0.3}
          >
            TicketFlow
          </Typography>
        </Box>

        {/* Nav links */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Typography
            fontSize={13}
            color="rgba(255,255,255,0.6)"
            fontFamily="Inter, sans-serif"
            sx={{
              cursor: "pointer",
              transition: "color 0.2s",
              "&:hover": { color: C.accent },
            }}
          >
            Home
          </Typography>
          <Typography
            fontSize={13}
            color="rgba(255,255,255,0.6)"
            fontFamily="Inter, sans-serif"
            sx={{
              cursor: "pointer",
              transition: "color 0.2s",
              "&:hover": { color: C.accent },
            }}
          >
            About
          </Typography>
          <Typography
            fontSize={13}
            color="rgba(255,255,255,0.6)"
            fontFamily="Inter, sans-serif"
            sx={{
              cursor: "pointer",
              transition: "color 0.2s",
              "&:hover": { color: C.accent },
            }}
          >
            Contact
          </Typography>
        </Box>

        
      </Box>

      {/* ── HERO CONTENT ── */}
      <Box sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        zIndex: 2,
        textAlign: "center",
        px: 4,
        pb: 8,
      }}>
        

        {/* Main title */}
        <Typography
          fontWeight={300}
          color="rgba(255,255,255,0.85)"
          fontFamily="Inter, sans-serif"
          sx={{
            fontSize: { xs: "2.5rem", md: "4rem" },
            lineHeight: 1.1,
            letterSpacing: "-1px",
            mb: 1,
          }}
        >
          Smart Ticket
        </Typography>
        <Typography
          fontWeight={800}
          fontFamily="Inter, sans-serif"
          sx={{
            fontSize: { xs: "3rem", md: "5.5rem" },
            lineHeight: 1,
            letterSpacing: "-2px",
            mb: 3,
            background: `linear-gradient(135deg, ${C.accent} 0%, #FFFFFF 60%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Management !
        </Typography>

        <Typography
          fontSize={16}
          color="rgba(255,255,255,0.45)"
          fontFamily="Inter, sans-serif"
          sx={{
            maxWidth: 500,
            lineHeight: 1.7,
            mb: 5,
          }}
        >
          We deliver a powerful ticket management solution
          to streamline your support workflow and boost team productivity.
        </Typography>

        {/* CTA Buttons */}
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Button
            variant="contained"
            disableElevation
            onClick={() => navigate("/login")}
            sx={{
              bgcolor: C.accent,
              color: C.navy,
              borderRadius: "50px",
              px: 4,
              py: 1.5,
              fontSize: 15,
              fontWeight: 700,
              fontFamily: "Inter, sans-serif",
              textTransform: "none",
              boxShadow: `0 0 30px rgba(95,194,186,0.4)`,
              transition: "all 0.3s ease",
              "&:hover": {
                bgcolor: C.accentHover,
                transform: "translateY(-2px)",
                boxShadow: `0 8px 30px rgba(95,194,186,0.5)`,
              },
            }}
          >
            Access Platform →
          </Button>

          <Button
            variant="text"
            sx={{
              color: "rgba(255,255,255,0.4)",
              borderRadius: "50px",
              px: 3,
              py: 1.5,
              fontSize: 14,
              fontFamily: "Inter, sans-serif",
              textTransform: "none",
              "&:hover": {
                color: "rgba(255,255,255,0.7)",
                bgcolor: "rgba(255,255,255,0.05)",
              },
            }}
          >
            Learn more
          </Button>
        </Box>

        {/* Stats */}
        <Box sx={{
          display: "flex",
          gap: 5,
          mt: 8,
          pt: 6,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          {[
            { value: "10K+", label: "Users worldwide" },
            { value: "99.9%", label: "Uptime" },
            { value: "50K+", label: "Tickets resolved" },
          ].map((stat) => (
            <Box key={stat.label} sx={{ textAlign: "center" }}>
              <Typography
                fontSize={26}
                fontWeight={700}
                color={C.accent}
                fontFamily="Inter, sans-serif"
                sx={{ letterSpacing: "-0.5px" }}
              >
                {stat.value}
              </Typography>
              <Typography
                fontSize={12}
                color="rgba(255,255,255,0.35)"
                fontFamily="Inter, sans-serif"
                mt={0.3}
              >
                {stat.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Footer ── */}
      <Box sx={{
        position: "relative",
        zIndex: 2,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 2,
        pb: 3,
        borderTop: "1px solid rgba(255,255,255,0.05)",
        pt: 2,
      }}>
        <Typography
          fontSize={12}
          color="rgba(255,255,255,0.2)"
          fontFamily="Inter, sans-serif"
        >
          Privacy policy
        </Typography>
        <Typography fontSize={12} color="rgba(255,255,255,0.1)">|</Typography>
        <Typography
          fontSize={12}
          color="rgba(255,255,255,0.2)"
          fontFamily="Inter, sans-serif"
        >
          Terms & conditions
        </Typography>
        <Typography fontSize={12} color="rgba(255,255,255,0.1)">|</Typography>
        <Typography
          fontSize={12}
          color="rgba(255,255,255,0.2)"
          fontFamily="Inter, sans-serif"
        >
          TicketFlow ©, 2026
        </Typography>
      </Box>
    </Box>
  );
};