# Mermaid Markdown Local

[English](README.md)

通常の文書へMermaid図を気軽に入れるための、小さなMarkdownエディタです。
1枚のHTMLとして動作し、インストール、サーバー、アカウント、インターネット
接続を必要としません。

## 主な機能

- 左側のMarkdownエディタと右側のライブViewer
- Viewerだけを全幅で表示するモード
- VS Codeに合わせたQuiet Lightを含むMermaid配色
- 本文フォント、文字サイズ、Viewer配色の切り替え
- PDF印刷、PNG、Word（`.docx`）、PowerPoint（`.pptx`）書き出し
- Word・PowerPointでは本文と表を編集可能。Mermaidは鮮明なSVG
- `{{CONTENT}}`を置いたローカル`.docx`をWordテンプレートとして利用可能
- `---`だけの行でPowerPointのスライドを分割
- 対応ブラウザでは、開いたMarkdownファイルを直接上書き保存
- MarkdownとMermaidのチートシート
- 配布物は1枚のHTML

## プライバシー

文書はブラウザ内だけで処理されます。配布HTMLには必要なライブラリがすべて
内蔵され、Content Security Policyの`connect-src 'none'`で外部通信を禁止
しています。アクセス解析、テレメトリー、外部フォント、CDN、クラウドAPIは
含みません。

表示設定はブラウザのローカルストレージに保存されます。書き出したファイル
には、当然ながら編集中の文書内容が含まれます。

Wordテンプレートはブラウザのメモリ内だけで処理し、保存しません。マクロ、
自動通信につながる外部参照、25MBを超えるテンプレートは受け付けません。

GitHubからHTMLをダウンロードする際には、GitHubとの通信が発生します。
ダウンロード後、HTMLをローカルファイルとして開いた場合、編集中の文書内容が
このアプリから外部へ送信されることはありません。厳密なオフライン利用では、
必要に応じてネットワークを切ったうえで`dist/mermaid-markdown-local.html`を
ローカルファイルとして開いてください。

## 使い方

1. 最新のGitHub Release、または`dist/`から
   `mermaid-markdown-local.html`を取得します。
2. モダンブラウザで開きます。
3. 「開く」を選ぶか、Markdownファイルを画面へドロップします。
4. 左側で編集し、右側で確認します。

ChromeとEdgeでは、利用者が許可した後にFile System Access APIを使って直接
上書きできます。未対応ブラウザではダウンロード保存へ切り替わります。
PDFはブラウザの印刷画面から保存します。

### Wordテンプレート

1. `.docx`テンプレートの本文で、挿入位置に`{{CONTENT}}`だけの段落を1つ置きます。
2. 必要であれば、文書名の挿入位置に`{{TITLE}}`を置きます。
3. 画面下部の「表示・書き出し」で「Wordテンプレート」の「選択」を押します。
4. 通常どおり上部の「Word」を押します。

テンプレートの用紙サイズ、余白、ヘッダー、フッター、ロゴ、見出しスタイルを
維持して本文を差し込みます。テンプレートを選ばなければ、従来の標準書式で
書き出します。

## ビルド

Node.js 20以上とnpmが必要です。

```bash
npm ci
npm run verify
```

生成先は次のファイルです。

```text
dist/mermaid-markdown-local.html
```

ソースは`src/`にあります。実行時ライブラリは`package-lock.json`で固定され、
ビルドにもCDNを使いません。

## リリース

`v0.2.0`のようなタグをpushすると、Releaseワークフローがビルドと検査を行い、
1枚HTMLをGitHub Releaseへ添付します。

```bash
git tag v0.2.0
git push origin v0.2.0
```

## セキュリティ

[SECURITY.md](SECURITY.md)を参照してください。公開Issueへ機密文書を添付しないで
ください。

## ライセンス

本プロジェクトのソースコードは[MIT License](LICENSE)です。配布HTMLには複数の
オープンソースライブラリが内蔵されています。各ライセンスは
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)に記載し、単体HTMLにも埋め込み
ます。
