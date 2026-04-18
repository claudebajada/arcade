const fs = require('fs');
const path = require('path');

// 1. Grab command-line arguments
const [,, sourcePath, title, icon, colorClass] = process.argv;

if (!sourcePath || !title || !icon || !colorClass) {
    console.error('❌ Missing arguments!');
    console.log('Usage: node scripts/install-game.js <path/to/Game.jsx> "Game Title" "Icon" "bg-color-class"');
    console.log('Example: node scripts/install-game.js ../downloads/MathNinja.jsx "Math Ninja" "🥷" "bg-red-500"');
    console.log('Installs the game as src/games/GameName/index.jsx');
    process.exit(1);
}

// 2. Parse paths and names
const fileName = path.basename(sourcePath);                      // e.g., MathNinja.jsx
const componentName = fileName.replace(/\.jsx?$/, '');           // e.g., MathNinja
const slug = componentName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(); // e.g., math-ninja

// Destination is a folder/index.jsx, not a flat .jsx
const destDir  = path.join(__dirname, '../src/games', componentName);
const destFile = path.join(destDir, 'index.jsx');

console.log(`🚀 Installing ${title} (${componentName})...`);

// 3. Create folder and copy the game file into the project
try {
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(sourcePath, destFile);
    console.log(`✅ Copied ${fileName} to src/games/${componentName}/index.jsx`);
} catch (err) {
    console.error(`❌ Failed to copy file: ${err.message}`);
    process.exit(1);
}

// 4. Update App.js (Routing)
const appJsPath = path.join(__dirname, '../src/App.js');
let appCode = fs.readFileSync(appJsPath, 'utf8');

// Add a React.lazy import after the last existing one
if (!appCode.includes(`import('./games/${componentName}')`)) {
    // Find the last React.lazy declaration and insert after it
    const lazyRegex = /^const \w+ = React\.lazy\([^)]+\);\n/gm;
    let match;
    let lastLazyIndex = 0;
    while ((match = lazyRegex.exec(appCode)) !== null) {
        lastLazyIndex = match.index + match[0].length;
    }

    if (lastLazyIndex === 0) {
        // Fallback: insert after the last top-level import statement
        const importRegex = /^import .* from '.*';\n/gm;
        while ((match = importRegex.exec(appCode)) !== null) {
            lastLazyIndex = match.index + match[0].length;
        }
    }

    const lazyLine = `const ${componentName} = React.lazy(() => import('./games/${componentName}'));\n`;
    appCode = appCode.slice(0, lastLazyIndex) + lazyLine + appCode.slice(lastLazyIndex);

    // Add the route right before the catch-all <Route path="*"> or closing </Routes>
    const routeStatement = `          <Route path="/${slug}" element={\n            <GamePageWrapper path="/${slug}"><${componentName} /></GamePageWrapper>\n          } />\n`;
    if (appCode.includes('<Route path="*"')) {
        appCode = appCode.replace('          <Route path="*"', `${routeStatement}          <Route path="*"`);
    } else {
        appCode = appCode.replace('</Routes>', `${routeStatement}        </Routes>`);
    }

    fs.writeFileSync(appJsPath, appCode);
    console.log(`✅ Updated App.js with React.lazy import and route for /${slug}`);
} else {
    console.log(`⚠️ ${componentName} is already in App.js. Skipping routing update.`);
}

// 5. Update Gallery.jsx (Display)
const galleryPath = path.join(__dirname, '../src/Gallery.jsx');
let galleryCode = fs.readFileSync(galleryPath, 'utf8');

if (!galleryCode.includes(`id: '${slug}'`)) {
    const newGameObject = `  {
    id: '${slug}',
    title: '${title}',
    subtitle: 'a new adventure awaits',
    emoji: '${icon}',
    path: '/${slug}',
    colors: ['#3b82f6', '#8b5cf6'], // Default blue/purple gradient
    description: 'A brand new game added to the arcade!',
    tags: ['new', 'arcade'],
  },\n`;

    galleryCode = galleryCode.replace('const GAMES = [', `const GAMES = [\n${newGameObject}`);
    fs.writeFileSync(galleryPath, galleryCode);
    console.log(`✅ Added ${title} to Gallery.jsx`);
} else {
    console.log(`⚠️ ${title} is already in Gallery.jsx. Skipping gallery update.`);
}

console.log(`\n🎉 ${title} installed at src/games/${componentName}/index.jsx`);
console.log(`\nRemaining manual steps:`);
console.log(`  2. Add PAGE_META entry in src/App.js`);
console.log(`  4. Add GAME_SEO_CONTENT entry in src/components/GamePageWrapper.jsx`);
console.log(`  5. Add public/og/${slug}.png (1200×630px)`);
console.log(`  6. Add <url> block to public/sitemap.xml`);
console.log(`  7. Rebuild: docker compose up --build -d`);
