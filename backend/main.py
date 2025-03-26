"""Main application module"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.routers.api import router as api_router
from backend.app.routers.migration import router as migration_router

app = FastAPI(title="Clinical Data Extraction API",
              description="API for psychiatric research data extraction",
              version="1.0.0")

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(migration_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
