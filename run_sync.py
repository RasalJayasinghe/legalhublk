#!/usr/bin/env python3

import subprocess
import sys
import os

# Set environment variables for the sync script
os.environ['SOURCE_BASE'] = 'https://raw.githubusercontent.com/nuuuwan/lk_legal_docs/main'
os.environ['SOURCE_ALL'] = 'data/all.json'
os.environ['SOURCE_LATEST'] = 'data/latest-100.json'
os.environ['OUTPUT_DIR'] = 'public/data'

print("Running sync script...")
result = subprocess.run([sys.executable, 'scripts/sync_lk_legal_docs.py'], 
                       capture_output=True, text=True)

print("STDOUT:")
print(result.stdout)
if result.stderr:
    print("STDERR:")
    print(result.stderr)

print(f"Exit code: {result.returncode}")