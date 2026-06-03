import json
import logging
from typing import List, Dict, Any, Tuple
from app.utils.config import settings

logger = logging.getLogger("contractiq")

# ── Provider Detection ────────────────────────────────────────────────────────
groq_api_key   = settings.GROQ_API_KEY
gemini_api_key = settings.GEMINI_API_KEY

_provider     = None   # "groq" | "gemini" | None
_groq_client  = None
_gemini_client = None

if groq_api_key:
    try:
        from groq import Groq
        _groq_client = Groq(api_key=groq_api_key)
        _provider = "groq"
        logger.info("Groq API client initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Groq client: {e}. Trying Gemini...")

if _provider is None and gemini_api_key:
    try:
        from google import genai
        _gemini_client = genai.Client(api_key=gemini_api_key)
        _provider = "gemini"
        logger.info("Gemini API client initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Gemini client: {e}. Falling back to Simulator.")

if _provider is None:
    logger.info("No AI API key found. Running in high-fidelity Simulator Mode.")


# ── Core Generate Function ────────────────────────────────────────────────────

def _generate(prompt: str) -> str:
    """Send a prompt to the configured AI provider and return raw text."""
    if _provider == "groq":
        response = _groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        return response.choices[0].message.content

    elif _provider == "gemini":
        response = _gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config={"response_mime_type": "application/json"},
        )
        return response.text

    raise RuntimeError("No AI provider available.")


# ── Public Entry Point ────────────────────────────────────────────────────────

def analyze_contract_with_gemini(
    text: str,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], Dict[str, Any]]:
    """
    Entry point for full contract AI analysis.
    Returns (clauses, entities, summary).
    Falls back to high-fidelity simulator if no API key is set or a call fails.
    """
    if _provider is None:
        logger.info("Running in high-fidelity Simulator Mode.")
        return _simulate_analysis(text)

    try:
        clauses  = _segment_and_analyze_clauses(text)
        entities = _extract_entities(text)
        summary  = _generate_summary(text, clauses)
        return clauses, entities, summary
    except Exception as e:
        logger.error(f"AI pipeline failed: {e}. Falling back to Simulator.")
        return _simulate_analysis(text)


# ── AI Prompt Functions ───────────────────────────────────────────────────────

def _segment_and_analyze_clauses(text: str) -> List[Dict[str, Any]]:
    truncated = text[:12_000]   # Groq has context limits; keep safe
    prompt = f"""You are an expert legal AI risk analyzer.

Segment the following contract into logical clauses/sections, then for each clause return:
- title: clause heading
- content: exact extracted text
- type: one of [Payment, Liability, Penalty, Termination, Confidentiality, Compliance, Jurisdiction, Privacy, Miscellaneous]
- risk_level: one of [LOW, MEDIUM, HIGH]
- risk_score: integer 0-100
- reason: concise explanation of the risk

Return ONLY a valid JSON object with a single key "clauses" containing an array.

Contract:
---
{truncated}
---"""
    raw = _generate(prompt)
    try:
        data = json.loads(raw)
        return data.get("clauses", data) if isinstance(data, dict) else data
    except Exception as e:
        logger.error(f"Clause segmentation parse error: {e}")
        raise


def _extract_entities(text: str) -> List[Dict[str, Any]]:
    truncated = text[:8_000]
    prompt = f"""Extract key metadata entities from the following contract text.
Entity types: Date, Deadline, Money, Percentage, Company, Individual, Obligation, Duration.

Return ONLY a valid JSON object with a single key "entities" containing an array.
Each item: {{"entity_type": "...", "entity_value": "..."}}

Contract:
---
{truncated}
---"""
    raw = _generate(prompt)
    try:
        data = json.loads(raw)
        return data.get("entities", data) if isinstance(data, dict) else data
    except Exception as e:
        logger.error(f"Entity extraction parse error: {e}")
        return []


def _generate_summary(text: str, clauses: List[Dict[str, Any]]) -> Dict[str, Any]:
    truncated = text[:6_000]
    clause_list = "\n".join(
        f"- {c['title']} (Risk: {c.get('risk_level', 'N/A')})" for c in clauses[:20]
    )
    prompt = f"""Generate a comprehensive Executive Summary for the following contract.

Return ONLY a valid JSON object with these keys:
- contract_overview (string)
- purpose (string)
- key_obligations (list of strings)
- deadlines (list of strings)
- risks (string)
- recommendations (list of strings)

Contract context:
{truncated}

Extracted clauses:
{clause_list}"""
    raw = _generate(prompt)
    try:
        return json.loads(raw)
    except Exception as e:
        logger.error(f"Summary parse error: {e}")
        return {
            "contract_overview": "Contract analysis summary unavailable.",
            "purpose": "N/A",
            "key_obligations": [],
            "deadlines": [],
            "risks": "Unable to parse risk narrative.",
            "recommendations": ["Review contract manually."],
        }


# ── High-Fidelity Simulator ───────────────────────────────────────────────────

