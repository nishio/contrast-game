"""ランダムな手を選ぶサンプルAIクライアント"""
import random
import asyncio
import aiohttp
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel

class TilePlacement(BaseModel):
    position: Tuple[int, int]
    color: str

class Move(BaseModel):
    piece_position: Tuple[int, int]
    target_position: Tuple[int, int]
    tile_placement: Optional[TilePlacement] = None

class GameClient:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        
    async def create_game(self) -> str:
        """新しいゲームを作成し、game_idを返す"""
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/api/games/create") as response:
                data = await response.json()
                return data["game_id"]
                
    async def get_game_state(self, game_id: str) -> Dict:
        """ゲームの状態を取得"""
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.base_url}/api/games/{game_id}") as response:
                return await response.json()
                
    async def submit_move(self, game_id: str, move: Move) -> Dict:
        """手を提出"""
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/api/games/{game_id}/move",
                json=move.dict()
            ) as response:
                return await response.json()

class RandomPlayer:
    def __init__(self, client: GameClient):
        self.client = client
        
    def select_random_move(self, legal_moves: List[Dict]) -> Move:
        """合法手の中からランダムに1手を選択"""
        move_dict = random.choice(legal_moves)
        return Move(
            piece_position=move_dict["piece_position"],
            target_position=move_dict["target_position"],
            tile_placement=TilePlacement(**move_dict["possible_tile_placements"][0])
            if move_dict["possible_tile_placements"]
            else None
        )
        
    async def play_game(self, game_id: str):
        """ゲームを最後まで実行"""
        while True:
            # ゲーム状態を取得
            state = await self.client.get_game_state(game_id)
            
            # 勝者が決まっていれば終了
            if "winner" in state:
                print(f"Game Over! Winner: Player {state['winner']}")
                break
                
            # 合法手の中からランダムに選択して実行
            move = self.select_random_move(state["legal_moves"])
            result = await self.client.submit_move(game_id, move)
            
            print(f"Submitted move: {move}")
            if "winner" in result:
                print(f"Game Over! Winner: Player {result['winner']}")
                break
                
            # 相手の手番の間、少し待機
            await asyncio.sleep(1)

async def main():
    """メイン実行関数"""
    client = GameClient()
    player = RandomPlayer(client)
    
    # 新しいゲームを作成
    game_id = await client.create_game()
    print(f"Created new game with ID: {game_id}")
    
    # ゲームを実行
    await player.play_game(game_id)

if __name__ == "__main__":
    asyncio.run(main())
