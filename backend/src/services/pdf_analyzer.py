import fitz  # PyMuPDF
import re
from PIL import Image

class PdfAnalyzer:
    def __init__(self, section_order, section_keywords, db_mapping):
        self.section_order = section_order
        self.section_keywords = section_keywords
        self.db_mapping = db_mapping
        
        self.header_pattern = re.compile(
            r"^\s*"
            r"(?:"
            r"\d+\.\s+"
            r"|"
            r"[IVXLCDM]+\.\s+"
            r"|"
            r"[•●-]\s+"
            r")"
            r"(.+?)"
            r"\s*:\s*"
            r"(.*)$",
            re.IGNORECASE
        )

    def _get_full_text(self, doc):
        """Extracts text from the document, preserving line breaks."""
        full_text = ""
        for page in doc:
            full_text += page.get_text()
        return full_text

    def _parse_line_as_header(self, line):
        """
        Applies the new structured logic to identify a header.
        
        A line is a header if it matches the regex pattern (prefix + text + colon).
        If it is a header, it then identifies which section it is via keywords.

        Returns:
            A tuple (section_key, inline_content) if it's a valid, identified header.
            None otherwise.
        """
        match = self.header_pattern.match(line)
        
        if not match:
            return None

        header_text_from_doc = match.group(1).strip().lower()
        inline_content = match.group(2).strip()

        for key in self.section_order:
            keywords = self.section_keywords.get(key, set())
            if any(keyword in header_text_from_doc for keyword in keywords):
                return (key, inline_content)
        
        return None

    def analyze_document(self, doc):
        """
        Analyzes the document using the new, robust, structure-first strategy.
        """
        full_text = self._get_full_text(doc)
        lines = full_text.split('\n')

        analysis_results = {
            "num_pages": len(doc), "extracted_sections": {}, "found_flags": {},
            "missing_required_sections": [], "error": None
        }

        current_section_key = None
        current_content = []

        for line in lines:
            line = line.strip()
            if not line:
                continue

            parsed_header = self._parse_line_as_header(line)
            
            if parsed_header:
                new_section_key, inline_content = parsed_header
                
                if current_section_key and current_content:
                    analysis_results["extracted_sections"][current_section_key] = " ".join(current_content)
                
                current_section_key = new_section_key
                analysis_results["found_flags"][current_section_key] = True
                current_content = []

                if inline_content:
                    current_content.append(inline_content)
            
            elif current_section_key:
                current_content.append(line)

        if current_section_key and current_content:
            analysis_results["extracted_sections"][current_section_key] = " ".join(current_content)

        if 'results' in analysis_results["extracted_sections"]:
            results_text = analysis_results["extracted_sections"]['results']
            results_text = re.sub(r'\s*([•●-])\s*', r'\n\1 ', results_text).strip()
            analysis_results["extracted_sections"]['results'] = results_text

        for skey, sconf in self.db_mapping.items():
            if sconf["is_required"] and not analysis_results["found_flags"].get(skey, False):
                analysis_results["missing_required_sections"].append(skey)
                
        return analysis_results

    def get_preview_image_from_document(self, doc, preview_width=380, max_preview_height=480):
        if not doc or len(doc) == 0:
            return None
        try:
            page = doc[0]
            zoom = 2.0; mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            
            aspect_ratio = img.height / img.width
            preview_height = int(preview_width * aspect_ratio)
            if preview_height > max_preview_height:
                preview_height = max_preview_height
                preview_width = int(preview_height / aspect_ratio)
                
            return img.resize((preview_width, preview_height), Image.Resampling.LANCZOS)
        except Exception as e:
            print(f"Error generating preview from open doc: {e}")
            return None