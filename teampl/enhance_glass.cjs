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
      const original = content;
      // Change harsh grays to navy and cool grays for glassmorphism
      content = content.replace(/text-gray-900/g, 'text-[#1A2340]');
      content = content.replace(/text-gray-800/g, 'text-[#222E54]');
      content = content.replace(/text-gray-700/g, 'text-[#7D879C]');
      content = content.replace(/text-gray-600/g, 'text-[#7D879C]');
      content = content.replace(/text-gray-500/g, 'text-[#7D879C]');
      content = content.replace(/text-gray-400/g, 'text-[#7D879C]/80');
      
      // Update background from solid gray to transparent white for glass cards
      content = content.replace(/bg-gray-50 /g, 'bg-white/40 ');
      content = content.replace(/bg-gray-100 /g, 'bg-white/50 ');
      content = content.replace(/bg-gray-200 /g, 'bg-white/60 ');

      if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
      }
    }
  });
});
