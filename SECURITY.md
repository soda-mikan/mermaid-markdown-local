# Security policy

Mermaid Markdown Local is designed to process documents inside the browser.
The distributed HTML uses a Content Security Policy that blocks network
connections, frames, forms, plugins, and external runtime resources.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting feature when it is enabled
for this repository. Do not attach private Markdown documents or confidential
exported files to a public issue. A minimal, non-sensitive reproduction is
welcome.

## Security boundaries

- Markdown and Mermaid are rendered locally in the browser.
- External links are not opened by the preview.
- External images are blocked; embedded `data:` images are allowed.
- Preferences are stored only in browser local storage.
- Word templates stay in browser memory and are not persisted by the app.
- Macro-enabled and automatically linked external Word template resources are rejected.
- Exported files contain the document content by design.
- Downloading from GitHub requires a normal request to GitHub. For strict
  offline use, download the release HTML and open it locally.
