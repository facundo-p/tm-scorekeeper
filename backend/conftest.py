import sys
import os

# Ensure the backend directory is on sys.path so imports work whether
# pytest is invoked from the repo root (CI) or from within backend/ (Docker).
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
