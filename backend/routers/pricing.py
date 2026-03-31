from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase_client import supabase

router = APIRouter()

class PricingInput(BaseModel):
    pathway_id: str
    molecule_id: str
    indication: str
    manufacturing_scale: str
    value_based_price: float
    net_profit_estimate: float

@router.get("/")
def get_pricing():
    try:
        result = supabase.table("indication_pricing").select("*, molecule(*)").order("evaluated_at", desc=True).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
def create_pricing(data: PricingInput):
    try:
        result = supabase.table("indication_pricing").insert({
            "pathway_id": data.pathway_id,
            "molecule_id": data.molecule_id,
            "indication": data.indication,
            "manufacturing_scale": data.manufacturing_scale,
            "value_based_price": data.value_based_price,
            "net_profit_estimate": data.net_profit_estimate
        }).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
