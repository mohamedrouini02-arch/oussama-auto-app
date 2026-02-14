const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

const standaloneDir = path.join(__dirname, '../.next/standalone/web');
const publicSrc = path.join(__dirname, '../public');
const publicDest = path.join(standaloneDir, 'public');
const staticSrc = path.join(__dirname, '../.next/static');
const staticDest = path.join(standaloneDir, '.next/static');

console.log('Copying public folder...');
if (fs.existsSync(publicSrc)) {
    copyDir(publicSrc, publicDest);
}

console.log('Copying .next/static folder...');
if (fs.existsSync(staticSrc)) {
    copyDir(staticSrc, staticDest);
}

console.log('Standalone build preparation complete.');
