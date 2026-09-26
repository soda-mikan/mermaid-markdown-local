import assert from "node:assert/strict";
import test from "node:test";
import {
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  PatchType,
  TextRun,
  patchDocument,
} from "docx";
import JSZip from "jszip";

test("Word template patching preserves surrounding document parts", async () => {
  const template = new Document({
    sections: [{
      headers: {
        default: new Header({ children: [new Paragraph("Template header")] }),
      },
      footers: {
        default: new Footer({ children: [new Paragraph("Template footer")] }),
      },
      children: [
        new Paragraph({ children: [new TextRun("{{TITLE}}")] }),
        new Paragraph({ children: [new TextRun("{{CONTENT}}")] }),
      ],
    }],
  });

  const output = await patchDocument({
    outputType: "uint8array",
    data: await Packer.toBuffer(template),
    recursive: false,
    keepOriginalStyles: true,
    patches: {
      TITLE: {
        type: PatchType.PARAGRAPH,
        children: [new TextRun("Template test")],
      },
      CONTENT: {
        type: PatchType.DOCUMENT,
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun("Inserted heading")],
          }),
          new Paragraph("Inserted body"),
          new Paragraph({
            children: [new ImageRun({
              type: "svg",
              data: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="#2f7ea1"/></svg>'),
              fallback: {
                type: "png",
                data: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nWQAAAAASUVORK5CYII=", "base64"),
              },
              transformation: { width: 10, height: 10 },
            })],
          }),
        ],
      },
    },
  });

  const zip = await JSZip.loadAsync(output);
  const documentXml = await zip.file("word/document.xml").async("text");
  const headerXml = await zip.file("word/header1.xml").async("text");
  const footerXml = await zip.file("word/footer1.xml").async("text");

  assert.match(documentXml, /Template test/);
  assert.match(documentXml, /Inserted heading/);
  assert.match(documentXml, /Inserted body/);
  assert.doesNotMatch(documentXml, /\{\{(?:TITLE|CONTENT)\}\}/);
  assert.match(headerXml, /Template header/);
  assert.match(footerXml, /Template footer/);
  assert.ok(Object.keys(zip.files).some((name) => /^word\/media\//.test(name)), "expected patched image media");
});
