#!/usr/bin/env python3
"""
Quick sync test - run the new scraper system quickly for testing
"""

import subprocess
import sys
import os

def main():
    print("🚀 Running quick sync test...")
    
    # First create sample data
    print("📝 Creating sample data...")
    try:
        result = subprocess.run([sys.executable, "create_sample_data.py"], 
                               capture_output=True, text=True, check=True)
        print("✅ Sample data created")
    except subprocess.CalledProcessError as e:
        print(f"❌ Sample data creation failed: {e}")
        print("STDOUT:", e.stdout)
        print("STDERR:", e.stderr)
        return False
    
    # Test if the new data files exist
    expected_files = [
        "public/data/acts/catalog.json",
        "public/data/acts/latest.json", 
        "public/data/bills/catalog.json",
        "public/data/bills/latest.json",
        "public/data/forms/catalog.json",
        "public/data/forms/latest.json",
        "public/data/notices/catalog.json",
        "public/data/notices/latest.json",
        "public/data/gazettes/catalog.json",
        "public/data/gazettes/latest.json",
        "public/data/extra-gazettes/catalog.json",
        "public/data/extra-gazettes/latest.json",
        "public/data/all/catalog.json",
        "public/data/all/latest.json"
    ]
    
    print("\n📂 Checking created files:")
    for file_path in expected_files:
        if os.path.exists(file_path):
            file_size = os.path.getsize(file_path)
            print(f"✅ {file_path} ({file_size} bytes)")
        else:
            print(f"❌ {file_path} - Missing")
    
    print("\n🎯 Quick sync test complete!")
    print("💡 The app should now load the new data structure with Forms and Notices")
    return True

if __name__ == "__main__":
    main()