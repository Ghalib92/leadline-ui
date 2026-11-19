import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EMAIL_SEPARATORS, TagInput } from './tag-input';

function Harness({ emails = false }: Readonly<{ emails?: boolean }>) {
  const [tags, setTags] = useState<string[]>([]);
  return (
    <>
      <TagInput
        value={tags}
        onChange={setTags}
        placeholder="Type here"
        separators={emails ? EMAIL_SEPARATORS : undefined}
      />
      <button type="button">Invite</button>
      <output>{tags.join('|')}</output>
    </>
  );
}

describe('TagInput', () => {
  it('keeps what was typed when you click away without pressing Enter', async () => {
    const user = userEvent.setup();
    render(<Harness emails />);
    await user.type(
      screen.getByPlaceholderText('Type here'),
      'amina@acme.co.ke'
    );
    await user.click(screen.getByRole('button', { name: 'Invite' }));
    expect(screen.getByRole('status')).toHaveTextContent('amina@acme.co.ke');
    expect(screen.getByPlaceholderText('Type here')).toHaveValue('');
  });

  it('splits email addresses on spaces, commas and semicolons', async () => {
    const user = userEvent.setup();
    render(<Harness emails />);
    const box = screen.getByPlaceholderText('Type here');
    await user.click(box);
    await user.paste('a@acme.co.ke b@acme.co.ke; c@acme.co.ke');
    expect(screen.getByRole('status')).toHaveTextContent(
      'a@acme.co.ke|b@acme.co.ke|c@acme.co.ke'
    );
    await user.type(box, 'd@acme.co.ke ');
    expect(screen.getByRole('status')).toHaveTextContent('|d@acme.co.ke');
  });

  it('keeps spaces inside ordinary tags, like place names', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(
      screen.getByPlaceholderText('Type here'),
      'Nairobi West, Mombasa{Enter}'
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Nairobi West|Mombasa'
    );
  });
});
