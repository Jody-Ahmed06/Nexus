"""
CV Parser — extracts raw text from uploaded PDF files using PyPDF2.
"""
import io
from typing import Optional

try:
    from PyPDF2 import PdfReader
    PYPDF2_AVAILABLE = True
except ImportError:
    PYPDF2_AVAILABLE = False


def extract_text_from_pdf(file_bytes: bytes) -> Optional[str]:
    """
    Extract all text content from a PDF file.
    Returns None if extraction fails or PyPDF2 is not available.
    """
    if not PYPDF2_AVAILABLE:
        return None

    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        pages_text = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages_text.append(text.strip())
        return "\n\n".join(pages_text)
    except Exception as e:
        print(f"[CVParser] Failed to parse PDF: {e}")
        return None
