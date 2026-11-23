import { beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadFile } from '~/lib/api/backend';
import { downloadApplication } from '.';

vi.mock('~/lib/api/backend', async (original) => ({
  ...(await original<typeof import('~/lib/api/backend')>()),
  downloadFile: vi.fn().mockResolvedValue(undefined),
}));

describe('downloadApplication', () => {
  beforeEach(() => vi.mocked(downloadFile).mockClear());

  it('downloads the CV and the cover letter as two files', async () => {
    await downloadApplication('org-1', 'opp-1', 'pdf');
    const calls = vi.mocked(downloadFile).mock.calls;
    expect(calls.map(([, name, params]) => [name, params])).toEqual([
      ['cv.pdf', { format: 'pdf', part: 'cv' }],
      ['cover-letter.pdf', { format: 'pdf', part: 'letter' }],
    ]);
    expect(calls[0][0]).toMatch(/opp-1\/application\/export$/);
  });

  it('downloads only the parts there are, in Word too', async () => {
    await downloadApplication('org-1', 'opp-1', 'docx', ['letter']);
    expect(vi.mocked(downloadFile).mock.calls).toHaveLength(1);
    expect(vi.mocked(downloadFile).mock.calls[0][2]).toEqual({
      format: 'docx',
      part: 'letter',
    });
  });
});
