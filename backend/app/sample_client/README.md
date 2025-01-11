# サンプルAIクライアント / Sample AI Client

## 概要 / Overview
このディレクトリには、Contrast GameのAPIを使用してゲームを実行するサンプルAIクライアントが含まれています。

## 実装例 / Implementation Examples
1. `random_player.py` - ランダムな手を選ぶ基本的なAIクライアント
   - ゲーム作成
   - 状態取得
   - ランダムな合法手の選択
   - 手の実行

## 使い方 / Usage
```bash
# 依存パッケージのインストール / Install dependencies
poetry add aiohttp

# ランダムプレイヤーの実行 / Run random player
python -m app.sample_client.random_player
```

## カスタムAIの作成 / Creating Custom AI
1. `GameClient`クラスを使用してAPIとの通信を行う
2. `RandomPlayer`クラスを参考に、独自の思考ルーチンを実装
3. 必要に応じて追加の機能を実装（評価関数、探索アルゴリズムなど）
