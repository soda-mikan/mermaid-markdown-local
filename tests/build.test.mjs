import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../dist/mermaid-markdown-local.html", import.meta.url), "utf8");

test("build is a complete single HTML file", () => {
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<\/html>\s*$/i);
  assert.ok(html.length > 1_000_000, "expected bundled runtime libraries");
});

test("build has no unresolved placeholders", () => {
  assert.doesNotMatch(html, /\/\*__[A-Z_]+__\*\//);
});

test("build does not load external runtime assets", () => {
  assert.doesNotMatch(html, /<script[^>]+src=/i);
  assert.doesNotMatch(html, /<link[^>]+rel=["']?stylesheet/i);
  assert.match(html, /connect-src 'none'/);
  assert.match(html, /default-src 'none'/);
});

test("third-party notices travel with the standalone HTML", () => {
  assert.match(html, /id="third-party-notices"/);
  assert.match(html, /Mermaid 11\.17\.2/);
  assert.match(html, /Marked 17\.0\.5/);
  assert.match(html, /PptxGenJS 4\.0\.1/);
});

test("requested editor features are present", () => {
  assert.match(html, />Viewerのみ</);
  assert.match(html, />Quiet Light</);
  assert.match(html, /id="textSizeSelect"/);
  assert.match(html, /id="wordTemplateInput"/);
  assert.match(html, /docx\.patchDocument/);
  assert.match(html, /\{\{CONTENT\}\}/);
  assert.match(html, /#2f7ea1/i);
  assert.match(html, /showOpenFilePicker/);
  assert.match(html, /showSaveFilePicker/);
});
