from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routers import uploads, jobs

app = FastAPI(title="Structurify Backend API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(uploads.router, prefix="/api/v1")
app.include_router(jobs.router, prefix="/api/v1/jobs")

@app.get("/health")
async def health_check():
    return {"status": "ok"}
