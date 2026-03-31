const fs = require('fs');
const path = require('path');

const dirs = [
  'c:\\Users\\kjhn3\\OneDrive\\Desktop\\tp\\teampl\\src\\app\\pages',
  'c:\\Users\\kjhn3\\OneDrive\\Desktop\\tp\\teampl\\src\\app\\components'
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
      const lines = content.split('\n');
      let changed = false;
      for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('bg-[#7C6CFF]') || lines[i].includes('bg-[#FF6B7A]') || lines[i].includes('bg-[#23D7A1]') || lines[i].includes('bg-[#4D8DFF]')) {
              if (lines[i].includes('text-gray-900 dark:text-white')) {
                  lines[i] = lines[i].replace(/text-gray-900 dark:text-white/g, 'text-white');
                  changed = true;
              }
              if (lines[i].includes('text-gray-700 dark:text-white/80')) {
                  lines[i] = lines[i].replace(/text-gray-700 dark:text-white\/80/g, 'text-white/80');
                  changed = true;
              }
              if (lines[i].includes('text-gray-600 dark:text-white/60')) {
                  lines[i] = lines[i].replace(/text-gray-600 dark:text-white\/60/g, 'text-white/60');
                  changed = true;
              }
          }
      }
      if (changed) {
          fs.writeFileSync(file, lines.join('\n'), 'utf8');
          console.log(`Fixed ${file}`);
      }
    }
  });
});
