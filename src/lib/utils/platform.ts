export type Platform = 'mac' | 'windows' | 'linux' | 'mobile';

/**
 * Detect the current platform based on user agent
 */
export function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'mac'; // SSR default

  const ua = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod|android/.test(ua)) return 'mobile';
  if (/macintosh|mac os x/.test(ua)) return 'mac';
  if (/windows|win32|win64/.test(ua)) return 'windows';

  return 'linux';
}

/**
 * Get the relevant path for the current platform
 */
export function getRelevantPath(
  macPath: string | null,
  pcPath: string | null,
  platform?: Platform
): string | null {
  const currentPlatform = platform || detectPlatform();

  if (currentPlatform === 'mobile') {
    // On mobile, show whichever path is available (prefer Mac)
    return macPath || pcPath;
  }

  if (currentPlatform === 'mac' || currentPlatform === 'linux') {
    return macPath;
  }

  return pcPath;
}

/**
 * Get the other platform's path (for display/reference)
 */
export function getOtherPath(
  macPath: string | null,
  pcPath: string | null,
  platform?: Platform
): string | null {
  const currentPlatform = platform || detectPlatform();

  if (currentPlatform === 'mac' || currentPlatform === 'linux') {
    return pcPath;
  }

  return macPath;
}

/**
 * Generate VS Code URL to open a folder/file
 */
export function generateVSCodeUrl(path: string): string {
  // VS Code URL scheme: vscode://file/path
  return `vscode://file/${encodeURIComponent(path)}`;
}

/**
 * Generate Cursor URL to open a folder/file
 */
export function generateCursorUrl(path: string): string {
  // Cursor uses the same URL scheme as VS Code
  // Format: cursor://file/absolute/path
  return `cursor://file/${path}`;
}

/**
 * Format path for display (truncate if too long)
 */
export function formatPathForDisplay(path: string, maxLength: number = 40): string {
  if (path.length <= maxLength) return path;

  // Try to show the last meaningful parts of the path
  const parts = path.split(/[\/\\]/);

  if (parts.length <= 2) {
    return `...${path.slice(-maxLength + 3)}`;
  }

  // Show first part and last few parts
  let result = parts[0] + '/...';
  let i = parts.length - 1;

  while (i > 0 && result.length + parts[i].length + 1 < maxLength) {
    result = parts[0] + '/.../' + parts.slice(i).join('/');
    i--;
  }

  return result;
}

/**
 * Check if running on a desktop platform
 */
export function isDesktop(): boolean {
  const platform = detectPlatform();
  return platform !== 'mobile';
}

/**
 * Get keyboard shortcut modifier key name for current platform
 */
export function getModifierKey(): string {
  const platform = detectPlatform();
  return platform === 'mac' ? '⌘' : 'Ctrl';
}
