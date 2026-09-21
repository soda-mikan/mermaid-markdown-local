# Mermaid Markdown Local

[日本語](README.ja.md)

A small, single-file Markdown editor for writing ordinary documents with
Mermaid diagrams. It runs entirely in the browser and does not require an
installation, server, account, or internet connection.

## Features

- Split Markdown editor and live Viewer
- Viewer-only full-width mode
- Mermaid rendering with selectable palettes, including Quiet Light
- Selectable fonts and Viewer color themes
- PDF printing and PNG, Word (`.docx`), and PowerPoint (`.pptx`) export
- Editable text and tables in Word and PowerPoint; Mermaid remains sharp SVG
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

Pushing a tag such as `v0.1.0` runs the Release workflow, verifies the build,
and attaches the standalone HTML to a GitHub Release.

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Security

See [SECURITY.md](SECURITY.md). Please never attach confidential documents to
a public issue.

## License

Project source code is available under the [MIT License](LICENSE). The output
bundles third-party open-source libraries. Their notices are in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and are also embedded in the
standalone HTML.
