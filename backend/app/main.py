from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from app.api import games, tournaments

app = FastAPI(
    title="Contrast Game Server",
    description="A server for the Contrast board game that allows AI clients to compete",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Add trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # Allow all hosts for development
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
