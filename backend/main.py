import os

import jwt
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL is not configured")

if not SUPABASE_SECRET_KEY:
    raise RuntimeError("SUPABASE_SECRET_KEY is not configured")


# Supabase server client
supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY,
)


app = FastAPI()


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


# JWT authentication
security = HTTPBearer()

JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"

jwks_client = PyJWKClient(JWKS_URL)


# ---------------------------------------------------------
# Allowed accounts
# ---------------------------------------------------------

ADMIN_EMAIL = "divyanshsingh879596@gmail.com"
IITM_EMAIL_DOMAIN = "@ds.study.iitm.ac.in"


def is_authorized_email(email: str | None) -> bool:
    if not email:
        return False

    normalized_email = email.strip().lower()

    if normalized_email == ADMIN_EMAIL:
        return True

    if normalized_email.endswith(IITM_EMAIL_DOMAIN):
        return True

    return False


def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials

    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256", "ES256"],
            audience="authenticated",
            issuer=f"{SUPABASE_URL}/auth/v1",
        )

        return payload

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token",
        )

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Authentication verification failed",
        )


@app.get("/")
def home():
    return {
        "message": "TDS Connect Backend is running!"
    }


@app.get("/api/me")
def get_current_user(
    payload: dict = Depends(verify_token),
):
    user_id = payload.get("sub")
    email = payload.get("email")

    # -----------------------------------------------------
    # IMPORTANT SECURITY CHECK
    # -----------------------------------------------------
    # Only IITM Data Science emails and the permanent
    # admin account are allowed.
    # This check happens BEFORE looking at the profiles table.
    # -----------------------------------------------------

    if not is_authorized_email(email):
        raise HTTPException(
            status_code=403,
            detail="Email account is not authorized to access TDS Connect",
        )

    profile_result = (
        supabase
        .table("profiles")
        .select(
            "id, email, full_name, role, avatar_url, is_active"
        )
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )

    profile = profile_result.data

    if not profile:
        raise HTTPException(
            status_code=403,
            detail="User profile not found",
        )

    if not profile.get("is_active"):
        raise HTTPException(
            status_code=403,
            detail="User account is inactive",
        )

    return {
        "message": "Authentication successful",
        "user_id": user_id,
        "email": email,
        "full_name": profile.get("full_name"),
        "role": profile.get("role"),
        "is_active": profile.get("is_active"),
    }