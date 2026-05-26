'use strict';

const fs = require('fs');
const path = require('path');

function mdToHtml(md) {
  let html = md
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---$/gm, '<hr>');

  // Tables markdown → HTML
  const lines = html.split('\n');
  const result = [];
  let inTable = false;
  let isFirstRow = true;

  for (const line of lines) {
    if (line.startsWith('|')) {
      if (line.match(/^\|[-:| ]+\|$/)) {
        isFirstRow = false;
        continue;
      }
      if (!inTable) { result.push('<table>'); inTable = true; isFirstRow = true; }
      const cells = line.split('|').filter(c => c.trim());
      const tag = isFirstRow ? 'th' : 'td';
      result.push(`<tr>${cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('')}</tr>`);
      if (isFirstRow) isFirstRow = false;
    } else {
      if (inTable) { result.push('</table>'); inTable = false; isFirstRow = true; }
      if (!line) {
        result.push('');
      } else if (/^<(h[1-6]|hr|blockquote|p|div|ul|ol|li)[ >\/]/.test(line)) {
        result.push(line);
      } else {
        result.push(`<p>${line}</p>`);
      }
    }
  }
  if (inTable) result.push('</table>');

  return result.join('\n');
}

async function generatePDF(mdFile) {
  const puppeteer = require('puppeteer');
  const templatePath = path.join(__dirname, '../templates/base.html');

  if (!fs.existsSync(mdFile)) {
    process.stderr.write(`❌ Fichier introuvable : ${mdFile}\n`);
    process.exit(1);
  }
  if (!fs.existsSync(templatePath)) {
    process.stderr.write(`❌ Template introuvable : ${templatePath}\n`);
    process.exit(1);
  }

  const mdContent = fs.readFileSync(mdFile, 'utf8');
  const template = fs.readFileSync(templatePath, 'utf8');
  const bodyHtml = mdToHtml(mdContent);
  const fullHtml = template.replace('{{CONTENT}}', bodyHtml);

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

  const pdfPath = mdFile.replace(/\.md$/, '.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: { top: '1.5cm', bottom: '1.5cm', left: '1.5cm', right: '1.5cm' },
    printBackground: true
  });
  await browser.close();

  process.stdout.write(`✅ PDF généré : ${pdfPath}\n`);
}

const [,, mdFile] = process.argv;
if (!mdFile) {
  process.stderr.write('Usage: node scripts/pdf.js <fichier.md>\n');
  process.exit(1);
}

generatePDF(mdFile).catch(err => {
  process.stderr.write(`❌ Erreur PDF : ${err.message}\n`);
  process.exit(1);
});
