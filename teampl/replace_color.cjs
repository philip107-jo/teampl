const fs = require('fs');
const path = require('path');

const dirs = [
  'c:\\Users\\kjhn3\\OneDrive\\Desktop\\tp\\teampl\\src\\app\\pages',
  'c:\\Users\\kjhn3\\OneDrive\\Desktop\\tp\\teampl\\src\\app\\components',
  'c:\\Users\\kjhn3\\OneDrive\\Desktop\\tp\\teampl\\src\\styles'
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
    if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
      let content = fs.readFileSync(file, 'utf8');
      if (content.includes('#4D8DFF') || content.includes('77,141,255') || content.includes('77, 141, 255')) {
        content = content.replace(/#4D8DFF/gi, '#7C6CFF');
        content = content.replace(/77,141,255/g, '124,108,255');
        content = content.replace(/77, 141, 255/g, '124, 108, 255');
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
      }
    }
  });
});
