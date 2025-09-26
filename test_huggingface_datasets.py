#!/usr/bin/env python3
"""
Test script to verify if the Hugging Face datasets exist and are accessible.
Run this to check if the datasets 'nuuuwan/lk-acts-docs' and 'nuuuwan/lk-acts-chunks' exist.
"""

import sys

def test_dataset(dataset_name):
    """Test if a Hugging Face dataset exists and is accessible"""
    try:
        from datasets import load_dataset
        print(f"Testing dataset: {dataset_name}")
        
        # Try to load the dataset
        dataset = load_dataset(dataset_name)
        
        print(f"✅ Dataset '{dataset_name}' loaded successfully!")
        print(f"   Splits: {list(dataset.keys())}")
        
        # Check each split
        for split_name, split in dataset.items():
            print(f"   Split '{split_name}': {len(split)} rows")
            
            # Show first example if available
            if len(split) > 0:
                first_example = split[0]
                print(f"   First example keys: {list(first_example.keys())}")
        
        return True
        
    except ImportError:
        print("❌ 'datasets' package not installed. Install with: pip install datasets")
        return False
    except Exception as e:
        print(f"❌ Error loading dataset '{dataset_name}': {e}")
        return False

def main():
    """Test both Hugging Face datasets"""
    print("Testing Hugging Face datasets for Sri Lankan legal documents...\n")
    
    datasets_to_test = [
        "nuuuwan/lk-acts-docs",
        "nuuuwan/lk-acts-chunks"
    ]
    
    success_count = 0
    for dataset_name in datasets_to_test:
        if test_dataset(dataset_name):
            success_count += 1
        print()  # Empty line for readability
    
    print(f"Results: {success_count}/{len(datasets_to_test)} datasets accessible")
    
    if success_count == 0:
        print("\n🔍 Alternative approaches:")
        print("1. Create the datasets on Hugging Face if they don't exist")
        print("2. Use different dataset names if they exist under different names")
        print("3. Use local data files or different data sources")
        print("4. Check if the datasets are private and require authentication")
    
    return success_count == len(datasets_to_test)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)