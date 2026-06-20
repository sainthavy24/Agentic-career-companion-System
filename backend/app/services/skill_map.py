"""Map a user's granular skills (e.g. 'React', 'Figma') to Model 2's 25
job-function categories so the Skill Gap analysis compares like-for-like.
Honest framing: Model 2 predicts broad *focus areas*, so we bridge the
user's skills up to the same level rather than inventing granular labels.
"""

# category -> keyword fragments (substring match, lowercase)
CATEGORY_KEYWORDS = {
    "Information Technology": [
        "information technology", "it", "software", "developer", "development",
        "programming", "program", "python", "java", "javascript", "typescript",
        "react", "angular", "vue", "node", "frontend", "front end", "backend",
        "back end", "full stack", "fullstack", "html", "css", "sql", "database",
        "cloud", "aws", "azure", "gcp", "devops", "docker", "kubernetes", "linux",
        "api", "web", "mobile", "android", "ios", "flutter", "machine learning",
        "ml", "deep learning", "ai", "artificial intelligence", "data science",
        "cyber", "security", "network", "git", "php", "c++", "c#", ".net", "go",
        "ruby", "rust", "swift", "kotlin", "spring", "django", "flask",
    ],
    "Engineering": [
        "engineer", "engineering", "mechanical", "electrical", "civil",
        "hardware", "embedded", "cad", "solidworks", "autocad", "robotics", "plc",
    ],
    "Design": [
        "design", "ui", "ux", "user interface", "user experience", "figma",
        "sketch", "photoshop", "illustrator", "adobe xd", "graphic", "prototype",
        "prototyping", "wireframe", "visual design", "product design",
    ],
    "Art/Creative": [
        "art", "creative", "animation", "video", "illustration", "drawing",
        "music", "photography", "3d", "motion graphics",
    ],
    "Analyst": [
        "analyst", "analytics", "data analysis", "data analyst", "power bi",
        "tableau", "excel", "statistics", "reporting", "looker", "bi",
    ],
    "Research": ["research", "r&d", "scientist", "study", "experiment", "literature review"],
    "Finance": ["finance", "financial", "investment", "banking", "trading", "valuation", "fp&a", "forecasting"],
    "Accounting/Auditing": ["accounting", "audit", "bookkeeping", "tax", "quickbooks", "ledger", "payable", "receivable"],
    "Marketing": ["marketing", "seo", "sem", "content", "social media", "campaign", "brand", "advertising", "copywriting", "email marketing", "google ads"],
    "Sales": ["sales", "selling", "lead generation", "crm", "salesforce", "account executive", "cold calling", "quota"],
    "Business Development": ["business development", "partnership", "partnerships", "go-to-market"],
    "Management": ["management", "manager", "leadership", "team lead", "strategy", "operations", "stakeholder"],
    "Project Management": ["project management", "scrum", "agile", "kanban", "pmp", "jira", "sprint", "product owner", "roadmap"],
    "Human Resources": ["human resources", "hr", "recruiting", "recruitment", "talent acquisition", "payroll", "onboarding", "people ops"],
    "Customer Service": ["customer service", "customer support", "support", "helpdesk", "help desk", "customer success"],
    "Consulting": ["consulting", "consultant", "advisory"],
    "Legal": ["legal", "law", "compliance", "contract", "attorney", "paralegal", "litigation"],
    "Education": ["education", "teaching", "teacher", "tutor", "curriculum", "lecturer", "instructor"],
    "Training": ["training", "trainer", "coaching", "instructional", "facilitation"],
    "Quality Assurance": ["quality assurance", "qa", "testing", "test automation", "selenium", "cypress", "qc", "quality control", "manual testing"],
    "Administrative": ["administrative", "admin", "office", "scheduling", "data entry", "clerical", "calendar"],
    "Manufacturing": ["manufacturing", "production", "assembly", "cnc", "lean", "six sigma", "supply chain", "logistics", "warehouse"],
    "Health Care Provider": ["nursing", "nurse", "medical", "clinical", "patient", "healthcare", "physician", "pharmacy", "therapy"],
}


def skill_to_categories(skill: str) -> set:
    s = (skill or "").lower().strip()
    if not s:
        return set()
    hits = set()
    for cat, kws in CATEGORY_KEYWORDS.items():
        cat_l = cat.strip().lower()
        if not kws:
            continue
        if s == cat_l or cat_l in s:
            hits.add(cat.strip())
            continue
        for kw in kws:
            # whole-token-ish match: kw inside skill, or skill inside kw
            if kw == s or kw in s or (len(s) >= 3 and s in kw):
                hits.add(cat.strip())
                break
    return hits


def skills_to_categories(skills: list) -> set:
    out = set()
    for sk in skills or []:
        out |= skill_to_categories(sk)
    return out
