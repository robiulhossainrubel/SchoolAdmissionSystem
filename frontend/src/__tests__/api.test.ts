import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, ApiError } from '../services/api';

describe('api service client', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('sends GET /classes request with Accept header', async () => {
    const mockOfferings = [{ id: '1', name: 'Class 1', totalSeats: 10, heldSeats: 0, confirmedSeats: 0, availableSeats: 10 }];
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockOfferings),
    } as unknown as Response);

    const result = await api.getClasses();
    expect(result).toEqual(mockOfferings);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/classes'),
      expect.objectContaining({
        headers: expect.any(Headers),
      })
    );
  });

  it('includes X-Student-Id header when studentId is supplied to createHold', async () => {
    const mockHold = { holdId: 'h-1', classId: 'c-1', studentId: '20061234567890123', status: 'HELD', expiresAt: '2026-11-09T00:10:00Z' };
    let capturedHeaders: Headers | undefined;

    globalThis.fetch = vi.fn().mockImplementation((_url, init) => {
      capturedHeaders = init?.headers as Headers;
      return Promise.resolve({
        ok: true,
        status: 201,
        text: async () => JSON.stringify(mockHold),
      } as unknown as Response);
    });

    const result = await api.createHold('c-1', '20061234567890123');
    expect(result).toEqual(mockHold);
    expect(capturedHeaders?.get('X-Student-Id')).toBe('20061234567890123');
    expect(capturedHeaders?.get('Content-Type')).toBe('application/json');
  });

  it('throws ApiError with status and problem details on HTTP 409 Conflict', async () => {
    const problemDetails = {
      type: 'https://tools.ietf.org/html/rfc7231#section-6.5.8',
      title: 'Conflict',
      status: 409,
      detail: 'No seats available in this offering.',
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      text: async () => JSON.stringify(problemDetails),
    } as unknown as Response);

    await expect(api.createHold('c-1', '20061234567890123')).rejects.toThrow(ApiError);
    await expect(api.createHold('c-1', '20061234567890123')).rejects.toMatchObject({
      status: 409,
      message: 'No seats available in this offering.',
    });
  });

  it('handles HTTP 204 No Content cleanly', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      text: async () => '',
    } as unknown as Response);

    const result = await api.cancelHold('h-1', '20061234567890123');
    expect(result).toBeNull();
  });

  it('throws ApiError with status 0 on network connection failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

    await expect(api.getClasses()).rejects.toMatchObject({
      status: 0,
      message: expect.stringContaining('Cannot connect to server'),
    });
  });
});
