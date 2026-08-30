from pptx import Presentation

prs = Presentation(r"C:\Users\asus\Documents\GitHub\Agentic-career-companion-System\docs\PathCompanionAI_PRES1_Presentation_v2.pptx")
print("Placeholders in layout 0:")
for ph in prs.slide_layouts[0].placeholders:
    print(ph.name)
