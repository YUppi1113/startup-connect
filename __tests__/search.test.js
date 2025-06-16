import { buildSearchQuery } from '../js/search.js';

test('buildSearchQuery applies filters', () => {
  const filters = {
    keyword: 'foo',
    region: 'tokyo',
    ages: ['20-30'],
    skills: ['js'],
    industries: ['tech'],
    stages: ['seed']
  };
  const query = buildSearchQuery(1, filters);
  expect(query.or[0]).toContain('foo');
  expect(query.eq.location).toBe('tokyo');
  expect(query.in.age_range).toEqual(['20-30']);
  expect(query.contains.skills).toEqual(['js']);
  expect(query.contains['startup_info.industries']).toEqual(['tech']);
  expect(query.in['startup_info.startup_status']).toEqual(['seed']);
});
