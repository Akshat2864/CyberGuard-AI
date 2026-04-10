from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import joblib
import re
import os
from urllib.parse import urlparse
from supabase import create_client, Client

app = Flask(__name__)
CORS(app)

# ⏱️ Rate Limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

# ✅ Supabase setup
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://rdabdvyvqsyxliyovzat.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkYWJkdnl2cXN5eGxpeW92emF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MzQ1MTksImV4cCI6MjA5MTMxMDUxOX0.hP7W99ZSilz1bR6daSGtyC29elcmpGw0hVvNR3c7GsE")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ✅ Safe model loading
try:
    model = joblib.load("model.pkl")
    print("✅ Model loaded successfully")
except:
    model = None
    print("⚠️ Model not found, running without ML")


# 🔍 Feature Extraction
def extract_features(url):
    return [
        len(url),
        1 if "login" in url else 0,
        1 if "@" in url else 0,
        1 if url.startswith("https") else 0,
        url.count('.')
    ]


# ✅ URL Validation
def validate_url(url):
    """Validate URL format and structure"""
    if not url or not isinstance(url, str):
        return False, "URL cannot be empty"
    
    url = url.strip()
    
    # Check minimum length
    if len(url) < 4:
        return False, "URL too short"
    
    # Check maximum length
    if len(url) > 2048:
        return False, "URL too long (max 2048 characters)"
    
    # URL pattern validation
    url_pattern = r'^(https?|ftp)://[^\s/$.?#].[^\s]*$'
    if not re.match(url_pattern, url, re.IGNORECASE):
        return False, "Invalid URL format. Use http://, https://, or ftp://"
    
    # Check for invalid characters
    if any(char in url for char in ['<', '>', '"', '{', '}', '|', '\\', '^', '`']):
        return False, "URL contains invalid characters"
    
    try:
        parsed = urlparse(url)
        if not parsed.netloc:
            return False, "URL missing domain"
        if not parsed.scheme:
            return False, "URL missing protocol (http/https)"
    except Exception as e:
        return False, f"URL parsing error: {str(e)}"
    
    return True, "Valid"


