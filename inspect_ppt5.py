from pptx import Presentation

prs = Presentation(r"C:\Users\asus\Documents\GitHub\Agentic-career-companion-System\docs\PathCompanionAI_PRES1_Presentation_v2.pptx")
for i, master in enumerate(prs.slide_masters):
    print(f"Master {i}:")
    for j, layout in enumerate(master.slide_layouts):
        print(f"  Layout {j}: {layout.name}")
        for ph in layout.placeholders:
            print(f"    Placeholder: {ph.name} (type: {ph.type})")
