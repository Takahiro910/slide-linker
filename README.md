# Slide Linker

PPTX/PDF プレゼンテーションを、ホットスポットによる非線形ナビゲーション付きのスタンドアロン HTML に変換する Windows デスクトップアプリ。

## 特徴

- **PDF/PPTX 読み込み** — スライドを自動で画像化
- **ホットスポット編集** — スライド上の任意の領域にリンクを設定（スライド間リンク / 外部URL）
- **メイン/サブ分類** — メインスライドを縦スクロール表示、サブスライドはオーバーレイで展開
- **ライブプレビュー** — エクスポート前に実際のナビゲーション体験を確認
- **スタンドアロン HTML エクスポート** — 画像を Base64 埋め込みした単一 HTML ファイル（オフライン閲覧可能）

## スクリーンショット

> *準備中*

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フレームワーク | Tauri v2 |
| フロントエンド | React 19 + TypeScript |
| 状態管理 | Zustand |
| バックエンド | Rust |
| PDF → 画像 | PDFium |
| PPTX → PDF | LibreOffice (headless) |

## セットアップ

### 前提条件

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install)
- [pnpm](https://pnpm.io/)
- PPTX を扱う場合: [LibreOffice](https://www.libreoffice.org/)

### インストール

```bash
pnpm install
```

### 開発サーバー起動

```bash
pnpm tauri dev
```

### ビルド

```bash
pnpm tauri build
```

## 使い方

1. アプリを起動し、PDF または PPTX ファイルを読み込む
2. 左パネルでスライドをメイン/サブに分類
3. 中央キャンバスでスライド上にホットスポットを矩形描画
4. 右パネルでリンク先（スライドまたは外部URL）を設定
5. プレビューモードでナビゲーションを確認
6. HTML エクスポートでスタンドアロンファイルを生成

## キーボードショートカット

| キー | 動作 |
|------|------|
| `Ctrl+O` | ファイルを開く |
| `Ctrl+S` | プロジェクト保存 |
| `Ctrl+Shift+S` | 名前を付けて保存 |
| `Ctrl+E` | HTML エクスポート |
| `Ctrl+P` | プレビューモード切替 |
| `Delete` | 選択中ホットスポット削除 |
| `Escape` | プレビュー: 1階層戻る / エディタ: 選択解除 |

## ライセンス

MIT
