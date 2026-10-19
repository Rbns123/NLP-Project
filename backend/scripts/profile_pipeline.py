import time
import psutil
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.core.sample_paper import create_sample_paper_docx
from backend.core.pipeline import run_paperlens_pipeline

def profile_paperlens():
    print("=" * 60)
    print("🚀 Running PaperLens Performance & Memory Profiler")
    print("=" * 60)

    process = psutil.Process(os.getpid()) if hasattr(psutil, "Process") else None
    mem_before = process.memory_info().rss / (1024 * 1024) if process else 0

    sample_doc = create_sample_paper_docx()
    print(f"📄 Sample scientific paper size: {len(sample_doc) / 1024:.2f} KB")

    times = []
    for iteration in range(1, 4):
        start = time.perf_counter()
        result = run_paperlens_pipeline(sample_doc, "Sample_PaperLens_Study.docx")
        elapsed = time.perf_counter() - start
        times.append(elapsed)
        print(f"Run {iteration}: {elapsed:.3f} seconds | Extracted {len(result.sections)} sections, {len(result.entities)} entities, {len(result.triplets)} triplets")

    avg_time = sum(times) / len(times)
    mem_after = process.memory_info().rss / (1024 * 1024) if process else 0

    print("-" * 60)
    print(f"⏱️ Average Latency: {avg_time:.3f} s")
    print(f"🧠 Memory Consumption: ~{mem_after - mem_before:.2f} MB delta (Total RSS: {mem_after:.2f} MB)")
    print("✅ Profiling Completed Successfully!")
    print("=" * 60)

if __name__ == "__main__":
    profile_paperlens()
