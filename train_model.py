import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

# 🔍 Feature extraction
def extract_features(url):
    return [
        len(url),
        1 if "login" in url else 0,
        1 if "@" in url else 0,
        1 if url.startswith("https") else 0,
        url.count('.')
    ]

# 📂 Load dataset
df = pd.read_csv("phishing_site_urls.csv")

# ✅ FIX COLUMN NAMES (VERY IMPORTANT)
df.columns = df.columns.str.strip().str.lower()

print("Columns after fix:", df.columns)

# Now columns become: ['url', 'label']

# ✅ Convert label (bad/good → 1/0)
df["label"] = df["label"].map({
    "bad": 1,
    "good": 0
})

# 🔍 Extract features from URL
df["features"] = df["url"].apply(extract_features)

X = pd.DataFrame(df["features"].tolist(),
                 columns=["length", "has_login", "has_at", "https", "dots"])

y = df["label"]

# ✂️ Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 🤖 Train model
model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)

# 📊 Accuracy
accuracy = model.score(X_test, y_test)
print(f"Accuracy: {accuracy * 100:.2f}%")

# 💾 Save model
joblib.dump(model, "model.pkl")

print("✅ model.pkl created successfully!")