from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import requests

router = APIRouter()

class InteractionInput(BaseModel):
    smiles_list: List[str]
    molecule_names: List[str] = []

def get_pubchem_cid(smiles: str) -> str:
    try:
        url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/{requests.utils.quote(smiles)}/property/IUPACName/JSON"
        r = requests.get(url, timeout=5)
        if r.status_code == 200:
            data = r.json()
            return str(data["PropertyTable"]["Properties"][0].get("CID", ""))
    except Exception:
        pass
    return ""

def check_interactions_heuristic(smiles_list: List[str], names: List[str]) -> dict:
    try:
        from rdkit import Chem
        from rdkit.Chem import Descriptors, rdMolDescriptors

        interactions = []
        warnings = []
        molecules_data = []

        for i, smiles in enumerate(smiles_list):
            mol = Chem.MolFromSmiles(smiles)
            if mol:
                name = names[i] if i < len(names) else f"Molecule {i+1}"
                logp = Descriptors.MolLogP(mol)
                mw = Descriptors.MolWt(mol)
                aromatic_rings = rdMolDescriptors.CalcNumAromaticRings(mol)
                hbd = rdMolDescriptors.CalcNumHBD(mol)
                tpsa = rdMolDescriptors.CalcTPSA(mol)
                molecules_data.append({
                    "name": name, "smiles": smiles, "logp": logp,
                    "mw": mw, "aromatic_rings": aromatic_rings,
                    "hbd": hbd, "tpsa": tpsa
                })

        # Check pairwise interactions
        for i in range(len(molecules_data)):
            for j in range(i+1, len(molecules_data)):
                mol_a = molecules_data[i]
                mol_b = molecules_data[j]
                pair_interactions = []
                severity = "None"

                # CYP3A4 interaction check
                if mol_a["logp"] > 3 and mol_a["mw"] > 400 and mol_b["logp"] > 3 and mol_b["mw"] > 400:
                    pair_interactions.append({
                        "type": "CYP3A4 Metabolic Competition",
                        "description": f"Both {mol_a['name']} and {mol_b['name']} may compete for CYP3A4 metabolism, potentially increasing plasma levels.",
                        "severity": "Medium",
                        "recommendation": "Monitor plasma levels. Consider dose adjustment."
                    })
                    severity = "Medium"

                # Protein binding competition
                if mol_a["logp"] > 2 and mol_b["logp"] > 2:
                    pair_interactions.append({
                        "type": "Plasma Protein Binding Competition",
                        "description": f"Both molecules are highly lipophilic and may compete for plasma protein binding sites.",
                        "severity": "Low",
                        "recommendation": "Monitor for enhanced pharmacological effects."
                    })
                    if severity == "None":
                        severity = "Low"

                # Additive CNS effects
                if mol_a["tpsa"] < 90 and mol_b["tpsa"] < 90 and mol_a["mw"] < 450 and mol_b["mw"] < 450:
                    pair_interactions.append({
                        "type": "Potential CNS Penetration",
                        "description": "Both molecules may penetrate the blood-brain barrier. Monitor for additive CNS effects.",
                        "severity": "Low",
                        "recommendation": "Exercise caution in CNS-sensitive patients."
                    })

                # hERG interaction
                if mol_a["logp"] > 3.7 and mol_a["aromatic_rings"] >= 2 and mol_b["logp"] > 3.7 and mol_b["aromatic_rings"] >= 2:
                    pair_interactions.append({
                        "type": "Additive hERG Cardiotoxicity Risk",
                        "description": f"Both {mol_a['name']} and {mol_b['name']} show structural features associated with hERG channel inhibition. Combined use may increase QT prolongation risk.",
                        "severity": "High",
                        "recommendation": "Contraindicated in patients with QT prolongation. ECG monitoring required."
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

        overall_safety = "Safe" if not interactions else (
            "High Risk" if any(i["overall_severity"] == "High" for i in interactions) else
            "Medium Risk" if any(i["overall_severity"] == "Medium" for i in interactions) else
            "Low Risk"
        )

        return {
            "molecules_analyzed": len(molecules_data),
            "interaction_pairs_found": len(interactions),
            "overall_safety_assessment": overall_safety,
            "warnings": warnings,
            "interactions": interactions,
            "recommendation": (
                "No significant interactions detected. Proceed with standard monitoring." if not interactions else
                "Significant interactions detected. Clinical review required before administration."
            )
        }

    except ImportError:
        return {
            "molecules_analyzed": len(smiles_list),
            "interaction_pairs_found": 0,
            "overall_safety_assessment": "Unable to analyze — RDKit not available",
            "warnings": [],
            "interactions": [],
            "recommendation": "Manual review required."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/check")
async def check_interactions(data: InteractionInput):
    if len(data.smiles_list) < 2:
        raise HTTPException(status_code=400, detail="At least 2 molecules required for interaction checking")
    if len(data.smiles_list) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 molecules per check")

    result = check_interactions_heuristic(data.smiles_list, data.molecule_names)
    return {"success": True, "result": result}
