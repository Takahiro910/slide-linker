# Slide Linker — 仕様書

非線形プレゼンテーションHTMLジェネレーター

## 1. プロダクト概要

### 1.1 コンセプト

既存のPPTX/PDFプレゼンテーション資料を読み込み、スライドを「メイン（本流）」と「サブ（詳細）」に分類。メインスライドをWebサイト的に縦スクロールで並べ、スライド上の任意の要素（図表・テキスト領域等）にホットスポットを設定してサブスライドへリンクする。最終成果物はスタンドアロンHTMLファイル。

### 1.2 ターゲットユーザー

- 既存PPT資産を大量に持つビジネスパーソン
- プレゼン資料を社内共有・非同期閲覧させたい人
- 技術的知識は不要（GUI完結）

### 1.3 プラットフォーム

- **Windows デスクトップアプリ**（Tauri v2 + React フロントエンド）

---

## 2. アーキテクチャ

### 2.1 技術スタック

| レイヤー | 技術 | 役割 |
|---------|------|------|
| フレームワーク | Tauri v2 | Windowsデスクトップアプリ |
| フロントエンド | React + TypeScript | エディタUI・プレビュー |
| バックエンド（Rust） | tauri core | ファイルI/O、プロジェクト保存 |
| PPTX→画像変換 | LibreOffice (headless) | soffice --convert-to pdf → 画像化 |
| PDF→画像変換 | pdf2image / poppler | ページ単位でPNG出力 |
| HTMLエクスポート | Rust or JS テンプレート | スタンドアロンHTML生成 |

### 2.2 処理パイプライン

```
[PPTX/PDF ファイル]
    ↓
[スライド画像化] LibreOffice (PPTX→PDF) + Poppler (PDF→PNG)
    ↓
[エディタ画面] メイン/サブ分類 + ホットスポット設定
    ↓
[プロジェクト保存] .json ファイル
    ↓
[HTMLエクスポート] Base64埋め込みスタンドアロンHTML
```

### 2.3 ディレクトリ構造（参考）

```
slide-linker/
├── src-tauri/          # Rust バックエンド
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands.rs # Tauri コマンド（ファイル操作等）
│   │   └── export.rs   # HTMLエクスポートロジック
│   └── Cargo.toml
├── src/                # React フロントエンド
│   ├── App.tsx
│   ├── components/
│   │   ├── SlidePanel.tsx       # 左：スライド一覧
│   │   ├── EditorCanvas.tsx     # 中央：ホットスポット編集
│   │   ├── HotspotSettings.tsx  # 右：ホットスポット設定
│   │   ├── PreviewMode.tsx      # プレビューモード
│   │   └── HotspotOverlay.tsx   # ホットスポット描画レイヤー
│   ├── types.ts
│   └── store.ts                 # 状態管理
├── package.json
└── tauri.conf.json
```

---

## 3. データモデル

### 3.1 プロジェクトファイル（.slproj.json）

```jsonc
{
  "version": "1.0",
  "created_at": "2025-02-10T12:00:00Z",
  "updated_at": "2025-02-10T15:30:00Z",
  "source_file": "presentation.pptx",  // 元ファイルパス（参考情報）
  "aspect_ratio": "16:9",              // スライドのアスペクト比
  "slides": [
    {
      "id": "slide-001",
      "index": 0,                // 元ファイルでのページ番号（0始まり）
      "label": "タイトル",        // ユーザーが編集可能なラベル
      "is_main": true,
      "image_path": "slides/slide-001.png",  // 相対パス
      "hotspots": [
        {
          "id": "hs-001",
          "x": 25.5,       // % 座標（左上基準）
          "y": 40.0,
          "w": 30.0,       // % サイズ
          "h": 20.0,
          "link_type": "slide",       // "slide" | "url"
          "target_id": "slide-006",   // link_type="slide" 時：リンク先スライドID
          "url": null,                // link_type="url" 時：外部URL
          "tooltip": "予測力の詳細"   // オプション：ツールチップテキスト
        }
      ]
    }
    // ... 全スライド
  ]
}
```

### 3.2 TypeScript 型定義

```typescript
interface Project {
  version: string;
  created_at: string;
  updated_at: string;
  source_file: string;
  aspect_ratio: string;     // "16:9" | "4:3" 等、画像から自動判定
  slides: Slide[];
}

interface Slide {
  id: string;
  index: number;
  label: string;
  is_main: boolean;
  image_path: string;    // プロジェクトフォルダからの相対パス
  hotspots: Hotspot[];
}

interface Hotspot {
  id: string;
  x: number;      // % (0-100)
  y: number;
  w: number;
  h: number;
  link_type: 'slide' | 'url';
  target_id: string | null;   // link_type="slide" 時
  url: string | null;         // link_type="url" 時
  tooltip?: string;
}

// ナビゲーション履歴スタック
type NavigationStack = string[];  // slide ID の配列
```

