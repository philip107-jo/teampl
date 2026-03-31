const fs = require('fs');

const file = 'c:\\Users\\kjhn3\\OneDrive\\Desktop\\tp\\teampl\\src\\styles\\midnight-theme.css';
let css = fs.readFileSync(file, 'utf8');

const variables = `
:root {
  --theme-bg: #f8faff;
  --theme-card: #ffffff;
  --theme-card-hover: #f9fafb;
  --theme-border: rgba(0, 0, 0, 0.05);
  --theme-border-strong: rgba(0, 0, 0, 0.1);
  --theme-text: #111827;
  --theme-text-muted: #6b7280;
  --theme-text-light: rgba(0, 0, 0, 0.4);
  --theme-hero: linear-gradient(135deg, #ffffff 70%, #f3f4f6 100%);
  --theme-overlay: rgba(255, 255, 255, 0.8);
  --theme-shadow: 0 10px 30px rgba(0,0,0,0.05);
}

.dark {
  --theme-bg: #0B1020;
  --theme-card: #151C31;
  --theme-card-hover: #1A2340;
  --theme-border: rgba(255, 255, 255, 0.05);
  --theme-border-strong: rgba(255, 255, 255, 0.1);
  --theme-text: #F5F7FF;
  --theme-text-muted: #7D879C;
  --theme-text-light: rgba(255, 255, 255, 0.4);
  --theme-hero: linear-gradient(135deg, #151C31 70%, #252552 100%);
  --theme-overlay: rgba(11, 16, 32, 0.8);
  --theme-shadow: 0 10px 30px rgba(0,0,0,0.3);
}
`;

css = css.replace(/#F5F7FF/g, 'var(--theme-text)');
css = css.replace(/#151C31/g, 'var(--theme-card)');
css = css.replace(/rgba\(255,\s*255,\s*255,\s*0\.05\)/g, 'var(--theme-border)');
css = css.replace(/rgba\(255,\s*255,\s*255,\s*0\.1\)/g, 'var(--theme-border-strong)');
css = css.replace(/rgba\(255,\s*255,\s*255,\s*0\.4\)/g, 'var(--theme-text-light)');
css = css.replace(/linear-gradient\(135deg,\s*#151C31 70%,\s*#252552 100%\)/g, 'var(--theme-hero)');
css = css.replace(/#7D879C/g, 'var(--theme-text-muted)');
css = css.replace(/#0B1020/g, 'var(--theme-bg)');
css = css.replace(/#12182B/g, 'var(--theme-card)');
css = css.replace(/0\s+10px\s+30px\s+rgba\(0,\s*0,\s*0,\s*0\.3\)/g, 'var(--theme-shadow)');

if (!css.includes(':root {')) {
  fs.writeFileSync(file, variables + '\n' + css, 'utf8');
  console.log('CSS variables injected successfully.');
} else {
  console.log('CSS variables already applied.');
}
