from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from supabase_client import supabase
from datetime import datetime, timezone

router = APIRouter()

class ValidateInput(BaseModel):
    notes: str
    validated_by_user_id: Optional[str] = None

@router.get("/")
def get_logs():
    try:
        result = supabase.table("retrosynthesis_log").select("*, ai_model(*)").execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{log_id}/validate")
def validate_log(log_id: str, data: ValidateInput):
    try:
        existing = supabase.table("retrosynthesis_log").select("*").eq("log_id", log_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Log not found")
        if existing.data[0]["human_validated"]:
            raise HTTPException(status_code=400, detail="Already validated")

        result = supabase.table("retrosynthesis_log").update({
            "human_validated": True,
            "validation_notes": data.notes,
            "validated_by_user_id": data.validated_by_user_id,
            "validated_at": datetime.now(timezone.utc).isoformat()
        }).eq("log_id", log_id).execute()

        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
def create_log(data: dict):
    try:
        result = supabase.table("retrosynthesis_log").insert(data).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
