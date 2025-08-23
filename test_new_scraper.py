#!/usr/bin/env python3
"""
Test the new scraper system
"""

import subprocess
import sys
import os

def run_command(cmd):
    """Run a command and return result"""
    print(f"Running: {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    print(f"Exit code: {result.returncode}")
    if result.stdout:
        print("STDOUT:", result.stdout[:500])
    if result.stderr:
        print("STDERR:", result.stderr[:500])
    return result.returncode == 0

def main():
    print("Testing new scraper system...")
    
    # Test individual scrapers
    commands = [
        "python -m scrapers.cli acts --out public/data/acts",
        "python -m scrapers.cli bills --out public/data/bills", 
        "python -m scrapers.cli forms --out public/data/forms",
        "python -m scrapers.cli notices --out public/data/notices",
        "python -m scrapers.cli merge-latest --root public/data"
    ]
    
    success_count = 0
    for cmd in commands:
        if run_command(cmd):
            success_count += 1
            print(f"✅ {cmd} - SUCCESS\n")
        else:
            print(f"❌ {cmd} - FAILED\n")
    
    print(f"Results: {success_count}/{len(commands)} commands succeeded")
    
    # Check output files
    expected_files = [
        "public/data/acts/catalog.json",
        "public/data/acts/latest.json",
        "public/data/bills/catalog.json", 
        "public/data/bills/latest.json",
        "public/data/forms/catalog.json",
        "public/data/forms/latest.json",
        "public/data/notices/catalog.json",
        "public/data/notices/latest.json",
        "public/data/all/catalog.json",
        "public/data/all/latest.json"
    ]
    
    print("\nChecking output files:")
    for file_path in expected_files:
        if os.path.exists(file_path):
            file_size = os.path.getsize(file_path)
            print(f"✅ {file_path} ({file_size} bytes)")
        else:
            print(f"❌ {file_path} - Missing")

if __name__ == "__main__":
    main()