---

## 4. 機能仕様

### 4.1 ファイル読み込み

| 項目 | 仕様 |
|------|------|
| 対応形式 | PPTX, PDF |
| PPTX処理 | LibreOffice headless で PDF に変換 → Poppler で PNG 化 |
| PDF処理 | Poppler (pdftoppm) で直接 PNG 化 |
| 画像解像度 | 1920px 幅（16:9 前提）、150-200 DPI 相当 |
| 保存先 | プロジェクトフォルダ内 `slides/` ディレクトリ |

**読み込みフロー：**

1. ユーザーがPPTX/PDFを選択（ネイティブファイルダイアログ）
2. バックエンドでスライド画像化を実行（プログレスバー表示）
3. 全スライドを `is_main: true`（デフォルト）で読み込み
4. エディタ画面に遷移

### 4.2 エディタ画面（3ペインレイアウト）

#### 左ペイン：スライド一覧パネル

| 項目 | 仕様 |
|------|------|
| 表示 | サムネイル一覧（縦スクロール） |
| メイン/サブ切替 | 各スライドにトグルボタン（⇄ アイコン） |
| バッジ | メイン=青「MAIN」、サブ=紫「SUB」 |
| 選択 | クリックで中央ペインに表示 |
| ラベル編集 | ダブルクリックでインライン編集 |
| 並び替え | ドラッグ&ドロップでメインスライドの表示順を変更 |
| フィルタ | 「ALL / MAIN / SUB」タブ切替 |

#### 中央ペイン：エディタキャンバス

| 項目 | 仕様 |
|------|------|
| 表示 | 選択中スライドを大きく表示 |
| ホットスポット描画 | スライド上をマウスドラッグで矩形描画 |
| ホットスポット選択 | クリックで選択（青枠ハイライト） |
| ホットスポット移動 | 選択中のホットスポットをドラッグで移動 |
| ホットスポットリサイズ | 四隅・辺のハンドルでリサイズ |
| ホットスポット削除 | 選択中に Delete キーで削除 |
| カーソル | 通常=default、描画可能エリア=crosshair、ホットスポット上=pointer |

#### 右ペイン：ホットスポット設定パネル

| 項目 | 仕様 |
|------|------|
| 表示 | 現在スライドのホットスポット一覧 |
| リンク種別 | 「スライド」/「外部URL」のラジオボタン切替 |
| リンク先（スライド） | スライドのサムネイル一覧からクリックで選択 |
| リンク先（URL） | URL入力欄（https://...）+ 新規タブで開くチェックボックス |
| リンク先対象 | **全スライド**（サブだけでなくメインも選択可能、サブ→サブも可能） |
| ツールチップ | テキスト入力欄（任意） |
| 座標表示 | x, y, w, h をパーセンテージで表示 |
| 削除ボタン | 個別ホットスポットの削除 |

### 4.3 プレビューモード

メインスライドを縦スクロールで並べた閲覧体験のプレビュー。

| 項目 | 仕様 |
|------|------|
| レイアウト | メインスライドを全幅・縦スクロールで連続表示 |
| ホットスポット表示 | 以下A+Cの組み合わせ（発見性とスライド美観の両立） |
| **A. 進入時フラッシュ** | スライドがビューポートに入った瞬間、全ホットスポットの枠線が薄く出現し、約1秒で消える（`IntersectionObserver` + CSS animation）。一度表示したスライドでは再トリガーしない（フラグ管理） |
| **C. 常時パルスドット** | ホットスポット領域の中心に小さな光点（4〜6px円）を常時配置。ゆっくり明滅（opacity 0.3↔0.8、周期2〜3秒）。スライドリンク=水色ドット、外部URL=オレンジドット |
| ホバー時 | マウスオーバーで枠線全体がフェードイン（半透明の枠線＋背景ハイライト）。パルスドットは非表示に |
| ホバー時（外部URL） | 枠線色をオレンジ系に + カーソルが外部リンクアイコン付き（`cursor: alias`） |
| クリック（スライド） | リンク先スライドを全画面オーバーレイで表示 |
| クリック（外部URL） | ブラウザの新規タブで外部URLを開く |
| サブスライド表示 | 全画面表示（画面全体を覆うオーバーレイ） |
| サブ上のホットスポット | さらにサブスライドにもホットスポットがあればクリック可能（無制限ネスト） |
| ESC キー | **1階層ずつ戻る**（スタック方式） |
| 戻るボタン | サブスライド左上に「← 戻る」ボタン |
| ナビゲーション | 画面下部にメインスライドのドットナビゲーション |
| キーボード | ↑↓ or スクロールでメインスライド間移動 |

