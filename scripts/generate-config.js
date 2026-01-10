
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_PATH = path.resolve(__dirname, '../theme.yaml');
const OUTPUT_CSS_PATH = path.resolve(__dirname, '../src/config/theme.css');

// Ensure output directory exists
const configDir = path.dirname(OUTPUT_CSS_PATH);
if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
}

function hexToRgbTriplet(hex) {
    if (typeof hex !== 'string') return null;
    const raw = hex.trim();
    // Already in "R G B" format
    if (/^\d+\s+\d+\s+\d+$/.test(raw)) return raw;
    const m = raw.replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(m)) return null;
    const r = parseInt(m.slice(0, 2), 16);
    const g = parseInt(m.slice(2, 4), 16);
    const b = parseInt(m.slice(4, 6), 16);
    return `${r} ${g} ${b}`;
}

try {
    const fileContents = fs.readFileSync(CONFIG_PATH, 'utf8');
    const config = yaml.load(fileContents);

    // Generate CSS variables for each theme.
    // We emit Tailwind-friendly RGB triplets so opacity modifiers work (e.g. bg-brand/90).
    const themes = (config && config.themes) ? config.themes : null;
    if (!themes || typeof themes !== 'object') {
        throw new Error('theme.yaml must define a top-level `themes` map');
    }

    const defaultTheme = (config && config.default_theme) ? config.default_theme : null;
    const themeIds = Object.keys(themes);
    const fallbackThemeId = (defaultTheme && themes[defaultTheme]) ? defaultTheme : themeIds[0];
    const fallbackTheme = themes[fallbackThemeId] || {};

    const fallbackColors = (fallbackTheme.branding && fallbackTheme.branding.colors) ? fallbackTheme.branding.colors : {};
    const fallbackPrimary = hexToRgbTriplet(fallbackColors.primary) || '0 0 0';
    const fallbackActive = hexToRgbTriplet(fallbackColors.active) || fallbackPrimary;

    const blocks = [];

    // Default variables on :root (used before data-theme is applied)
    blocks.push(`
:root {
  --color-primary: ${fallbackPrimary};
  --color-active: ${fallbackActive};
}
    `.trim());

    themeIds.forEach((id) => {
        const theme = themes[id] || {};
        const colors = (theme.branding && theme.branding.colors) ? theme.branding.colors : {};
        const primary = hexToRgbTriplet(colors.primary) || fallbackPrimary;
        const active = hexToRgbTriplet(colors.active) || primary;
        blocks.push(`
:root[data-theme="${id}"] {
  --color-primary: ${primary};
  --color-active: ${active};
}
        `.trim());
    });

    const cssContent = blocks.join('\n\n') + '\n';
    fs.writeFileSync(OUTPUT_CSS_PATH, cssContent);
    console.log(`Generated ${OUTPUT_CSS_PATH}`);

} catch (e) {
    console.error('Error generating config:', e);
    process.exit(1);
}
