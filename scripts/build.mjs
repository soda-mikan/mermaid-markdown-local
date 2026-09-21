import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const modules = resolve(root, "node_modules");

const paths = {
  template: resolve(root, "src/index.template.html"),
  css: resolve(root, "src/app.css"),
  app: resolve(root, "src/app.js"),
  marked: resolve(modules, "marked/lib/marked.umd.js"),
  mermaid: resolve(modules, "mermaid/dist/mermaid.min.js"),
  jszip: resolve(modules, "jszip/dist/jszip.min.js"),
  docx: resolve(modules, "docx/dist/index.iife.js"),
  pptx: resolve(modules, "pptxgenjs/dist/pptxgen.min.js"),
  notices: resolve(root, "THIRD_PARTY_NOTICES.md"),
  output: resolve(root, "dist/mermaid-markdown-local.html"),
};

const escapeScriptEnd = (value) => value.replace(/<\/script/gi, "<\\/script");
const escapeStyleEnd = (value) => value.replace(/<\/style/gi, "<\\/style");
const escapeHtml = (value) => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;");

let html = await readFile(paths.template, "utf8");
const replacements = {
  "/*__APP_CSS__*/": escapeStyleEnd(await readFile(paths.css, "utf8")),
  "/*__MARKED_JS__*/": escapeScriptEnd(await readFile(paths.marked, "utf8")),
  "/*__MERMAID_JS__*/": escapeScriptEnd(await readFile(paths.mermaid, "utf8")),
  "/*__JSZIP_JS__*/": escapeScriptEnd(await readFile(paths.jszip, "utf8")),
  "/*__DOCX_JS__*/": escapeScriptEnd(await readFile(paths.docx, "utf8")),
  "/*__PPTX_JS__*/": escapeScriptEnd(await readFile(paths.pptx, "utf8")),
  "/*__APP_JS__*/": escapeScriptEnd(await readFile(paths.app, "utf8")),
};

for (const [placeholder, value] of Object.entries(replacements)) {
  if (!html.includes(placeholder)) throw new Error(`Missing placeholder: ${placeholder}`);
  html = html.replace(placeholder, () => value);
}

const notices = escapeHtml(await readFile(paths.notices, "utf8"));
const embeddedNotices = [
  "<template id=\"third-party-notices\" aria-hidden=\"true\">",
  `<pre>${notices}</pre>`,
  "</template>",
].join("\n");

const closingBody = html.lastIndexOf("</body>");
if (closingBody < 0) throw new Error("Missing closing </body> tag");
html = `${html.slice(0, closingBody)}${embeddedNotices}\n${html.slice(closingBody)}`;

const notice = `\n<!-- Built for offline use. Third-party license texts are embedded in #third-party-notices. -->\n`;
const closingHtml = html.lastIndexOf("</html>");
if (closingHtml < 0) throw new Error("Missing closing </html> tag");
html = `${html.slice(0, closingHtml)}${notice}${html.slice(closingHtml)}`;

await mkdir(dirname(paths.output), { recursive: true });
await writeFile(paths.output, html, "utf8");
const info = await stat(paths.output);
process.stdout.write(`${paths.output}\n${info.size} bytes\n`);