**ナビゲーションスタック動作例：**

```
メインA → サブB → サブC → サブD
ESC: サブD を閉じる → サブC に戻る
ESC: サブC を閉じる → サブB に戻る
ESC: サブB を閉じる → メインA に戻る
```

### 4.4 プロジェクト保存/読込

| 項目 | 仕様 |
|------|------|
| 形式 | `.slproj.json`（独自拡張子） |
| 保存内容 | スライド一覧、メイン/サブ分類、全ホットスポット設定 |
| 画像参照 | プロジェクトフォルダからの相対パス |
| 保存操作 | Ctrl+S で上書き保存、Ctrl+Shift+S で名前を付けて保存 |
| 自動保存 | 変更検知後30秒で自動保存（オプション） |
| ファイル関連付け | `.slproj.json` をダブルクリックでアプリ起動（Tauri設定） |

**プロジェクトフォルダ構造：**

```
my-presentation/
├── my-presentation.slproj.json   # プロジェクトファイル
└── slides/                       # 変換済みスライド画像
    ├── slide-001.png
    ├── slide-002.png
    └── ...
```

### 4.5 HTMLエクスポート

| 項目 | 仕様 |
|------|------|
| 出力 | **単一HTMLファイル**（完全スタンドアロン） |
| 画像 | Base64 エンコードで `<img src="data:image/png;base64,...">` として埋め込み |
| CSS/JS | すべてインライン |
| 外部依存 | なし（オフライン閲覧可能） |
| レイアウト | メインスライドを縦スクロールで配置 |
| ホットスポット | div要素で絶対配置、普段非表示、hover で枠線出現 |
| サブスライド | 全画面モーダルオーバーレイ |
| ナビゲーション | ESCで1階層戻る（スタック方式）、ドットナビゲーション |
| レスポンシブ | スライド画像は max-width: 100% でスケーリング |

**エクスポートHTMLの構造イメージ：**

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{プロジェクト名}</title>
  <style>
    /* 全スタイルをインライン */
    .hotspot {
      position: absolute;
      border: 2px solid transparent;
      background: transparent;
      cursor: pointer;
      transition: all 0.3s;
    }
    .hotspot:hover {
      border-color: rgba(99, 200, 255, 0.6);
      background: rgba(99, 200, 255, 0.1);
    }
    .hotspot:hover .pulse-dot { opacity: 0 !important; }
    .hotspot[data-type="url"]:hover {
      border-color: rgba(255, 180, 50, 0.6);
      background: rgba(255, 180, 50, 0.1);
      cursor: alias;
    }

    /* A. 進入時フラッシュ */
    @keyframes hotspotFlash {
      0%   { border-color: rgba(99,200,255,0.6); background: rgba(99,200,255,0.12); }
      100% { border-color: transparent; background: transparent; }
    }
    .slide-container.in-view .hotspot {
      animation: hotspotFlash 1s ease-out forwards;
    }

    /* C. 常時パルスドット */
    .pulse-dot {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 6px; height: 6px;
      border-radius: 50%;
      background: rgba(99, 200, 255, 0.8);
      animation: pulse 2.5s ease-in-out infinite;
      pointer-events: none;
    }
    .hotspot[data-type="url"] .pulse-dot {
      background: rgba(255, 180, 50, 0.8);
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.3; }
      50%      { opacity: 0.8; }
    }
    .modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.85);
      z-index: var(--z);  /* スタック深度に応じて動的設定 */
      align-items: center;
      justify-content: center;
    }
    .modal-overlay.active { display: flex; }
    /* ... */
  </style>
