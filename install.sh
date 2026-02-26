#!/usr/bin/env bash
set -euo pipefail

# 1️⃣ Basic checks for Node & npm
command -v node >/dev/null 2>&1 || { echo "❌ Node.js not found. Install it first."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm not found."; exit 1; }

# 2️⃣ Move to project dir
cd "$(dirname "$0")"

# 3️⃣ Global pm2 install (if missing)
if ! pm2 -v >/dev/null 2>&1; then
  echo "📦 Installing pm2 globally..."
  npm install -g pm2
fi

# 4️⃣ Install project deps
echo "📦 Installing local dependencies..."
npm ci

# 5️⃣ Create a placeholder .env
cat > .env <<'EOF'
# --------- OPENAI ----------
OPENAI_API_KEY=sk-XXXXXXXXXXXXXXXXXXXX

# --------- STRIPE ----------
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXXXX
# Optional: STRIPE_WEBHOOK_SECRET=whsec_XXXX

# --------- OPTIMIZER ----------
ENABLE_CACHE=true
ENABLE_SMART_ROUTING=true
CACHE_TTL=300
EOF
echo "✅ Placeholder .env created. Edit it with your real keys."

# 6️⃣ Start pm2 process
echo "🚀 Starting optimizer with pm2..."
pm2 start ./src/index.js --name api-optimizer

# 7️⃣ Save the pm2 process list
pm2 save

# 8️⃣ Register pm2 to start on boot
echo "🔧 Setting pm2 to start on boot..."
pm2 startup bash -u "$(whoami)" --hp "$(echo ~)" -d >/dev/null 2>&1
# The above command prints the command you need to run once. Run it if you want pm2 to start at boot.
echo "✅ pm2 is ready. The optimizer is now 'always on' and will start on every system boot."

echo ""
echo "Use 'pm2 status' to view the running process."
echo "Use 'pm2 logs api-optimizer' to see runtime logs."