# 🧠 Heuristic Detection Engine
def analyze_url_heuristics(url):
    score = 0
    reasons = []
    threat_type = []

    # === PHISHING DETECTION ===
    phishing_keywords = [
        "login", "verify", "bank", "secure", "account", "update", "confirm", 
        "validate", "authenticate", "credential", "password", "paypal", "amazon",
        "apple", "microsoft", "google", "urgent", "action required", "suspended",
        "resume", "confirm identity", "re-enter", "click here"
    ]
    if any(word in url.lower() for word in phishing_keywords):
        score += 2
        reasons.append("Contains phishing-related keywords")
        threat_type.append("Phishing")

    # === TYPOSQUATTING DETECTION ===
    typosquatting_patterns = [
        r"(g00gle|goog1e|googl3)",  # Google variants
        r"(amaz0n|amaz0m|amazan)",   # Amazon variants
        r"(paypa1|paypp1|paypel)",   # PayPal variants
        r"(micr0soft|microsft)",     # Microsoft variants
        r"(app1e|aple)",             # Apple variants
        r"(fac3book|faecebook)",     # Facebook variants
    ]
    if any(re.search(pattern, url, re.IGNORECASE) for pattern in typosquatting_patterns):
        score += 3
        reasons.append("Possible typosquatting detected (domain mimics trusted brand)")
        threat_type.append("Phishing")

    # === MALWARE DETECTION ===
    malware_extensions = [".exe", ".zip", ".apk", ".bat", ".cmd", ".scr", 
                          ".msi", ".dll", ".jar", ".run", ".dmg", ".pkg"]
    if any(ext in url.lower() for ext in malware_extensions):
        score += 3
        reasons.append("Possible malware file detected in URL")
        threat_type.append("Malware")

    # === CREDENTIAL STUFFING & INJECTION ===
    if "@" in url:
        score += 2
        reasons.append("Uses '@' symbol to hide destination domain")
        threat_type.append("Phishing")

    if "?" in url and any(char in url.split("?")[1] if "?" in url else "" for char in ["'", "\"", ";"]):
        score += 2
        reasons.append("Possible query injection detected")
        threat_type.append("Injection Attack")

    # === INFRASTRUCTURE THREATS ===
    
    # IP Address Detection
    ip_pattern = r"http(s)?://(\d{1,3}\.){3}\d{1,3}"
    if re.match(ip_pattern, url):
        score += 2
        reasons.append("Uses IP address instead of domain (DNS evasion)")
        threat_type.append("Infrastructure Threat")

    # Non-HTTPS Detection (SSL/TLS)
    if url.startswith("http://"):
        score += 1
        reasons.append("Uses HTTP instead of HTTPS (no encryption)")
        threat_type.append("SSL/TLS Missing")

    # === URL STRUCTURAL ANOMALIES ===
    
    # Excessive length
    if len(url) > 75:
        score += 1
        reasons.append("URL is unusually long (possible obfuscation)")

    # Too many subdomains
    parsed = urlparse(url)
    subdomain_count = parsed.netloc.count('.')
    if subdomain_count > 3:
        score += 1
        reasons.append("Excessive subdomains (possible domain spoofing)")
        threat_type.append("Domain Spoofing")

    # === URL SHORTENERS (Reputation Risk) ===
    shorteners = ["bit.ly", "tinyurl.com", "goo.gl", "tiny.cc", "ow.ly", "short.link"]
    if any(short in url.lower() for short in shorteners):
        score += 2
        reasons.append("URL uses shortening service (hides true destination)")
        threat_type.append("Obfuscation")

    # === SUSPICIOUS PROTOCOLS ===
    if re.match(r"^(ftp|file|telnet)://", url):
        score += 2
        reasons.append("Uses suspicious protocol (FTP/File/Telnet)")
        threat_type.append("Infrastructure Threat")

    # === HOMOGRAPH ATTACKS ===
    if re.search(r"[^a-z0-9\-.]", url.lower()):  # Non-standard characters
        score += 1
        reasons.append("Contains non-standard characters (Unicode homoglyphs possible)")

    # === REDIRECT CHAINS ===
    if url.count("http") > 1:
        score += 2
        reasons.append("Possible redirect chain detected")
        threat_type.append("Redirect Chain")

    return score, reasons, list(set(threat_type))

