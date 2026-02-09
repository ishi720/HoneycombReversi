# HoneycombReversi

ハニカム（六角形）構造のボードでプレイするリバーシです。

<img width="626" height="759" alt="image" src="https://github.com/user-attachments/assets/f2711ec6-44b0-423f-8a5f-0ec8bc818fc0" />

## ゲームモード

- **2人対戦** — 2人のプレイヤーが交互に石を置いて対戦します
- **CPU対戦** — プレイヤー（黒）がCPU（白）と対戦します

## 座標系

HoneycombReversiでは、六角形グリッドを効率的に扱うために**Cube Coordinates**を採用しています。

制約条件： `x + y + z = 0`

<img width="657" height="459" alt="image" src="https://github.com/user-attachments/assets/aa2a4453-b3d9-4358-aacd-82ea7558c4b7" />

## 技術スタック

- フロントエンド: React 19
- ビルドツール: Vite 7
- デプロイ: GitHub Pages（GitHub Actions）

## 開発

```bash
# 依存パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev

# プロダクションビルド
npm run build

# ビルド結果のプレビュー
npm run preview
```

## クレジット

本プロジェクトでは、以下の素材を使用しています。

- 効果音素材：On-Jin ～音人～
  https://on-jin.com/
