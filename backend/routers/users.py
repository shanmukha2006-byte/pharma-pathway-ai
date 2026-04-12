from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from supabase_client import supabase

router = APIRouter()

class UserSyncInput(BaseModel):
    firebase_uid: str
    email: str
    display_name: Optional[str] = ""
    role: Optional[str] = "RESEARCHER"

@router.post("/sync")
def sync_user(data: UserSyncInput):
    try:
        existing = supabase.table("app_user").select("*").eq("firebase_uid", data.firebase_uid).execute()
        if existing.data:
            updated = supabase.table("app_user").update({
                "email": data.email,
                "display_name": data.display_name,
            }).eq("firebase_uid", data.firebase_uid).execute()
            return updated.data[0]
        else:
            inserted = supabase.table("app_user").insert({
                "firebase_uid": data.firebase_uid,
                "email": data.email,
                "display_name": data.display_name,
                "role": data.role,
            }).execute()
            return inserted.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/me")
def get_user(firebase_uid: str):
    try:
        result = supabase.table("app_user").select("*").eq("firebase_uid", firebase_uid).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="User not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))