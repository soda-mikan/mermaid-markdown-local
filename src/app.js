(() => {
  "use strict";

  const SAMPLE = [
    "# Mermaidを、いつもの文書へ",
    "",
    "このHTMLは外部通信を行わず、MarkdownとMermaidを端末内だけで処理します。",
    "",
    "```mermaid",
    "flowchart LR",
    "  A[Markdownを書く] --> B{Mermaidを描画}",
    "  B --> C[PDF / PNG]",
    "  B --> D[Word]",
    "  B --> E[PowerPoint]",
    "```",
    "",
    "## 使い方",
    "",
    "- 左側で編集します。",
    "- 右側へ即座に反映されます。",
    "- 画面下部のヘルプはいつでも表示できます。",
    "- 外部リンクと外部画像は安全のため読み込みません。",
    "",
    "---",
    "",
    "# PowerPointの2枚目",
    "",
    "行に `---` だけを書くと、PowerPointでは次のスライドになります。",
    "",
    "```mermaid",
    "sequenceDiagram",
    "  participant Writer as Writer",
    "  participant App as Local App",
    "  Writer->>App: Markdown + Mermaid",
    "  App-->>Writer: PPTX（端末内で生成）",
    "```",
  ].join("\n");

  const ALLOWED_TAGS = new Set([
    "H1", "H2", "H3", "H4", "H5", "H6", "P", "BR", "HR",
    "STRONG", "EM", "DEL", "BLOCKQUOTE", "UL", "OL", "LI",
    "PRE", "CODE", "TABLE", "THEAD", "TBODY", "TFOOT", "TR", "TH", "TD",
    "A", "IMG", "INPUT", "DETAILS", "SUMMARY", "KBD", "MARK", "SUB", "SUP",
    "DIV", "SPAN"
  ]);

  const editor = document.getElementById("editor");
  const preview = document.getElementById("preview");
  const previewScroll = document.getElementById("previewScroll");
  const filenameLabel = document.getElementById("filename");
  const fileInput = document.getElementById("fileInput");
  const helpPanel = document.getElementById("helpPanel");
  const helpButton = document.getElementById("helpButton");
  const viewModeButton = document.getElementById("viewModeButton");
  const renderState = document.getElementById("renderState");
  const editorStats = document.getElementById("editorStats");
  const toast = document.getElementById("toast");
  const captureRoot = document.getElementById("captureRoot");
  const exportButtons = Array.from(document.querySelectorAll(".export-button"));
  const fontSelect = document.getElementById("fontSelect");
  const colorSelect = document.getElementById("colorSelect");
  const textSizeSelect = document.getElementById("textSizeSelect");
  const mermaidPaletteSelect = document.getElementById("mermaidPaletteSelect");
  const wordTemplateButton = document.getElementById("wordTemplateButton");
  const clearWordTemplateButton = document.getElementById("clearWordTemplateButton");
  const wordTemplateInput = document.getElementById("wordTemplateInput");
  const wordTemplateStatus = document.getElementById("wordTemplateStatus");
  const resetAppearanceButton = document.getElementById("resetAppearanceButton");

  let fileName = "untitled.md";
  let fileHandle = null;
  let lastSavedContent = SAMPLE;
  let renderTimer = 0;
  let renderRevision = 0;
  let toastTimer = 0;
  let mermaidSequence = 0;
  let busy = false;
  let wordTemplate = null;

  const APPEARANCE_STORAGE_KEY = "mermaid-markdown-local.appearance.v1";
  const APPEARANCE_DEFAULTS = { font: "gothic", color: "monochrome", textSize: "standard", mermaid: "colorful", viewerOnly: false };
  const TEXT_SIZE_PRESETS = {
    small: { content: "14px", editor: "13px", mermaid: "14px", scale: 0.875 },
    standard: { content: "16px", editor: "14px", mermaid: "16px", scale: 1 },
    large: { content: "18px", editor: "16px", mermaid: "18px", scale: 1.125 },
    xlarge: { content: "20px", editor: "18px", mermaid: "20px", scale: 1.25 },
  };
  const FONT_PRESETS = {
    gothic: {
      css: 'Arial, "Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, sans-serif',
      export: "Yu Gothic",
      code: "Consolas",
    },
    mincho: {
      css: '"Yu Mincho", "Hiragino Mincho ProN", "Hiragino Mincho Pro", serif',
      export: "Yu Mincho",
      code: "Consolas",
    },
    system: {
      css: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      export: "Arial",
      code: "Consolas",
    },
    monospace: {
      css: 'Consolas, Menlo, Monaco, "Yu Gothic", Meiryo, monospace',
      export: "Consolas",
      code: "Consolas",
    },
  };
  const MERMAID_PALETTES = {
    colorful: {
      line: "#111111",
      note: { fill: "#d94683", border: "#9d174d", text: "#ffffff" },
      nodes: [
        { fill: "#2f6feb", border: "#174ea6", text: "#ffffff" },
        { fill: "#f2b134", border: "#a85d00", text: "#111111" },
        { fill: "#2ea043", border: "#176c2b", text: "#ffffff" },
        { fill: "#d94683", border: "#9d174d", text: "#ffffff" },
        { fill: "#7c3aed", border: "#4c1d95", text: "#ffffff" },
      ],
    },
    cool: {
      line: "#1f2937",
      note: { fill: "#0e7490", border: "#155e75", text: "#ffffff" },
      nodes: [
        { fill: "#2563eb", border: "#1e40af", text: "#ffffff" },
        { fill: "#0891b2", border: "#155e75", text: "#ffffff" },
        { fill: "#0f766e", border: "#115e59", text: "#ffffff" },
        { fill: "#7c3aed", border: "#5b21b6", text: "#ffffff" },
        { fill: "#475569", border: "#1e293b", text: "#ffffff" },
      ],
    },
    warm: {
      line: "#292524",
      note: { fill: "#db2777", border: "#9d174d", text: "#ffffff" },
      nodes: [
        { fill: "#dc2626", border: "#991b1b", text: "#ffffff" },
        { fill: "#ea580c", border: "#9a3412", text: "#ffffff" },
        { fill: "#eab308", border: "#a16207", text: "#111111" },
        { fill: "#db2777", border: "#9d174d", text: "#ffffff" },
        { fill: "#92400e", border: "#78350f", text: "#ffffff" },
      ],
    },
    "quiet-light": {
      background: "#f5f5f5",
      line: "#2f7ea1",
      edgeLabel: { fill: "#f5f5f5", text: "#555555" },
      note: { fill: "#f5f5f5", border: "#2f7ea1", text: "#555555" },
      nodes: [
        { fill: "#f5f5f5", border: "#2f7ea1", text: "#555555" },
        { fill: "#f5f5f5", border: "#2f7ea1", text: "#555555" },
        { fill: "#f5f5f5", border: "#2f7ea1", text: "#555555" },
        { fill: "#f5f5f5", border: "#2f7ea1", text: "#555555" },
        { fill: "#f5f5f5", border: "#2f7ea1", text: "#555555" },
      ],
    },
    monochrome: {
      line: "#111111",
      note: { fill: "#d1d1d1", border: "#555555", text: "#111111" },
      nodes: [
        { fill: "#111111", border: "#000000", text: "#ffffff" },
        { fill: "#f7f7f7", border: "#555555", text: "#111111" },
        { fill: "#858585", border: "#444444", text: "#ffffff" },
        { fill: "#d1d1d1", border: "#666666", text: "#111111" },
        { fill: "#4b4b4b", border: "#111111", text: "#ffffff" },
      ],
    },
  };

  function loadAppearance() {
    try {
      const stored = JSON.parse(localStorage.getItem(APPEARANCE_STORAGE_KEY) || "null") || {};
      return {
        font: Object.prototype.hasOwnProperty.call(FONT_PRESETS, stored.font) ? stored.font : APPEARANCE_DEFAULTS.font,
        color: ["monochrome", "quiet-light", "dark", "paper"].includes(stored.color) ? stored.color : APPEARANCE_DEFAULTS.color,
        textSize: Object.prototype.hasOwnProperty.call(TEXT_SIZE_PRESETS, stored.textSize) ? stored.textSize : APPEARANCE_DEFAULTS.textSize,
        mermaid: Object.prototype.hasOwnProperty.call(MERMAID_PALETTES, stored.mermaid) ? stored.mermaid : APPEARANCE_DEFAULTS.mermaid,
        viewerOnly: stored.viewerOnly === true,
      };
    } catch (_) {
      return { ...APPEARANCE_DEFAULTS };
    }
  }

  let appearance = loadAppearance();
  let EXPORT_FONT = FONT_PRESETS[appearance.font].export;
  let EXPORT_CODE_FONT = FONT_PRESETS[appearance.font].code;

  marked.setOptions({
    gfm: true,
    breaks: false,
    pedantic: false,
  });

  function mermaidThemeCss(palette) {
    const nodeCss = palette.nodes.map((node, index) => {
      const selector = index === 4 ? "5n" : `5n+${index + 1}`;
      return `
        .nodes > .node:nth-child(${selector}) .label-container { fill: ${node.fill} !important; stroke: ${node.border} !important; }
        .nodes > .node:nth-child(${selector}) .nodeLabel,
        .nodes > .node:nth-child(${selector}) text { fill: ${node.text} !important; color: ${node.text} !important; }
      `;
    }).join("\n");
    const edgeCss = palette.edgeLabel ? `
      .edgeLabel rect, .edgeLabel .labelBkg { fill: ${palette.edgeLabel.fill} !important; opacity: 1 !important; }
      .edgeLabel text, .edgeLabel .label { fill: ${palette.edgeLabel.text} !important; color: ${palette.edgeLabel.text} !important; }
    ` : "";
    return `${nodeCss}\n${edgeCss}`;
  }

  function configureMermaid() {
    const font = FONT_PRESETS[appearance.font];
    const textSize = TEXT_SIZE_PRESETS[appearance.textSize];
    const palette = MERMAID_PALETTES[appearance.mermaid];
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      suppressErrorRendering: true,
      htmlLabels: false,
      theme: "base",
      fontFamily: font.css,
      themeCSS: mermaidThemeCss(palette),
      themeVariables: {
        background: palette.background || "#ffffff",
        primaryColor: palette.nodes[0].fill,
        primaryBorderColor: palette.nodes[0].border,
        primaryTextColor: palette.nodes[0].text,
        secondaryColor: palette.nodes[1].fill,
        secondaryBorderColor: palette.nodes[1].border,
        secondaryTextColor: palette.nodes[1].text,
        tertiaryColor: palette.nodes[2].fill,
        tertiaryBorderColor: palette.nodes[2].border,
        tertiaryTextColor: palette.nodes[2].text,
        lineColor: palette.line,
        textColor: "#111111",
        fontSize: textSize.mermaid,
        edgeLabelBackground: palette.edgeLabel ? palette.edgeLabel.fill : palette.background || "#ffffff",
        noteBkgColor: palette.note.fill,
        noteBorderColor: palette.note.border,
        noteTextColor: palette.note.text,
      },
      flowchart: {
        htmlLabels: false,
        useMaxWidth: true,
      },
    });
  }

  function storeAppearance() {
    try {
      localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(appearance));
    } catch (_) {
      // 保存できない環境でも、その場での切り替えは利用できます。
    }
  }

  function applyAppearance({ persist = true, rerender = true, announce = true } = {}) {
    const font = FONT_PRESETS[appearance.font] || FONT_PRESETS[APPEARANCE_DEFAULTS.font];
    const textSize = TEXT_SIZE_PRESETS[appearance.textSize] || TEXT_SIZE_PRESETS[APPEARANCE_DEFAULTS.textSize];
    document.documentElement.dataset.fontTheme = appearance.font;
    document.documentElement.dataset.colorTheme = appearance.color;
    document.documentElement.style.setProperty("--content-font-size", textSize.content);
    document.documentElement.style.setProperty("--editor-font-size", textSize.editor);
    fontSelect.value = appearance.font;
    colorSelect.value = appearance.color;
    textSizeSelect.value = appearance.textSize;
    mermaidPaletteSelect.value = appearance.mermaid;
    applyViewMode({ persist: false, announce: false });
    EXPORT_FONT = font.export;
    EXPORT_CODE_FONT = font.code;
    configureMermaid();
    if (persist) storeAppearance();
    if (rerender) scheduleRender();
    if (announce) showToast("表示設定を変更しました");
  }

  function currentTextScale() {
    return (TEXT_SIZE_PRESETS[appearance.textSize] || TEXT_SIZE_PRESETS.standard).scale;
  }

  applyAppearance({ persist: false, rerender: false, announce: false });

  function showToast(message, duration = 2600) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), duration);
  }

  function setBusy(value, message = "") {
    busy = value;
    exportButtons.forEach((button) => { button.disabled = value; });
    document.getElementById("openButton").disabled = value;
    wordTemplateButton.disabled = value;
    clearWordTemplateButton.disabled = value || !wordTemplate;
    if (message) {
      renderState.textContent = message;
    }
  }

  function safeBaseName(name) {
    return (name || "untitled.md")
      .replace(/\.(md|markdown|txt)$/i, "")
      .replace(/[\\/:*?"<>|]+/g, "-")
      .trim() || "untitled";
  }

  function updateFileLabel() {
    const dirty = editor.value !== lastSavedContent;
    filenameLabel.textContent = `${dirty ? "● " : ""}${fileName}`;
    document.title = `${dirty ? "● " : ""}${fileName} — Mermaid Markdown`;
  }

  function updateStats() {
    const text = editor.value;
    const lines = text ? text.split("\n").length : 0;
    editorStats.textContent = `${text.length.toLocaleString("ja-JP")}文字 · ${lines.toLocaleString("ja-JP")}行`;
    updateFileLabel();
  }

  function blockedResource(label, value) {
    const span = document.createElement("span");
    span.className = "blocked-resource";
    span.textContent = `${label}をブロックしました: ${value || "URLなし"}`;
    return span;
  }

  function sanitizeHtml(html) {
    const template = document.createElement("template");
    template.innerHTML = html;

    const elements = Array.from(template.content.querySelectorAll("*"));
    for (const element of elements) {
      if (!ALLOWED_TAGS.has(element.tagName)) {
        element.remove();
        continue;
      }

      for (const attribute of Array.from(element.attributes)) {
        const name = attribute.name.toLowerCase();
        const value = attribute.value;
        let keep = false;

        if (name === "class" && ["CODE", "LI", "UL", "OL", "INPUT"].includes(element.tagName)) {
          keep = /^(language-[a-z0-9_-]+|task-list-item|contains-task-list)$/i.test(value);
        } else if (name === "align" && ["TH", "TD"].includes(element.tagName)) {
          keep = /^(left|center|right)$/i.test(value);
        } else if (element.tagName === "INPUT") {
          keep = (name === "type" && value === "checkbox") || name === "checked" || name === "disabled";
        } else if (element.tagName === "IMG") {
          keep = ["src", "alt", "title"].includes(name);
        } else if (element.tagName === "A") {
          keep = ["href", "title"].includes(name);
        }

        if (!keep) element.removeAttribute(attribute.name);
      }

      if (element.tagName === "A") {
        const href = element.getAttribute("href") || "";
        if (!href.startsWith("#")) {
          element.removeAttribute("href");
          element.classList.add("blocked-link");
          element.title = href ? `外部リンクは開きません: ${href}` : "リンク先なし";
        }
      }

      if (element.tagName === "IMG") {
        const src = element.getAttribute("src") || "";
        if (!/^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);/i.test(src) && !src.startsWith("blob:")) {
          element.replaceWith(blockedResource("外部画像", src));
        }
      }

      if (element.tagName === "INPUT") {
        element.setAttribute("disabled", "");
      }
    }

    return template.innerHTML;
  }

  async function renderMermaid(container, revision = null) {
    const codeBlocks = Array.from(container.querySelectorAll("pre > code.language-mermaid"));
    let errors = 0;

    for (const codeBlock of codeBlocks) {
      if (revision !== null && revision !== renderRevision) return { errors, cancelled: true };

      const source = codeBlock.textContent;
      const frame = document.createElement("div");
      frame.className = "mermaid-frame";
      codeBlock.parentElement.replaceWith(frame);

      try {
        const id = `mermaid-local-${Date.now()}-${++mermaidSequence}`;
        const result = await mermaid.render(id, source);
        if (revision !== null && revision !== renderRevision) return { errors, cancelled: true };
        frame.innerHTML = result.svg;
        const svg = frame.querySelector("svg");
        if (svg) {
          svg.removeAttribute("height");
          svg.style.maxWidth = "100%";
          svg.style.height = "auto";
        }
      } catch (error) {
        errors += 1;
        frame.className = "mermaid-error";
        frame.textContent = `Mermaid構文エラー\n${error && error.message ? error.message : String(error)}`;
      }
    }

    return { errors, cancelled: false };
  }

  async function renderInto(container, markdown, revision = null) {
    const raw = marked.parse(markdown);
    container.innerHTML = sanitizeHtml(raw);
    return renderMermaid(container, revision);
  }

  async function renderPreview(revision) {
    if (revision !== renderRevision) return;
    renderState.textContent = "描画中";
    const result = await renderInto(preview, editor.value, revision);
    if (result.cancelled || revision !== renderRevision) return;
    renderState.textContent = result.errors ? `Mermaidエラー ${result.errors}件` : "描画済み";
  }

  function scheduleRender() {
    const revision = ++renderRevision;
    clearTimeout(renderTimer);
    renderTimer = window.setTimeout(() => {
      renderPreview(revision).catch((error) => {
        renderState.textContent = "描画エラー";
        showToast(error && error.message ? error.message : String(error), 5000);
      });
    }, 180);
  }

  async function ensurePreviewCurrent() {
    clearTimeout(renderTimer);
    const revision = ++renderRevision;
    await renderPreview(revision);
  }

  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async function openFile(file, handle = null) {
    if (!file) return;
    if (!/\.(md|markdown|txt)$/i.test(file.name)) {
      showToast("Markdown、Markdown、またはテキストファイルを選んでください。", 4000);
      return;
    }
    const text = await file.text();
    editor.value = text;
    fileName = file.name;
    fileHandle = handle;
    lastSavedContent = text;
    updateStats();
    scheduleRender();
    showToast(`${file.name} を開きました`);
  }

  async function chooseFile() {
    if (typeof window.showOpenFilePicker !== "function") {
      fileInput.click();
      return;
    }

    try {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [{
          description: "Markdown",
          accept: { "text/markdown": [".md", ".markdown"], "text/plain": [".txt"] },
        }],
      });
      const file = await handle.getFile();
      await openFile(file, handle);
    } catch (error) {
      if (!error || error.name !== "AbortError") throw error;
    }
  }

  async function writeFileHandle(handle, content) {
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  async function saveMarkdown() {
    try {
      if (!fileHandle && typeof window.showSaveFilePicker === "function") {
        fileHandle = await window.showSaveFilePicker({
          suggestedName: /\.(md|markdown)$/i.test(fileName) ? fileName : `${safeBaseName(fileName)}.md`,
          types: [{
            description: "Markdown",
            accept: { "text/markdown": [".md", ".markdown"] },
          }],
        });
        const file = await fileHandle.getFile();
        fileName = file.name;
      }

      if (fileHandle) {
        await writeFileHandle(fileHandle, editor.value);
        lastSavedContent = editor.value;
        updateFileLabel();
        showToast(`${fileName} を上書き保存しました`);
        return;
      }

      const blob = new Blob([editor.value], { type: "text/markdown;charset=utf-8" });
      const outputName = /\.(md|markdown)$/i.test(fileName) ? fileName : `${safeBaseName(fileName)}.md`;
      downloadBlob(blob, outputName);
      lastSavedContent = editor.value;
      updateFileLabel();
      showToast("このブラウザでは直接上書きできないため、ダウンロード保存しました。", 5000);
    } catch (error) {
      if (error && error.name === "AbortError") return;
      showToast(`保存に失敗しました: ${error && error.message ? error.message : String(error)}`, 6000);
    }
  }

  function updateWordTemplateUi() {
    if (wordTemplate) {
      wordTemplateStatus.textContent = wordTemplate.name;
      wordTemplateStatus.title = wordTemplate.name;
      clearWordTemplateButton.disabled = busy;
      document.getElementById("wordButton").title = `${wordTemplate.name} の {{CONTENT}} に本文を差し込んで保存`;
    } else {
      wordTemplateStatus.textContent = "未選択";
      wordTemplateStatus.removeAttribute("title");
      clearWordTemplateButton.disabled = true;
      document.getElementById("wordButton").title = "編集可能なWord文書として保存。MermaidはSVGで埋め込みます";
    }
  }

  function parseWordXml(xml, label) {
    const parsed = new DOMParser().parseFromString(xml, "application/xml");
    if (parsed.querySelector("parsererror")) throw new Error(`${label}を読み取れませんでした。`);
    return parsed;
  }

  function documentPlaceholderCount(xml, key) {
    const wordNamespace = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
    const parsed = parseWordXml(xml, "Word本文");
    return Array.from(parsed.getElementsByTagNameNS(wordNamespace, "p")).filter((paragraph) => {
      const text = Array.from(paragraph.getElementsByTagNameNS(wordNamespace, "t"))
        .map((node) => node.textContent || "")
        .join("")
        .trim();
      return text === `{{${key}}}`;
    }).length;
  }

  function hasAutomaticExternalWordField(parsed) {
    const wordNamespace = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
    const instructions = Array.from(parsed.getElementsByTagNameNS(wordNamespace, "instrText"))
      .map((node) => node.textContent || "")
      .join(" ");
    return /\b(?:INCLUDEPICTURE|INCLUDETEXT|DDE|DDEAUTO|LINK)\b/i.test(instructions);
  }

  async function validateWordTemplate(file) {
    if (!file || !/\.docx$/i.test(file.name)) throw new Error(".docx形式のテンプレートを選んでください。");
    if (file.size > 25 * 1024 * 1024) throw new Error("Wordテンプレートは25MB以下にしてください。");

    const data = new Uint8Array(await file.arrayBuffer());
    const zip = await JSZip.loadAsync(data);
    const documentEntry = zip.file("word/document.xml");
    if (!zip.file("[Content_Types].xml") || !documentEntry) throw new Error("有効なWord文書ではありません。");
    if (Object.keys(zip.files).some((name) => /vbaProject\.bin$/i.test(name))) {
      throw new Error("マクロを含むWord文書はテンプレートに使用できません。");
    }

    for (const [name, entry] of Object.entries(zip.files)) {
      if (entry.dir || !name.endsWith(".rels")) continue;
      const relationships = parseWordXml(await entry.async("text"), name);
      for (const relationship of Array.from(relationships.getElementsByTagName("Relationship"))) {
        const external = (relationship.getAttribute("TargetMode") || "").toLowerCase() === "external";
        const type = relationship.getAttribute("Type") || "";
        if (external && !type.endsWith("/hyperlink")) {
          throw new Error("外部テンプレートや外部画像を参照するWord文書は使用できません。");
        }
      }
    }

    const documentXml = await documentEntry.async("text");
    const contentCount = documentPlaceholderCount(documentXml, "CONTENT");
    if (contentCount !== 1) {
      throw new Error("テンプレート本文に、単独の段落として {{CONTENT}} を1つ置いてください。");
    }
    for (const [name, entry] of Object.entries(zip.files)) {
      if (entry.dir || !/^word\/.+\.xml$/i.test(name)) continue;
      const parsed = parseWordXml(await entry.async("text"), name);
      if (hasAutomaticExternalWordField(parsed)) {
        throw new Error("外部データを自動取得するフィールドを含むWord文書は使用できません。");
      }
      if (name !== "word/document.xml" && (parsed.documentElement.textContent || "").includes("{{CONTENT}}")) {
        throw new Error("{{CONTENT}} はヘッダーやフッターではなく、テンプレート本文だけに置いてください。");
      }
    }
    const patchKeys = await docx.patchDetector({ data });
    return {
      name: file.name,
      data,
      hasTitle: patchKeys.includes("TITLE"),
    };
  }

  async function loadWordTemplate(file) {
    if (!file) return;
    setBusy(true, "テンプレート確認中");
    try {
      const nextTemplate = await validateWordTemplate(file);
      wordTemplate = nextTemplate;
      updateWordTemplateUi();
      showToast(`${file.name} をWordテンプレートとして読み込みました`, 4200);
    } finally {
      setBusy(false, "描画済み");
    }
  }

  function clearWordTemplate() {
    wordTemplate = null;
    wordTemplateInput.value = "";
    updateWordTemplateUi();
    showToast("Wordテンプレートを解除しました");
  }

  function canvasToBlob(canvas, type = "image/png", quality = 1) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("画像を生成できませんでした。")), type, quality);
    });
  }

  function htmlToPlain(html) {
    const template = document.createElement("template");
    template.innerHTML = html || "";
    return template.content.textContent || "";
  }

  function inlinePlain(tokens) {
    if (!Array.isArray(tokens)) return "";
    return tokens.map((token) => {
      if (!token) return "";
      if (token.type === "br") return "\n";
      if (token.type === "image") return token.text ? `[画像: ${token.text}]` : "[画像]";
      if (token.type === "html") return htmlToPlain(token.raw || token.text || "");
      if (Array.isArray(token.tokens)) return inlinePlain(token.tokens);
      return token.text == null ? "" : String(token.text);
    }).join("");
  }

  function scaledWordSize(size) {
    return Math.max(1, Math.round(size * currentTextScale()));
  }

  function inlineWordRuns(tokens, style = {}) {
    const runs = [];
    for (const token of Array.isArray(tokens) ? tokens : []) {
      if (!token) continue;
      if (token.type === "br") {
        runs.push(new docx.TextRun({
          text: "",
          break: 1,
          font: style.templateStyles ? undefined : EXPORT_FONT,
          size: style.templateStyles ? undefined : scaledWordSize(style.size || 21),
        }));
        continue;
      }
      if (token.type === "strong" || token.type === "em" || token.type === "del" || token.type === "link") {
        runs.push(...inlineWordRuns(token.tokens, {
          ...style,
          bold: style.bold || token.type === "strong",
          italics: style.italics || token.type === "em",
          strike: style.strike || token.type === "del",
          underline: style.underline || token.type === "link",
        }));
        continue;
      }

      const isCode = token.type === "codespan" || style.code;
      let text = "";
      if (token.type === "image") text = token.text ? `[画像: ${token.text}]` : "[画像]";
      else if (token.type === "html") text = htmlToPlain(token.raw || token.text || "");
      else if (Array.isArray(token.tokens)) {
        runs.push(...inlineWordRuns(token.tokens, style));
        continue;
      } else text = token.text == null ? "" : String(token.text);

      if (!text) continue;
      runs.push(new docx.TextRun({
        text,
        bold: Boolean(style.bold),
        italics: Boolean(style.italics),
        strike: Boolean(style.strike),
        underline: style.underline ? {} : undefined,
        font: style.templateStyles ? undefined : isCode ? EXPORT_CODE_FONT : EXPORT_FONT,
        size: style.templateStyles ? undefined : scaledWordSize(style.size || 21),
        shading: isCode ? { fill: "EEEEEE" } : undefined,
      }));
    }
    return runs;
  }

  function bytesToBase64(bytes) {
    let binary = "";
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
    }
    return btoa(binary);
  }

  function svgDataUri(svg) {
    return `data:image/svg+xml;base64,${bytesToBase64(new TextEncoder().encode(svg))}`;
  }

  async function renderMermaidSvg(source) {
    const id = `mermaid-export-${Date.now()}-${++mermaidSequence}`;
    const result = await mermaid.render(id, source);
    const documentSvg = new DOMParser().parseFromString(result.svg, "image/svg+xml");
    const svgElement = documentSvg.documentElement;
    if (!svgElement || svgElement.nodeName.toLowerCase() !== "svg" || documentSvg.querySelector("parsererror")) {
      throw new Error("MermaidのSVGを生成できませんでした。");
    }

    const viewBox = (svgElement.getAttribute("viewBox") || "").trim().split(/[ ,]+/).map(Number);
    let width = viewBox.length === 4 && Number.isFinite(viewBox[2]) ? viewBox[2] : parseFloat(svgElement.getAttribute("width"));
    let height = viewBox.length === 4 && Number.isFinite(viewBox[3]) ? viewBox[3] : parseFloat(svgElement.getAttribute("height"));
    if (!(width > 0) || !(height > 0)) {
      width = 800;
      height = 450;
    }
    svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svgElement.setAttribute("width", String(width));
    svgElement.setAttribute("height", String(height));
    svgElement.style.removeProperty("max-width");
    return {
      svg: new XMLSerializer().serializeToString(svgElement),
      width,
      height,
    };
  }

  async function loadSvgImage(svg) {
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.decoding = "sync";
    try {
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error("Mermaid画像を読み込めませんでした。"));
        image.src = url;
      });
      return image;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function svgToPngBytes(diagram, maxWidth = 1800) {
    const scale = Math.min(3, maxWidth / Math.max(1, diagram.width));
    const width = Math.max(1, Math.round(diagram.width * scale));
    const height = Math.max(1, Math.round(diagram.height * scale));
    const image = await loadSvgImage(diagram.svg);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return new Uint8Array(await (await canvasToBlob(canvas)).arrayBuffer());
  }

  function appendListBlocks(listToken, blocks, depth, quoteDepth) {
    const start = Number(listToken.start) || 1;
    listToken.items.forEach((item, index) => {
      const contentTokens = [];
      const nestedLists = [];
      for (const child of item.tokens || []) {
        if (child.type === "list") nestedLists.push(child);
        else if (Array.isArray(child.tokens)) contentTokens.push(...child.tokens);
        else contentTokens.push(child);
      }
      const prefix = listToken.ordered ? `${start + index}. ` : "• ";
      blocks.push({
        type: "text",
        text: `${prefix}${inlinePlain(contentTokens)}`,
        tokens: contentTokens,
        prefix,
        fontSize: 15,
        indent: depth + 1,
        quoteDepth,
      });
      nestedLists.forEach((nested) => appendListBlocks(nested, blocks, depth + 1, quoteDepth));
    });
  }

  async function appendTokenBlocks(tokens, blocks, quoteDepth = 0) {
    for (const token of Array.isArray(tokens) ? tokens : []) {
      if (!token || token.type === "space") continue;
      if (token.type === "heading") {
        const sizes = [28, 22, 18, 16, 15, 14];
        blocks.push({
          type: "text",
          text: inlinePlain(token.tokens),
          tokens: token.tokens,
          fontSize: sizes[Math.max(0, Math.min(5, token.depth - 1))],
          bold: true,
          heading: token.depth,
          quoteDepth,
        });
      } else if (token.type === "paragraph" || token.type === "text") {
        blocks.push({
          type: "text",
          text: inlinePlain(token.tokens || [{ type: "text", text: token.text || "" }]),
          tokens: token.tokens || [{ type: "text", text: token.text || "" }],
          fontSize: 15.5,
          quoteDepth,
        });
      } else if (token.type === "list") {
        appendListBlocks(token, blocks, 0, quoteDepth);
      } else if (token.type === "blockquote") {
        await appendTokenBlocks(token.tokens, blocks, quoteDepth + 1);
      } else if (token.type === "code") {
        if ((token.lang || "").trim().toLowerCase() === "mermaid") {
          blocks.push({ type: "diagram", ...(await renderMermaidSvg(token.text)), quoteDepth });
        } else {
          blocks.push({ type: "code", text: token.text || "", fontSize: 12.5, quoteDepth });
        }
      } else if (token.type === "table") {
        blocks.push({ type: "table", header: token.header || [], rows: token.rows || [], quoteDepth });
      } else if (token.type === "hr") {
        blocks.push({ type: "hr" });
      } else if (token.type === "html") {
        const text = htmlToPlain(token.raw || token.text || "").trim();
        if (text) blocks.push({ type: "text", text, tokens: [{ type: "text", text }], fontSize: 15.5, quoteDepth });
      }
    }
  }

  async function markdownBlocks(markdown) {
    const blocks = [];
    await appendTokenBlocks(marked.lexer(markdown), blocks);
    return blocks;
  }

  function textUnits(text) {
    let units = 0;
    for (const character of String(text || "")) units += character.charCodeAt(0) < 256 ? 0.56 : 1;
    return units;
  }

  function estimateTextLines(text, fontSize, widthInches) {
    const capacity = Math.max(4, (widthInches * 72) / Math.max(8, fontSize));
    return String(text || "").split("\n").reduce((total, line) => total + Math.max(1, Math.ceil(textUnits(line) / capacity)), 0);
  }

  function pptBlockHeight(block, scale = 1) {
    if (block.type === "text") {
      const width = 11.9 - (block.indent || 0) * 0.35;
      return estimateTextLines(block.text, block.fontSize * scale, width) * block.fontSize * scale / 72 * 1.34 + 0.12;
    }
    if (block.type === "code") return estimateTextLines(block.text, block.fontSize * scale, 11.4) * block.fontSize * scale / 72 * 1.34 + 0.24;
    if (block.type === "table") return Math.max(0.72, (block.rows.length + 1) * 0.38 * scale + 0.1);
    if (block.type === "diagram") return Math.min(3.5, Math.max(1.25, 10.8 * block.height / block.width)) * scale + 0.08;
    if (block.type === "hr") return 0.22;
    return 0.1;
  }

  function wrapCanvasLines(context, text, maxWidth) {
    const lines = [];
    for (const sourceLine of String(text || "").split("\n")) {
      if (!sourceLine) {
        lines.push("");
        continue;
      }
      let line = "";
      for (const character of sourceLine) {
        const candidate = line + character;
        if (line && context.measureText(candidate).width > maxWidth) {
          lines.push(line);
          line = character;
        } else {
          line = candidate;
        }
      }
      lines.push(line);
    }
    return lines;
  }

  function canvasBlockMetrics(context, block, contentWidth, textScale = 1) {
    if (block.type === "text" || block.type === "code") {
      const size = (block.type === "code" ? 22 : block.fontSize * 1.7) * textScale;
      context.font = `${block.bold ? "700 " : ""}${size}px ${block.type === "code" ? EXPORT_CODE_FONT : EXPORT_FONT}, sans-serif`;
      const indent = (block.indent || 0) * 38 + (block.quoteDepth || 0) * 22;
      const lines = wrapCanvasLines(context, block.text, contentWidth - indent - 20);
      return { height: lines.length * size * 1.48 + 22, lines, size, indent };
    }
    if (block.type === "diagram") {
      return { height: Math.min(620, Math.max(190, contentWidth * block.height / block.width)) + 28 };
    }
    if (block.type === "table") {
      const rows = [block.header, ...block.rows];
      const columns = Math.max(1, block.header.length);
      const cellWidth = contentWidth / columns;
      const tableFontSize = 22 * textScale;
      context.font = `${tableFontSize}px ${EXPORT_FONT}, sans-serif`;
      const rowHeights = rows.map((row) => Math.max(48 * textScale, ...row.map((cell) => wrapCanvasLines(context, inlinePlain(cell.tokens), cellWidth - 24).length * tableFontSize * 1.4 + 16)));
      return { height: rowHeights.reduce((sum, value) => sum + value, 0) + 28, rowHeights, cellWidth, tableFontSize };
    }
    return { height: block.type === "hr" ? 34 : 16 };
  }

  async function exportPng() {
    setBusy(true, "PNG生成中");
    try {
      const blocks = await markdownBlocks(editor.value);
      const logicalWidth = 1400;
      const margin = 80;
      const contentWidth = logicalWidth - margin * 2;
      const textScale = currentTextScale();
      const measureCanvas = document.createElement("canvas");
      const measureContext = measureCanvas.getContext("2d");
      const metrics = blocks.map((block) => canvasBlockMetrics(measureContext, block, contentWidth, textScale));
      const logicalHeight = Math.max(720, margin * 2 + metrics.reduce((sum, item) => sum + item.height, 0));
      const scale = Math.min(1, 15600 / logicalHeight);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(logicalWidth * scale));
      canvas.height = Math.max(1, Math.round(logicalHeight * scale));
      const context = canvas.getContext("2d", { alpha: false });
      context.scale(scale, scale);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, logicalWidth, logicalHeight);
      context.textBaseline = "top";

      let y = margin;
      for (let index = 0; index < blocks.length; index += 1) {
        const block = blocks[index];
        const metric = metrics[index];
        if (block.type === "text" || block.type === "code") {
          const x = margin + metric.indent;
          if (block.quoteDepth) {
            context.fillStyle = "#8a8a8a";
            context.fillRect(x - 16, y, 4, metric.height - 12);
          }
          if (block.type === "code") {
            context.fillStyle = "#eeeeee";
            context.fillRect(x - 10, y - 6, contentWidth - metric.indent + 10, metric.height - 6);
          }
          context.font = `${block.bold ? "700 " : ""}${metric.size}px ${block.type === "code" ? EXPORT_CODE_FONT : EXPORT_FONT}, sans-serif`;
          context.fillStyle = "#111111";
          metric.lines.forEach((line, lineIndex) => context.fillText(line, x, y + lineIndex * metric.size * 1.48));
        } else if (block.type === "hr") {
          context.fillStyle = "#9a9a9a";
          context.fillRect(margin, y + 10, contentWidth, 2);
        } else if (block.type === "diagram") {
          const image = await loadSvgImage(block.svg);
          const height = metric.height - 28;
          const width = Math.min(contentWidth, height * block.width / block.height);
          context.drawImage(image, margin + (contentWidth - width) / 2, y, width, height);
        } else if (block.type === "table") {
          const rows = [block.header, ...block.rows];
          let rowY = y;
          context.font = `${metric.tableFontSize}px ${EXPORT_FONT}, sans-serif`;
          rows.forEach((row, rowIndex) => {
            const rowHeight = metric.rowHeights[rowIndex];
            row.forEach((cell, columnIndex) => {
              const cellX = margin + columnIndex * metric.cellWidth;
              context.fillStyle = rowIndex === 0 ? "#e6e6e6" : "#ffffff";
              context.fillRect(cellX, rowY, metric.cellWidth, rowHeight);
              context.strokeStyle = "#888888";
              context.strokeRect(cellX, rowY, metric.cellWidth, rowHeight);
              context.fillStyle = "#111111";
              const lines = wrapCanvasLines(context, inlinePlain(cell.tokens), metric.cellWidth - 24);
              lines.forEach((line, lineIndex) => context.fillText(line, cellX + 12, rowY + 10 + lineIndex * metric.tableFontSize * 1.4));
            });
            rowY += rowHeight;
          });
        }
        y += metric.height;
      }

      downloadBlob(await canvasToBlob(canvas), `${safeBaseName(fileName)}.png`);
      showToast("PNGを書き出しました");
    } finally {
      setBusy(false, "描画済み");
    }
  }

  function splitSlides(markdown) {
    const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
    const slides = [];
    let current = [];
    let fenceChar = "";
    let fenceLength = 0;
    let inFrontmatter = lines[0] && lines[0].trim() === "---";

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const trimmed = line.trim();

      if (inFrontmatter) {
        current.push(line);
        if (index > 0 && trimmed === "---") inFrontmatter = false;
        continue;
      }

      const fence = line.match(/^\s{0,3}(`{3,}|~{3,})/);
      if (fence) {
        const marker = fence[1];
        if (!fenceChar) {
          fenceChar = marker[0];
          fenceLength = marker.length;
        } else if (marker[0] === fenceChar && marker.length >= fenceLength) {
          fenceChar = "";
          fenceLength = 0;
        }
        current.push(line);
        continue;
      }

      if (!fenceChar && trimmed === "---") {
        slides.push(current.join("\n").trim());
        current = [];
      } else {
        current.push(line);
      }
    }

    slides.push(current.join("\n").trim());
    const nonEmpty = slides.filter((slide) => slide.length > 0);
    return nonEmpty.length ? nonEmpty : [""];
  }

  async function exportPptx() {
    setBusy(true, "PowerPoint生成中");
    try {
      const slideMarkdowns = splitSlides(editor.value);
      const pptx = new PptxGenJS();
      pptx.layout = "LAYOUT_WIDE";
      pptx.author = "Mermaid Markdown (local)";
      pptx.subject = "Markdown and Mermaid export";
      pptx.title = safeBaseName(fileName);
      pptx.company = "Local only";
      pptx.lang = "ja-JP";

      for (let index = 0; index < slideMarkdowns.length; index += 1) {
        renderState.textContent = `PowerPoint ${index + 1}/${slideMarkdowns.length}`;
        const blocks = await markdownBlocks(slideMarkdowns[index]);
        const slide = pptx.addSlide();
        slide.background = { color: "FFFFFF" };
        const totalHeight = blocks.reduce((sum, block) => sum + pptBlockHeight(block), 0);
        const scale = Math.max(0.42, Math.min(currentTextScale(), 6.2 / Math.max(0.1, totalHeight)));
        let y = 0.58;

        for (const block of blocks) {
          const height = pptBlockHeight(block, scale);
          if (block.type === "text") {
            const indent = (block.indent || 0) * 0.34 + (block.quoteDepth || 0) * 0.2;
            if (block.quoteDepth) {
              slide.addShape(pptx.ShapeType.rect, {
                x: 0.68 + indent - 0.14, y, w: 0.035, h: Math.max(0.18, height - 0.08),
                line: { color: "8A8A8A", transparency: 100 }, fill: { color: "8A8A8A" },
              });
            }
            slide.addText(block.text, {
              x: 0.7 + indent, y, w: 11.93 - indent, h: Math.max(0.2, height - 0.05),
              margin: 0, valign: "top", breakLine: false,
              fontFace: EXPORT_FONT, fontSize: Math.max(7, block.fontSize * scale),
              bold: Boolean(block.bold), color: "111111", fit: "shrink",
            });
          } else if (block.type === "code") {
            slide.addText(block.text, {
              x: 0.7, y, w: 11.93, h: Math.max(0.3, height - 0.04),
              margin: 0.1, valign: "top", fontFace: EXPORT_CODE_FONT,
              fontSize: Math.max(7, block.fontSize * scale), color: "111111",
              fill: { color: "EEEEEE" }, line: { color: "B8B8B8", width: 0.6 }, fit: "shrink",
            });
          } else if (block.type === "hr") {
            slide.addShape(pptx.ShapeType.line, { x: 0.7, y: y + 0.08, w: 11.93, h: 0, line: { color: "909090", width: 1 } });
          } else if (block.type === "diagram") {
            const maxHeight = Math.max(0.8, height - 0.08);
            let width = Math.min(11.7, maxHeight * block.width / block.height);
            let imageHeight = width * block.height / block.width;
            if (imageHeight > maxHeight) {
              imageHeight = maxHeight;
              width = imageHeight * block.width / block.height;
            }
            slide.addImage({ data: svgDataUri(block.svg), x: 0.7 + (11.93 - width) / 2, y, w: width, h: imageHeight });
          } else if (block.type === "table") {
            const rows = [block.header, ...block.rows].map((row) => row.map((cell) => inlinePlain(cell.tokens)));
            slide.addTable(rows, {
              x: 0.7, y, w: 11.93, h: Math.max(0.5, height - 0.04),
              border: { type: "solid", color: "888888", pt: 0.8 },
              fill: "FFFFFF", color: "111111", fontFace: EXPORT_FONT,
              fontSize: Math.max(7, 13 * scale), margin: 0.06,
              bold: false, autoFit: false,
            });
          }
          y += height;
        }

        slide.addText(String(index + 1), {
          x: 12.15, y: 7.08, w: 0.48, h: 0.18, margin: 0,
          align: "right", fontFace: "Arial", fontSize: 8, color: "777777",
        });
      }

      await pptx.writeFile({ fileName: `${safeBaseName(fileName)}.pptx`, compression: true });
      showToast(`${slideMarkdowns.length}枚のPowerPointを書き出しました`);
    } finally {
      setBusy(false, "描画済み");
    }
  }

  function wordTextParagraph(block, { templateStyles = false } = {}) {
    const sizes = [34, 29, 25, 23, 22, 21];
    const size = block.heading ? sizes[Math.max(0, Math.min(5, block.heading - 1))] : 21;
    const prefixRuns = block.prefix ? [new docx.TextRun({
      text: block.prefix,
      font: templateStyles ? undefined : EXPORT_FONT,
      size: templateStyles ? undefined : scaledWordSize(size),
    })] : [];
    const runs = [...prefixRuns, ...inlineWordRuns(block.tokens, { bold: block.bold, size, templateStyles })];
    return new docx.Paragraph({
      heading: block.heading ? [null, docx.HeadingLevel.HEADING_1, docx.HeadingLevel.HEADING_2, docx.HeadingLevel.HEADING_3, docx.HeadingLevel.HEADING_4, docx.HeadingLevel.HEADING_5, docx.HeadingLevel.HEADING_6][block.heading] : undefined,
      style: templateStyles && block.quoteDepth ? "Quote" : undefined,
      children: runs.length ? runs : [new docx.TextRun({
        text: block.text || "",
        font: templateStyles ? undefined : EXPORT_FONT,
        size: templateStyles ? undefined : scaledWordSize(size),
      })],
      indent: (block.indent || block.quoteDepth) ? {
        left: (block.indent || 0) * 360 + (block.quoteDepth || 0) * 300,
        hanging: block.prefix ? 240 : undefined,
      } : undefined,
      shading: !templateStyles && block.quoteDepth ? { fill: "F2F2F2" } : undefined,
      spacing: templateStyles ? undefined : { before: block.heading ? 180 : 0, after: block.heading ? 130 : 110, line: 300 },
    });
  }

  async function wordChildren(blocks, { templateStyles = false } = {}) {
    const children = [];
    for (const block of blocks) {
      if (block.type === "text") {
        children.push(wordTextParagraph(block, { templateStyles }));
      } else if (block.type === "code") {
        const lines = String(block.text || "").split("\n");
        const runs = [];
        lines.forEach((line, index) => {
          if (index) runs.push(new docx.TextRun({
            text: "",
            break: 1,
            font: templateStyles ? undefined : EXPORT_CODE_FONT,
            size: templateStyles ? undefined : scaledWordSize(18),
          }));
          runs.push(new docx.TextRun({
            text: line || " ",
            font: templateStyles ? undefined : EXPORT_CODE_FONT,
            size: templateStyles ? undefined : scaledWordSize(18),
          }));
        });
        children.push(new docx.Paragraph({
          children: runs,
          shading: { fill: "EEEEEE" },
          indent: { left: 240, right: 240 },
          spacing: { before: 80, after: 140, line: 260 },
        }));
      } else if (block.type === "hr") {
        children.push(new docx.Paragraph({ thematicBreak: true, spacing: { before: 100, after: 100 } }));
      } else if (block.type === "table") {
        const makeCell = (cell, header) => new docx.TableCell({
          shading: !templateStyles && header ? { fill: "E5E5E5" } : undefined,
          children: [new docx.Paragraph({
            children: inlineWordRuns(cell.tokens, { bold: header, size: 19, templateStyles }),
            spacing: templateStyles ? undefined : { before: 40, after: 40 },
          })],
        });
        children.push(new docx.Table({
          style: templateStyles ? "TableGrid" : undefined,
          width: { size: 100, type: docx.WidthType.PERCENTAGE },
          rows: [
            new docx.TableRow({ children: block.header.map((cell) => makeCell(cell, true)) }),
            ...block.rows.map((row) => new docx.TableRow({ children: row.map((cell) => makeCell(cell, false)) })),
          ],
        }));
        children.push(new docx.Paragraph({ children: [], spacing: { after: 80 } }));
      } else if (block.type === "diagram") {
        const pngBytes = await svgToPngBytes(block);
        let width = Math.min(620, block.width);
        let height = width * block.height / block.width;
        if (height > 560) {
          height = 560;
          width = height * block.width / block.height;
        }
        children.push(new docx.Paragraph({
          alignment: docx.AlignmentType.CENTER,
          spacing: { before: 100, after: 150 },
          children: [new docx.ImageRun({
            type: "svg",
            data: new TextEncoder().encode(block.svg),
            fallback: { type: "png", data: pngBytes },
            transformation: { width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(height)) },
            altText: { title: "Mermaid diagram", description: "Markdownから生成したMermaid図", name: "Mermaid diagram" },
          })],
        }));
      }
    }
    return children;
  }

  async function exportWord() {
    setBusy(true, "Word生成中");
    try {
      const blocks = await markdownBlocks(editor.value);
      const children = await wordChildren(blocks, { templateStyles: Boolean(wordTemplate) });
      if (wordTemplate) {
        const patches = {
          CONTENT: { type: docx.PatchType.DOCUMENT, children },
        };
        if (wordTemplate.hasTitle) {
          patches.TITLE = {
            type: docx.PatchType.PARAGRAPH,
            children: [new docx.TextRun({ text: safeBaseName(fileName) })],
          };
        }
        const blob = await docx.patchDocument({
          outputType: "blob",
          data: wordTemplate.data,
          patches,
          keepOriginalStyles: true,
          recursive: false,
        });
        downloadBlob(blob, `${safeBaseName(fileName)}.docx`);
        showToast(`${wordTemplate.name} を使ってWordを書き出しました`);
        return;
      }
      const documentFile = new docx.Document({
        creator: "Mermaid Markdown (local)",
        title: safeBaseName(fileName),
        description: "Markdown and Mermaid export",
        sections: [{
          properties: {
            page: {
              size: { width: 11906, height: 16838 },
              margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
            },
          },
          children,
        }],
      });
      const blob = await docx.Packer.toBlob(documentFile);
      downloadBlob(blob, `${safeBaseName(fileName)}.docx`);
      showToast("編集可能なWordを書き出しました");
    } finally {
      setBusy(false, "描画済み");
    }
  }

  async function runExport(action) {
    if (busy) return;
    try {
      await ensurePreviewCurrent();
      await action();
    } catch (error) {
      console.error(error);
      setBusy(false, "書き出しエラー");
      showToast(`書き出しに失敗しました: ${error && error.message ? error.message : String(error)}`, 6000);
    }
  }

  function toggleHelp(force) {
    const open = typeof force === "boolean" ? force : !helpPanel.classList.contains("open");
    helpPanel.classList.toggle("open", open);
    helpButton.setAttribute("aria-expanded", String(open));
    helpButton.textContent = open ? "ヘルプを閉じる" : "ヘルプ";
  }

  function applyViewMode({ persist = true, announce = true } = {}) {
    const viewerOnly = appearance.viewerOnly === true;
    document.documentElement.dataset.viewMode = viewerOnly ? "viewer" : "split";
    viewModeButton.setAttribute("aria-pressed", String(viewerOnly));
    viewModeButton.textContent = viewerOnly ? "分割表示" : "Viewerのみ";
    viewModeButton.title = viewerOnly ? "EditorとViewerを並べて表示" : "Viewerを全幅で表示";
    if (persist) storeAppearance();
    if (announce) showToast(viewerOnly ? "Viewerのみ表示します" : "分割表示に戻しました");
  }

  function toggleViewMode() {
    appearance.viewerOnly = !appearance.viewerOnly;
    if (appearance.viewerOnly) toggleHelp(false);
    applyViewMode();
  }

  editor.addEventListener("input", () => {
    updateStats();
    scheduleRender();
  });

  editor.addEventListener("scroll", () => {
    const editorMax = editor.scrollHeight - editor.clientHeight;
    const previewMax = previewScroll.scrollHeight - previewScroll.clientHeight;
    if (editorMax > 0 && previewMax > 0) {
      previewScroll.scrollTop = (editor.scrollTop / editorMax) * previewMax;
    }
  }, { passive: true });

  editor.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      event.preventDefault();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      editor.setRangeText("  ", start, end, "end");
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });

  preview.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (link && !link.getAttribute("href")) {
      event.preventDefault();
      showToast("外部リンクはローカル専用モードで無効です。", 3600);
    }
  });

  document.getElementById("openButton").addEventListener("click", () => {
    chooseFile().catch((error) => showToast(error.message, 5000));
  });
  document.getElementById("saveButton").addEventListener("click", () => { saveMarkdown(); });
  document.getElementById("pdfButton").addEventListener("click", () => runExport(async () => {
    showToast("印刷画面で「PDFとして保存」を選択してください。", 5000);
    window.setTimeout(() => window.print(), 120);
  }));
  document.getElementById("pngButton").addEventListener("click", () => runExport(exportPng));
  document.getElementById("wordButton").addEventListener("click", () => runExport(exportWord));
  document.getElementById("pptxButton").addEventListener("click", () => runExport(exportPptx));
  viewModeButton.addEventListener("click", toggleViewMode);
  helpButton.addEventListener("click", () => toggleHelp());
  fontSelect.addEventListener("change", () => {
    appearance.font = fontSelect.value;
    applyAppearance();
  });
  colorSelect.addEventListener("change", () => {
    appearance.color = colorSelect.value;
    applyAppearance({ rerender: false });
  });
  textSizeSelect.addEventListener("change", () => {
    appearance.textSize = textSizeSelect.value;
    applyAppearance();
  });
  mermaidPaletteSelect.addEventListener("change", () => {
    appearance.mermaid = mermaidPaletteSelect.value;
    applyAppearance();
  });
  resetAppearanceButton.addEventListener("click", () => {
    appearance = { ...APPEARANCE_DEFAULTS };
    applyAppearance();
  });
  wordTemplateButton.addEventListener("click", () => wordTemplateInput.click());
  clearWordTemplateButton.addEventListener("click", clearWordTemplate);
  wordTemplateInput.addEventListener("change", () => {
    const file = wordTemplateInput.files && wordTemplateInput.files[0];
    loadWordTemplate(file).catch((error) => {
      console.error(error);
      showToast(`Wordテンプレートを読み込めません: ${error && error.message ? error.message : String(error)}`, 6500);
    });
    wordTemplateInput.value = "";
  });
  fileInput.addEventListener("change", () => {
    openFile(fileInput.files && fileInput.files[0]).catch((error) => showToast(error.message, 5000));
    fileInput.value = "";
  });

  window.addEventListener("keydown", (event) => {
    const modifier = event.ctrlKey || event.metaKey;
    if (modifier && event.key.toLowerCase() === "o") {
      event.preventDefault();
      chooseFile().catch((error) => showToast(error.message, 5000));
    } else if (modifier && event.key.toLowerCase() === "s") {
      event.preventDefault();
      saveMarkdown();
    } else if (event.key === "F1") {
      event.preventDefault();
      toggleHelp();
    }
  });

  window.addEventListener("beforeunload", (event) => {
    if (editor.value !== lastSavedContent) {
      event.preventDefault();
      event.returnValue = "";
    }
  });

  let dragDepth = 0;
  window.addEventListener("dragenter", (event) => {
    event.preventDefault();
    dragDepth += 1;
    document.body.classList.add("drop-active");
  });
  window.addEventListener("dragover", (event) => event.preventDefault());
  window.addEventListener("dragleave", (event) => {
    event.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (!dragDepth) document.body.classList.remove("drop-active");
  });
  window.addEventListener("drop", (event) => {
    event.preventDefault();
    dragDepth = 0;
    document.body.classList.remove("drop-active");
    const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    openFile(file).catch((error) => showToast(error.message, 5000));
  });

  editor.value = SAMPLE;
  updateWordTemplateUi();
  updateStats();
  renderPreview(++renderRevision).catch((error) => showToast(error.message, 5000));
})();
