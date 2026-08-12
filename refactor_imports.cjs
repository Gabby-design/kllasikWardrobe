const fs = require('fs');
const path = require('path');

const directories = ['app', 'components', 'store', 'data', 'lib'];

const replacements = [
  // CSS
  { from: /import '\.\.\/src\/index\.css';/g, to: "import './globals.css';" },
  // Components
  { from: /\.\.\/src\/components\//g, to: '../components/' },
  { from: /\.\.\/\.\.\/src\/components\//g, to: '../../components/' },
  { from: /\.\.\/\.\.\/\.\.\/src\/components\//g, to: '../../../components/' },
  // Store
  { from: /\.\.\/src\/store\//g, to: '../store/' },
  { from: /\.\.\/\.\.\/src\/store\//g, to: '../../store/' },
  // Data
  { from: /\.\.\/src\/data\//g, to: '../data/' },
  { from: /\.\.\/\.\.\/src\/data\//g, to: '../../data/' },
  // Supabase Client
  { from: /\.\.\/utils\/supabase\/client/g, to: '../lib/client/supabase' },
  { from: /\.\.\/\.\.\/utils\/supabase\/client/g, to: '../../lib/client/supabase' },
  // Supabase Server & Admin
  { from: /\.\.\/\.\.\/\.\.\/utils\/supabase\/server/g, to: '../../../lib/server/supabase' },
  { from: /\.\.\/\.\.\/utils\/supabase\/server/g, to: '../../lib/server/supabase' },
  { from: /\.\.\/\.\.\/utils\/supabase\/admin/g, to: '../../lib/server/supabase' },
  // Brevo
  { from: /\.\.\/\.\.\/lib\/brevo/g, to: '../../lib/server/brevo' },
];

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      let changed = false;
      
      for (const replacement of replacements) {
        if (content.match(replacement.from)) {
          content = content.replace(replacement.from, replacement.to);
          changed = true;
        }
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`Updated imports in ${fullPath}`);
      }
    }
  }
}

directories.forEach(processDirectory);