def generate_detailed_explanations(url):
    explanations = []

    # Phishing indicators
    if any(word in url.lower() for word in ["login", "verify", "confirm", "validate", "authenticate"]):
        explanations.append(
            "The URL contains keywords commonly used in phishing attacks (e.g., 'login', 'verify'). Legitimate sites rarely require urgent verification through clickable links."
        )

    if any(word in url.lower() for word in ["urgent", "action required", "suspended", "resume"]):
        explanations.append(
            "Urgent language detected. Phishing emails often create false urgency to bypass critical thinking."
        )

    if "@" in url:
        explanations.append(
            "The URL contains an '@' symbol, which can hide the real destination domain—a known phishing technique."
        )

    if url.startswith("http://"):
        explanations.append(
            "The URL uses HTTP instead of HTTPS, meaning data transmitted to this site is not encrypted. Legitimate financial or credential sites use HTTPS."
        )

    if len(url) > 75:
        explanations.append(
            "The URL is unusually long, which may indicate obfuscation to hide the true destination."
        )

    if url.count('.') > 3:
        explanations.append(
            "Multiple subdomains detected. Attackers often create subdomains that mimic trusted sites (e.g., security.paypal.attacker.com)."
        )

    if any(re.search(pattern, url, re.IGNORECASE) for pattern in [
        r"(g00gle|goog1e|googl3)", r"(amaz0n|amaz0m|amazan)", r"(paypa1|paypp1|paypel)",
        r"(micr0soft|microsft)", r"(app1e|aple)", r"(fac3book|faecebook)"
    ]):
        explanations.append(
            "Domain typosquatting detected. The domain mimics a trusted brand using deceptive spelling (e.g., 'g00gle' instead of 'google')."
        )

    if any(ext in url.lower() for ext in [".exe", ".apk", ".zip", ".dmg", ".msi"]):
        explanations.append(
            "The URL may lead to a downloadable executable file. Such files could contain malware, ransomware, or spyware."
        )

    if any(short in url.lower() for short in ["bit.ly", "tinyurl.com", "goo.gl", "tiny.cc"]):
        explanations.append(
            "The URL uses a shortening service, which hides the true destination. This is commonly used in phishing to disguise malicious links."
        )

    if re.match(r"http(s)?://(\d{1,3}\.){3}\d{1,3}", url):
        explanations.append(
            "The URL uses an IP address instead of a domain name, which is unusual and may indicate an attempt to evade domain-based security filters."
        )

    if "?" in url and any(char in url.split("?")[1] if "?" in url else "" for char in ["'", "\"", ";"]):
        explanations.append(
            "The URL contains suspicious characters in query parameters, which may indicate an injection attack attempt."
        )

    if url.count("http") > 1:
        explanations.append(
            "The URL appears to contain redirect chains, which can be used to evade security checks or lead to malicious sites."
        )

    if re.match(r"^(ftp|file|telnet)://", url):
        explanations.append(
            f"The URL uses {url.split('://')[0].upper()}, which is rarely used legitimately and has known security vulnerabilities."
        )

    if not explanations:
        explanations.append(
            "No significant threats were detected."
        )

    
    return explanations


# 🎯 Classification
def classify_risk(score):
    if score >= 6:
        return "Malicious", "#ef4444"
    elif score >= 3:
        return "Suspicious", "#f59e0b"
    else:
        return "Safe", "#10b981"


# 📊 Update analytics in Supabase (upsert row with id=1)
def update_analytics(result):
    try:
        existing = supabase.table("analytics").select("*").eq("id", 1).execute()

        if existing.data:
            row = existing.data[0]
        else:
            row = {"id": 1, "total_scans": 0, "safe_count": 0, "suspicious_count": 0, "malicious_count": 0}

        row["total_scans"] = (row.get("total_scans") or 0) + 1

        if result == "Safe":
            row["safe_count"] = (row.get("safe_count") or 0) + 1
        elif result == "Suspicious":
            row["suspicious_count"] = (row.get("suspicious_count") or 0) + 1
        elif result == "Malicious":
            row["malicious_count"] = (row.get("malicious_count") or 0) + 1

        supabase.table("analytics").upsert(row).execute()

    except Exception as e:
        print("Analytics update error:", e)


# 🌐 Home
@app.route('/')
def home():
    return "API is running ✅"


# 🚀 Analyze API
@app.route('/analyze', methods=['POST'])
@limiter.limit("30 per minute")
def analyze():
    try:
        data = request.json

        if not data or "url" not in data:
            return jsonify({"error": "URL is required"}), 400

        url = data["url"].strip()
        user_id = data.get("user_id", "anonymous")

        # Validate URL format
        is_valid, validation_msg = validate_url(url)
        if not is_valid:
            return jsonify({"error": validation_msg}), 400

        score, reasons, threat_type = analyze_url_heuristics(url)
        detailed_explanations = generate_detailed_explanations(url)

        # Default fallback
        confidence = 50

        if model:
            features = extract_features(url)
            prediction = model.predict([features])[0]
            probability = model.predict_proba([features])[0]

            if prediction == 1:
                score += 2

            # ML-based confidence
            confidence = round(max(probability) * 100, 2)
        else:
            # Heuristic-based fallback confidence
            confidence = min(95, 40 + score * 8)

        result, risk_color = classify_risk(score)
        threat_str = ", ".join(threat_type) if threat_type else "None"

        # 💾 Save scan to Supabase
        supabase.table("url_scans").insert({
            "url": url,
            "result": result,
            "confidence": confidence,
            "risk_score": score,
            "threat_type": threat_str,
            "user_id": user_id
        }).execute()

        # 📊 Update analytics
        update_analytics(result)

        return jsonify({
            "url": url,
            "result": result,
            "risk_color": risk_color,
            "confidence": confidence,
            "risk_score": score,
            "threat_type": threat_type if threat_type else ["None"],
            "reasons": reasons if reasons else ["No major threats detected"],
            "explanations": detailed_explanations  
        })

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500


