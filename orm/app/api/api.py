from fastapi import APIRouter
from app.api.endpoints import studies, tables, data


api_router = APIRouter()
api_router.include_router(studies.router, prefix="/studies", tags=["studies"])
api_router.include_router(tables.router, prefix="/tables", tags=["tables"])
api_router.include_router(data.router, prefix="/data", tags=["data"]) 