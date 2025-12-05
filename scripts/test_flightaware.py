# scripts/test_flightaware.py
import requests
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

api_key = os.getenv('FLIGHTAWARE_API_KEY')

if not api_key:
    print("No API key found in .env file!")
    exit()

print(f"Testing with API key: {api_key[:10]}...")

headers = {
    "x-apikey": api_key,
    "Accept": "application/json"
}

# Try to get airport info (simple test)
url = "https://aeroapi.flightaware.com/aeroapi/airports/KATL"

response = requests.get(url, headers=headers)

print(f"Status Code: {response.status_code}")
print(f"Response: {response.text[:500]}")

if response.status_code == 200:
    print("\n✓ API key works!")
elif response.status_code == 401:
    print("\n✗ API key is invalid or unauthorized")
elif response.status_code == 429:
    print("\n✗ Rate limited - you may have exceeded your quota")
else:
    print(f"\n✗ Unexpected error: {response.status_code}")