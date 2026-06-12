"""
Lint the knowledge base for structural integrity.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from utils import list_wiki_articles, read_wiki_index


def lint_article(path: Path) -> list[str]:
    errors = []
    content = path.read_text(encoding="utf-8")
    
    if not content.startswith("---"):
        errors.append(f"{path.name}: Missing YAML frontmatter")
    
    if "# " not in content:
        errors.append(f"{path.name}: Missing heading")
    
    return errors


def check_index() -> list[str]:
    errors = []
    index = read_wiki_index()
    articles = list_wiki_articles()
    
    for art in articles:
        rel = str(art.relative_to(art.parent.parent))
        if rel not in index:
            errors.append(f"Article {rel} not in index")
    
    return errors


def main():
    parser = argparse.ArgumentParser(description="Lint the knowledge base")
    parser.add_argument("--structural-only", action="store_true", help="Skip LLM checks")
    args = parser.parse_args()
    
    errors = []
    
    for art in list_wiki_articles():
        errors.extend(lint_article(art))
    
    errors.extend(check_index())
    
    if errors:
        print("Lint errors found:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print("Knowledge base looks good.")


if __name__ == "__main__":
    main()
