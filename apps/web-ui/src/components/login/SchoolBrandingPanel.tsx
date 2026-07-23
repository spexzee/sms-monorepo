import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  School as SchoolIcon,
  LocationOn,
  Email,
  Phone,
  Language,
} from '@mui/icons-material';
import type { SchoolBranding } from '../../hooks/useSubdomainSchool';

interface SchoolBrandingPanelProps {
  school: SchoolBranding | null;
}

/** SMS Platform logo mark */
const SmsLogo: React.FC<{ size?: number }> = ({ size = 44 }) => (
  <Box
    sx={{
      width: size,
      height: size,
      borderRadius: '12px',
      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
      flexShrink: 0,
    }}
  >
    <SchoolIcon sx={{ color: 'white', fontSize: size * 0.55 }} />
  </Box>
);

/** School logo — image if available, fallback to initial */
const SchoolLogoMark: React.FC<{
  logo?: string;
  name?: string;
  primaryColor?: string;
  size?: number;
}> = ({ logo, name, primaryColor, size = 44 }) => {
  if (logo) {
    return (
      <Box
        component="img"
        src={logo}
        alt={name}
        sx={{
          width: size,
          height: size,
          borderRadius: '12px',
          objectFit: 'contain',
          bgcolor: 'white',
          p: '5px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          flexShrink: 0,
        }}
      />
    );
  }

  const initial = name?.[0]?.toUpperCase() ?? 'S';
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '12px',
        background: primaryColor
          ? `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}CC 100%)`
          : 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 900,
        fontSize: size * 0.45,
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        flexShrink: 0,
        letterSpacing: '-1px',
      }}
    >
      {initial}
    </Box>
  );
};

