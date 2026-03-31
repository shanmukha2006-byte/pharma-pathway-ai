from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase_client import supabase

router = APIRouter()

class WeightProfileInput(BaseModel):
    user_id: str
    profile_name: str
    weight_yield: float
    weight_safety: float
    weight_economics: float
    weight_green: float

@router.get("/profiles")
def get_profiles(user_id: str):
    try:
        result = supabase.table("mcda_weight_profile").select("*").eq("user_id", user_id).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/profiles")
def create_profile(data: WeightProfileInput):
    total = data.weight_yield + data.weight_safety + data.weight_economics + data.weight_green
    if abs(total - 1.0) > 0.01:
        raise HTTPException(status_code=400, detail=f"Weights must sum to 1.0, got {total:.2f}")
    try:
        result = supabase.table("mcda_weight_profile").insert({
            "user_id": data.user_id,
            "profile_name": data.profile_name,
            "weight_yield": data.weight_yield,
            "weight_safety": data.weight_safety,
            "weight_economics": data.weight_economics,
            "weight_green": data.weight_green
        }).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
