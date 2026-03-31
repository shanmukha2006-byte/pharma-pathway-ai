from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase_client import supabase
import requests

router = APIRouter()

class SMILESInput(BaseModel):
    smiles: str

def calculate_properties(smiles: str):
    try:
        from rdkit import Chem
        from rdkit.Chem import Descriptors, rdMolDescriptors
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            return None
        mw = Descriptors.MolWt(mol)
        logp = Descriptors.MolLogP(mol)
        tpsa = rdMolDescriptors.CalcTPSA(mol)
        hbd = rdMolDescriptors.CalcNumHBD(mol)
        hba = rdMolDescriptors.CalcNumHBA(mol)
        return {"mw": mw, "logp": logp, "tpsa": tpsa, "hbd": hbd, "hba": hba}
    except Exception:
        return None

def check_lipinski(props):
    violations = []
    if props["mw"] > 500:
        violations.append(f"Molecular Weight {props['mw']:.1f} Da exceeds 500 Da")
    if props["logp"] > 5:
        violations.append(f"LogP {props['logp']:.2f} exceeds 5")
    if props["hbd"] > 5:
        violations.append(f"H-Bond Donors {props['hbd']} exceeds 5")
    if props["hba"] > 10:
        violations.append(f"H-Bond Acceptors {props['hba']} exceeds 10")
    return violations

def get_radar_data(props):
    return [
        {"metric": "Lipophilicity", "value": min(round((5 - props["logp"]) / 5 * 100, 1), 100), "fullMark": 100},
        {"metric": "MW Score",      "value": min(round((500 - props["mw"]) / 500 * 100, 1), 100), "fullMark": 100},
        {"metric": "Polarity",      "value": min(round((140 - props["tpsa"]) / 140 * 100, 1), 100), "fullMark": 100},
        {"metric": "Solubility",    "value": min(round((5 - max(props["logp"], 0)) / 5 * 100, 1), 100), "fullMark": 100},
        {"metric": "Flexibility",   "value": 75, "fullMark": 100},
        {"metric": "Saturation",    "value": 80, "fullMark": 100},
    ]

def fetch_pubchem(smiles: str):
    try:
        url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/{requests.utils.quote(smiles)}/JSON"
        r = requests.get(url, timeout=5)
        if r.status_code == 200:
            data = r.json()
            compound = data["PC_Compounds"][0]
            cid = str(compound["id"]["id"]["cid"])
            iupac = ""
            for prop in compound.get("props", []):
                if prop.get("urn", {}).get("label") == "IUPAC Name" and prop.get("urn", {}).get("name") == "Preferred":
                    iupac = prop["value"]["sval"]
                    break
            return {"cid": cid, "iupac": iupac}
    except Exception:
        pass
    return {"cid": "", "iupac": ""}

@router.post("/analyze")
def analyze_molecule(data: SMILESInput):
    smiles = data.smiles.strip()
    if not smiles:
        raise HTTPException(status_code=400, detail="SMILES string is required")

    try:
        from rdkit import Chem
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            raise HTTPException(status_code=400, detail="Invalid SMILES string")
        from rdkit.Chem import Chem as C
        canonical = Chem.MolToSmiles(mol)
    except ImportError:
        canonical = smiles

    props = calculate_properties(smiles)
    if not props:
        props = {"mw": 0, "logp": 0, "tpsa": 0, "hbd": 0, "hba": 0}

    violations = check_lipinski(props)
    pubchem = fetch_pubchem(smiles)

    existing = supabase.table("molecule").select("*").eq("canonical_smiles", canonical).execute()
    if existing.data:
        molecule = existing.data[0]
    else:
        inserted = supabase.table("molecule").insert({
            "canonical_smiles": canonical,
            "iupac_name": pubchem["iupac"],
            "molecular_weight": round(props["mw"], 2),
            "log_p": round(props["logp"], 2),
            "tpsa": round(props["tpsa"], 2),
            "lipinski_violations": len(violations),
            "pubchem_cid": pubchem["cid"]
        }).execute()
        molecule = inserted.data[0]

    return {
        "molecule": molecule,
        "passes_filter": len(violations) == 0,
        "violations": violations,
        "bioavailability_score": round(max(0, 100 - len(violations) * 25), 1),
        "radar_data": get_radar_data(props)
    }

@router.get("/search")
def search_molecule(q: str):
    try:
        result = supabase.table("molecule").select("*").ilike("iupac_name", f"%{q}%").limit(10).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
