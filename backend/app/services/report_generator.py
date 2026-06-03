import json
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from app.models.db_models import Document

def generate_pdf_report(document: Document) -> BytesIO:
    buffer = BytesIO()
    
    # Page settings
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter,
        rightMargin=40, leftMargin=40,
        topMargin=40, bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=colors.HexColor('#7c3aed'), # Violet brand
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#64748b'),
        spaceAfter=25
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=15,
        spaceAfter=10,
        borderPadding=2
    )

    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9.5,
        textColor=colors.HexColor('#334155'),
        leading=14,
        spaceAfter=10
    )

    list_style = ParagraphStyle(
        'ListCustom',
        parent=body_style,
        leftIndent=15,
        spaceAfter=5
    )

    header_bar = ParagraphStyle(
        'HeaderBar',
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=colors.white,
        backColor=colors.HexColor('#1e293b'),
        borderPadding=6,
        spaceAfter=15
    )

    story = []
    
    # 1. Header Banner
    story.append(Paragraph("ContractIQ", title_style))
    story.append(Paragraph(f"AI Risk Intelligence Platform & Audit Assessment Report &bull; Contract: {document.filename}", subtitle_style))
    story.append(Spacer(1, 10))
    
    # Parse report summary
    summary_data = {}
    if document.report and document.report.summary:
        try:
            summary_data = json.loads(document.report.summary)
        except Exception:
            summary_data = {
                "contract_overview": document.report.summary,
                "purpose": "Commercial engagement terms",
                "key_obligations": [],
                "deadlines": [],
                "risks": "Refer to clause breakdown.",
                "recommendations": []
            }
            
    # 2. Overall Risk Rating Scorecard
    score = document.avg_risk_score
    level = document.avg_risk_level
    
    if level == 'HIGH':
        badge_color = '#ef4444' # Crimson
    elif level == 'MEDIUM':
        badge_color = '#f59e0b' # Amber
    else:
        badge_color = '#10b981' # Emerald
        
    scorecard_data = [
        [
            Paragraph(f"<b>Overall Risk Rating:</b> <font color='{badge_color}'><b>{level}</b></font>", body_style),
            Paragraph(f"<b>Risk Score:</b> <b>{score} / 100</b>", body_style)
        ]
    ]
    
    t_score = Table(scorecard_data, colWidths=[250, 250])
    t_score.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('PADDING', (0,0), (-1,-1), 12),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
    ]))
    
    story.append(t_score)
    story.append(Spacer(1, 20))
    
    # 3. Executive Summary Section
    story.append(Paragraph("EXECUTIVE SUMMARY", header_bar))
    story.append(Paragraph("<b>Contract Overview</b>", section_heading))
    story.append(Paragraph(summary_data.get("contract_overview", "N/A"), body_style))
    
    story.append(Paragraph("<b>Purpose & Scope</b>", section_heading))
    story.append(Paragraph(summary_data.get("purpose", "N/A"), body_style))
    
    # Key Obligations
    story.append(Paragraph("<b>Key Obligations</b>", section_heading))
    obligations = summary_data.get("key_obligations", [])
    if obligations:
        for ob in obligations:
            story.append(Paragraph(f"&bull; {ob}", list_style))
    else:
        story.append(Paragraph("No significant obligations specified.", body_style))
        
    story.append(Spacer(1, 10))
    
    # Deadlines
    story.append(Paragraph("<b>Important Milestones & Deadlines</b>", section_heading))
    deadlines = summary_data.get("deadlines", [])
    if deadlines:
        for dl in deadlines:
            story.append(Paragraph(f"&bull; {dl}", list_style))
    else:
        story.append(Paragraph("No explicit deadlines captured.", body_style))
        
    story.append(Spacer(1, 15))
    story.append(PageBreak()) # Push detailed breakdown to page 2
    
    # 4. Detailed Clause Analysis Table
    story.append(Paragraph("DETAILED CLAUSE BREAKDOWN & RISK ANALYSIS", header_bar))
    
    table_data = [
        ["Clause Title", "Type", "Risk", "Score", "AI Reasoning / Action Plan"]
    ]
    
    for clause in document.clauses:
        # Style clause components so they wrap inside table cell
        c_title = Paragraph(f"<b>{clause.title}</b>", body_style)
        c_type = Paragraph(clause.type, body_style)
        
        c_level_color = '#10b981' if clause.risk_level == 'LOW' else ('#f59e0b' if clause.risk_level == 'MEDIUM' else '#ef4444')
        c_level = Paragraph(f"<font color='{c_level_color}'><b>{clause.risk_level}</b></font>", body_style)
        
        c_score = Paragraph(f"<b>{clause.risk_score}</b>", body_style)
        c_reason = Paragraph(clause.reason or "", body_style)
        
        table_data.append([c_title, c_type, c_level, c_score, c_reason])
        
    # Column width rules (Total letter width is 612, - 80 margin = 532 printable)
    t_clauses = Table(table_data, colWidths=[100, 75, 45, 40, 272])
    t_clauses.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 8),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#475569')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
    ]))
    
    # Format headers in table to have white text
    for i in range(5):
        table_data[0][i] = Paragraph(f"<font color='white'><b>{table_data[0][i]}</b></font>", body_style)
        
    story.append(t_clauses)
    story.append(Spacer(1, 20))
    
    # 5. Recommendations
    story.append(Paragraph("RECOMMENDATIONS & REMEDIATION", header_bar))
    recs = summary_data.get("recommendations", [])
    if recs:
        for rec in recs:
            story.append(Paragraph(f"&bull; <b>Action:</b> {rec}", list_style))
    else:
        story.append(Paragraph("All clauses are within standard low-risk tolerances. No modifications recommended.", body_style))
        
    # Build document
    doc.build(story)
    
    buffer.seek(0)
    return buffer
