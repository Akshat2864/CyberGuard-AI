#!/usr/bin/env python
import requests
import json

test_urls = [
    "https://google.com",
    "https://paypal-verify-login.com",
    "https://evil-g00gle-login.xyz",
    "https://bank-update-account.xyz",
    "http://192.168.1.1",
    "https://amazon.com/checkout"
]

print("🧪 Testing Improved Confidence Scores:\n")
print("=" * 80)

for url in test_urls:
    try:
        r = requests.post('http://localhost:8000/analyze', json={'url': url})
        if r.status_code == 200:
            data = r.json()
            print(f"\n📍 URL: {url}")
            print(f"   Classification: {data['result'].upper()}")
            print(f"   Confidence: {data['confidence']}%")
            print(f"   Risk Score: {data['risk_score']}")
            print(f"   Threats: {', '.join(data['threat_type'])}")
        else:
            print(f"\n❌ Error for {url}: {r.status_code}")
    except Exception as e:
        print(f"\n❌ Error testing {url}: {str(e)}")

print("\n" + "=" * 80)
print("\n✅ Test complete!")