const SchoolBrandingPanel: React.FC<SchoolBrandingPanelProps> = ({ school }) => {
  const theme = school?.loginTheme;
  const primary = theme?.primaryColor || '#6366F1';
  const bg = theme?.backgroundColor || '#0F172A';
  const accent = theme?.accentColor || '#8B5CF6';

  // Determine if we should use dark or light text based on bg
  const isDarkBg = !theme?.backgroundColor; // Default dark bg
  const heroTextColor = theme?.textColor || (isDarkBg ? '#F8FAFC' : '#1E293B');
  const subTextColor = isDarkBg ? 'rgba(248,250,252,0.65)' : '#64748B';

  if (!school) {
    // ── Default generic branding ──
    return (
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          position: 'relative',
          flexDirection: 'column',
          p: 6,
          overflow: 'hidden',
          background: 'linear-gradient(145deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)',
        }}
      >
        {/* Decorative blobs */}
        <Box sx={{ position: 'absolute', top: '-80px', right: '-80px', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)', zIndex: 0 }} />
        <Box sx={{ position: 'absolute', bottom: '-100px', left: '-60px', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)', zIndex: 0 }} />
        <Box sx={{ position: 'absolute', top: '40%', left: '60%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', zIndex: 0 }} />

        {/* Dot grid */}
        <Box sx={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px', zIndex: 0 }} />

        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 'auto' }}>
            <SmsLogo size={42} />
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: '#F8FAFC', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                SMS Edu
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: 'rgba(248,250,252,0.5)', fontWeight: 500, letterSpacing: '0.05em' }}>
                SOLUTION
              </Typography>
            </Box>
          </Box>

          {/* Hero */}
          <Box sx={{ my: 'auto' }}>
            <Box
              sx={{
                display: 'inline-block',
                px: 1.5, py: 0.5,
                bgcolor: 'rgba(99,102,241,0.15)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: '20px',
                mb: 3,
              }}
            >
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#A5B4FC', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                School Management Platform
              </Typography>
            </Box>

            <Typography
              sx={{
                fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)',
                fontWeight: 900,
                lineHeight: 1.1,
                mb: 3,
                background: 'linear-gradient(135deg, #F8FAFC 0%, #C7D2FE 50%, #A5B4FC 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-1.5px',
              }}
            >
              Elevate Your School's Potential.
            </Typography>
            <Typography sx={{ color: 'rgba(248,250,252,0.55)', fontSize: '1rem', lineHeight: 1.7, maxWidth: 400 }}>
              The all-in-one solution for modern school management. Streamline administrative tasks, track student progress, and engage parents effortlessly.
            </Typography>
          </Box>

          {/* Stats row */}
          <Box sx={{ display: 'flex', gap: 4, mt: 'auto', pt: 4, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {[['500+', 'Schools'], ['50K+', 'Students'], ['99.9%', 'Uptime']].map(([num, label]) => (
              <Box key={label}>
                <Typography sx={{ fontWeight: 900, fontSize: '1.4rem', color: '#F8FAFC', lineHeight: 1 }}>{num}</Typography>
                <Typography sx={{ fontSize: '0.75rem', color: 'rgba(248,250,252,0.45)', fontWeight: 500, mt: 0.25 }}>{label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  // ── School-specific branding ──
  return (
    <Box
      sx={{
        flex: 1,
        display: { xs: 'none', md: 'flex' },
        position: 'relative',
        flexDirection: 'column',
        p: 6,
        overflow: 'hidden',
        bgcolor: bg,
        transition: 'background-color 0.5s ease',
      }}
    >
      {/* Decorative blobs using school colors */}
      <Box sx={{ position: 'absolute', top: '-100px', right: '-100px', width: 380, height: 380, borderRadius: '50%', background: `radial-gradient(circle, ${primary}40 0%, transparent 70%)`, zIndex: 0 }} />
      <Box sx={{ position: 'absolute', bottom: '-80px', left: '-80px', width: 350, height: 350, borderRadius: '50%', background: `radial-gradient(circle, ${accent}30 0%, transparent 70%)`, zIndex: 0 }} />

      {/* Subtle dot grid */}
      <Box
        sx={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(${isDarkBg ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'} 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
          zIndex: 0,
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* ── Collab Logo Row ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, mb: 'auto' }}>
          {/* School logo + name */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SchoolLogoMark logo={school.schoolLogo} name={school.schoolName} primaryColor={primary} size={44} />
            <Box sx={{ maxWidth: 160 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: heroTextColor, lineHeight: 1.2, letterSpacing: '-0.3px' }}>
                {school.schoolName}
              </Typography>
            </Box>
          </Box>

          {/* × connector */}
          <Box
            sx={{
              mx: 2,
              width: 28, height: 28,
              borderRadius: '50%',
              bgcolor: isDarkBg ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              border: `1px solid ${isDarkBg ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isDarkBg ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
              fontSize: '0.85rem',
              fontWeight: 300,
              flexShrink: 0,
            }}
          >
            ×
          </Box>

          {/* SMS logo + name */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SmsLogo size={44} />
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: heroTextColor, lineHeight: 1.2, letterSpacing: '-0.3px' }}>
                SMS Edu
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: subTextColor, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                Solution
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* ── Hero Content ── */}
        <Box sx={{ my: 'auto', py: 4 }}>
          {/* Pill label */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              px: 1.5, py: 0.6,
              bgcolor: `${primary}20`,
              border: `1px solid ${primary}40`,
              borderRadius: '20px',
              mb: 3,
            }}
          >
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: primary, boxShadow: `0 0 6px ${primary}` }} />
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: primary, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Official School Portal
            </Typography>
          </Box>

          <Typography
            sx={{
              fontSize: 'clamp(1.8rem, 3vw, 2.8rem)',
              fontWeight: 900,
              lineHeight: 1.12,
              mb: 2.5,
              color: heroTextColor,
              letterSpacing: '-1.5px',
            }}
          >
            {school.schoolTagline || `Welcome to\n${school.schoolName}`}
          </Typography>

          <Typography sx={{ color: subTextColor, fontSize: '0.95rem', lineHeight: 1.7, maxWidth: 380 }}>
            Powered by <Box component="span" sx={{ color: primary, fontWeight: 700 }}>SMS Edu Solution</Box> — the all-in-one school management platform.
          </Typography>
        </Box>

        {/* ── Info Card ── */}
        {(school.schoolAddress || school.schoolEmail || school.schoolContact || school.schoolWebsite) && (
          <Box
            sx={{
              mt: 'auto',
              p: 2.5,
              borderRadius: '16px',
              background: isDarkBg
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(16px)',
              border: isDarkBg
                ? '1px solid rgba(255,255,255,0.1)'
                : '1px solid rgba(255,255,255,0.8)',
              boxShadow: isDarkBg
                ? '0 4px 24px rgba(0,0,0,0.3)'
                : '0 4px 24px rgba(0,0,0,0.06)',
            }}
          >
            {school.schoolAddress && (
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, mb: 1.5 }}>
                <Box
                  sx={{
                    width: 28, height: 28, borderRadius: '8px',
                    bgcolor: `${primary}20`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}
                >
                  <LocationOn sx={{ fontSize: 14, color: primary }} />
                </Box>
                <Typography sx={{ fontSize: '0.82rem', color: isDarkBg ? 'rgba(248,250,252,0.75)' : '#475569', lineHeight: 1.5, mt: 0.4 }}>
                  {school.schoolAddress}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {school.schoolEmail && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Email sx={{ fontSize: 13, color: primary }} />
                  <Typography sx={{ fontSize: '0.78rem', color: isDarkBg ? 'rgba(248,250,252,0.6)' : '#64748B', fontWeight: 500 }}>
                    {school.schoolEmail}
                  </Typography>
                </Box>
              )}
              {school.schoolContact && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Phone sx={{ fontSize: 13, color: primary }} />
                  <Typography sx={{ fontSize: '0.78rem', color: isDarkBg ? 'rgba(248,250,252,0.6)' : '#64748B', fontWeight: 500 }}>
                    {school.schoolContact}
                  </Typography>
                </Box>
              )}
              {school.schoolWebsite && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Language sx={{ fontSize: 13, color: primary }} />
                  <Typography
                    component="a"
                    href={school.schoolWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ fontSize: '0.78rem', color: primary, fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                  >
                    {school.schoolWebsite.replace(/^https?:\/\//, '')}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SchoolBrandingPanel;
