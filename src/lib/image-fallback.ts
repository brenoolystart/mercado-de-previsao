/**
 * Smart image fallback system:
 * Priority 1: Polymarket proxy (wsrv.nl)
 * Priority 2: Google Favicon API
 * Priority 3: Dynamic initials avatar (SVG data URI)
 */

const PALETTE = [
  '210, 60%, 50%',  // blue
  '152, 60%, 40%',  // green
  '340, 65%, 50%',  // pink
  '30, 80%, 50%',   // orange
  '260, 55%, 55%',  // purple
  '180, 50%, 40%',  // teal
  '0, 65%, 50%',    // red
  '45, 80%, 45%',   // gold
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getInitials(text: string): string {
  const words = text
    .replace(/[^a-zA-ZÀ-ÿ\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0 && !['de', 'do', 'da', 'das', 'dos', 'the', 'of', 'in', 'a', 'o', 'e', 'or', 'and', 'will', 'be', 'to', 'for', 'at', 'by', 'is', 'it'].includes(w.toLowerCase()));
  
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function generateInitialsAvatar(text: string, size = 80): string {
  const initials = getInitials(text);
  const color = PALETTE[hashCode(text) % PALETTE.length];
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${size / 2}" fill="hsl(${color})"/>
    <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" 
          font-family="system-ui, -apple-system, sans-serif" font-weight="700" 
          font-size="${size * 0.38}" fill="white" letter-spacing="0.5">${initials}</text>
  </svg>`;
  
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Returns an onError handler for <img> tags that tries fallbacks in order.
 * Usage: <img src={proxyImage(url)} onError={createImageFallback(title, url)} />
 */
export function createImageFallback(title: string, originalUrl?: string) {
  let attempt = 0;
  
  return (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    attempt++;
    
    if (attempt === 1 && originalUrl) {
      // Try direct URL (skip proxy)
      img.src = originalUrl;
      return;
    }
    
    if (attempt <= 2) {
      // Use initials avatar as final fallback
      img.src = generateInitialsAvatar(title);
      img.onerror = null;
      return;
    }
    
    // Give up - show initials
    img.src = generateInitialsAvatar(title);
    img.onerror = null;
  };
}
