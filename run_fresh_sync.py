#!/usr/bin/env python3
import subprocess
import sys

try:
    result = subprocess.run([sys.executable, "fetch_and_sync.py"], 
                          capture_output=True, text=True, cwd=".")
    print("STDOUT:", result.stdout)
    if result.stderr:
        print("STDERR:", result.stderr)
    print("Return code:", result.returncode)
except Exception as e:
    print(f"Error running sync: {e}")