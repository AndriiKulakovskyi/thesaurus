"""Middleware module securing the admin authentication"""
import os
from typing import Optional
from dotenv import load_dotenv

from fastapi import Security, HTTPException, status
from fastapi.security.api_key import APIKeyHeader

load_dotenv()
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY")
api_key_header = APIKeyHeader(name="X-Admin-API-Key", auto_error=False)

def verify_admin_key(api_key: Optional[str] = Security(api_key_header)):
    """Verifies that the client's request contains the admin api key"""
    if api_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin API key is missing. Please include X-Admin-API-Key header."
        )
    if api_key != ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: Invalid admin API key"
        )
    return api_key