</head>
<body>
  <!-- メインスライド（縦スクロール） -->
  <section class="main-slide" id="slide-001">
    <div class="slide-container">
      <img src="data:image/png;base64,..." />
      <div class="hotspot" style="left:25%;top:40%;width:30%;height:20%"
           onclick="openSlide('slide-006')">
        <span class="pulse-dot"></span>
      </div>
      <!-- 外部URLホットスポット -->
      <div class="hotspot" data-type="url" style="left:60%;top:70%;width:20%;height:15%"
           onclick="openUrl('https://example.com')">
        <span class="pulse-dot"></span>
      </div>
    </div>
  </section>
  <!-- ...他のメインスライド -->

  <!-- サブスライド（モーダル） -->
  <div class="modal-overlay" id="modal-slide-006">
    <div class="modal-content">
      <img src="data:image/png;base64,..." />
      <!-- サブスライド上のホットスポット -->
      <div class="hotspot" style="..." onclick="openSlide('slide-008')"></div>
      <button class="back-btn" onclick="goBack()">← 戻る</button>
    </div>
  </div>
  <!-- ...他のサブスライド -->

  <script>
    // ナビゲーションスタック
    const navStack = [];
    
    function openSlide(id) {
      navStack.push(id);
      document.getElementById('modal-' + id).classList.add('active');
      // z-index をスタック深度に応じて設定
      document.getElementById('modal-' + id).style.zIndex = 100 + navStack.length;
    }
    
    function openUrl(url) {
      window.open(url, '_blank');
    }
    
    function goBack() {
      if (navStack.length === 0) return;
      const id = navStack.pop();
      document.getElementById('modal-' + id).classList.remove('active');
    }
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') goBack();
    });
    
    // A. 進入時フラッシュ（IntersectionObserver）
    const containers = document.querySelectorAll('.slide-container');
    const flashObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && !e.target.classList.contains('in-view')) {
          e.target.classList.add('in-view');
        }
      });
    }, { threshold: 0.3 });
  </script>
</body>
</html>
```

---

## 4.6 座標系・ホットスポット配置ルール

ホットスポットの位置がエディタ・プレビュー・エクスポートHTML間でずれないよう、以下を厳守する。

### 座標基準

| 項目 | 仕様 |
|------|------|
| 座標系 | **スライド画像の左上を (0,0)、右下を (100,100) とするパーセンテージ座標** |
| 基準要素 | `<img>` 要素そのもの（パディング・マージン・ボーダーを含まない） |
| ホットスポット配置 | `position: absolute` で `<img>` と同一サイズの親コンテナ内に配置 |

### 実装パターン（全画面共通）

エディタ・プレビュー・エクスポートHTMLのすべてで、以下の同一構造を使用する：

```html
<!-- この構造をエディタ・プレビュー・エクスポートで統一 -->
<div class="slide-wrapper" style="position: relative; width: 100%; aspect-ratio: 16/9;">
  <!-- 画像は親コンテナに完全フィット -->
  <img src="..." style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain;" />
  
  <!-- ホットスポットレイヤー：画像と完全に同一サイズ -->
  <div class="hotspot-layer" style="position: absolute; inset: 0;">
    <div class="hotspot" style="
      position: absolute;
      left: 25%;    /* x% */
      top: 40%;     /* y% */
      width: 30%;   /* w% */
      height: 20%;  /* h% */
    "></div>
  </div>
</div>
```

### ズレ防止チェックリスト

| チェック項目 | 説明 |
|-------------|------|
| `object-fit: contain` 使用禁止（単体画像） | `contain` はレターボックスを生むため、画像とホットスポットレイヤーの座標がずれる。`aspect-ratio` を親に設定して画像は `width:100%; height:100%` でフィットさせる |
| 親コンテナの `aspect-ratio` 統一 | エディタ・プレビュー・HTMLすべてで同じ `aspect-ratio`（元スライドのアスペクト比、通常16:9）を使用 |
| `<img>` と hotspot-layer は同一親の直接子 | 間に余計なラッパーを挟まない |
| padding/border は親の外側に | `slide-wrapper` 自体にパディングやボーダーを付けない。装飾が必要なら外側のラッパーで行う |
| スクロール位置を座標計算に混入させない | ホットスポット描画時は `getBoundingClientRect()` を使用（`offsetX/Y` は子要素のネストで不正確になりうる） |

### アスペクト比の扱い

| 項目 | 仕様 |
|------|------|
| デフォルト | 16:9（PPTXの標準） |
| 判定方法 | スライド画像化時に実際の画像サイズから算出し、プロジェクトファイルに保存 |
| 混在 | 1プロジェクト内のスライドはすべて同一アスペクト比を前提（異なる場合は読み込み時に警告） |

---

### 5.1 カラースキーム

ダークテーマ基調。

| 要素 | カラー |
|------|--------|
| 背景 | `#0c0f1a` |
| サーフェス | `#141825` |
| ボーダー | `rgba(255,255,255,0.07)` |
| テキスト | `#e2e8f0` |
| テキスト（薄） | `#64748b` |
| アクセント | `#638cff` |
| メインバッジ | `#638cff`（青） |
| サブバッジ | `#a855f7`（紫） |
| ホットスポット枠 | `rgba(99, 200, 255, 0.6)` |
| 危険 | `#ef4444` |

