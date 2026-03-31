from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import io
from datetime import datetime

router = APIRouter()

class ReportInput(BaseModel):
    pathway_id: str
    include_admet: bool = True
    include_retrosynthesis: bool = True
    include_pricing: bool = True

def generate_pdf_report(pathway_id: str, include_admet: bool, include_retrosynthesis: bool, include_pricing: bool) -> bytes:
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch, cm
        from reportlab.lib.colors import HexColor, white, black
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
        from supabase_client import supabase

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4,
                                rightMargin=2*cm, leftMargin=2*cm,
                                topMargin=2*cm, bottomMargin=2*cm)

        # Colors
        purple = HexColor('#7c3aed')
        teal = HexColor('#0d9488')
        dark = HexColor('#0f0f1a')
        light_gray = HexColor('#f1f5f9')
        mid_gray = HexColor('#94a3b8')
        red = HexColor('#ef4444')
        green = HexColor('#22c55e')
        amber = HexColor('#f59e0b')

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle('Title', parent=styles['Title'],
            fontSize=24, textColor=purple, spaceAfter=6, fontName='Helvetica-Bold')
        subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'],
            fontSize=11, textColor=mid_gray, spaceAfter=20)
        heading_style = ParagraphStyle('Heading', parent=styles['Heading1'],
            fontSize=14, textColor=purple, spaceBefore=16, spaceAfter=8, fontName='Helvetica-Bold')
        subheading_style = ParagraphStyle('Subheading', parent=styles['Heading2'],
            fontSize=11, textColor=teal, spaceBefore=10, spaceAfter=6, fontName='Helvetica-Bold')
        body_style = ParagraphStyle('Body', parent=styles['Normal'],
            fontSize=9, textColor=HexColor('#334155'), spaceAfter=4, leading=14)
        mono_style = ParagraphStyle('Mono', parent=styles['Normal'],
            fontSize=8, fontName='Courier', textColor=HexColor('#1e293b'),
            backColor=light_gray, spaceAfter=4)

        story = []

        # Header
        story.append(Paragraph("PRPOIS", title_style))
        story.append(Paragraph("Pharmaceutical Reaction Pathway Optimization and Analysis System", subtitle_style))
        story.append(HRFlowable(width="100%", thickness=2, color=purple, spaceAfter=16))

        # Report metadata
        story.append(Paragraph("Pathway Analysis Report", heading_style))
        now = datetime.now().strftime("%B %d, %Y at %H:%M UTC")
        meta_data = [
            ["Pathway ID:", pathway_id[:8] + "..."],
            ["Generated:", now],
            ["Classification:", "CONFIDENTIAL — For authorized personnel only"],
            ["Compliance:", "FDA 21 CFR Part 11 Compliant"]
        ]
        meta_table = Table(meta_data, colWidths=[4*cm, 12*cm])
        meta_table.setStyle(TableStyle([
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('TEXTCOLOR', (0,0), (0,-1), purple),
            ('TEXTCOLOR', (1,0), (1,-1), HexColor('#334155')),
            ('ROWBACKGROUNDS', (0,0), (-1,-1), [white, light_gray]),
            ('GRID', (0,0), (-1,-1), 0.5, HexColor('#e2e8f0')),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 20))

        # Fetch pathway from Supabase
        try:
            pathway_result = supabase.table("pathway").select("*").eq("pathway_id", pathway_id).execute()
            if pathway_result.data:
                pathway = pathway_result.data[0]
                story.append(Paragraph("Pathway Summary", heading_style))
                summary_data = [
                    ["Manufacturing Scale", pathway.get("manufacturing_scale", "—")],
                    ["Optimization Score", f"{pathway.get('final_optimization_score', 0):.1f} / 100"],
                    ["Total Yield", f"{pathway.get('total_yield', 0):.1f}%"],
                    ["Version", f"v{pathway.get('version', 1)}"],
                    ["Status", "Active" if pathway.get("is_active") else "Inactive"],
                    ["Created", pathway.get("created_at", "—")[:10]],
                ]
                summary_table = Table(summary_data, colWidths=[6*cm, 10*cm])
                summary_table.setStyle(TableStyle([
                    ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
                    ('FONTSIZE', (0,0), (-1,-1), 9),
                    ('TEXTCOLOR', (0,0), (0,-1), teal),
                    ('ROWBACKGROUNDS', (0,0), (-1,-1), [white, light_gray]),
                    ('GRID', (0,0), (-1,-1), 0.5, HexColor('#e2e8f0')),
                    ('PADDING', (0,0), (-1,-1), 8),
                ]))
                story.append(summary_table)
                story.append(Spacer(1, 20))

                # Reaction steps
                steps_result = supabase.table("reaction_step").select("*").eq("pathway_id", pathway_id).order("step_order").execute()
                if steps_result.data:
                    story.append(Paragraph("Reaction Steps", heading_style))
                    for step in steps_result.data:
                        story.append(Paragraph(f"Step {step.get('step_order', '?')}", subheading_style))
                        step_data = [
                            ["Temperature", f"{step.get('temperature_celsius', 0)}°C"],
                            ["Pressure", f"{step.get('pressure_bar', 0)} bar"],
                            ["E-Factor", f"{step.get('e_factor', 0):.2f}"],
                            ["Projected Cost", f"${step.get('projected_hardware_cost', 0):,.0f}"],
                            ["Solvent", step.get('solvent', '—')],
                        ]
                        step_table = Table(step_data, colWidths=[5*cm, 11*cm])
                        step_table.setStyle(TableStyle([
                            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
                            ('FONTSIZE', (0,0), (-1,-1), 9),
                            ('TEXTCOLOR', (0,0), (0,-1), HexColor('#475569')),
                            ('GRID', (0,0), (-1,-1), 0.5, HexColor('#e2e8f0')),
                            ('PADDING', (0,0), (-1,-1), 6),
                            ('ROWBACKGROUNDS', (0,0), (-1,-1), [white, light_gray]),
                        ]))
                        story.append(step_table)
                        story.append(Spacer(1, 8))
        except Exception:
            story.append(Paragraph("Pathway data unavailable.", body_style))

        # Retrosynthesis log
        if include_retrosynthesis:
            story.append(HRFlowable(width="100%", thickness=1, color=HexColor('#e2e8f0'), spaceAfter=8))
            story.append(Paragraph("AI Retrosynthesis Audit Log", heading_style))
            try:
                log_result = supabase.table("retrosynthesis_log").select("*, ai_model(*)").eq("pathway_id", pathway_id).execute()
                if log_result.data:
                    log = log_result.data[0]
                    risk = log.get("hallucination_risk_score", 0)
                    risk_color = green if risk < 0.3 else amber if risk < 0.6 else red
                    log_data = [
                        ["AI Model", f"{log.get('ai_model', {}).get('model_name', 'Unknown')} v{log.get('ai_model', {}).get('version', '?')}"],
                        ["Hallucination Risk Score", f"{risk:.2f} / 1.00"],
                        ["Risk Threshold", f"{log.get('risk_threshold', 0.5):.2f}"],
                        ["Human Validated", "YES — Compliant" if log.get("human_validated") else "NO — Pending Review"],
                        ["Validated By", log.get("validated_by_user_id", "—") or "—"],
                        ["Validation Notes", log.get("validation_notes", "None") or "None"],
                    ]
                    log_table = Table(log_data, colWidths=[5*cm, 11*cm])
                    log_table.setStyle(TableStyle([
                        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
                        ('FONTSIZE', (0,0), (-1,-1), 9),
                        ('TEXTCOLOR', (0,0), (0,-1), HexColor('#475569')),
                        ('GRID', (0,0), (-1,-1), 0.5, HexColor('#e2e8f0')),
                        ('PADDING', (0,0), (-1,-1), 6),
                        ('ROWBACKGROUNDS', (0,0), (-1,-1), [white, light_gray]),
                    ]))
                    story.append(log_table)
                else:
                    story.append(Paragraph("No retrosynthesis log found for this pathway.", body_style))
            except Exception:
                story.append(Paragraph("Retrosynthesis log unavailable.", body_style))

        # Footer
        story.append(Spacer(1, 30))
        story.append(HRFlowable(width="100%", thickness=1, color=HexColor('#e2e8f0'), spaceAfter=8))
        story.append(Paragraph(
            f"This report was generated by PRPOIS on {now}. "
            "It is confidential and intended only for authorized pharmaceutical research personnel. "
            "FDA 21 CFR Part 11 compliant electronic record.",
            ParagraphStyle('Footer', parent=styles['Normal'],
                fontSize=7, textColor=mid_gray, alignment=TA_CENTER)
        ))

        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

    except ImportError:
        raise HTTPException(status_code=500, detail="ReportLab not installed. Run: pip install reportlab")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

@router.post("/pathway/{pathway_id}")
async def generate_pathway_report(pathway_id: str, data: ReportInput = None):
    include_admet = data.include_admet if data else True
    include_retro = data.include_retrosynthesis if data else True
    include_pricing = data.include_pricing if data else True

    pdf_bytes = generate_pdf_report(pathway_id, include_admet, include_retro, include_pricing)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=PRPOIS_Pathway_{pathway_id[:8]}_Report.pdf"}
    )
