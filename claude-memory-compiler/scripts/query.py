"""
Query the knowledge base with natural language questions.
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

from utils import list_wiki_articles, read_wiki_index


async def query_knowledge(question: str, file_back: bool = False) -> None:
    from mimo_backend import mimo_query
    
    index = read_wiki_index()
    articles = list_wiki_articles()
    
    article_summaries = []
    for art in articles[:20]:
        content = art.read_text(encoding="utf-8")
        article_summaries.append(f"### {art.stem}\n\n{content[:500]}")
    
    context = "\n\n".join(article_summaries) if article_summaries else "(no articles yet)"
    
    prompt = f"""Answer the following question using the knowledge base below.

## Knowledge Base Index

{index}

## Article Previews

{context}

## Question

{question}

Provide a concise answer with references to specific wiki articles using [[wikilinks]]."""

    response, _ = await mimo_query(prompt=prompt, tools=[], max_turns=2)
    
    print("\n" + "=" * 60)
    print(response)
    print("=" * 60)
    
    if file_back:
        from datetime import datetime, timezone
        from config import DAILY_DIR
        
        today = datetime.now(timezone.utc).astimezone()
        log_path = DAILY_DIR / f"{today.strftime('%Y-%m-%d')}.md"
        
        if not log_path.exists():
            DAILY_DIR.mkdir(parents=True, exist_ok=True)
            log_path.write_text(
                f"# Daily Log: {today.strftime('%Y-%m-%d')}\n\n## Sessions\n\n## Memory Maintenance\n\n",
                encoding="utf-8",
            )
        
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"### Query ({today.strftime('%H:%M')})\n\n**Q:** {question}\n\n**A:** {response}\n\n")
        
        print(f"\nSaved to {log_path}")


def main():
    parser = argparse.ArgumentParser(description="Query the knowledge base")
    parser.add_argument("question", type=str, help="Question to ask")
    parser.add_argument("--file-back", action="store_true", help="Save Q&A to daily log")
    args = parser.parse_args()
    
    asyncio.run(query_knowledge(args.question, args.file_back))


if __name__ == "__main__":
    main()
