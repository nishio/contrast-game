from fastapi import APIRouter, HTTPException
from typing import List, Dict
from pydantic import BaseModel
from uuid import uuid4

class Tournament(BaseModel):
    id: str
    players: List[str]
    matches: List[Dict[str, str]]  # List of game_ids and player assignments
    standings: Dict[str, int]  # Player -> Score mapping

class TournamentManager:
    def __init__(self):
        self.tournaments: Dict[str, Tournament] = {}
        
    def create_tournament(self, players: List[str]) -> Tournament:
        """Create a new tournament with the given players."""
        tournament_id = str(uuid4())
        tournament = Tournament(
            id=tournament_id,
            players=players,
            matches=[],
            standings={player: 0 for player in players}
        )
        self.tournaments[tournament_id] = tournament
        return tournament
        
    def get_tournament(self, tournament_id: str) -> Tournament:
        """Get tournament by ID."""
        if tournament_id not in self.tournaments:
            raise HTTPException(status_code=404, detail="Tournament not found")
        return self.tournaments[tournament_id]
        
    def update_standings(self, tournament_id: str, winner: str):
        """Update tournament standings after a game."""
        tournament = self.get_tournament(tournament_id)
        if winner in tournament.standings:
            tournament.standings[winner] += 1

router = APIRouter(prefix="/api/tournaments", tags=["tournaments"])
tournament_manager = TournamentManager()

@router.post("/create")
async def create_tournament(players: List[str]):
    """Create a new tournament."""
    tournament = tournament_manager.create_tournament(players)
    return {"tournament_id": tournament.id}

@router.get("/{tournament_id}")
async def get_tournament(tournament_id: str):
    """Get tournament status."""
    tournament = tournament_manager.get_tournament(tournament_id)
    return {
        "id": tournament.id,
        "players": tournament.players,
        "matches": tournament.matches,
        "standings": tournament.standings
    }

@router.get("/{tournament_id}/matches")
async def get_tournament_matches(tournament_id: str):
    """Get all matches in a tournament."""
    tournament = tournament_manager.get_tournament(tournament_id)
    return {"matches": tournament.matches}

@router.get("/{tournament_id}/standings")
async def get_tournament_standings(tournament_id: str):
    """Get current tournament standings."""
    tournament = tournament_manager.get_tournament(tournament_id)
    return {"standings": tournament.standings}
