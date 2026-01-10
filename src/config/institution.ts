import yaml from 'js-yaml';

// Single source of truth for app configuration + theming.
// We load `theme.yaml` from the repo root as raw text (Vite `?raw`),
// then parse it at runtime in the browser. This file now supports multiple
// themes and runtime switching.
import themeYaml from '../../theme.yaml?raw';

export type ThemeId = string;

export interface ThemeConfig {
  /**
   * Human-friendly label for UI theme pickers.
   * If omitted in YAML, we fall back to the theme id.
   */
  label?: string;
  institution: {
    name: string;
    logo_url: string;
    /**
     * Optional header "lockup" to render next to the logo image.
     * Example: logo | Geoportal
     */
    logo_lockup?: {
      separator?: 'pipe' | 'none';
      right_text: string;
      right_text_style?: {
        font_family?: string;
        font_weight?: number;
        letter_spacing?: string;
      };
    };
    hero_text?: string;
    hero_description?: string;
  };
  branding?: {
    colors?: {
      primary?: string;
      active?: string;
    };
    fonts?: {
      sans?: string;
    };
  };
  api: {
    base_url: string;
    search_path?: string;
    /**
     * Extra query params to append to every API request.
     * Use `key=value` strings (value may contain `[]` etc).
     * Example: `fq=ogm_repo[]=nyu.edu`
     */
    default_query_params?: string[];
    /**
     * Legacy/special API param config used by parts of the app.
     * Example:
     * params:
     *   include_filters:
     *     schema_provider_s: "NYU"
     */
    params?: {
      include_filters?: Record<string, string>;
    };
  };
  homepage?: {
    featured?: Array<{
      title: string;
      field: string;
      value: string;
      sort: string;
      limit: number;
    }>;
  };
}

export interface ThemeRegistryConfig {
  default_theme?: ThemeId;
  themes: Record<ThemeId, ThemeConfig>;
}

const THEME_STORAGE_KEY = 'rui.theme';
const THEME_CHANGED_EVENT = 'rui:theme-changed';

function parseThemeYaml(raw: string): ThemeRegistryConfig {
  const parsed = yaml.load(raw);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid theme.yaml: expected an object at top-level');
  }
  const cfg = parsed as ThemeRegistryConfig;
  if (!cfg.themes || typeof cfg.themes !== 'object') {
    throw new Error('Invalid theme.yaml: expected `themes` map');
  }
  return cfg;
}

const registry = parseThemeYaml(themeYaml);

export function getThemeIds(): ThemeId[] {
  return Object.keys(registry.themes);
}

export function getDefaultThemeId(): ThemeId {
  const ids = getThemeIds();
  return registry.default_theme && registry.themes[registry.default_theme]
    ? registry.default_theme
    : ids[0] || 'default';
}

export function getThemeConfig(themeId: ThemeId): ThemeConfig {
  return registry.themes[themeId] || registry.themes[getDefaultThemeId()];
}

export function getThemeLabel(themeId: ThemeId): string {
  const theme = getThemeConfig(themeId);
  return theme.label || theme.institution?.name || themeId;
}

export function getAvailableThemes(): Array<{ id: ThemeId; label: string }> {
  return getThemeIds().map((id) => ({ id, label: getThemeLabel(id) }));
}

function safeReadLocalStorage(key: string): string | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function safeWriteLocalStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // ignore
  }
}

export function getActiveThemeId(): ThemeId {
  const stored = safeReadLocalStorage(THEME_STORAGE_KEY);
  if (stored && registry.themes[stored]) return stored;

  // Optional override via query param for easy sharing/debugging
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    const fromQuery = url.searchParams.get('theme');
    if (fromQuery && registry.themes[fromQuery]) return fromQuery;
  }

  return getDefaultThemeId();
}

export function applyThemeToDom(themeId: ThemeId): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = themeId;
}

export function setActiveThemeId(themeId: ThemeId): void {
  const next = registry.themes[themeId] ? themeId : getDefaultThemeId();
  safeWriteLocalStorage(THEME_STORAGE_KEY, next);
  applyThemeToDom(next);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(THEME_CHANGED_EVENT, { detail: next }));
  }
}

export function subscribeToThemeChanges(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener(THEME_CHANGED_EVENT, handler as EventListener);
  return () => window.removeEventListener(THEME_CHANGED_EVENT, handler as EventListener);
}

export function getActiveThemeConfig(): ThemeConfig {
  return getThemeConfig(getActiveThemeId());
}

