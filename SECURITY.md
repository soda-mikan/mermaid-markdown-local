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
- Exported files contain the document content by design.
- Opening a GitHub Pages demo still makes a normal page request to GitHub. For
  strict offline use, download the release HTML and open it locally.
