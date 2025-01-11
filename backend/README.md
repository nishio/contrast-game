# コントラストゲーム バックエンド / Contrast Game Backend

## 環境要件 / Environment Requirements

### Python バージョン / Python Version
- Python 3.10 以上を推奨 (Recommended Python 3.10 or later)
- Python 3.12 での既知の問題 (Known issues with Python 3.12):
  - 一部の依存パッケージ（aiohttp等）との互換性の問題

### 依存パッケージ / Dependencies
- FastAPI (^0.115.6)
- Uvicorn (^0.34.0)
- Pydantic (^2.10.5)
- aiohttp (^3.11.11)

## セットアップ手順 / Setup Instructions

### 1. 仮想環境の準備 / Prepare Virtual Environment

```bash
# プロジェクトディレクトリに移動 / Change to project directory
cd backend

# 仮想環境の作成 / Create virtual environment
python -m venv venv

# 仮想環境のアクティベート / Activate virtual environment
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 仮想環境のPythonバージョン確認 / Check Python version in virtual environment
python --version  # Should show Python 3.10.x
```

### 2. 依存パッケージのインストール / Install Dependencies

```bash
# pipのアップグレード / Upgrade pip
python -m pip install --upgrade pip

# 依存パッケージのインストール / Install dependencies
pip install -r requirements.txt

# または直接インストール / Or install directly
pip install "fastapi[all]" "uvicorn[standard]" pydantic aiohttp pytest pytest-asyncio httpx
```

### 3. 動作確認 / Verification

```bash
# テストの実行 / Run tests
pytest

# 開発サーバーの起動 / Start development server
uvicorn app.main:app --reload
```

## トラブルシューティング / Troubleshooting

### 仮想環境の問題 / Virtual Environment Issues

1. 仮想環境のアクティベーションエラー / Activation Error
- 症状: アクティベーションコマンドが失敗する
- 解決策:
  ```bash
  # 仮想環境の再作成 / Recreate virtual environment
  rm -rf venv
  python -m venv venv
  source venv/bin/activate  # macOS/Linux
  # または / or
  venv\Scripts\activate  # Windows
  ```

2. パッケージのインストールエラー / Package Installation Error
- 症状: `pip install` が失敗する
- 解決策:
  ```bash
  # キャッシュを使わずに再インストール / Reinstall without cache
  pip install --no-cache-dir -r requirements.txt
  ```

### Python関連の問題 / Python Issues

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