### 5.2 キーボードショートカット

| キー | 動作 |
|------|------|
| Ctrl+O | ファイルを開く（PPTX/PDF） |
| Ctrl+S | プロジェクト保存 |
| Ctrl+Shift+S | 名前を付けて保存 |
| Ctrl+E | HTMLエクスポート |
| Ctrl+P | プレビューモード切替 |
| Delete | 選択中ホットスポット削除 |
| Escape | プレビュー中：1階層戻る / エディタ中：選択解除 |
| ↑ / ↓ | プレビュー中：メインスライド間移動 |

### 5.3 画面遷移

```
[起動画面]
  ├── 新規作成 → [ファイル選択ダイアログ] → [変換中...] → [エディタ画面]
  └── プロジェクトを開く → [.slproj.json 選択] → [エディタ画面]

[エディタ画面]
  ├── [左] スライド一覧
  ├── [中央] ホットスポット編集キャンバス
  ├── [右] ホットスポット設定
  └── ▶ プレビュー → [プレビューモード] → ← 編集に戻る
```

---

## 6. 外部依存・前提条件

### 6.1 ビルド依存

| 依存 | 用途 | 備考 |
|------|------|------|
| Rust + Cargo | Tauri バックエンド | |
| Node.js + npm | React フロントエンド | |
| Tauri CLI v2 | ビルド・パッケージング | |

### 6.2 ランタイム依存（バンドルまたは要インストール）

| 依存 | 用途 | バンドル方針 |
|------|------|-------------|
| LibreOffice | PPTX → PDF 変換 | ユーザーに事前インストールを要求（パス設定UI提供） |
| Poppler (pdftoppm) | PDF → PNG 変換 | バンドル推奨（Windows向けバイナリ同梱） |

**代替案：** LibreOffice依存を避ける場合、PPTX対応を将来対応としてPDFのみの初期リリースも選択肢。その場合 Poppler のみで完結する。

---

## 7. 開発フェーズ

### Phase 1: MVP（最小動作版）

- PDF読み込み → スライド画像化
- メイン/サブ分類
- ホットスポット描画・リンク設定
- プレビューモード（全画面サブスライド、ESCスタック、ホバー表示）
- HTMLエクスポート（Base64埋め込み）
- プロジェクト保存/読込

### Phase 2: 完成版

- PPTX対応（LibreOffice連携）
- ホットスポットの移動・リサイズ
- スライドラベル編集
- メインスライドの並び替え（D&D）
- キーボードショートカット全実装
- 自動保存

### Phase 3: 拡張（将来）

- ホットスポットにトランジションアニメーション設定
- スライド内テキストのOCR → 検索機能
- AIによるホットスポット自動提案（図表検出）
- エクスポートHTML のテーマ切替（ダーク/ライト）
- 複数ファイルのマージ（複数PPTXを1プロジェクトに統合）

---

## 8. 備考・設計判断の根拠

| 判断 | 理由 |
|------|------|
| メインのみ選択制 | サブの方が多い運用が想定されるため、少ない方を選ぶUXが自然 |
| ネスト無制限 | 制限するとサブ→サブのリンクで不自然な制約が発生。スタック方式で戻りを保証 |
| Base64埋め込み | 共有時に画像フォルダの管理が不要。1ファイルをメール添付/チャット共有で完結 |
| ESC=1階層戻り | 無制限ネストと整合。ユーザーの「どこにいるか」の感覚を維持 |
| ホットスポット発見性 | A（進入時フラッシュ）で初見の気づきを確保 + C（パルスドット）で常時ヒントを提供。スライドの美観を最小限の侵食で発見性を担保する組み合わせ |
| 外部URL対応 | 画像化でハイパーリンクが失われる問題への対策。スライド内リンクと外部URLを同じホットスポットUIで統一的に扱う |
| 座標系の統一構造 | エディタ・プレビュー・エクスポートで同一のHTML構造（slide-wrapper > img + hotspot-layer）を使うことで、パーセンテージ座標のズレを構造的に防止 |
| プロジェクトファイル(.json) | 再編集可能性を担保。HTMLは最終出力、プロジェクトは作業ファイル |
