#!/usr/bin/env python3
import subprocess
import sys
import os

def run_sync():
    """Run the document sync and update process"""
    try:
        # Ensure the public/data directory exists
        os.makedirs('public/data', exist_ok=True)
        
        # Run the fetch_and_sync.py script
        print("Running document sync...")
        result = subprocess.run([sys.executable, "fetch_and_sync.py"], 
                              capture_output=True, text=True, cwd=".")
        
        print("STDOUT:", result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        print("Return code:", result.returncode)
        
        if result.returncode == 0:
            print("✅ Document sync completed successfully!")
        else:
            print("❌ Document sync failed!")
            
        return result.returncode == 0
        
    except Exception as e:
        print(f"Error running sync: {e}")
        return False

if __name__ == "__main__":
    success = run_sync()
    sys.exit(0 if success else 1)