import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CampaignState } from '../types';
import { createGist, fetchGist, GistError, updateGist } from './gist';

const validState: CampaignState = {
  marines: [
    {
      id: 'm01',
      nom: 'Test',
      grade: '2nd',
      specialisation: 'Fusilier',
      conditionPhysique: 'RAS',
      etatPsychologique: 'RAS',
    },
  ],
  scenarios: [],
  dateCourante: '2186-03-10',
  highlightedMarineIds: [],
};

interface MockResponseInit {
  ok?: boolean;
  status?: number;
  headers?: Record<string, string>;
  json?: () => unknown;
}

function mockFetchOnce(response: MockResponseInit) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: response.ok ?? true,
    status: response.status ?? 200,
    headers: new Headers(response.headers ?? {}),
    json: async () => (response.json ? response.json() : {}),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('fetchGist', () => {
  it('parses a valid CampaignState from the Gist response', async () => {
    mockFetchOnce({
      ok: true,
      status: 200,
      json: () => ({
        id: 'abc123',
        updated_at: '2026-04-01T12:00:00Z',
        files: {
          'troupe-manager.json': { content: JSON.stringify(validState) },
        },
      }),
    });

    const result = await fetchGist('abc123');
    expect(result.marines).toHaveLength(1);
    expect(result.dateCourante).toBe('2186-03-10');
  });

  it('throws GistError NOT_FOUND on 404', async () => {
    mockFetchOnce({ ok: false, status: 404 });
    await expect(fetchGist('nope')).rejects.toMatchObject({
      name: 'GistError',
      code: 'NOT_FOUND',
    });
  });

  it('throws GistError RATE_LIMIT on 403 with X-RateLimit-Remaining: 0', async () => {
    mockFetchOnce({
      ok: false,
      status: 403,
      headers: { 'X-RateLimit-Remaining': '0' },
    });
    await expect(fetchGist('abc')).rejects.toMatchObject({
      name: 'GistError',
      code: 'RATE_LIMIT',
    });
  });

  it('throws GistError PARSE when the JSON has the wrong shape', async () => {
    mockFetchOnce({
      ok: true,
      status: 200,
      json: () => ({
        id: 'abc123',
        updated_at: '2026-04-01T12:00:00Z',
        files: {
          'troupe-manager.json': {
            // marines as string instead of array — must be rejected
            content: JSON.stringify({
              marines: 'not-an-array',
              scenarios: [],
              dateCourante: '2186-03-10',
            }),
          },
        },
      }),
    });
    await expect(fetchGist('abc123')).rejects.toMatchObject({
      name: 'GistError',
      code: 'PARSE',
    });
  });

  it('throws GistError PARSE when highlightedMarineIds has the wrong type', async () => {
    mockFetchOnce({
      ok: true,
      status: 200,
      json: () => ({
        id: 'abc123',
        updated_at: '2026-04-01T12:00:00Z',
        files: {
          'troupe-manager.json': {
            content: JSON.stringify({
              marines: [],
              scenarios: [],
              dateCourante: '2186-03-10',
              highlightedMarineIds: 'nope',
            }),
          },
        },
      }),
    });
    await expect(fetchGist('abc123')).rejects.toMatchObject({
      name: 'GistError',
      code: 'PARSE',
    });
  });

  it('accepts a valid state without highlightedMarineIds and defaults it', async () => {
    mockFetchOnce({
      ok: true,
      status: 200,
      json: () => ({
        id: 'abc123',
        updated_at: '2026-04-01T12:00:00Z',
        files: {
          'troupe-manager.json': {
            content: JSON.stringify({
              marines: [],
              scenarios: [],
              dateCourante: '2186-03-10',
            }),
          },
        },
      }),
    });
    const result = await fetchGist('abc123');
    expect(result.highlightedMarineIds).toEqual([]);
  });

  it('throws GistError PARSE when the expected file is missing', async () => {
    mockFetchOnce({
      ok: true,
      status: 200,
      json: () => ({
        id: 'abc123',
        updated_at: '2026-04-01T12:00:00Z',
        files: { 'other.json': { content: '{}' } },
      }),
    });
    await expect(fetchGist('abc123')).rejects.toMatchObject({
      name: 'GistError',
      code: 'PARSE',
    });
  });

  it('throws GistError NETWORK when fetch itself throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(fetchGist('abc123')).rejects.toMatchObject({
      name: 'GistError',
      code: 'NETWORK',
    });
  });
});

describe('createGist', () => {
  it('returns the gist id on 201', async () => {
    const fetchMock = mockFetchOnce({
      ok: true,
      status: 201,
      json: () => ({
        id: 'new-id-999',
        updated_at: '2026-04-01T12:00:00Z',
        files: { 'troupe-manager.json': { content: '{}' } },
      }),
    });

    const id = await createGist(validState, 'ghp_test_token');
    expect(id).toBe('new-id-999');

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer ghp_test_token');
    const body = JSON.parse(init.body as string);
    expect(body.public).toBe(false);
    expect(body.files['troupe-manager.json'].content).toContain('Test');
  });

  it('throws GistError UNAUTHORIZED on 401', async () => {
    mockFetchOnce({ ok: false, status: 401 });
    await expect(createGist(validState, 'bad-token')).rejects.toMatchObject({
      name: 'GistError',
      code: 'UNAUTHORIZED',
    });
  });
});

describe('updateGist', () => {
  it('PATCHes with the correct body', async () => {
    const fetchMock = mockFetchOnce({
      ok: true,
      status: 200,
      json: () => ({
        id: 'abc123',
        updated_at: '2026-04-01T12:00:00Z',
        files: { 'troupe-manager.json': { content: '{}' } },
      }),
    });

    await updateGist('abc123', validState, 'ghp_test_token');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.github.com/gists/abc123');
    expect(init.method).toBe('PATCH');
    const body = JSON.parse(init.body as string);
    expect(body.files['troupe-manager.json'].content).toContain('2186-03-10');
  });
});

describe('GistError', () => {
  it('exposes code and message without leaking token-ish fields', () => {
    const err = new GistError('oops', 'UNAUTHORIZED');
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.message).toBe('oops');
    expect(JSON.stringify(err)).not.toContain('Bearer');
  });
});
