# contrast-game

## 開発計画 / Development Plan

### 現在の実装状況 / Current Implementation Status
- ✅ ゲームサーバー (FastAPI)
  - 基本的なゲーム管理エンドポイント
  - トーナメント管理システム
  - WebSocketによるリアルタイム更新
- ✅ ルールエンジン
  - 移動ルールの実装
  - 勝利条件のチェック
  - 千日手の検出

### 今後の開発計画 / Future Development Plan
1. AIクライアントの実装 / AI Client Implementation
   - サンプルAIクライアントの作成
   - クライアントSDKの提供
   - テストケースの作成

2. ゲーム状態の可視化 / Game State Visualization
   - ボードの描画
   - 駒の移動アニメーション
   - タイル配置の表示

3. マッチ管理システムの拡張 / Match Management System Extension
   - トーナメント形式の実装
   - リーグ戦の実装
   - 成績管理システム

4. テスト整備 / Testing Infrastructure
   - ユニットテストの作成
   - 統合テストの実装
   - パフォーマンステストの追加

### セットアップ手順 / Setup Instructions
```bash
# バックエンドのセットアップ / Backend Setup
cd backend
poetry install
poetry run uvicorn app.main:app --reload

# フロントエンドのセットアップ (実装予定) / Frontend Setup (Planned)
cd frontend
npm install
npm run dev
```

### APIドキュメント / API Documentation
#### ゲーム管理 / Game Management
- `POST /api/games/create` - 新規ゲーム作成
- `GET /api/games/{game_id}` - ゲーム状態取得
- `POST /api/games/{game_id}/move` - 手の実行
- `GET /api/games/{game_id}/legal_moves` - 合法手の取得

#### トーナメント管理 / Tournament Management
- `POST /api/tournaments/create` - トーナメント作成
- `GET /api/tournaments/{tournament_id}` - トーナメント状態取得
- `GET /api/tournaments/{tournament_id}/matches` - 試合一覧取得
- `GET /api/tournaments/{tournament_id}/standings` - 順位表取得

### 開発方針 / Development Policy
1. コードの品質管理 / Code Quality Management
   - PRレビューの徹底
   - テストカバレッジの維持
   - ドキュメントの更新

2. パフォーマンス最適化 / Performance Optimization
   - 応答時間の監視
   - メモリ使用量の最適化
   - 同時接続数の管理

3. セキュリティ対策 / Security Measures
   - レート制限の実装
   - 認証システムの導入
   - 入力値の検証

### 貢献ガイド / Contribution Guide
1. 開発フロー / Development Flow
   - Issueの作成
   - ブランチの作成
   - PRの作成
   - レビュー対応

2. コーディング規約 / Coding Standards
   - PEP 8準拠
   - 型ヒントの使用
   - ドキュメンテーション文字列の記述

### ライセンス / License
MIT License
