# Mermaid Markdown Local

[日本語](README.ja.md)

A small, single-file Markdown editor for writing ordinary documents with
Mermaid diagrams. It runs entirely in the browser and does not require an
installation, server, account, or internet connection.

## Features

- Split Markdown editor and live Viewer
- Viewer-only full-width mode
- Mermaid rendering with a VS Code-aligned Quiet Light palette
- Selectable fonts, text sizes, and Viewer color themes
- PDF printing and PNG, Word (`.docx`), and PowerPoint (`.pptx`) export
- Editable text and tables in Word and PowerPoint; Mermaid remains sharp SVG
- Optional local `.docx` templates with a standalone `{{CONTENT}}` placeholder
- PowerPoint slide separation with a line containing only `---`
- Direct overwrite when supported by the browser
- Built-in Markdown and Mermaid cheat sheet
- One distributable HTML file

## Privacy

Document processing happens in the browser. The distributed HTML contains all
runtime libraries and has a Content Security Policy with `connect-src 'none'`.
It does not include analytics, telemetry, remote fonts, CDNs, or cloud APIs.

Preferences are stored in browser local storage. Exported files contain the
document content by design.

Word templates are processed only in browser memory and are not persisted.
Templates with macros, automatic external references, or a size over 25 MB are
rejected.

Downloading the HTML from GitHub requires a connection to GitHub. After the
download, opening the HTML as a local file does not cause this application to
send the document you are editing to an external service. For strict offline
use, disconnect if required and open `dist/mermaid-markdown-local.html` as a
local file.

## Use

1. Download `mermaid-markdown-local.html` from the latest GitHub Release or
   from `dist/`.
2. Open it in a modern browser.
3. Select **Open** or drag a Markdown file onto the window.
4. Edit on the left and preview on the right.

Chrome and Edge can use the File System Access API for direct overwrite after
the user grants access. Browsers without that API fall back to download-based
saving. PDF export uses the browser print dialog.

### Word templates

1. Put a paragraph containing only `{{CONTENT}}` at the insertion point in a
   `.docx` template.
2. Optionally put `{{TITLE}}` where the document name should appear.
3. Under **Display and export** at the bottom of the application, select the
   Word template.
4. Use the regular **Word** button to export.

The export preserves the template's page setup, margins, headers, footers,
logos, and heading styles. Without a selected template, Word export uses the
original built-in formatting.

## Build

Requirements: Node.js 20 or newer and npm.

```bash
npm ci
npm run verify
```

The generated file is written to:

```text
dist/mermaid-markdown-local.html
```

Source files live in `src/`. Runtime dependencies are pinned in
`package-lock.json`; the build does not use a CDN.

## Release

Pushing a tag such as `v0.2.0` runs the Release workflow, verifies the build,
and attaches the standalone HTML to a GitHub Release.

```bash
git tag v0.2.0
git push origin v0.2.0
```

## Security

See [SECURITY.md](SECURITY.md). Please never attach confidential documents to
a public issue.

## License

Project source code is available under the [MIT License](LICENSE). The output
bundles third-party open-source libraries. Their notices are in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and are also embedded in the
standalone HTML.
