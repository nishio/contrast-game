from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import games, tournaments

app = FastAPI(
    title="Contrast Game Server",
    description="A server for the Contrast board game that allows AI clients to compete",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
app.include_router(games.router)
app.include_router(tournaments.router)

@app.get("/")
async def root():
    return {"message": "Welcome to Contrast Game Server"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
