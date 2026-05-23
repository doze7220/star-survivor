const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const jsMatch = html.match(/<script>([\s\S]*?)<\/script>/);

if (!jsMatch) {
  console.log("No script tag found.");
  process.exit(1);
}

const js = jsMatch[1];
const acorn = require('acorn');

try {
  acorn.parse(js, { ecmaVersion: 2020 });
  console.log("Syntax check passed!");
} catch (e) {
  console.error(`Syntax Error at line ${e.loc ? e.loc.line : 'unknown'}: ${e.message}`);
  // Extract a few lines around the error
  if (e.loc) {
    const lines = js.split('\n');
    const start = Math.max(0, e.loc.line - 5);
    const end = Math.min(lines.length, e.loc.line + 5);
    for (let i = start; i < end; i++) {
        console.error(`${i + 1}: ${lines[i]}`);
    }
  }
  process.exit(1);
}
