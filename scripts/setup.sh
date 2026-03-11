#!/usr/bin/env bash
# scripts/setup.sh — One-shot development environment setup

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[setup]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC}  $1"; }
err()  { echo -e "${RED}[error]${NC} $1"; exit 1; }

# ─── Check prerequisites ───────────────────────────────────────────────────────
log "Checking prerequisites..."

command -v node >/dev/null 2>&1 || err "Node.js is required. Install from https://nodejs.org"
command -v python3 >/dev/null 2>&1 || err "Python 3 is required."
command -v git >/dev/null 2>&1 || err "Git is required."

NODE_VERSION=$(node -e "process.stdout.write(process.version.slice(1).split('.')[0])")
if [ "$NODE_VERSION" -lt 18 ]; then
  err "Node.js >= 18 is required (found v${NODE_VERSION})"
fi

log "Node.js $(node --version) ✓"
log "Python $(python3 --version) ✓"

# ─── Install Node dependencies ─────────────────────────────────────────────────
log "Installing Node.js dependencies..."
npm install

# ─── Install Python dependencies ──────────────────────────────────────────────
log "Installing Python dependencies..."
if command -v pip3 >/dev/null 2>&1; then
  pip3 install -r requirements.txt --quiet
else
  warn "pip3 not found — skipping Python dependency installation"
fi

# ─── Create data directories ───────────────────────────────────────────────────
log "Creating data directories..."
mkdir -p data/repos data/dependency_reports data/complexity_reports diagrams

# Keep directories in git
touch data/repos/.gitkeep
touch data/dependency_reports/.gitkeep
touch data/complexity_reports/.gitkeep
touch diagrams/.gitkeep

# ─── Create .env if missing ────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  log "Creating .env from template..."
  cat > .env <<EOF
PORT=3000
NODE_ENV=development
GITHUB_TOKEN=
OPENAI_API_KEY=
ALLOWED_ORIGINS=*
EOF
  warn "Edit .env and add your API keys."
fi

# ─── Done ──────────────────────────────────────────────────────────────────────
echo ""
log "Setup complete! 🧠"
echo ""
echo "  Start the server:   npm start"
echo "  Development mode:   npm run dev"
echo "  Run tests:          npm test"
echo "  Open browser:       http://localhost:3000"
echo ""
