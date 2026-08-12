const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;

// Map from old path to new path
const moves = [
  { old: 'components', new: 'frontend/components' },
  { old: 'lib/client', new: 'frontend/lib' },
  { old: 'lib/server/products.ts', new: 'backend/services/products.ts' },
  { old: 'lib/server/orders.ts', new: 'backend/services/orders.ts' },
  { old: 'lib/server/brevo.ts', new: 'backend/services/brevo.ts' },
  { old: 'lib/server/supabase.ts', new: 'backend/lib/supabase.ts' },
  { old: 'app/actions', new: 'backend/actions' }
];

function getOldPath(newAbsPath) {
  const relPath = path.relative(projectRoot, newAbsPath).replace(/\\/g, '/');
  
  for (const move of moves) {
    if (relPath === move.new) {
      return move.old;
    }
    if (relPath.startsWith(move.new + '/')) {
      return relPath.replace(move.new, move.old);
    }
  }
  return relPath;
}

function getNewPath(oldAbsPath) {
  const relPath = path.relative(projectRoot, oldAbsPath).replace(/\\/g, '/');
  
  for (const move of moves) {
    // Exact match or prefix match
    if (relPath === move.old) {
      return move.new;
    }
    // Handle files that were moved because their parent was moved
    // E.g. lib/server/products (without extension if resolved early, though usually we have full extension)
    // Wait, the resolved path might not have an extension.
    if (relPath.startsWith(move.old + '/')) {
      return relPath.replace(move.old, move.new);
    }
  }
  
  // Specific file moves without extensions
  if (relPath === 'lib/server/products') return 'backend/services/products';
  if (relPath === 'lib/server/orders') return 'backend/services/orders';
  if (relPath === 'lib/server/brevo') return 'backend/services/brevo';
  if (relPath === 'lib/server/supabase') return 'backend/lib/supabase';
  
  return relPath;
}

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        processDirectory(fullPath);
      }
    } else if (fullPath.match(/\.(js|jsx|ts|tsx)$/)) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      
      const oldAbsPathFile = path.join(projectRoot, getOldPath(fullPath));
      
      let changed = false;
      const newContent = content.replace(/(import .*?from |import |require\()(['"])(.*?)\2/g, (match, prefix, quote, importPath) => {
        if (!importPath.startsWith('.')) return match; // Not relative
        
        // 1. Resolve old absolute path of target
        const oldTargetDir = path.dirname(oldAbsPathFile);
        const oldTargetAbs = path.resolve(oldTargetDir, importPath);
        
        // 2. Map old target to new target
        const newTargetRel = getNewPath(oldTargetAbs);
        const newTargetAbs = path.join(projectRoot, newTargetRel);
        
        // 3. Compute new relative path
        let newImportPath = path.relative(path.dirname(fullPath), newTargetAbs).replace(/\\/g, '/');
        if (!newImportPath.startsWith('.')) {
          newImportPath = './' + newImportPath;
        }
        
        if (newImportPath !== importPath) {
          changed = true;
          return `${prefix}${quote}${newImportPath}${quote}`;
        }
        return match;
      });
      
      if (changed) {
        fs.writeFileSync(fullPath, newContent, 'utf-8');
        console.log(`Updated imports in ${path.relative(projectRoot, fullPath)}`);
      }
    }
  }
}

['app', 'frontend', 'backend'].forEach(dir => processDirectory(path.join(projectRoot, dir)));
