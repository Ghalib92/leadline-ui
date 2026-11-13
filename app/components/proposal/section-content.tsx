import type { ReactNode } from 'react';
import type { ProposalSection } from '~/lib/schema';

/**
 * A proposal section's Markdown as React elements (no HTML injection): headings,
 * bullet and numbered lists, paragraphs, **bold**, citations `[n]` linked to the
 * evidence, and `[TODO: …]` markers highlighted for the team to fill in.
 */
export function SectionContent({
  section,
}: Readonly<{ section: ProposalSection }>) {
  const blocks = section.content.split(/\n{2,}/);
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {blocks.map((block, index) => (
        <Block key={index} block={block.trim()} section={section} />
      ))}
    </div>
  );
}

function Block({
  block,
  section,
}: Readonly<{ block: string; section: ProposalSection }>) {
  if (!block) return null;
  const heading = /^(#{1,4})\s+(.*)$/.exec(block);
  if (heading && !block.includes('\n')) {
    return <p className="pt-1 font-semibold">{inline(heading[2], section)}</p>;
  }
  const lines = block.split('\n');
  if (lines.every((line) => /^\s*([-*]|\d+[.)])\s+/.test(line))) {
    const ordered = /^\s*\d/.test(lines[0]);
    const items = lines.map((line) =>
      line.replace(/^\s*([-*]|\d+[.)])\s+/, '')
    );
    const List = ordered ? 'ol' : 'ul';
    return (
      <List
        className={
          ordered ? 'list-decimal space-y-1 pl-5' : 'list-disc space-y-1 pl-5'
        }
      >
        {items.map((item, i) => (
          <li key={i}>{inline(item, section)}</li>
        ))}
      </List>
    );
  }
  return <p>{inline(lines.join(' '), section)}</p>;
}

const TOKEN = /(\[TODO[^\]]*\]|\[\d+(?:\s*,\s*\d+)*\]|\*\*[^*]+\*\*)/g;

function inline(text: string, section: ProposalSection): ReactNode[] {
  return text.split(TOKEN).map((part, i) => {
    if (part.startsWith('[TODO')) {
      return (
        <mark
          key={i}
          className="rounded bg-amber-200/70 px-1 text-amber-950 dark:bg-amber-500/30 dark:text-amber-100"
        >
          {part}
        </mark>
      );
    }
    if (/^\[\d/.test(part)) {
      const numbers = part
        .slice(1, -1)
        .split(',')
        .map((n) => Number(n));
      const titles = numbers
        .map((n) => section.evidence.find((e) => e.n === n))
        .filter(Boolean)
        .map(
          (e) => `[${e?.n}] ${e?.documentTitle}: ${e?.excerpt.slice(0, 200)}`
        )
        .join('\n\n');
      return (
        <sup
          key={i}
          title={titles || 'Source'}
          className="cursor-help font-medium text-primary"
        >
          {part}
        </sup>
      );
    }
    if (part.startsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
