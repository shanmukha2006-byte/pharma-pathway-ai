from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import molecules, pathways, retrosynthesis, pricing, users, mcda
from routers import ai_retrosynthesis, admet, reports, interactions

app = FastAPI(
    title="PRPOIS API",
    description="Pharmaceutical Reaction Pathway Optimization and Analysis System — Enterprise Edition",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://localhost:8080",
    "https://prpois-project.web.app",
    "https://prpois-project.firebaseapp.com"
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core routers
app.include_router(users.router,          prefix="/api/users",          tags=["Users"])
app.include_router(molecules.router,      prefix="/api/molecules",      tags=["Molecules"])
app.include_router(pathways.router,       prefix="/api/pathways",       tags=["Pathways"])
app.include_router(retrosynthesis.router, prefix="/api/retrosynthesis", tags=["Retrosynthesis"])
app.include_router(pricing.router,        prefix="/api/pricing",        tags=["Pricing"])
app.include_router(mcda.router,           prefix="/api/mcda",           tags=["MCDA"])

# AI feature routers
app.include_router(ai_retrosynthesis.router, prefix="/api/ai",           tags=["AI Retrosynthesis"])
app.include_router(admet.router,             prefix="/api/admet",        tags=["ADMET"])
app.include_router(reports.router,           prefix="/api/reports",      tags=["Reports"])
app.include_router(interactions.router,      prefix="/api/interactions", tags=["Drug Interactions"])

@app.get("/")
def root():
    return {
        "message": "PRPOIS API is running",
        "version": "2.0.0",
        "total_endpoints": 10,
        "features": [
            "Molecule Analysis + Lipinski Filter",
            "AI Retrosynthesis (GPT-4o)",
            "ADMET Prediction",
            "Drug-Drug Interaction Checker",
            "PDF Report Generation",
            "Pathway Builder + MCDA Scoring",
            "FDA 21 CFR Part 11 Compliance"
        ]
    }

@app.get("/health")
def health():
    return {"status": "healthy", "version": "2.0.0"}