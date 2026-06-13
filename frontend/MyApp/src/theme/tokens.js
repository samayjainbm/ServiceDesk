// src/theme/tokens.js
// MANIT Bhopal design tokens — the single source of truth for color, spacing,
// radius, typography and elevation. Consumed everywhere via ThemeProvider/useTheme.
// No screen should ever hardcode a hex value again.
import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Brand strings (authoritative — from manit.ac.in / official records)
// ---------------------------------------------------------------------------
export const BRAND = {
  fullName: 'Maulana Azad National Institute of Technology, Bhopal',
  shortName: 'MANIT Bhopal',
  appName: 'MANIT ServiceDesk',
  appSubtitle: 'Campus Complaint & Inventory',
  status: 'An Institute of National Importance',
  motto: 'Education is our soul wealth',
  tagline: 'Centre of Excellence in Central India',
  established: 'Estd. September 4, 1960',
  location: 'Link Road No. 3, Bhopal, Madhya Pradesh 462003',
};

// ---------------------------------------------------------------------------
// Raw palette — MANIT royal blue + saffron, on a neutral gray ramp
// ---------------------------------------------------------------------------
const brand = {
  blue900: '#0A357E',
  blue800: '#0B3D91', // primary
  blue700: '#143F94',
  blue600: '#1D4FB3', // interactive
  blue500: '#2E63C8',
  blue300: '#7FA0DC',
  blue200: '#AFC4EC',
  blue100: '#E8EEF9', // tint bg
  saffron600: '#D9531E',
  saffron500: '#F26522', // accent
  saffron100: '#FFF1E8',
  gold: '#F4B400',
};

const gray = {
  0: '#FFFFFF',
  50: '#F6F8FB',
  100: '#EEF1F6',
  200: '#E2E7EE',
  300: '#CDD5E0',
  400: '#9AA5B5',
  500: '#6B7585',
  600: '#4A5361',
  700: '#343B46',
  800: '#1F242C',
  900: '#11151B',
};

// Secondary, per-role accents (NEVER override the MANIT-blue primary identity).
export const ROLE_ACCENTS = {
  user: { color: '#1D4FB3', tint: '#E8EEF9', onColor: '#FFFFFF' },
  worker: { color: '#059669', tint: '#E7F6F0', onColor: '#FFFFFF' },
  inventory: { color: '#D97706', tint: '#FCF1E2', onColor: '#FFFFFF' },
  pa: { color: '#5B4BD6', tint: '#ECEAFB', onColor: '#FFFFFF' },
};

export function roleAccent(role, isDark) {
  const a = ROLE_ACCENTS[role] || ROLE_ACCENTS.user;
  if (!isDark) return a;
  // Brighten accents slightly for dark surfaces.
  const darkMap = {
    user: '#4C7CE8',
    worker: '#34D399',
    inventory: '#FBBF24',
    pa: '#8B7CF0',
  };
  return { ...a, color: darkMap[role] || a.color, tint: 'rgba(255,255,255,0.08)' };
}

// ---------------------------------------------------------------------------
// Semantic color maps
// ---------------------------------------------------------------------------
export const lightColors = {
  mode: 'light',
  primary: brand.blue800,
  primaryInteractive: brand.blue600,
  primaryPressed: brand.blue900,
  primaryTint: brand.blue100,
  onPrimary: '#FFFFFF',
  gradient: [brand.blue700, brand.blue900],

  accent: brand.saffron500,
  accentPressed: brand.saffron600,
  accentTint: brand.saffron100,
  onAccent: '#FFFFFF',
  gold: brand.gold,

  bg: gray[50],
  surface: '#FFFFFF',
  surfaceAlt: gray[100],
  surfaceSunken: gray[100],
  border: gray[200],
  borderStrong: gray[300],
  overlay: 'rgba(11,21,27,0.45)',

  textPrimary: gray[900],
  textSecondary: gray[600],
  textMuted: gray[500],
  textInverse: '#FFFFFF',
  textOnTint: brand.blue800,

  success: '#059669',
  successTint: '#E7F6F0',
  warning: '#D97706',
  warningTint: '#FCF1E2',
  danger: '#DC2626',
  dangerTint: '#FCEBEB',
  info: brand.blue600,
  infoTint: brand.blue100,

  skeleton: gray[200],
  skeletonHighlight: gray[100],
  inputBg: '#FFFFFF',
};

