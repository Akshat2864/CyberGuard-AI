import requests
import json
import time

API_BASE = "http://127.0.0.1:8000"

def test_module(name, endpoint, data, method="POST"):
    print(f"\n[🔬 TESTING] Module: {name}")
    try:
        if method == "POST":
            response = requests.post(f"{API_BASE}{endpoint}", json=data, timeout=10)
        else:
            response = requests.get(f"{API_BASE}{endpoint}", timeout=10)
        
        if response.status_code == 200:
            res_data = response.json()
            print(f"✅ SUCCESS: {name}")
            print(f"📊 RESULT: {json.dumps(res_data, indent=2)[:300]}...")
            return res_data
        else:
            print(f"❌ FAILED: {name} (Status: {response.status_code})")
            print(f"⚠️ ERROR: {response.text}")
    except Exception as e:
        print(f"💥 FATAL ERROR: {name} - {str(e)}")
    return None

def run_suite():
    print("🚀 INITIALIZING CYBERGUARD AI FORENSIC TEST SUITE")
    print("-" * 50)

    # 1. Single Scan (Homograph Detection)
    test_module("Threat Explorer (Homograph)", "/analyze", {"url": "http://xn--payp-upa.com"})

    # 2. Redirect Tracing
    test_module("Redirect Intelligence", "/analyze", {"url": "http://bit.ly/3uG2y6h"}) # Known common shortener

    # 3. Email Breach Analysis
    test_module("Email Leak Checker", "/check-email", {"email": "test-breach@gmail.com"})

    # 4. Batch Processing
    test_module("Batch URL Processor", "/batch-analyze", {
        "urls": ["http://malicious.zip", "http://192.168.1.1", "https://google.com"]
    })

    # 5. History Synchronization check
    time.sleep(1) # Give DB a moment to breathe
    history = test_module("History Synchronization", "/history", {}, method="GET")
    
    if history and len(history) > 0:
        print("\n🏆 FINAL VERIFICATION: Scan history is SYNCED and populated.")
    else:
        print("\n⚠️ WARNING: History is still empty. Check DB connectivity.")

if __name__ == "__main__":
    run_suite()
