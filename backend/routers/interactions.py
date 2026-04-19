from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from urllib.parse import quote
import requests

router = APIRouter()

class InteractionInput(BaseModel):
    smiles_list: List[str]
    molecule_names: List[str] = []

def get_pubchem_cid(smiles: str) -> str:
    try:
        url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/{quote(smiles)}/property/IUPACName/JSON"
        r = requests.get(url, timeout=5)
        if r.status_code == 200:
            data = r.json()
            return str(data["PropertyTable"]["Properties"][0].get("CID", ""))
    except Exception:
        pass
    return ""

def check_interactions_heuristic(smiles_list: List[str], names: List[str]) -> dict:
    molecules_data = []

    for i, smiles in enumerate(smiles_list):
        name = names[i] if i < len(names) else f"Molecule {i+1}"
        # Try RDKit first
        props = None
        try:
            from rdkit import Chem
            from rdkit.Chem import Descriptors, rdMolDescriptors
            mol = Chem.MolFromSmiles(smiles)
            if mol:
                props = {
                    "name": name, "smiles": smiles,
                    "logp": Descriptors.MolLogP(mol),
                    "mw": Descriptors.MolWt(mol),
                    "aromatic_rings": rdMolDescriptors.CalcNumAromaticRings(mol),
                    "hbd": rdMolDescriptors.CalcNumHBD(mol),
                    "tpsa": rdMolDescriptors.CalcTPSA(mol)
                }
        except ImportError:
            pass
        except Exception:
            pass

        # Fallback heuristics if RDKit unavailable
        if props is None:
            props = {
                "name": name, "smiles": smiles,
                "logp": 2.0,
                "mw": len(smiles) * 4.5,
                "aromatic_rings": smiles.count("c") // 3,
                "hbd": smiles.count("O") + smiles.count("N"),
                "tpsa": 70.0
            }

        molecules_data.append(props)

    interactions = []
    warnings = []

    for i in range(len(molecules_data)):
        for j in range(i + 1, len(molecules_data)):
            mol_a = molecules_data[i]
            mol_b = molecules_data[j]
            pair_interactions = []
            severity = "None"

            if mol_a["logp"] > 3 and mol_a["mw"] > 400 and mol_b["logp"] > 3 and mol_b["mw"] > 400:
                pair_interactions.append({
                    "type": "CYP3A4 Metabolic Competition",
                    "description": f"Both {mol_a['name']} and {mol_b['name']} may compete for CYP3A4 metabolism.",
                    "severity": "Medium",
                    "recommendation": "Monitor plasma levels. Consider dose adjustment."
                })
                severity = "Medium"

            if mol_a["logp"] > 2 and mol_b["logp"] > 2:
                pair_interactions.append({
                    "type": "Plasma Protein Binding Competition",
                    "description": "Both molecules may compete for plasma protein binding sites.",
                    "severity": "Low",
                    "recommendation": "Monitor for enhanced pharmacological effects."
                })
                if severity == "None":
                    severity = "Low"

            if mol_a["tpsa"] < 90 and mol_b["tpsa"] < 90 and mol_a["mw"] < 450 and mol_b["mw"] < 450:
                pair_interactions.append({
                    "type": "Potential CNS Penetration",
                    "description": "Both molecules may penetrate the blood-brain barrier.",
                    "severity": "Low",
                    "recommendation": "Exercise caution in CNS-sensitive patients."
                })

            if (mol_a["logp"] > 3.7 and mol_a["aromatic_rings"] >= 2 and
                    mol_b["logp"] > 3.7 and mol_b["aromatic_rings"] >= 2):
                pair_interactions.append({
                    "type": "Additive hERG Cardiotoxicity Risk",
                    "description": f"Both {mol_a['name']} and {mol_b['name']} show hERG inhibition features.",
                    "severity": "High",
                    "recommendation": "ECG monitoring required. Consider alternatives."
                })
                severity = "High"
                warnings.append(f"HIGH RISK: {mol_a['name']} + {mol_b['name']} — Potential QT prolongation")

            if pair_interactions:
                interactions.append({
                    "molecule_a": mol_a["name"],
                    "molecule_b": mol_b["name"],
                    "overall_severity": severity,
                    "interactions": pair_interactions,
                    "interaction_count": len(pair_interactions)
                })

    overall_safety = "Safe"
    if interactions:
        if any(i["overall_severity"] == "High" for i in interactions):
            overall_safety = "High Risk"
        elif any(i["overall_severity"] == "Medium" for i in interactions):
            overall_safety = "Medium Risk"
        else:
            overall_safety = "Low Risk"

    return {
        "molecules_analyzed": len(molecules_data),
        "interaction_pairs_found": len(interactions),
        "overall_safety_assessment": overall_safety,
        "warnings": warnings,
        "interactions": interactions,
        "recommendation": (
            "No significant interactions detected. Proceed with standard monitoring."
            if not interactions else
            "Significant interactions detected. Clinical review required."
        )
    }

@router.post("/check")
async def check_interactions(data: InteractionInput):
    if len(data.smiles_list) < 2:
        raise HTTPException(status_code=400, detail="At least 2 molecules required")
    if len(data.smiles_list) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 molecules per check")
    result = check_interactions_heuristic(data.smiles_list, data.molecule_names)
    return {"success": True, "result": result}