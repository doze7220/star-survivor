const fs = require('fs');

const mainPath = 'd:/ozlab/star-survivor/js/main.js';
let mainContent = fs.readFileSync(mainPath, 'utf8');

const cieloObjStart = mainContent.indexOf('const Cielo = {');
if (cieloObjStart !== -1) {
    const cieloObjEnd = mainContent.indexOf('};\r\n', cieloObjStart);
    if (cieloObjEnd !== -1) {
        mainContent = mainContent.substring(0, cieloObjStart) + mainContent.substring(cieloObjEnd + 4);
    } else {
        const cieloObjEnd2 = mainContent.indexOf('};\n', cieloObjStart);
        if (cieloObjEnd2 !== -1) {
            mainContent = mainContent.substring(0, cieloObjStart) + mainContent.substring(cieloObjEnd2 + 3);
        }
    }
}

mainContent = mainContent.replace(/Cielo\.play/g, 'comm.play');

const injection = 'import Communication from "./classes/communication.js";\nconst comm = new Communication();\n\n';
mainContent = injection + mainContent;

fs.writeFileSync(mainPath, mainContent, 'utf8');

const elimPath = 'd:/ozlab/star-survivor/js/eliminator.js';
let elimContent = fs.readFileSync(elimPath, 'utf8');
elimContent = elimContent.replace(/Cielo\.play/g, 'comm.play');
fs.writeFileSync(elimPath, elimContent, 'utf8');

console.log('Replaced successfully.');
