# コントラストゲーム / Contrast Game

## 概要 / Overview
コントラストは、駒の移動方向がマスの色によって変わる、シンプルながら深い戦略性を持つボードゲームです。このリポジトリは、AIプレイヤーが対戦できるゲームサーバーを提供します。

## 実装状況 / Implementation Status
### バックエンド / Backend
- ✅ FastAPIベースのゲームサーバー
  - WebSocketによるリアルタイム通信
  - RESTful APIエンドポイント
- ✅ ルールエンジン
  - 移動ルールの実装
  - 勝利条件の判定
  - 千日手の検出
- ✅ トーナメント管理システム
  - 対戦管理
  - 成績記録

### フロントエンド / Frontend
- ✅ Next.js + Chakra UIによる実装
  - ゲーム状態の可視化
  - リアルタイム更新
  - 手の選択UI

### AIクライアント / AI Client
- ✅ サンプルAI実装
  - ランダムプレイヤー
  - WebSocket通信対応
- 🔲 評価関数の実装
- 🔲 探索アルゴリズムの実装

## セットアップ手順 / Setup Instructions
### バックエンド / Backend
```bash
cd backend
poetry install
poetry run pytest  # テストの実行
poetry run uvicorn app.main:app --reload  # 開発サーバーの起動
```

### フロントエンド / Frontend
```bash
cd frontend
npm install
npm run dev  # 開発サーバーの起動
```

## API仕様 / API Specification
### ゲーム管理 / Game Management
- `POST /api/games/create` - 新規ゲーム作成
- `GET /api/games/{game_id}` - ゲーム状態取得
- `POST /api/games/{game_id}/move` - 手の実行
- `GET /api/games/{game_id}/legal_moves` - 合法手の取得
- `WS /api/games/{game_id}/ws` - WebSocket接続

### トーナメント管理 / Tournament Management
- `POST /api/tournaments/create` - トーナメント作成
- `GET /api/tournaments/{tournament_id}` - トーナメント状態取得
- `GET /api/tournaments/{tournament_id}/matches` - 試合一覧取得

## 開発ガイド / Development Guide
### コーディング規約 / Coding Standards
- PEP 8準拠
- 型ヒントの使用
- ドキュメンテーション文字列の記述

### テスト / Testing
- ユニットテストの作成
- 統合テストの実装
- WebSocket通信のテスト

## 今後の計画 / Future Plans
1. AIクライアントの機能拡張
   - 評価関数の実装
   - 探索アルゴリズムの実装
   - パフォーマンス最適化

2. フロントエンドの改善
   - アニメーションの追加
   - UI/UXの改善
   - モバイル対応

3. バックエンドの拡張
   - データベースの導入
   - ユーザー認証
   - レート制限の実装

## ライセンス / License
MIT License
