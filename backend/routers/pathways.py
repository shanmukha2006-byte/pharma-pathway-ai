from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from supabase_client import supabase

router = APIRouter()

class StepMoleculeInput(BaseModel):
    molecule_id: str
    role: str
    quantity_grams: float

class ReactionStepInput(BaseModel):
    step_order: int
    temperature_celsius: float
    pressure_bar: float
    e_factor: float
    projected_hardware_cost: float
    solvent: str
    molecules: List[StepMoleculeInput] = []

class PathwayInput(BaseModel):
    created_by_user_id: str
    manufacturing_scale: str
    weight_profile_id: Optional[str] = None
    steps: List[ReactionStepInput] = []
    total_yield: Optional[float] = 0
    final_optimization_score: Optional[float] = 0

class ScaleUpdate(BaseModel):
    scale: str

@router.get("/")
def get_pathways():
    try:
        result = supabase.table("pathway").select("*").order("created_at", desc=True).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{pathway_id}")
def get_pathway(pathway_id: str):
    try:
        result = supabase.table("pathway").select("*").eq("pathway_id", pathway_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Pathway not found")
        pathway = result.data[0]
        steps = supabase.table("reaction_step").select("*").eq("pathway_id", pathway_id).order("step_order").execute()
        pathway["steps"] = steps.data
        return pathway
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
def create_pathway(data: PathwayInput):
    try:
        pathway_result = supabase.table("pathway").insert({
            "created_by_user_id": data.created_by_user_id,
            "manufacturing_scale": data.manufacturing_scale,
            "weight_profile_id": data.weight_profile_id,
            "total_yield": data.total_yield,
            "final_optimization_score": data.final_optimization_score,
            "version": 1,
            "is_active": True
        }).execute()

        pathway = pathway_result.data[0]
        pathway_id = pathway["pathway_id"]

        role_map = {}
        roles = supabase.table("molecule_role").select("*").execute()
        for r in roles.data:
            role_map[r["role_name"]] = r["role_id"]

        for step in data.steps:
            step_result = supabase.table("reaction_step").insert({
                "pathway_id": pathway_id,
                "step_order": step.step_order,
                "temperature_celsius": step.temperature_celsius,
                "pressure_bar": step.pressure_bar,
                "e_factor": step.e_factor,
                "projected_hardware_cost": step.projected_hardware_cost,
                "solvent": step.solvent
            }).execute()

            step_id = step_result.data[0]["step_id"]

            for mol in step.molecules:
                role_id = role_map.get(mol.role.upper())
                if role_id:
                    supabase.table("step_molecule_map").insert({
                        "step_id": step_id,
                        "molecule_id": mol.molecule_id,
                        "role_id": role_id,
                        "quantity_grams": mol.quantity_grams
                    }).execute()

        return pathway
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{pathway_id}/scale")
def update_scale(pathway_id: str, data: ScaleUpdate):
    try:
        result = supabase.table("pathway").update({
            "manufacturing_scale": data.scale
        }).eq("pathway_id", pathway_id).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
