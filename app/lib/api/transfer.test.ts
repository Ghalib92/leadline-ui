import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { post, axiosPost } = vi.hoisted(() => ({
  post: vi.fn(),
  axiosPost: vi.fn(),
}));
vi.mock('./client', () => ({ apiClient: { post } }));
vi.mock('axios', () => ({ default: { post: axiosPost } }));

import { downloadFile, uploadFile } from './transfer';

const ticket = {
  url: 'https://leadline-api.test/api/v1/organizations/o1/documents/',
  ticket: 'abc:123',
};

beforeEach(() => {
  post.mockResolvedValue({ data: ticket });
});
afterEach(() => vi.clearAllMocks());

describe('file transfers', () => {
  it('uploads straight to the API with a ticket from our server', async () => {
    axiosPost.mockResolvedValue({ data: { id: 'd1' } });
    const form = new FormData();

    const data = await uploadFile('/organizations/o1/documents', form);

    expect(post).toHaveBeenCalledWith('/transfers/ticket', {
      path: 'organizations/o1/documents',
      method: 'POST',
    });
    expect(axiosPost).toHaveBeenCalledWith(
      ticket.url,
      form,
      expect.objectContaining({
        headers: { Authorization: 'Ticket abc:123' },
      })
    );
    expect(data).toEqual({ id: 'd1' });
  });

  it('downloads from the API with the ticket in the link', async () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        expect(this.href).toBe(`${ticket.url}?ticket=abc%3A123`);
      });

    await downloadFile('/organizations/o1/documents/d1/download');

    expect(post).toHaveBeenCalledWith('/transfers/ticket', {
      path: 'organizations/o1/documents/d1/download',
      method: 'GET',
    });
    expect(click).toHaveBeenCalledOnce();
  });
});
