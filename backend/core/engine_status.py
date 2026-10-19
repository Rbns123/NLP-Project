import torch
import platform
from typing import Dict, Any

def get_engine_status() -> Dict[str, Any]:
    """
    Returns engine telemetry, runtime hardware availability (Apple Silicon MPS vs CPU),
    and status of configured pipeline components.
    """
    mps_available = torch.backends.mps.is_available()
    mps_built = torch.backends.mps.is_built()
    
    device = "mps" if mps_available else "cpu"
    
    return {
        "device": device,
        "apple_silicon_mps_available": mps_available,
        "apple_silicon_mps_built": mps_built,
        "python_version": platform.python_version(),
        "platform": platform.platform(),
        "modules": {
            "ingestion": {"status": "ready", "engine": "pdfplumber+python-docx"},
            "segmentation": {"status": "ready", "engine": "rule-based"},
            "scientific_ner": {"status": "ready", "engine": "gazetteer+regex (transformer tier ready)"},
            "triplet_extraction": {"status": "ready", "engine": "rule-based"},
            "claim_classification": {"status": "ready", "engine": "deterministic-rules (fallback ready)"},
            "reproducibility": {"status": "ready", "engine": "rule-based"},
            "citations": {"status": "ready", "engine": "regex-parser"},
            "summarization": {"status": "ready", "engine": "extractive-fallback (abstractive tier ready)"}
        }
    }
