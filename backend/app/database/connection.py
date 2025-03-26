"""Module allowing connection to the database"""
import os
import logging
from functools import lru_cache

from dotenv import load_dotenv
from fastapi import HTTPException, status
from supabase import create_client, Client

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_APP_USER_EMAIL = os.getenv("SUPABASE_APP_USER_EMAIL")
SUPABASE_APP_USER_PASSWORD = os.getenv("SUPABASE_APP_USER_PASSWORD")

logger = logging.getLogger("uvicorn")


@lru_cache()
def get_supabase() -> Client:
    """Returns the generic Supabase connected client"""
    return create_client(SUPABASE_URL, SUPABASE_KEY)

async def get_db():
    """Returns the authenticated Supabase app client"""
    client = get_supabase()
    try:
        logger.info("Authenticating with Supabase...")
        auth_response = client.auth.sign_in_with_password({
            "email": SUPABASE_APP_USER_EMAIL,
            "password": SUPABASE_APP_USER_PASSWORD
        })
        client.auth.set_session(
            access_token=auth_response.session.access_token,
            refresh_token=auth_response.session.refresh_token
        )
        logger.info("Client Supabase authentifié avec succès: %s", auth_response.session.user.email)
        yield client
    except Exception as e:
        logger.error("Supabase authentication error: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database connection error : {str(e)}"
        ) from e
    finally:
        client.auth.sign_out()