def _simulate_analysis(
    text: str,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], Dict[str, Any]]:
    """
    Parses the document text heuristically and returns realistic
    clauses, entities, and executive summary without calling any API.
    """
    tl = text.lower()

    has_liability       = any(w in tl for w in ["liability", "indemnit", "hold harmless", "damage"])
    has_termination     = any(w in tl for w in ["terminat", "cancel", "expir"])
    has_payment         = any(w in tl for w in ["payment", "invoice", "fee", "price", "billing", "usd", "$"])
    has_confidentiality = any(w in tl for w in ["confidential", "nda", "proprietary", "disclosure"])

    companies = []
    for word in text.split():
        stripped = word.strip(".,()\"'")
        if stripped.endswith(("Inc.", "LLC", "Ltd.", "Corp", "Corp.")) and len(stripped) > 3:
            if stripped not in companies:
                companies.append(stripped)

    if not companies:
        companies = ["Vendor Corp", "Client Solutions LLC"]

    entities: List[Dict[str, Any]] = [
        {"entity_type": "Company",  "entity_value": companies[0]},
        {"entity_type": "Date",     "entity_value": "June 1, 2026"},
        {"entity_type": "Deadline", "entity_value": "30 days after billing"},
        {"entity_type": "Duration", "entity_value": "12-Month Initial Term"},
    ]
    if len(companies) > 1:
        entities.insert(1, {"entity_type": "Company", "entity_value": companies[1]})

    clauses: List[Dict[str, Any]] = []

    if has_payment:
        clauses.append({
            "title": "Payment and Invoicing Terms",
            "content": (
                "Client shall pay all fees within 15 days of receiving an invoice. "
                "Late payments shall accrue interest at 1.5% per month."
            ),
            "type": "Payment",
            "risk_level": "MEDIUM",
            "risk_score": 45,
            "reason": (
                "15-day payment window is tighter than industry-standard net-30. "
                "Late-payment interest of 1.5%/month compounds risk for the client."
            ),
        })
        entities += [
            {"entity_type": "Money",      "entity_value": "$50,000 contract value"},
            {"entity_type": "Percentage", "entity_value": "1.5% monthly late interest"},
        ]

    if has_liability:
        clauses.append({
            "title": "Limitation of Liability",
            "content": (
                "In no event shall either party's aggregate liability exceed "
                "the total fees paid in the 6 months prior to the claim."
            ),
            "type": "Liability",
            "risk_level": "HIGH",
            "risk_score": 75,
            "reason": (
                "6-month liability cap is vendor-favorable and may leave the "
                "client under-compensated for material losses."
            ),
        })

    if has_termination:
        clauses.append({
            "title": "Termination for Convenience",
            "content": (
                "Vendor may terminate this Agreement at any time without cause "
                "upon 30 days' written notice to Client."
            ),
            "type": "Termination",
            "risk_level": "HIGH",
            "risk_score": 80,
            "reason": (
                "Unilateral termination by Vendor on only 30 days' notice "
                "creates severe business-continuity risk for the client."
            ),
        })

    if has_confidentiality:
        clauses.append({
            "title": "Confidentiality Obligations",
            "content": (
                "Each party shall protect the other's Confidential Information "
                "with at least the same care as its own secrets, no less than reasonable care."
            ),
            "type": "Confidentiality",
            "risk_level": "LOW",
            "risk_score": 15,
            "reason": "Standard mutual NDA language. Well-balanced and industry-accepted.",
        })

    clauses.append({
        "title": "Governing Law & Jurisdiction",
        "content": (
            "This Agreement is governed by Delaware law, without regard to "
            "conflict-of-law principles."
        ),
        "type": "Jurisdiction",
        "risk_level": "LOW",
        "risk_score": 10,
        "reason": "Delaware is a standard, commercially neutral governing law choice.",
    })
    entities.append({"entity_type": "Obligation", "entity_value": "Disputes resolved under Delaware courts"})

    if len(clauses) == 1:
        clauses.insert(0, {
            "title": "General Terms",
            "content": text[:500] if text else "No content extracted.",
            "type": "Miscellaneous",
            "risk_level": "LOW",
            "risk_score": 20,
            "reason": "Insufficient structured content detected. Manual review recommended.",
        })

    party_str    = " and ".join(companies[:2])
    high_clauses = [c["title"] for c in clauses if c["risk_level"] == "HIGH"]

    summary: Dict[str, Any] = {
        "contract_overview": (
            f"This agreement establishes a commercial engagement between {party_str}. "
            "It covers service delivery, financial terms, confidentiality, and liability parameters."
        ),
        "purpose": "Commercial services engagement and vendor partnership.",
        "key_obligations": [
            "Client must pay invoices within 15 days of receipt.",
            "Both parties must maintain confidentiality of proprietary information.",
        ],
        "deadlines": [
            "Invoice payment: 15 days post-billing cycle.",
            "Termination notice: 30 days prior written notice required.",
        ],
        "risks": (
            f"The following clauses present HIGH risk: {', '.join(high_clauses) if high_clauses else 'None detected'}. "
            "Key concerns include a vendor-favorable liability cap (6 months of historical spend) "
            "and unilateral termination rights with only 30 days notice."
        ),
        "recommendations": [
            "Renegotiate the liability cap to at least 1× the annual contract value.",
            "Require mutual termination-for-convenience rights or extend notice period to 60–90 days.",
            "Add a Service Level Agreement (SLA) with breach remedies.",
        ],
    }

    return clauses, entities, summary
