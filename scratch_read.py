import zipfile
import xml.etree.ElementTree as ET
import sys
import os
import re

def extract_text_from_docx(docx_path):
    text = []
    try:
        with zipfile.ZipFile(docx_path) as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.XML(xml_content)
            for paragraph in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                para_text = []
                for node in paragraph.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
                    if node.text:
                        para_text.append(node.text)
                if para_text:
                    text.append("".join(para_text))
    except Exception as e:
        text.append(f"Error reading docx: {e}")
    return "\n".join(text)

def extract_text_from_pptx(pptx_path):
    text = []
    try:
        with zipfile.ZipFile(pptx_path) as pptx:
            # Only exact slide1.xml, slide2.xml etc
            slides = [f for f in pptx.namelist() if re.match(r'^ppt/slides/slide\d+\.xml$', f)]
            slides.sort(key=lambda x: int(re.search(r'\d+', x).group()))
            for file in slides:
                text.append(f"--- {os.path.basename(file)} ---")
                xml_content = pptx.read(file)
                tree = ET.XML(xml_content)
                for node in tree.iter('{http://schemas.openxmlformats.org/drawingml/2006/main}t'):
                    if node.text:
                        text.append(node.text)
    except Exception as e:
        text.append(f"Error reading pptx: {e}")
    return "\n".join(text)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python script.py <path_to_file> <output_file>")
        sys.exit(1)
    
    path = sys.argv[1]
    out_path = sys.argv[2]
    content = ""
    if path.endswith('.docx'):
        content = extract_text_from_docx(path)
    elif path.endswith('.pptx'):
        content = extract_text_from_pptx(path)
        
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(content)
