const fs = require('fs');
const path = require('path');

// Read app.ts to find mount paths
const appTs = fs.readFileSync(path.join(__dirname, 'src/app/app.ts'), 'utf8');

// Match apiRouter.use('...', ...) and app.use('...', ...)
const mountLines = appTs.split('\n').filter(l => l.includes("apiRouter.use('") || l.includes("app.use('/health"));
console.log('--- MOUNT LINES IN APP.TS ---');
mountLines.forEach(l => console.log(l.trim()));

// Let's also scan all *route*.ts files in src/modules
function getFiles(dir, match) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(file, match));
    } else if (file.toLowerCase().includes('route') && file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const routeFiles = getFiles(path.join(__dirname, 'src/modules'), 'route');
console.log('\n--- EXTRACTING ROUTES FROM FILES ---');
let totalRoutes = 0;
const allExtracted = [];

routeFiles.forEach(rf => {
  const content = fs.readFileSync(rf, 'utf8');
  const relPath = path.relative(__dirname, rf);
  
  // Regex to match router.get/post/patch/delete/put('path'
  const routeRegex = /(?:router|app)\.(get|post|put|patch|delete)\s*\(\s*(['"`])([^'"`]+)\2/g;
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const routePath = match[3];
    allExtracted.push({ file: relPath, method, routePath });
    totalRoutes++;
  }
});

console.log(`Found ${totalRoutes} endpoint definitions across ${routeFiles.length} files.`);
console.log('Sample of 20 endpoints:');
console.log(allExtracted.slice(0, 20));
