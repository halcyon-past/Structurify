from fastapi import FastAPI
from src.api.routers import router

app = FastAPI(title="Structurify Worker Engine")

app.include_router(router)

@app.get("/health")
async def health_check():
    return {"status": "ok"}
