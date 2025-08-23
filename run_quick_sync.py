#!/usr/bin/env python3
import subprocess
import sys

print("Running quick sync to create test data...")
result = subprocess.run([sys.executable, "quick_sync_test.py"], capture_output=True, text=True)
print("STDOUT:")
print(result.stdout)
if result.stderr:
    print("STDERR:")
    print(result.stderr)
print(f"Exit code: {result.returncode}")