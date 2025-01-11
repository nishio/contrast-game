# コントラストゲーム バックエンド / Contrast Game Backend

## 環境要件 / Environment Requirements

### Python バージョン / Python Version
- Python 3.10 以上を推奨 (Recommended Python 3.10 or later)
- Python 3.12 での既知の問題 (Known issues with Python 3.12):
  - 一部の依存パッケージ（aiohttp等）との互換性の問題
  - six モジュールの依存関係の問題

### 依存パッケージ / Dependencies
- FastAPI (^0.115.6)
- Uvicorn (^0.34.0)
- Pydantic (^2.10.5)
- aiohttp (^3.11.11)

## セットアップ手順 / Setup Instructions

1. Python環境の準備 / Prepare Python Environment
```bash
# pyenvでPython 3.10をインストール / Install Python 3.10 using pyenv
pyenv install 3.10
pyenv local 3.10

# poetryのインストール / Install poetry
curl -sSL https://install.python-poetry.org | python3 -
```

2. 依存パッケージのインストール / Install Dependencies
```bash
poetry install
```

3. テストの実行 / Run Tests
```bash
poetry run pytest
```

4. 開発サーバーの起動 / Start Development Server
```bash
poetry run uvicorn app.main:app --reload
```

## トラブルシューティング / Troubleshooting

### 既知の問題 / Known Issues

1. Python 3.12での依存関係の問題 / Dependency Issues with Python 3.12
- 症状: 依存パッケージとの互換性の問題
- 解決策: Python 3.10を使用する

2. テスト実行時のWebSocket接続エラー / WebSocket Connection Error During Tests
- 症状: `aiohttp.client_exceptions.ClientConnectorError`
- 原因: テスト実行時にバックエンドサーバーが起動していない
- 解決策: テスト実行前にサーバーを起動する

## 開発ガイドライン / Development Guidelines

1. コーディング規約 / Coding Standards
- PEP 8に準拠
- 型ヒントを使用
- ドキュメンテーション文字列を記述

2. テスト / Testing
- 新機能の追加時はテストを作成
- テストカバレッジの維持
- 統合テストの実装

3. ドキュメント / Documentation
- コードの変更に応じてドキュメントを更新
- APIの変更点を記録
- セットアップ手順の更新
