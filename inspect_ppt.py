from pptx import Presentation
import sys

try:
    prs = Presentation(r"C:\Users\asus\Documents\GitHub\Agentic-career-companion-System\docs\PathCompanionAI_PRES1_Presentation_v2.pptx")
    print(f"Number of slides: {len(prs.slides)}")
    for i, layout in enumerate(prs.slide_layouts):
        print(f"Layout {i}: {layout.name}")
except Exception as e:
    print(f"Error: {e}")
