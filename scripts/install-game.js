const fs = require('fs');
const path = require('path');

// 1. Grab command-line arguments
const [,, sourcePath, title, icon, colorClass] = process.argv;

if (!sourcePath || !title || !icon || !colorClass) {
    console.error('❌ Missing arguments!');
    console.log('Usage: node scripts/install-game.js <path/to/Game.jsx> "Game Title" "Icon" "bg-color-class"');
    console.log('Example: node scripts/install-game.js ../downloads/MathNinja.jsx "Math Ninja" "🥷" "bg-red-500"');
    process.exit(1);
}

// 2. Parse paths and names
const fileName = path.basename(sourcePath);                      // e.g., MathNinja.jsx
const componentName = fileName.replace(/\.jsx?$/, '');           // e.g., MathNinja
const slug = componentName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(); // e.g., math-ninja
const destPath = path.join(__dirname, '../src/games', fileName);

console.log(`🚀 Installing ${title} (${componentName})...`);

// 3. Copy the game file into the project
try {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ Copied ${fileName} to src/games/`);
} catch (err) {
    console.error(`❌ Failed to copy file: ${err.message}`);
    process.exit(1);
}

// 4. Update App.js (Routing)
const appJsPath = path.join(__dirname, '../src/App.js');
let appCode = fs.readFileSync(appJsPath, 'utf8');

// Add the import statement near the top (looks for the last import)
if (!appCode.includes(`import ${componentName}`)) {
    const importRegex = /import .* from '.*';\n/g;
    let match;
    let lastImportIndex = 0;
    while ((match = importRegex.exec(appCode)) !== null) {
        lastImportIndex = match.index + match[0].length;
    }
    const importStatement = `import ${componentName} from './games/${componentName}';\n`;
    appCode = appCode.slice(0, lastImportIndex) + importStatement + appCode.slice(lastImportIndex);
    
    // Add the route right before the closing </Routes> tag
    const routeStatement = `        <Route path="/${slug}" element={<${componentName} />} />\n`;
    appCode = appCode.replace('</Routes>', `${routeStatement}</Routes>`);
    
    fs.writeFileSync(appJsPath, appCode);
    console.log(`✅ Updated App.js with routing for /${slug}`);
} else {
    console.log(`⚠️ ${componentName} is already in App.js. Skipping routing update.`);
}

// 5. Update Gallery.jsx (Display)
const galleryPath = path.join(__dirname, '../src/Gallery.jsx');
let galleryCode = fs.readFileSync(galleryPath, 'utf8');

if (!galleryCode.includes(`id: '${slug}'`)) {
    // Generate the correct object structure for your gallery
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
    
    // Look for the uppercase GAMES array
    galleryCode = galleryCode.replace('const GAMES = [', `const GAMES = [\n${newGameObject}`);
    
    fs.writeFileSync(galleryPath, galleryCode);
    console.log(`✅ Added ${title} to Gallery.jsx`);
} else {
    console.log(`⚠️ ${title} is already in Gallery.jsx. Skipping gallery update.`);
}

console.log(`🎉 Success! ${title} has been installed. Restart your dev server if it's running.`);
