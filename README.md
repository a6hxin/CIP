# 🧠 Codebase Intelligence Platform

A comprehensive platform for deep codebase analysis — featuring complexity metrics, dependency scanning, commit timeline visualization, and AI-powered architectural insights.

---

## ✨ Features

- **Complexity Analysis** — Cyclomatic complexity, hotspot detection, and code health scoring
- **Dependency Scanning** — NPM package analysis, vulnerability detection, and dependency graphs
- **Commit Timeline** — Visual history of changes, contributor activity, and churn analysis
- **Architecture Visualization** — Auto-generated dependency graphs and module relationship maps
- **AI Insights** — LLM-powered code quality recommendations and refactoring suggestions

---

## 🗂 Project Structure

```
codebase-intelligence-platform/
├── frontend/               # Vanilla JS frontend
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── components/         # UI components
├── backend/                # Node.js/Express API server
│   ├── server.js
│   ├── routes/             # API route handlers
│   ├── services/           # Core business logic
│   └── utils/              # Helpers and utilities
├── analyzers/              # Analysis modules
│   ├── git-analyzer/       # Git history processing
│   ├── dependency-analyzer/ # Package dependency analysis
│   └── complexity-analyzer/ # Code complexity metrics
├── ai-engine/              # Python AI/ML layer
│   ├── insight_generator.py
│   └── prompts/
├── data/                   # Analysis output storage
├── tests/                  # Test suites
└── scripts/                # Setup and utility scripts
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- Python >= 3.9
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/codebase-intelligence-platform.git
cd codebase-intelligence-platform

# Run automated setup
bash scripts/setup.sh

# Or manually:
npm install
pip install -r requirements.txt
```

### Configuration

Create a `.env` file in the root:

```env
PORT=3000
GITHUB_TOKEN=your_github_token_here
OPENAI_API_KEY=your_openai_key_here   # optional, for AI insights
NODE_ENV=development
```

### Run

```bash
# Start backend server
npm start

# Development mode with auto-reload
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/repo/clone` | Clone and register a repository |
| GET | `/api/repo/:id/info` | Get repository metadata |
| GET | `/api/analysis/complexity/:id` | Run complexity analysis |
| GET | `/api/analysis/architecture/:id` | Generate architecture map |
| GET | `/api/commits/:id/timeline` | Fetch commit timeline |
| GET | `/api/dependencies/:id/scan` | Scan dependencies |
| GET | `/api/dependencies/:id/vulnerabilities` | Check for vulnerabilities |

---

## 🧪 Tests

```bash
npm test
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT
