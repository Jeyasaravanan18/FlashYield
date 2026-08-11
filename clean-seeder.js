const fs = require('fs');

function removeUnsplash(file) {
    if (!fs.existsSync(file)) return;
    const code = fs.readFileSync(file, 'utf8');
    const lines = code.split('\n');
    const newLines = lines.filter(line => !line.includes('https://images.unsplash'));
    fs.writeFileSync(file, newLines.join('\n'));
}

removeUnsplash('server/src/scripts/seedSattur.js');
removeUnsplash('server/src/scripts/seedLocal.js');

console.log("Done");
