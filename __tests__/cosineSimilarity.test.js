let cosineSimilarity;

beforeAll(async () => {
  process.env.SUPABASE_URL = 'http://example.com';
  process.env.SUPABASE_ANON_KEY = 'test-key';
  process.env.OPENAI_API_KEY = 'test-key';
  ({ cosineSimilarity } = await import('../server.js'));
});

describe('cosineSimilarity', () => {
  test('returns 0 when either vector has zero norm', () => {
    expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
    expect(cosineSimilarity([0, 0], [0, 0])).toBe(0);
  });

  test('throws error when vector lengths differ', () => {
    expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow('Vector length mismatch');
  });
});
