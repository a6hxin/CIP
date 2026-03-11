#!/usr/bin/env python3
"""
ai-engine/insight_generator.py
Generates AI-powered code quality insights using LLM APIs.
Reads complexity/dependency reports and outputs actionable recommendations.
"""

import json
import os
import sys
import argparse
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Optional LLM client — falls back to rule-based insights if not configured
try:
    import openai
    client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    LLM_AVAILABLE = bool(os.environ.get("OPENAI_API_KEY"))
except ImportError:
    LLM_AVAILABLE = False

DATA_DIR = Path(__file__).parent.parent / "data"
PROMPT_PATH = Path(__file__).parent / "prompts" / "code_insight_prompt.txt"


def load_report(report_type: str, repo_id: str) -> dict:
    """Load a JSON report for a given repo."""
    report_path = DATA_DIR / f"{report_type}_reports" / f"{repo_id}.json"
    if not report_path.exists():
        return {}
    with open(report_path) as f:
        return json.load(f)


def load_prompt_template() -> str:
    if PROMPT_PATH.exists():
        return PROMPT_PATH.read_text()
    return (
        "You are a senior software engineer reviewing a codebase.\n"
        "Analyze the following metrics and provide 3-5 concise, actionable insights.\n"
        "Focus on: refactoring opportunities, dependency risks, and architectural concerns.\n"
        "Data:\n{data}\n\nInsights (JSON array of strings):"
    )


def generate_llm_insights(metrics: dict) -> list[str]:
    """Call LLM API with metrics data and return insights list."""
    template = load_prompt_template()
    prompt = template.replace("{data}", json.dumps(metrics, indent=2))

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=600,
        temperature=0.3,
    )
    raw = response.choices[0].message.content.strip()

    # Parse JSON array from response
    try:
        start = raw.index("[")
        end = raw.rindex("]") + 1
        return json.loads(raw[start:end])
    except (ValueError, json.JSONDecodeError):
        return [raw]


def generate_rule_based_insights(complexity_report: dict, dep_report: dict) -> list[str]:
    """Generate deterministic insights without an LLM."""
    insights = []

    files = complexity_report.get("files", [])
    if files:
        avg_cc = sum(f.get("complexity", 1) for f in files) / len(files)
        high_cc = [f for f in files if f.get("complexity", 0) > 20]

        if avg_cc > 10:
            insights.append(
                f"⚠️ Average cyclomatic complexity is {avg_cc:.1f}. "
                "Consider breaking large functions into smaller units with a single responsibility."
            )
        if high_cc:
            names = ", ".join(f["name"].split("/")[-1] for f in high_cc[:3])
            insights.append(
                f"🔥 {len(high_cc)} files exceed complexity 20 (e.g. {names}). "
                "These are prime candidates for refactoring."
            )
        if len(files) > 100:
            insights.append(
                f"📦 Large codebase ({len(files)} files scanned). "
                "Enforce clear module boundaries and use barrel exports to manage dependencies."
            )

    deps = dep_report.get("dependencies", [])
    vulns = dep_report.get("vulnerabilities", 0)
    if vulns:
        insights.append(
            f"🚨 {vulns} known vulnerabilities detected. Run `npm audit fix` to resolve patched issues."
        )
    if len(deps) > 50:
        insights.append(
            f"📚 {len(deps)} dependencies found. Audit for unused packages with `depcheck`."
        )

    if not insights:
        insights.append("✅ Codebase metrics look healthy! Maintain low complexity and regular dependency audits.")

    return insights


def generate_insights(repo_id: str) -> dict:
    """Main entry point — generate and return insights for a repo."""
    complexity_report = load_report("complexity", repo_id)
    dep_report = load_report("dependency", repo_id)

    combined_metrics = {
        "totalFiles": len(complexity_report.get("files", [])),
        "avgComplexity": (
            sum(f.get("complexity", 1) for f in complexity_report.get("files", []))
            / max(len(complexity_report.get("files", [])), 1)
        ),
        "highComplexityFiles": sum(
            1 for f in complexity_report.get("files", []) if f.get("complexity", 0) > 20
        ),
        "totalDependencies": len(dep_report.get("dependencies", [])),
        "vulnerabilities": dep_report.get("vulnerabilities", 0),
    }

    if LLM_AVAILABLE:
        try:
            insights = generate_llm_insights(combined_metrics)
        except Exception as e:
            print(f"[InsightGenerator] LLM error, falling back: {e}", file=sys.stderr)
            insights = generate_rule_based_insights(complexity_report, dep_report)
    else:
        insights = generate_rule_based_insights(complexity_report, dep_report)

    return {
        "repoId": repo_id,
        "metrics": combined_metrics,
        "insights": insights,
        "generatedAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "llmUsed": LLM_AVAILABLE,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate AI insights for a repository")
    parser.add_argument("repo_id", help="Repository ID (UUID)")
    parser.add_argument("--output", help="Write JSON output to file")
    args = parser.parse_args()

    result = generate_insights(args.repo_id)

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w") as f:
            json.dump(result, f, indent=2)
        print(f"Insights written to {args.output}")
    else:
        print(json.dumps(result, indent=2))
