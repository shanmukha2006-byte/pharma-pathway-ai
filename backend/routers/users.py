from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase_client import supabase

router = APIRouter()

class UserSync(BaseModel):
    firebase_uid: str
    email: str
    role: str = "RESEARCHER"
    full_name: str = ""
    institution: str = ""

@router.post("/sync")
def sync_user(data: UserSync):
    try:
        existing = supabase.table("users").select("*").eq("email", data.email).execute()
        if existing.data:
            user = existing.data[0]
            profile = supabase.table("user_profile").select("*").eq("user_id", user["user_id"]).execute()
            return {"user": user, "profile": profile.data[0] if profile.data else None}

        new_user = supabase.table("users").insert({
            "email": data.email,
            "role": data.role.upper(),
            "is_active": True
        }).execute()

        user = new_user.data[0]

        new_profile = supabase.table("user_profile").insert({
            "user_id": user["user_id"],
            "full_name": data.full_name,
            "institution": data.institution,
            "credential_level": data.role
        }).execute()

        return {"user": user, "profile": new_profile.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/me")
def get_me():
    return {"message": "Use /sync endpoint"}
