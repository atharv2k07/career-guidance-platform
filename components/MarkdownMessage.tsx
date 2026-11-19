/**
 * MarkdownMessage — lightweight markdown renderer for mentor chat replies.
 *
 * Supported syntax:
 *   ## Heading 2 / ### Heading 3
 *   **bold**  *italic*  `inline code`
 *   - bullet list items (leading -, *, or •)
 *   Blank lines → paragraph breaks
 */

import React from "react";

// ---------------------------------------------------------------------------
// Inline parser  (bold / italic / code inside a single line)
// ---------------------------------------------------------------------------
function parseInline(text: string): React.ReactNode[] {
  // Pattern order matters: code > bold+italic > bold > italic
  const pattern = /(`[^`]+`)|(\*\*\*(.+?)\*\*\*)|(\*\*(.+?)\*\*)|(\*(.+?)\*)|(_(.+?)_)/g;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));

    if (match[1]) {
      // `code`
      nodes.push(
        <code key={match.index} className="rounded bg-slate-200 px-1 py-0.5 font-mono text-[0.8em] text-slate-800">
          {match[1].slice(1, -1)}
        </code>
      );
    } else if (match[2]) {
      // ***bold+italic***
      nodes.push(<strong key={match.index}><em>{parseInline(match[3])}</em></strong>);
    } else if (match[4]) {
      // **bold**
      nodes.push(<strong key={match.index}>{parseInline(match[5])}</strong>);
    } else if (match[6]) {
      // *italic*
      nodes.push(<em key={match.index}>{parseInline(match[7])}</em>);
    } else if (match[8]) {
      // _italic_
      nodes.push(<em key={match.index}>{parseInline(match[9])}</em>);
    }

    last = pattern.lastIndex;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

// ---------------------------------------------------------------------------
// Block parser
// ---------------------------------------------------------------------------
type Block =
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "p"; text: string };

function parseBlocks(raw: string): Block[] {
  const lines = raw.split("\n");
  const blocks: Block[] = [];
  let listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length) {
      blocks.push({ kind: "ul", items: [...listBuffer] });
      listBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Blank line → flush list, then skip
    if (!trimmed) {
      flushList();
      continue;
    }

    // ## Heading 2
    if (/^#{2}\s/.test(trimmed)) {
      flushList();
      blocks.push({ kind: "h2", text: trimmed.replace(/^#+\s*/, "") });
      continue;
    }

    // ### Heading 3
    if (/^#{3}\s/.test(trimmed)) {
      flushList();
      blocks.push({ kind: "h3", text: trimmed.replace(/^#+\s*/, "") });
      continue;
    }

    // Bullet item: -, *, or •
    if (/^[-*•]\s/.test(trimmed)) {
      listBuffer.push(trimmed.replace(/^[-*•]\s*/, ""));
      continue;
    }

    // Plain paragraph
    flushList();
    blocks.push({ kind: "p", text: trimmed });
  }

  flushList();
  return blocks;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface Props {
  content: string;
  className?: string;
}

export default function MarkdownMessage({ content, className = "" }: Props) {
  const blocks = parseBlocks(content);

  return (
    <div className={`space-y-2 ${className}`}>
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "h2":
            return (
              <p key={i} className="font-bold text-base mt-3 first:mt-0">
                {parseInline(block.text)}
              </p>
            );
          case "h3":
            return (
              <p key={i} className="font-semibold text-sm mt-2 first:mt-0">
                {parseInline(block.text)}
              </p>
            );
          case "ul":
            return (
              <ul key={i} className="space-y-1 pl-1">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="mt-[3px] h-[6px] w-[6px] shrink-0 rounded-full bg-indigo-400" />
                    <span>{parseInline(item)}</span>
                  </li>
                ))}
              </ul>
            );
          case "p":
            return (
              <p key={i}>
                {parseInline(block.text)}
              </p>
            );
        }
      })}
    </div>
  );
}
