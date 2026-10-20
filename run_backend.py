"""
Mainframe Ride Analytics - Backend Server Launcher
Can be run from anywhere:
    python run_backend.py
"""

import os
import sys

# Ensure project root is in Python path
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

if __name__ == "__main__":
    import uvicorn
    print("\n" + "=" * 65)
    print("  MAINFRAME RIDE ANALYTICS - FASTAPI SERVER")
    print("  Zero-Database Direct Sequential Dataset Streaming")
    print("  API Docs: http://127.0.0.1:8000/docs")
    print("=" * 65 + "\n")
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
