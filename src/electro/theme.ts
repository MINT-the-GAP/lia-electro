export type ElectroThemeMode = 'light' | 'dark';

export interface ElectroTheme {
  mode: ElectroThemeMode;
  foreground: string;
  accent: string;
  action: string;
  surface: string;
  surfaceMuted: string;
  onAccent: string;
  shadow: string;
  backdrop: string;
}

interface RgbColor {
  red: number;
  green: number;
  blue: number;
}

const LIGHT_FOREGROUND = '#172033';
const LIGHT_SURFACE = '#ffffff';
const LIGHT_SURFACE_MUTED = '#f2f5f7';
const DARK_FOREGROUND = '#ffffff';
const DARK_SURFACE = '#151a1c';
const DARK_SURFACE_MUTED = '#20282b';
const FALLBACK_ACCENT = '#b41f65';

export function resolveElectroTheme(neutral: string, accent: string): ElectroTheme {
  const neutralRgb = parseCssColor(neutral) || parseCssColor(LIGHT_FOREGROUND)!;
  const mode: ElectroThemeMode = relativeLuminance(neutralRgb) > 0.55 ? 'dark' : 'light';
  const foreground = parseCssColor(neutral)
    ? neutral.trim()
    : (mode === 'dark' ? DARK_FOREGROUND : LIGHT_FOREGROUND);
  const accentRgb = parseCssColor(accent) || parseCssColor(FALLBACK_ACCENT)!;
  const accentColor = parseCssColor(accent) ? accent.trim() : FALLBACK_ACCENT;
  const surface = mode === 'dark' ? DARK_SURFACE : LIGHT_SURFACE;
  const surfaceMuted = mode === 'dark' ? DARK_SURFACE_MUTED : LIGHT_SURFACE_MUTED;
  const surfaceRgb = parseCssColor(surface)!;

  // lia-coordinate uses the raw accent for its grid. Pull the interaction
  // color towards the foreground until it remains legible on the board.
  let foregroundWeight = mode === 'dark' ? 0.58 : 0.24;
  let actionRgb = mixColors(accentRgb, neutralRgb, foregroundWeight);
  while (contrastRatioRgb(actionRgb, surfaceRgb) < 4.5 && foregroundWeight < 0.9) {
    foregroundWeight += 0.08;
    actionRgb = mixColors(accentRgb, neutralRgb, foregroundWeight);
  }

  const black = parseCssColor('#111827')!;
  const white = parseCssColor('#ffffff')!;
  const onAccent = contrastRatioRgb(accentRgb, black) >= contrastRatioRgb(accentRgb, white)
    ? '#111827'
    : '#ffffff';

  return {
    mode,
    foreground,
    accent: accentColor,
    action: toHex(actionRgb),
    surface,
    surfaceMuted,
    onAccent,
    shadow: mode === 'dark' ? 'rgba(0, 0, 0, 0.48)' : 'rgba(15, 23, 42, 0.2)',
    backdrop: mode === 'dark' ? 'rgba(0, 0, 0, 0.68)' : 'rgba(15, 23, 42, 0.42)',
  };
}

export function parseCssColor(input: string): RgbColor | null {
  const value = String(input || '').trim().toLowerCase();
  const hex = value.match(/^#([0-9a-f]{3,8})$/i)?.[1];
  if (hex) {
    if (hex.length === 3 || hex.length === 4) {
      return {
        red: Number.parseInt(hex[0] + hex[0], 16),
        green: Number.parseInt(hex[1] + hex[1], 16),
        blue: Number.parseInt(hex[2] + hex[2], 16),
      };
    }
    if (hex.length === 6 || hex.length === 8) {
      return {
        red: Number.parseInt(hex.slice(0, 2), 16),
        green: Number.parseInt(hex.slice(2, 4), 16),
        blue: Number.parseInt(hex.slice(4, 6), 16),
      };
    }
  }

  const functional = value.match(/^rgba?\((.*)\)$/i)?.[1];
  if (!functional) return null;
  const channels = functional
    .split('/')[0]
    .replace(/,/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .map(parseChannel);
  if (channels.length !== 3 || channels.some((channel) => channel == null)) return null;
  return { red: channels[0]!, green: channels[1]!, blue: channels[2]! };
}

export function contrastRatio(left: string, right: string): number {
  const leftRgb = parseCssColor(left);
  const rightRgb = parseCssColor(right);
  return leftRgb && rightRgb ? contrastRatioRgb(leftRgb, rightRgb) : 1;
}

function parseChannel(value: string): number | null {
  const percentage = value.endsWith('%');
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return null;
  return clamp(percentage ? parsed * 255 / 100 : parsed, 0, 255);
}

function mixColors(left: RgbColor, right: RgbColor, rightWeight: number): RgbColor {
  const weight = clamp(rightWeight, 0, 1);
  return {
    red: left.red * (1 - weight) + right.red * weight,
    green: left.green * (1 - weight) + right.green * weight,
    blue: left.blue * (1 - weight) + right.blue * weight,
  };
}

function relativeLuminance(color: RgbColor): number {
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(color.red) + 0.7152 * channel(color.green) + 0.0722 * channel(color.blue);
}

function contrastRatioRgb(left: RgbColor, right: RgbColor): number {
  const light = Math.max(relativeLuminance(left), relativeLuminance(right));
  const dark = Math.min(relativeLuminance(left), relativeLuminance(right));
  return (light + 0.05) / (dark + 0.05);
}

function toHex(color: RgbColor): string {
  const channel = (value: number) => Math.round(clamp(value, 0, 255)).toString(16).padStart(2, '0');
  return `#${channel(color.red)}${channel(color.green)}${channel(color.blue)}`;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
