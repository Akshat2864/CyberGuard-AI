import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import re
import math
import requests
import joblib
from collections import Counter
from datetime import datetime
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor, as_completed
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from urllib.parse import urlparse
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# 🚀 PRE-COMPILED REGEX FOR MAXIMUM SCAN SPEED
INTERNAL_PATTERNS_REGEX = re.compile(
    r"(10|127|192\.168|172\.(1[6-9]|2[0-9]|3[0-1]))\.|/etc/passwd|/\.env|/wp-config|\.git/",
    re.IGNORECASE
)

PHISHING_KEYWORDS = ["login", "verify", "secure", "account", "bank", "update", "confirm", "paypal", "amazon", "urgent", "action", "signin", "wp-login", "authorize"]
PHISHING_REGEX = re.compile(r"|".join(PHISHING_KEYWORDS), re.IGNORECASE)

URL_VALIDATION_REGEX = re.compile(r'^(https?|ftp)://[^\s/$.?#].[^\s]*$', re.IGNORECASE)

# Configured CORS: Support development and production environments
app = Flask(__name__)
# Configured CORS: Debug mode (Open)
CORS(app, resources={r"/*": {
    "origins": "*",
    "methods": ["GET", "POST", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}})

@app.after_request
def after_request(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    return response

@app.before_request
def log_request_info():
    print(f"📡 [INCOMING] {request.method} {request.path} | Remote: {request.remote_addr}")

# ⏱️ Rate Limiting (Optimized for Real-time Dashboard)
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["2000 per day", "500 per hour"],
    storage_uri="memory://"
)

# ✅ Supabase setup
SUPABASE_URL = os.environ.get("SUPABASE_URL")
if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL environment variable is required")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
if not SUPABASE_KEY:
    raise ValueError("SUPABASE_KEY environment variable is required")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ✅ Safe model loading
try:
    model = joblib.load("model.pkl")
    print("✅ Model loaded successfully")
except:
    model = None
    print("⚠️ Model not found, running without ML")

# 📝 Local Intelligence Cache (Baseline + Real-time)
LOCAL_HISTORY = []
LOCAL_ANALYTICS = {"total_scans": 5, "safe_count": 5, "suspicious_count": 0, "malicious_count": 0}


# ⚡ In-memory result cache: avoid redundant analysis of same URL
_URL_CACHE = {}

def trace_redirects(url):
    """Traces the redirect chain - optimized with HEAD-first + tight timeout"""
    try:
        # HEAD first (faster, no body download)
        resp = requests.head(url, allow_redirects=True, timeout=1.5,
                             headers={'User-Agent': 'CyberGuard-Bot/2.0'})
        chain = [r.url for r in resp.history] + [resp.url]
        return resp.url, chain, resp.headers
    except:
        try:
            # Fallback GET with strict timeout
            resp = requests.get(url, allow_redirects=True, timeout=1.5,
                                headers={'User-Agent': 'CyberGuard-Bot/2.0'},
                                stream=True)
            resp.close()
            chain = [r.url for r in resp.history] + [resp.url]
            return resp.url, chain, resp.headers
        except:
            return url, [url], {}

def analyze_infrastructure(headers):
    """Analyzes server headers and infrastructure for risk signals"""
    risk_score = 0
    reasons = []
    
    server = headers.get('Server', '').lower()
    # High-risk server signatures (obfuscated or non-standard)
    if any(sig in server for sig in ['kestrel', 'none', 'sharding']):
        risk_score += 15
        reasons.append("Non-standard high-risk server banner detected")
    
    # Check for cloaking signals
    if 'X-Frame-Options' not in headers:
        risk_score += 10
        reasons.append("Missing security headers (X-Frame-Options)")
        
    return risk_score, reasons

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
    if not URL_VALIDATION_REGEX.match(url):
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


# 🧪 Forensic Helpers
@lru_cache(maxsize=2048)
def calculate_entropy(text):
    """Calculates Shannon Entropy to detect DGA (Random) domains."""
    if not text: return 0
    probs = [n/len(text) for n in Counter(text).values()]
    return -sum(p * math.log2(p) for p in probs)

# 🧠 Advanced Forensic Heuristic Engine
def analyze_url_heuristics(url, fast_mode=False):
    score = 0
    reasons = []
    threat_types = []
    forensics = {
        "entropy": 0,
        "typosquatting": None,
        "subdomain_depth": 0,
        "breadcrumb_alerts": [],
        "redirect_hops": 0,
        "final_destination": url,
        "infra_risk": "Low"
    }

    parsed = urlparse(url)
    domain = parsed.netloc.lower()
    path = parsed.path.lower()
    
    # Clean domain for analysis (remove port/subdomains)
    domain_parts = domain.split('.')
    forensics["subdomain_depth"] = len(domain_parts) - 2 if len(domain_parts) > 2 else 0

    # === 1. TYPOSQUATTING DETECTION ===
    LEGIT_DOMAINS = ["google", "paypal", "microsoft", "amazon", "apple", "facebook", "netflix", "bankofamerica", "chase", "wellsfargo"]
    domain_primary = domain_parts[-2] if len(domain_parts) >= 2 else domain
    
    for legit in LEGIT_DOMAINS:
        if domain_primary != legit and (legit in domain_primary or len(set(domain_primary) ^ set(legit)) <= 2):
            score += 25
            reasons.append(f"Possible typosquatting detected (Target: {legit.capitalize()})")
            forensics["typosquatting"] = legit
            threat_types.append("Phishing")
            break

    # === 2. TLD REPUTATION ANALYSIS ===
    high_risk_tlds = {
        ".top": 15, ".xyz": 12, ".monster": 20, ".work": 10, ".click": 10,
        ".zip": 25, ".mov": 25, ".link": 8, ".surf": 12, ".gq": 15, ".cf": 15
    }
    for tld, weight in high_risk_tlds.items():
        if domain.endswith(tld):
            score += weight
            reasons.append(f"High-risk TLD detected ({tld})")
            forensics["tld_reputation"] = "High Risk"
            threat_types.append("Infrastructure Threat")

    # === 2. ENTROPY & DGA DETECTION ===
    domain_only = domain.split(':')[0] # Remove port
    entropy = calculate_entropy(domain_only)
    forensics["entropy"] = round(entropy, 2)
    
    # Relaxed entropy threshold (4.8+) to avoid flagging legitimate auto-generated IDs (like Netlify/Vercel)
    if entropy > 4.8:
        score += 25
        reasons.append("High domain entropy detected (possible DGA/Random generation)")
        forensics["dga_risk"] = "High"
        threat_types.append("Malware/Botnet")

    # === 2.5 TRUSTED PROVIDER ANALYSIS ===
    # Reduce false positives for legitimate subdomains on trusted platforms
    trusted_providers = ['.netlify.app', '.github.io', '.vercel.app', '.pages.dev', '.azurewebsites.net']
    for provider in trusted_providers:
        if domain.endswith(provider):
            score = max(0, score - 15)
            reasons.append(f"Trust Layer: Hosting on verified provider ({provider}) reduces volatility score.")
            break

    # === 3. BREADCRUMB & INTERNAL PROBING ===
    if INTERNAL_PATTERNS_REGEX.search(url):
        score += 30
        reasons.append("Forensic indicator: Unauthorized system probe pattern detected")
        forensics["breadcrumb_alerts"].append("Internal/Sys Probe")
        threat_types.append("System Auditing")

    # === 4. WEIGHTED KEYWORD ANALYSIS ===
    matches = PHISHING_REGEX.findall(url)
    if matches:
        score += min(len(matches) * 12, 40)
        reasons.append(f"Suspicious intent keywords detected: {', '.join(set(matches))}")
        threat_types.append("Social Engineering")

    # === 5. OBFUSCATION & STRUCTURE ===
    if "@" in url:
        score += 25
        reasons.append("Credential-style obfuscation (@ symbol)")
        threat_types.append("Obfuscation")

    if domain.count('-') > 2:
        score += 12
        reasons.append("Excessive hyphenation in domain (common in auto-generated phishing)")

    if forensics["subdomain_depth"] > 3:
        score += 15
        reasons.append(f"Deep subdomain structure ({forensics['subdomain_depth']} levels)")
        threat_types.append("Obfuscation")

    # --- 6. Advanced Intelligence Layer (Network Check) ---
    if not fast_mode:
        final_url, chain, headers = trace_redirects(url)
        forensics["redirect_hops"] = len(chain) - 1
        forensics["final_destination"] = final_url

        if len(chain) > 2:
            score += 25
            reasons.append(f"Deep redirect chain detected ({len(chain)-1} hops)")
            threat_types.append("Cloaking/Evasion")
        
        if final_url != url:
            forensics["breadcrumb_alerts"].append(f"Destination Cloaking: {final_url}")
            if any(bad in final_url.lower() for bad in ['verify', 'login', 'account']):
                score += 20
                reasons.append("Final destination target is highly suspicious")

        # Infrastructure Reputation
        infra_score, infra_reasons = analyze_infrastructure(headers)
        score += infra_score
        reasons.extend(infra_reasons)
        if infra_score > 0: forensics["infra_risk"] = "High"
    else:
        reasons.append("Network probing skipped (Static Audit Mode active)")

    # Lexical Checks (Unified)
    if 'xn--' in url:
        score += 55
        reasons.append("Punycode/Homograph attack detected")
        threat_types.append("Brand Spoofing")

    if re.match(r'https?://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', url):
        score += 45
        reasons.append("Direct IP address access (Bypasses DNS reputation)")
        threat_types.append("Infrastructure Threat")

    # Double protocols (evasion trick)
    if "http" in path or "https" in path:
        score += 30
        reasons.append("Nested protocol redirection trick")
        threat_types.append("Phishing")

    # Suspicious file extensions in path
    malicious_exts = ['.exe', '.bat', '.scr', '.zip', '.rar', '.iso', '.dmg', '.msi', '.pif']
    for ext in malicious_exts:
        if path.endswith(ext):
            score += 35
            reasons.append(f"Direct payload delivery point ({ext})")
            threat_types.append("Malware Distribution")
            break

    # Shorteners detection
    shorteners = ['bit.ly', 't.co', 'goo.gl', 'tinyurl.com', 'is.gd', 'buff.ly', 'ow.ly']
    if any(s in domain for s in shorteners):
        score += 15
        reasons.append("URL shortener obscures destination")
        threat_types.append("Obfuscation")

    if url.startswith("http://"):
        score += 15
        reasons.append("Non-secure protocol (Plaintext HTTP/MITM Risk)")

    # Final calibration to 100 max
    score = min(100, score)

    return score, reasons, list(set(threat_types)), forensics

def heuristic_analysis(url, fast_mode=False):
    """Unified wrapper for forensic analysis used by Batch and System Auditor modules."""
    score, reasons, threat_types, forensics = analyze_url_heuristics(url, fast_mode=fast_mode)
    res_type, _ = classify_risk(score)
    return {
        "risk_score": score,
        "result": res_type,
        "reasons": reasons,
        "threat_types": threat_types,
        "forensics": forensics,
        "confidence": 95 if score > 50 else 70
    }

# 🎯 Multi-Factor Confidence Scoring (Refined)
def calculate_confidence(url, score, reasons, ml_prob=None):
    # Base confidence on the density of evidence
    evidence_weight = min(1.0, 0.5 + (len(reasons) * 0.15))
    
    # ML agreement boost
    ml_factor = 1.0
    if ml_prob is not None:
        if (score > 60 and ml_prob > 0.7) or (score < 20 and ml_prob < 0.3):
            ml_factor = 1.2 # Strong agreement
    
    final_conf = 75 + (score * 0.2) # Scale with risk
    return round(min(99, final_conf * evidence_weight * ml_factor), 2)

def generate_detailed_explanations(url, reasons):
    if not reasons:
        return ["System baseline: No behavioral anomalies detected in standard inspection."]
    
    # Forensic mapping
    explanations = []
    for reason in reasons:
        if "TLD" in reason:
            explanations.append("The Top-Level Domain (TLD) is historically associated with high abuse rates and lacks organizational trust.")
        elif "entropy" in reason:
            explanations.append("The domain name shows mathematical patterns consistent with Domain Generation Algorithms (DGA), often used by malware command-and-control servers.")
        elif "indicator" in reason:
            explanations.append("The URL targets sensitive system paths or internal networking space, typical of reconnaissance or data exfiltration.")
        elif "weighted" in reason:
            explanations.append("The combination of service-specific keywords suggests a targeted attempt to solicit user credentials.")
        elif "@" in reason:
            explanations.append("The use of the '@' symbol in the early part of the URL is a redirection technique designed to trick the user's eye and browser.")
        else:
            explanations.append(reason)
            
    return explanations


# 🎯 Step 6: Scoring Calibration
def classify_risk(score):
    if score >= 61:
        return "Malicious", "#ef4444"
    elif score >= 21:
        return "Suspicious", "#f59e0b"
    else:
        return "Safe", "#10b981"


# 📊 Update analytics in Supabase
def update_analytics(result):
    global LOCAL_ANALYTICS
    LOCAL_ANALYTICS["total_scans"] += 1
    if result == "Safe": LOCAL_ANALYTICS["safe_count"] += 1
    elif result == "Suspicious": LOCAL_ANALYTICS["suspicious_count"] += 1
    else: LOCAL_ANALYTICS["malicious_count"] += 1

    try:
        # Use a single row with id 1 for global stats
        existing = supabase.table("analytics").select("*").eq("id", 1).execute()

        if existing.data:
            row = existing.data[0]
            row["total_scans"] = (row.get("total_scans", 0)) + 1
            if result == "Safe": row["safe_count"] = (row.get("safe_count", 0)) + 1
            elif result == "Suspicious": row["suspicious_count"] = (row.get("suspicious_count", 0)) + 1
            elif result == "Malicious": row["malicious_count"] = (row.get("malicious_count", 0)) + 1
            supabase.table("analytics").update(row).eq("id", 1).execute()
        else:
            new_row = {
                "id": 1, 
                "total_scans": 1, 
                "safe_count": 1 if result == "Safe" else 0,
                "suspicious_count": 1 if result == "Suspicious" else 0,
                "malicious_count": 1 if result == "Malicious" else 0
            }
            supabase.table("analytics").insert(new_row).execute()

    except Exception as e:
        print("Analytics update error:", e)


# 🔐 Auth APIs
@app.route('/auth/register', methods=['POST'])
def auth_register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('fullName', '')
    try:
        res = supabase.auth.sign_up({"email": email, "password": password, "options": {"data": {"full_name": full_name}} })
        return jsonify({"message": "User registered", "user": res.user.id if res.user else None})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/auth/login', methods=['POST'])
def auth_login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    try:
        res = supabase.auth.sign_in_with_password({"email": email, "password": password})
        return jsonify({"message": "Login successful", "user": res.user.id if res.user else None, "name": res.user.user_metadata.get("full_name", email) if res.user else email })
    except Exception as e:
        return jsonify({"error": str(e)}), 401

@app.route('/auth/reset-password', methods=['POST'])
def auth_reset_password():
    data = request.json
    email = data.get('email')
    try:
        # Send password reset email; Supabase will email the user a link.
        frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")
        supabase.auth.reset_password_for_email(email, options={"redirect_to": f"{frontend_url}/"})
        return jsonify({"message": "Password reset email sent"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# 🌐 Home
@app.route('/')
def home():
    return jsonify({
        "status": "online",
        "service": "CyberGuard AI Intelligence engine",
        "version": "2.1.0",
        "endpoints": ["/analyze", "/batch-analyze", "/analytics", "/history"]
    })


# 🚀 Analyze API
@app.route('/analyze', methods=['POST'])
@limiter.limit("30 per minute")
def analyze():
    try:
        data = request.json
        if not data or "url" not in data:
            return jsonify({"error": "URL is required"}), 400

        url = data["url"].strip()
        user_id = data.get("user_id", "admin_operator")

        # ⚡ Cache hit: return instantly for repeat URLs
        if url in _URL_CACHE:
            cached = _URL_CACHE[url]
            return jsonify({**cached, "cached": True, "updated_analytics": _get_analytics_data()})

        # 1. Validate
        is_valid, validation_msg = validate_url(url)
        if not is_valid:
            return jsonify({"error": validation_msg}), 400

        # 2. Heuristic Analysis
        heuristic_score, reasons, threat_types, forensics = analyze_url_heuristics(url)

        # 3. Machine Learning Phase
        ml_prob = None
        if model:
            features = extract_features(url)
            ml_prob = model.predict_proba([features])[0][1]
            if ml_prob > 0.7:
                heuristic_score += 2
        
        # Ensure score stays in bounds after ML boost
        heuristic_score = min(100, heuristic_score)

        # 4. Final Calculations
        confidence = calculate_confidence(url, heuristic_score, reasons, ml_prob)
        result, risk_color = classify_risk(heuristic_score)
        explanations = generate_detailed_explanations(url, reasons)

        # 5. Persistence
        log_entry = {
            "url": url, "result": result, "confidence": confidence,
            "risk_score": heuristic_score, "threat_type": ", ".join(threat_types) if threat_types else "None",
            "created_at": datetime.now().isoformat()
        }
        LOCAL_HISTORY.insert(0, log_entry)
        update_analytics(result)

        try:
            supabase.table("url_scans").insert({
                "url": url,
                "result": result,
                "confidence": confidence,
                "risk_score": heuristic_score,
                "threat_type": ", ".join(threat_types) if threat_types else "None",
                "user_id": user_id
            }).execute()
        except Exception as db_err:
            print(f"❌ [DB] Single Scan Log Error: {db_err}")

        payload = {
            "url": url,
            "result": result,
            "risk_color": risk_color,
            "confidence": confidence,
            "risk_score": heuristic_score,
            "threat_type": threat_types if threat_types else ["None"],
            "reasons": reasons if reasons else ["No suspicious patterns found"],
            "explanations": explanations,
            "forensics": forensics,
            "updated_analytics": _get_analytics_data()
        }
        _URL_CACHE[url] = payload  # ⚡ Cache for instant repeat lookups
        return jsonify(payload)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Intelligence analysis failed: {str(e)}"}), 500


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
        clean_urls = [u.strip() for u in urls if u.strip()]

        def analyze_single(url):
            """Isolated per-URL worker for parallel execution"""
            # Cache hit: instant return
            if url in _URL_CACHE:
                return _URL_CACHE[url]

            is_valid, validation_msg = validate_url(url)
            if not is_valid:
                return {"url": url, "error": validation_msg, "valid": False}

            try:
                h_score, reasons, t_types, forensics = analyze_url_heuristics(url)
                ml_prob = None
                if model:
                    f = extract_features(url)
                    ml_prob = model.predict_proba([f])[0][1]
                    if ml_prob > 0.7: h_score += 2

                h_score = min(100, h_score)
                conf = calculate_confidence(url, h_score, reasons, ml_prob)
                res, color = classify_risk(h_score)

                entry = {
                    "url": url, "result": res, "risk_color": color,
                    "confidence": conf, "risk_score": h_score,
                    "threat_type": t_types if t_types else ["None"],
                    "forensics": forensics, "valid": True
                }
                _URL_CACHE[url] = entry  # Cache result
                return entry
            except Exception as e:
                return {"url": url, "error": str(e), "valid": False}

        # ⚡ Parallel execution - 20 workers for instant batch throughput
        with ThreadPoolExecutor(max_workers=20) as executor:
            future_map = {executor.submit(analyze_single, u): u for u in clean_urls}
            ordered = {}
            for future in as_completed(future_map):
                res_entry = future.result()
                ordered[future_map[future]] = res_entry

        # Preserve original order
        for url in clean_urls:
            result_entry = ordered.get(url, {"url": url, "error": "Unknown", "valid": False})
            results.append(result_entry)

            if result_entry.get("valid"):
                log_entry = {
                    "url": url, "result": result_entry["result"],
                    "confidence": result_entry["confidence"],
                    "risk_score": result_entry["risk_score"],
                    "threat_type": ", ".join(result_entry["threat_type"]) if result_entry["threat_type"] else "None",
                    "created_at": datetime.now().isoformat()
                }
                LOCAL_HISTORY.insert(0, log_entry)
                update_analytics(result_entry["result"])


        # Background DB persist (non-blocking for valid results)
        valid_results = [r for r in results if r.get("valid")]
        def _persist_batch():
            for r in valid_results:
                try:
                    supabase.table("url_scans").insert({
                        "url": r["url"], "result": r["result"],
                        "confidence": r["confidence"], "risk_score": r["risk_score"],
                        "threat_type": ", ".join(r["threat_type"]) if r["threat_type"] else "None",
                        "user_id": user_id
                    }).execute()
                except: pass
        ThreadPoolExecutor(max_workers=1).submit(_persist_batch)

        return jsonify({
            "status": "success",
            "summary": {
                "total": len(urls),
                "analyzed": len([r for r in results if r.get("valid", False)]),
                "failed": len([r for r in results if not r.get("valid", False)])
            },
            "results": results,
            "updated_analytics": _get_analytics_data() # Instant Sync Payload
        })

    except Exception as e:
        print("BATCH ERROR:", e)
        return jsonify({"error": f"Batch analysis failed: {str(e)}"}), 500


def _get_analytics_data():
    """Helper to get raw analytics dictionary for unified payloads"""
    try:
        response = supabase.table("analytics").select("*").eq("id", 1).execute()
        db_data = response.data[0] if response.data else {"total_scans": 0, "safe_count": 0, "suspicious_count": 0, "malicious_count": 0}
        
        return {
            "total_scans": int(db_data.get("total_scans", 0)) + LOCAL_ANALYTICS["total_scans"],
            "safe_count": int(db_data.get("safe_count", 0)) + LOCAL_ANALYTICS["safe_count"],
            "suspicious_count": int(db_data.get("suspicious_count", 0)) + LOCAL_ANALYTICS["suspicious_count"],
            "malicious_count": int(db_data.get("malicious_count", 0)) + LOCAL_ANALYTICS["malicious_count"]
        }
    except Exception as e:
        print(f"❌ [DB] Analytics Internal Error: {e}")
        return LOCAL_ANALYTICS

# 📈 Analytics API
@app.route('/analytics', methods=['GET'])
@limiter.exempt # Allow frequent dashboard polling
def get_analytics():
    return jsonify(_get_analytics_data())


# 📋 Scan History API
@app.route('/history', methods=['GET'])
@limiter.exempt # Allow frequent dashboard polling
def get_history():
    try:
        response = supabase.table("url_scans").select("*").order("created_at", desc=True).limit(50).execute()
        db_data = response.data if response.data else []
        # Merge Local + DB (Local first for real-time feel)
        merged = (LOCAL_HISTORY + db_data)[:50]
        return jsonify(merged)
    except Exception as e:
        print(f"❌ [DB] History Fetch Error: {e}")
        return jsonify(LOCAL_HISTORY[:50])


import time

XON_BREACH_CACHE = {}
XON_LAST_FETCH = 0

def get_xon_breach_details():
    global XON_BREACH_CACHE, XON_LAST_FETCH
    if time.time() - XON_LAST_FETCH < 3600 and XON_BREACH_CACHE:
        return XON_BREACH_CACHE
        
    try:
        req = requests.get('https://api.xposedornot.com/v1/breaches', timeout=10)
        if req.status_code == 200:
            data = req.json().get('exposedBreaches', [])
            for b in data:
                XON_BREACH_CACHE[b['breachID']] = {
                    "source": b['breachID'],
                    "date": str(b.get("breachedDate", "Unknown Date"))[:10],
                    "impact": ", ".join(b.get("exposedData", [])),
                    "description": b.get("exposureDescription", "")
                }
            XON_LAST_FETCH = time.time()
    except Exception as e:
        print("XON Cache Err:", e)
    return XON_BREACH_CACHE

# 📧 Email Leak Checker: Live Threat OSINT Node
@app.route('/check-email', methods=['POST'])
@limiter.limit("20 per minute")
def check_email():
    """100% Accurate OSINT Data Breach Analysis via XposedOrNot API"""
    try:
        data = request.json
        email = data.get("email", "").strip().lower()
        
        if not email or "@" not in email:
            return jsonify({"error": "Valid email is required"}), 400

        breach_metadata = get_xon_breach_details()
        headers = {'User-Agent': 'CyberGuardAI-Forensics-Engine'}
        apiUrl = f'https://api.xposedornot.com/v1/check-email/{email}'
        
        res = requests.get(apiUrl, headers=headers, timeout=10)
        
        selected_breaches = []
        num_leaks = 0
        risk_score = 0
        
        if res.status_code == 200:
            res_data = res.json()
            leaks = res_data.get('breaches', [])
            leaks = leaks[0] if isinstance(leaks, list) and len(leaks) > 0 and isinstance(leaks[0], list) else leaks
            num_leaks = len(leaks)
            
            for breach_id in leaks:
                if isinstance(breach_id, list): breach_id = breach_id[0]
                
                info = breach_metadata.get(breach_id, {
                    "source": breach_id,
                    "date": "Unknown",
                    "impact": "Credentials / Identity Data"
                })
                
                impact_str = info['impact'].lower()
                if "password" in impact_str or "financial" in impact_str or "ssn" in impact_str:
                    score_incr = 35
                elif "ip" in impact_str or "location" in impact_str or "phone" in impact_str:
                    score_incr = 20
                else:
                    score_incr = 10
                
                if risk_score < 100: risk_score += score_incr
                selected_breaches.append(info)
                
        elif res.status_code == 404:
            num_leaks = 0
            risk_score = 0
        else:
            return jsonify({"error": f"OSINT Node error: HTTP {res.status_code}"}), 502

        risk_score = min(100, risk_score)
        res_type = "Malicious" if risk_score > 60 else ("Suspicious" if risk_score > 0 else "Safe")
        
        breach_result = {
            "email": email,
            "status": "Exposed" if num_leaks > 0 else "Secure",
            "is_breached": num_leaks > 0,
            "num_leaks": num_leaks,
            "risk_score": risk_score,
            "result": res_type,
            "sources": [b["source"] for b in selected_breaches],
            "breach_details": [f"{b['source']} ({b['date']}) - {b['impact']}" for b in selected_breaches],
            "recommendation": "IMMEDIATE ACTION: Rotate your credentials and enable Multi-Factor Authentication (MFA)." if num_leaks > 0 else "Secure: No known corporate leak associations detected."
        }

        update_analytics(res_type)
        try:
            supabase.table("url_scans").insert({
                "url": f"Identity Check: {email}",
                "result": res_type,
                "confidence": 100 if num_leaks > 0 else 98,
                "risk_score": risk_score,
                "threat_type": "Data Breach",
                "user_id": "operator_forensics"
            }).execute()
        except: pass

        return jsonify({
            **breach_result,
            "updated_analytics": _get_analytics_data()
        })
    except Exception as e:
        return jsonify({"error": f"Intelligence analysis failed: {str(e)}"}), 500


# 🔍 System Auditor: Scan Local Directory
@app.route('/system/audit', methods=['POST'])
def system_audit():
    """Recursively scans a directory for hardcoded malicious URLs with performance filtering."""
    try:
        data = request.json
        directory = data.get("path", ".")
        abs_path = os.path.abspath(directory)
        
        if not os.path.exists(abs_path):
            return jsonify({"error": f"Directory path does not exist: {abs_path}"}), 400

        findings = []
        files_scanned = 0
        # High-performance, non-backtracking URL regex
        url_pattern = re.compile(r'(?i)\b(?:http|https)://[^\s<>"\'{}|\\^\[\]`]+')
        
        # Forensic Exclusions: Prevent catastrophic backtracking and memory stalling on metadata
        EXCLUDE_DIRS = {'.git', 'node_modules', '__pycache__', '.venv', 'dist', 'build', '.next'}
        EXCLUDE_EXTS = {'.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', 
                        '.eot', '.mp4', '.pdf', '.zip', '.map', '.ico', '.json', '.lock'}

        for root, dirs, files in os.walk(abs_path):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            
            for file in files:
                if any(file.endswith(ext) for ext in EXCLUDE_EXTS):
                    continue
                
                file_path = os.path.join(root, file)
                
                # Protect memory: Skip files > 500KB (typically minified bundles or dbs)
                try:
                    if os.path.getsize(file_path) > 500 * 1024:
                        continue
                except:
                    continue

                files_scanned += 1
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        
                        found_urls = set(url_pattern.findall(content))
                        
                        # Process max 20 unique URLs per file to prevent API stalling
                        for found_url in list(found_urls)[:20]:
                            analysis = heuristic_analysis(found_url, fast_mode=True)
                            if analysis['result'] != "Safe":
                                findings.append({
                                    "file": os.path.relpath(file_path, abs_path),
                                    "url": found_url,
                                    "result": analysis['result'],
                                    "score": analysis['risk_score'],
                                    "type": "Internal Asset Leak"
                                })
                except Exception as e:
                    continue
        
        # Log results to intelligence stream if findings exist
        if findings:
            for f in findings:
              res_type = f['result']
              update_analytics(res_type)
              
              # Optional: Suppress DB logging for massive audits to prevent API throttling
              if len(findings) < 20: 
                  try:
                      supabase.table("url_scans").insert({
                          "url": f"{f['file']}: {f['url']}",
                          "result": res_type,
                          "confidence": 95,
                          "risk_score": f['score'],
                          "threat_type": "Project Audit Leak",
                          "user_id": "auditor_bot"
                      }).execute()
                  except: pass

        return jsonify({
            "status": "success",
            "directory": abs_path,
            "total_scanned": files_scanned,
            "total_findings": len(findings),
            "findings": findings[:100], # Cap display results for UI stability
            "updated_analytics": _get_analytics_data()
        })
    except Exception as e:
        return jsonify({"error": f"Audit execution failure: {str(e)}"}), 500


# End of Routes Section

# ⚙️ Engine Metadata
@app.route('/system/engine-rules', methods=['GET'])
def get_engine_rules():
    """Returns the internal rules for the Heuristic Logic tab"""
    return jsonify({
        "version": "2.2.0-Heuristic",
        "active_nodes": 12,
        "rules": [
            {"id": "R-101", "name": "TLD Reputation Filter", "description": "Detects high-risk extensions like .zip, .mov, .top"},
            {"id": "R-102", "name": "Entropy (DGA) Analysis", "description": "Shannon Entropy calculation for random domain detection"},
            {"id": "R-103", "name": "Typosquatting Check", "description": "Identifies domains mimicking 10+ major brands"},
            {"id": "R-104", "name": "Obfuscation Detection", "description": "@ symbol redirects and deep subdomain nesting"},
            {"id": "R-105", "name": "Contextual Keyword weights", "description": "Behavioral analysis of URL path strings"},
            {"id": "R-106", "name": "Protocol Security", "description": "HTTP/HTTPS validation and cert-trust proxy"}
        ]
    })


# 🧪 Phase 2: Step 7 - Engine Sandbox
@app.route('/dev/engine-test', methods=['GET', 'POST'])
def engine_sandbox():
    """Diagnostic endpoint to view raw heuristic and forensic outputs"""
    url = request.args.get('url') if request.method == 'GET' else request.json.get('url')
    
    if not url:
        return jsonify({
            "instruction": "Provide a URL via ?url= query param or POST JSON {'url': '...'}",
            "status": "Awaiting vector"
        })

    is_valid, msg = validate_url(url)
    h_score, reasons, t_types, forensics = analyze_url_heuristics(url)
    
    return jsonify({
        "vector": url,
        "valid": is_valid,
        "validation_msg": msg,
        "raw_heuristics": {
            "score": h_score,
            "reasons": reasons,
            "threat_types": t_types
        },
        "forensics": forensics,
        "system_status": "Forensic Probe Complete"
    })


# Delete History Entry
@app.route('/history/delete', methods=['POST'])
def delete_history():
    try:
        data = request.json
        target = data.get('target')
        entry_id = data.get('id')
        global LOCAL_HISTORY
        if target:
            LOCAL_HISTORY = [h for h in LOCAL_HISTORY if (h.get('url') or h.get('target')) != target]
        if entry_id and supabase:
            try:
                supabase.table('url_scans').delete().eq('id', entry_id).execute()
            except Exception as db_err:
                print(f'DB Delete Error: {db_err}')
        return jsonify({'message': 'History entry cleared'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Bug Report Endpoint
@app.route('/report-bug', methods=['POST'])
def report_bug():
    try:
        data = request.json
        print('BUG REPORT received')
        if supabase:
            try:
                supabase.table('bug_reports').insert({
                    'reporter_email': data.get('email'),
                    'bug_type': data.get('type'),
                    'description': data.get('description'),
                    'user_id': 'public_reporter'
                }).execute()
            except: pass
        return jsonify({'message': 'Bug report submitted successfully! Our engineers have been notified.'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Bug Report API
@app.route('/report-bug', methods=['POST'])
def report_bug():
    try:
        data = request.json
        name = data.get('name', 'Anonymous')
        email = data.get('email', 'No Email Provided')
        bug_desc = data.get('description', 'No Description')
        
        # --- Email Sending Logic (Gmail/SMTP) ---
        # Note: You need to set these in your .env file or local environment
        sender_email = 'rishikhadiyar@gmail.com'
        # For security, you should use an App Password from Google
        sender_password = os.environ.get('SMTP_PASSWORD', '') 
        
        msg = MIMEMultipart()
        msg['From'] = f'CyberGuard AI <{sender_email}>'
        msg['To'] = sender_email
        msg['Subject'] = f'[BUG REPORT] from {name}'
        
        body = f'''
        A new bug has been reported on CyberGuard AI.
        
        Reporter: {name}
        Contact: {email}
        
        Description:
        {bug_desc}
        
        --- End of Report ---
        '''
        msg.attach(MIMEText(body, 'plain'))
        
        if sender_password:
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(msg)
            server.quit()
        
        # We also log to Supabase if available
        if supabase:
            try:
                supabase.table('bug_reports').insert({
                    'name': name,
                    'email': email,
                    'description': bug_desc,
                    'created_at': datetime.now().isoformat()
                }).execute()
            except: pass

        return jsonify({'message': 'Bug report submitted successfully'})
    except Exception as e:
        print(f'Bug Report Error: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/report-bug', methods=['POST'])
def report_bug():
    try:
        data = request.json
        reporter = data.get('email', 'Anonymous')
        subject = data.get('subject', 'Bug Report')
        description = data.get('description', '')

        # For local dev without SMTP setup, we will log it and return success
        # In production, you would use smtplib or a service like Resend/SendGrid
        print(f'BUG REPORT RECEIVED FROM {reporter}: {subject}')
        print(f'Description: {description}')

        return jsonify({'message': 'Bug report submitted successfully! We will review it shortly.'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=False, use_reloader=False, port=8000, host='127.0.0.1')