export const darkColors = {
  mode: 'dark',
  primary: '#3B6FE0',
  primaryInteractive: '#4C7CE8',
  primaryPressed: '#2E63C8',
  primaryTint: 'rgba(76,124,232,0.16)',
  onPrimary: '#FFFFFF',
  gradient: ['#0E2350', '#0A1730'],

  accent: brand.saffron500,
  accentPressed: brand.saffron600,
  accentTint: 'rgba(242,101,34,0.16)',
  onAccent: '#FFFFFF',
  gold: brand.gold,

  bg: '#0B1220',
  surface: '#131C2E',
  surfaceAlt: '#1A2438',
  surfaceSunken: '#0E1626',
  border: '#243049',
  borderStrong: '#33405C',
  overlay: 'rgba(0,0,0,0.6)',

  textPrimary: '#EAF0F8',
  textSecondary: '#A9B6CC',
  textMuted: '#7C8AA3',
  textInverse: '#0B1220',
  textOnTint: '#C9D8F2',

  success: '#34D399',
  successTint: 'rgba(52,211,153,0.14)',
  warning: '#FBBF24',
  warningTint: 'rgba(251,191,36,0.14)',
  danger: '#F87171',
  dangerTint: 'rgba(248,113,113,0.14)',
  info: '#4C7CE8',
  infoTint: 'rgba(76,124,232,0.16)',

  skeleton: '#1E293B',
  skeletonHighlight: '#26334B',
  inputBg: '#0F1A2B',
};

// ---------------------------------------------------------------------------
// Scales
// ---------------------------------------------------------------------------
export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, '3xl': 32, '4xl': 40, '5xl': 56,
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 };

export const typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: 0.2 },
  h1: { fontSize: 26, lineHeight: 32, fontWeight: '800', letterSpacing: 0.2 },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '700' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '700', letterSpacing: 0.3 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.2 },
  overline: { fontSize: 11, lineHeight: 14, fontWeight: '800', letterSpacing: 1.2 },
};

export function makeElevation(mode) {
  const ios = (opacity, r, y) => ({
    shadowColor: mode === 'dark' ? '#000000' : '#0B1220',
    shadowOpacity: opacity,
    shadowRadius: r,
    shadowOffset: { width: 0, height: y },
  });
  return {
    0: Platform.select({ android: { elevation: 0 }, default: {} }),
    1: Platform.select({ android: { elevation: 2 }, default: ios(mode === 'dark' ? 0.4 : 0.08, 6, 2) }),
    2: Platform.select({ android: { elevation: 5 }, default: ios(mode === 'dark' ? 0.5 : 0.12, 14, 6) }),
    3: Platform.select({ android: { elevation: 12 }, default: ios(mode === 'dark' ? 0.6 : 0.18, 24, 12) }),
  };
}

export const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

// Lighten (amt > 0, toward white) or darken (amt < 0, toward black) a hex color.
// Used to derive 2-stop gradients for buttons and role-tinted app bars.
export function shade(hex, amt) {
  const n = String(hex).replace('#', '');
  if (n.length < 6) return hex;
  let r = parseInt(n.substr(0, 2), 16);
  let g = parseInt(n.substr(2, 2), 16);
  let b = parseInt(n.substr(4, 2), 16);
  const target = amt < 0 ? 0 : 255;
  const p = Math.min(1, Math.abs(amt));
  r = Math.round(r + (target - r) * p);
  g = Math.round(g + (target - g) * p);
  b = Math.round(b + (target - b) * p);
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}
