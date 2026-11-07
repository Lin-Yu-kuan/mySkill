import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const source = readFileSync(new URL('resources/annotator-overlay.js', root), 'utf8').replaceAll('\r\n', '\n');
// Encode the complete source; do not strip comments with regex (URLs and strings can contain //).
const bookmarklet = 'javascript:' + encodeURIComponent(source).replaceAll("'", '%27');
const installerPath = new URL('resources/bookmarklet-installer.html', root);
let installer = readFileSync(installerPath, 'utf8').replaceAll('\r\n', '\n');
const linkStart = installer.indexOf('href="javascript:');
if (linkStart < 0) throw new Error('Missing bookmarklet link');
const linkEnd = installer.indexOf('"', linkStart + 6);
installer = installer.slice(0, linkStart) + 'href="' + bookmarklet + installer.slice(linkEnd);
const marker = '<!-- 內嵌即時運行的腳本邏輯 -->';
const scriptStart = installer.indexOf('<script>', installer.indexOf(marker));
const scriptEnd = installer.indexOf('</script>', scriptStart);
if (scriptStart < 0 || scriptEnd < 0) throw new Error('Missing demo script');
installer = installer.slice(0, scriptStart) + '<script>\ndocument.getElementById("tryDemoBtn").addEventListener("click", () => {\n' + source.replaceAll('</script', '<\\/script') + '\n});\n  ' + installer.slice(scriptEnd);
const outputs = [[new URL('resources/bookmarklet.txt', root), bookmarklet + '\n'], [installerPath, installer],
  [new URL('extension/annotator-overlay.js', root), source]];
for (const [path, content] of outputs) {
  if (process.argv.includes('--check')) {
    if (readFileSync(path, 'utf8').replaceAll('\r\n', '\n') !== content) throw new Error('Generated resource is stale: ' + fileURLToPath(path));
  } else writeFileSync(path, content);
}
console.log(process.argv.includes('--check') ? 'Generated resources match source' : 'Generated bookmarklet, installer and extension');
