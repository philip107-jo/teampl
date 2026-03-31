const fs = require('fs');
const path = require('path');

const dirs = [
  'c:\\Users\\kjhn3\\OneDrive\\Desktop\\tp\\teampl\\src\\app\\pages',
  'c:\\Users\\kjhn3\\OneDrive\\Desktop\\tp\\teampl\\src\\app\\components'
];

const mappings = [
  // Backgrounds
  { regex: /(?<!dark:)(!)?bg-\[\#0B1020\]/g, replace: '$1bg-[#f8faff] dark:$1bg-[#0B1020]' },
  { regex: /(?<!dark:)(!)?bg-\[\#12182B\]/g, replace: '$1bg-white dark:$1bg-[#12182B]' },
  { regex: /(?<!dark:)(!)?bg-\[\#151C31\]/g, replace: '$1bg-white dark:$1bg-[#151C31]' },
  { regex: /(?<!dark:)(!)?bg-\[\#1A2340\]/g, replace: '$1bg-gray-50 dark:$1bg-[#1A2340]' },
  { regex: /(?<!dark:)(!)?bg-\[\#222E54\]/g, replace: '$1bg-gray-100 dark:$1bg-[#222E54]' },
  { regex: /(?<!dark:)(!)?bg-white\/5\b/g, replace: '$1bg-gray-100 dark:$1bg-white/5' },
  { regex: /(?<!dark:)(!)?bg-white\/10\b/g, replace: '$1bg-gray-200 dark:$1bg-white/10' },

  // Text Colors
  { regex: /(?<!dark:)(!)?text-white\b(?!\/)/g, replace: '$1text-gray-900 dark:$1text-white' },
  { regex: /(?<!dark:)(!)?text-white\/80\b/g, replace: '$1text-gray-700 dark:$1text-white/80' },
  { regex: /(?<!dark:)(!)?text-white\/70\b/g, replace: '$1text-gray-600 dark:$1text-white/70' },
  { regex: /(?<!dark:)(!)?text-white\/60\b/g, replace: '$1text-gray-500 dark:$1text-white/60' },
  { regex: /(?<!dark:)(!)?text-white\/50\b/g, replace: '$1text-gray-500 dark:$1text-white/50' },
  { regex: /(?<!dark:)(!)?text-white\/40\b/g, replace: '$1text-gray-400 dark:$1text-white/40' },
  { regex: /(?<!dark:)(!)?text-white\/30\b/g, replace: '$1text-gray-400 dark:$1text-white/30' },
  { regex: /(?<!dark:)(!)?text-white\/20\b/g, replace: '$1text-gray-300 dark:$1text-white/20' },

  // Border Colors
  { regex: /(?<!dark:)(!)?border-white\/5\b/g, replace: '$1border-gray-200 dark:$1border-white/5' },
  { regex: /(?<!dark:)(!)?border-white\/10\b/g, replace: '$1border-gray-300 dark:$1border-white/10' },
  { regex: /(?<!dark:)(!)?border-white\/20\b/g, replace: '$1border-gray-300 dark:$1border-white/20' }
];

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

dirs.forEach(dir => {
  const files = walk(dir);
  files.forEach(file => {
    if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(file, 'utf8');
      let changed = false;
      const original = content;
      mappings.forEach(m => {
        content = content.replace(m.regex, m.replace);
      });
      if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
      }
    }
  });
});
