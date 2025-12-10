"""
Convert Python Pickle Files to JSON for C# API

This script converts the label encoders and feature scaler from pickle format
to JSON format so the C# API can load them.

WHY THIS IS NECESSARY:
- Python's pickle format is binary and Python-specific
- C# cannot read pickle files directly
- JSON is a universal format that both Python and C# can read
"""

import pickle
import json
import numpy as np
from pathlib import Path

print("="*60)
print("CONVERTING PICKLE FILES TO JSON")
print("="*60)

# Path to your models directory
models_dir = Path('data/models')
output_dir = models_dir

# ============================================================================
# 1. Convert Label Encoders
# ============================================================================
print("\n1. Converting label encoders...")

with open(models_dir / 'label_encoders.pkl', 'rb') as f:
    encoders = pickle.load(f)

# The pickle file contains a dictionary with three LabelEncoder objects
# We need to extract the classes_ array from each encoder
label_encoders_json = {
    'origin': {
        'classes': encoders['origin'].classes_.tolist(),
        'class_count': len(encoders['origin'].classes_)
    },
    'dest': {
        'classes': encoders['dest'].classes_.tolist(),
        'class_count': len(encoders['dest'].classes_)
    },
    'carrier': {
        'classes': encoders['carrier'].classes_.tolist(),
        'class_count': len(encoders['carrier'].classes_)
    }
}

output_path = output_dir / 'label_encoders.json'
with open(output_path, 'w') as f:
    json.dump(label_encoders_json, f, indent=2)

print(f"✓ Label encoders saved to: {output_path}")
print(f"  - Origin airports: {len(label_encoders_json['origin']['classes'])}")
print(f"  - Destination airports: {len(label_encoders_json['dest']['classes'])}")
print(f"  - Carriers: {len(label_encoders_json['carrier']['classes'])}")

# ============================================================================
# 2. Convert Feature Scaler
# ============================================================================
print("\n2. Converting feature scaler...")

with open(models_dir / 'feature_scaler.pkl', 'rb') as f:
    scaler = pickle.load(f)

# StandardScaler has these important attributes:
# - mean_: array of means for each feature
# - scale_: array of standard deviations for each feature
# - n_features_in_: number of features

scaler_json = {
    'mean': scaler.mean_.tolist(),
    'scale': scaler.scale_.tolist(),
    'n_features': int(scaler.n_features_in_)
}

output_path = output_dir / 'feature_scaler.json'
with open(output_path, 'w') as f:
    json.dump(scaler_json, f, indent=2)

print(f"✓ Feature scaler saved to: {output_path}")
print(f"  - Number of features: {scaler_json['n_features']}")

# Show example of what the scaler does
print(f"\n  Example scaling (feature 0):")
print(f"    Mean: {scaler_json['mean'][0]:.4f}")
print(f"    Std:  {scaler_json['scale'][0]:.4f}")
print(f"    Formula: (x - {scaler_json['mean'][0]:.4f}) / {scaler_json['scale'][0]:.4f}")

# ============================================================================
# 3. Convert Feature Info
# ============================================================================
print("\n3. Converting feature info...")

with open(models_dir / 'feature_info.pkl', 'rb') as f:
    feature_info = pickle.load(f)

# This should contain the feature column names in order
feature_info_json = {
    'feature_columns': feature_info['feature_columns'],
    'num_features': feature_info['num_features'],
    'target_column': feature_info.get('target_column', 'is_delayed')
}

output_path = output_dir / 'feature_info.json'
with open(output_path, 'w') as f:
    json.dump(feature_info_json, f, indent=2)

print(f"✓ Feature info saved to: {output_path}")
print(f"  - Number of features: {feature_info_json['num_features']}")
print(f"\n  Feature order (first 10):")
for i, feat in enumerate(feature_info_json['feature_columns'][:10], 1):
    print(f"    {i:2d}. {feat}")

# ============================================================================
# 4. Create a verification file
# ============================================================================
print("\n4. Creating verification info...")

# This file helps you verify everything is correct
verification = {
    'conversion_date': str(np.datetime64('now')),
    'label_encoders': {
        'origin_example': {
            'ATL': label_encoders_json['origin']['classes'].index('ATL') if 'ATL' in label_encoders_json['origin']['classes'] else None,
            'LAX': label_encoders_json['origin']['classes'].index('LAX') if 'LAX' in label_encoders_json['origin']['classes'] else None,
            'ORD': label_encoders_json['origin']['classes'].index('ORD') if 'ORD' in label_encoders_json['origin']['classes'] else None,
        },
        'carrier_example': {
            carrier: label_encoders_json['carrier']['classes'].index(carrier) 
            for carrier in label_encoders_json['carrier']['classes'][:5]
        }
    },
    'feature_count': {
        'expected': 45,
        'actual': feature_info_json['num_features'],
        'match': feature_info_json['num_features'] == 45
    },
    'scaler_features_match': scaler_json['n_features'] == feature_info_json['num_features']
}

output_path = output_dir / 'conversion_verification.json'
with open(output_path, 'w') as f:
    json.dump(verification, f, indent=2)

print(f"✓ Verification saved to: {output_path}")

# ============================================================================
# Final Summary
# ============================================================================
print("\n" + "="*60)
print("CONVERSION COMPLETE!")
print("="*60)

print("\nCreated files:")
print(f"  1. label_encoders.json")
print(f"  2. feature_scaler.json")
print(f"  3. feature_info.json")
print(f"  4. conversion_verification.json")

print("\n⚠ IMPORTANT: Copy these JSON files to your C# API:")
print(f"  From: {models_dir.absolute()}")
print(f"  To:   FlightPredictor.API/Data/")

if not verification['feature_count']['match']:
    print(f"\n⚠ WARNING: Feature count mismatch!")
    print(f"  Expected: {verification['feature_count']['expected']}")
    print(f"  Actual:   {verification['feature_count']['actual']}")

if not verification['scaler_features_match']:
    print(f"\n⚠ WARNING: Scaler features don't match feature info!")