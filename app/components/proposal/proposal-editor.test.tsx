import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProposalEditor, normalizeProposalMarkdown } from './proposal-editor';

describe('normalizeProposalMarkdown', () => {
  it('unescapes backslash-escaped TODO and citation markers', () => {
    const raw =
      '## Executive Summary\n\n\\[TODO: outline team background\\]\n\nBased on prior work \\[1\\] and \\[2, 3\\].';
    const normalized = normalizeProposalMarkdown(raw);
    expect(normalized).toBe(
      '## Executive Summary\n\n[TODO: outline team background]\n\nBased on prior work [1] and [2, 3].'
    );
  });

  it('keeps standard markdown intact', () => {
    const raw = '# Title\n\n**bold** and *italic*\n\n- item 1\n- item 2';
    expect(normalizeProposalMarkdown(raw)).toBe(raw);
  });
});

describe('ProposalEditor Component', () => {
  const sampleEvidence = [
    {
      n: 1,
      documentTitle: 'Annual Report 2025',
      location: 'p. 4',
      excerpt: 'We reached 10,000 households with clean water access.',
    },
    {
      n: 2,
      documentTitle: 'Audit Report 2024',
      location: 'Section 3',
      excerpt: 'Unqualified audit opinion for FY2024.',
    },
  ];

  it('renders toolbar actions, purpose prompt, and evidence citation chips', () => {
    render(
      <ProposalEditor
        value="## Section Title\n\nInitial draft content."
        onChange={vi.fn()}
        purpose="Demonstrate organizational capability and past performance."
        evidence={sampleEvidence}
      />
    );

    // Purpose prompt
    expect(
      screen.getByText(
        'Demonstrate organizational capability and past performance.'
      )
    ).toBeInTheDocument();

    // Toolbar buttons
    expect(screen.getByTitle('Heading 2')).toBeInTheDocument();
    expect(screen.getByTitle('Heading 3')).toBeInTheDocument();
    expect(screen.getByTitle(/Bold/)).toBeInTheDocument();
    expect(screen.getByTitle(/Italic/)).toBeInTheDocument();
    expect(screen.getByTitle('Highlight Text')).toBeInTheDocument();
    expect(screen.getByTitle('Bulleted List')).toBeInTheDocument();
    expect(screen.getByTitle('Numbered List')).toBeInTheDocument();
    expect(screen.getByTitle('Blockquote')).toBeInTheDocument();

    // Add [TODO] button
    expect(screen.getByText('Add [TODO]')).toBeInTheDocument();

    // Citation chips
    expect(screen.getByText('[1]')).toBeInTheDocument();
    expect(screen.getByText('[2]')).toBeInTheDocument();

    // Word count info in footer
    expect(screen.getByText(/words/)).toBeInTheDocument();
  });

  it('allows clicking citation chips and Add [TODO] without throwing errors', async () => {
    const onChange = vi.fn();
    render(
      <ProposalEditor
        value="Initial text."
        onChange={onChange}
        evidence={sampleEvidence}
      />
    );

    const todoButton = screen.getByText('Add [TODO]');
    await userEvent.click(todoButton);

    const citationButton = screen.getByText('[1]');
    await userEvent.click(citationButton);
  });
});
