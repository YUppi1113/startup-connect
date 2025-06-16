import { extractHashtags, buildPostSearchQuery } from '../js/posts.js';

test('extractHashtags extracts lowercase tags', () => {
  const tags = extractHashtags('Hello #World #JS');
  expect(tags).toEqual(['world', 'js']);
});

test('buildPostSearchQuery builds ilike query', () => {
  const q = buildPostSearchQuery('foo');
  expect(q.ilike.content).toBe('%foo%');
});