# 🔗 Batch URL Analyzer
@app.route('/batch-analyze', methods=['POST'])
@limiter.limit("10 per minute")
def batch_analyze():
    """Analyze multiple URLs in one request"""
    try:
        data = request.json

        if not data or "urls" not in data:
            return jsonify({"error": "URLs list is required"}), 400

        urls = data.get("urls", [])
        
        # Validate input
        if not isinstance(urls, list):
            return jsonify({"error": "URLs must be a list"}), 400
        
        if len(urls) == 0:
            return jsonify({"error": "At least one URL is required"}), 400
        
        if len(urls) > 20:
            return jsonify({"error": "Maximum 20 URLs per batch"}), 400

        user_id = data.get("user_id", "anonymous")
        results = []

        for url in urls:
            url = url.strip()
            
            # Validate URL
            is_valid, validation_msg = validate_url(url)
            if not is_valid:
                results.append({
                    "url": url,
                    "error": validation_msg,
                    "valid": False
                })
                continue

            try:
                score, reasons, threat_type = analyze_url_heuristics(url)
                detailed_explanations = generate_detailed_explanations(url)

                confidence = 50
                if model:
                    features = extract_features(url)
                    prediction = model.predict([features])[0]
                    probability = model.predict_proba([features])[0]
                    if prediction == 1:
                        score += 2
                    confidence = round(max(probability) * 100, 2)
                else:
                    confidence = min(95, 40 + score * 8)

                result, risk_color = classify_risk(score)
                threat_str = ", ".join(threat_type) if threat_type else "None"

                # Save to database
                supabase.table("url_scans").insert({
                    "url": url,
                    "result": result,
                    "confidence": confidence,
                    "risk_score": score,
                    "threat_type": threat_str,
                    "user_id": user_id
                }).execute()

                update_analytics(result)

                results.append({
                    "url": url,
                    "result": result,
                    "risk_color": risk_color,
                    "confidence": confidence,
                    "risk_score": score,
                    "threat_type": threat_type if threat_type else ["None"],
                    "valid": True
                })
            except Exception as e:
                results.append({
                    "url": url,
                    "error": str(e),
                    "valid": False
                })

        return jsonify({
            "total": len(urls),
            "analyzed": len([r for r in results if r.get("valid", False)]),
            "failed": len([r for r in results if not r.get("valid", False)]),
            "results": results
        })

    except Exception as e:
        print("BATCH ERROR:", e)
        return jsonify({"error": f"Batch analysis failed: {str(e)}"}), 500


# 📈 Analytics API
@app.route('/analytics', methods=['GET'])
def get_analytics():
    try:
        response = supabase.table("analytics").select("*").eq("id", 1).execute()
        if response.data:
            return jsonify(response.data[0])
        return jsonify({"total_scans": 0, "safe_count": 0, "suspicious_count": 0, "malicious_count": 0})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 📋 Scan History API
@app.route('/history', methods=['GET'])
def get_history():
    try:
        response = supabase.table("url_scans").select("*").order("created_at", desc=True).limit(50).execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ▶️ Run
if __name__ == '__main__':
    app.run(debug=False, use_reloader=False, port=8000, host='127.0.0.1')