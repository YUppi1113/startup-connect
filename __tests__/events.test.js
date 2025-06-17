import { jest } from '@jest/globals';
import { filterEvents } from '../js/events.js';

const events = [
  { id: 1, title: 'Tech Conference', description: 'Annual tech event', event_type: 'conference', format: 'in-person', location: 'Tokyo', event_date: '2024-05-15' },
  { id: 2, title: 'Online Meetup', description: 'Discuss projects', event_type: 'meetup', format: 'online', location: 'Zoom', event_date: '2024-05-16' },
  { id: 3, title: 'Workshop', description: 'Hands-on coding', event_type: 'workshop', format: 'in-person', location: 'Osaka', event_date: '2024-05-25' },
  { id: 4, title: 'Hack Nagoya', description: 'Hackathon event', event_type: 'hackathon', format: 'in-person', location: 'Nagoya', event_date: '2024-06-10' },
  { id: 5, title: 'Another Meetup', description: 'Meetup about testing', event_type: 'meetup', format: 'online', location: null, event_date: '2024-06-20' },
];

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2024-05-15T00:00:00Z'));
});

afterAll(() => {
  jest.useRealTimers();
});

test('filters by type', () => {
  const result = filterEvents(events, { type: 'meetup' });
  expect(result).toEqual([events[1], events[4]]);
});

test('filters by online location', () => {
  const result = filterEvents(events, { location: 'online' });
  expect(result).toEqual([events[1], events[4]]);
});

test('filters by city location', () => {
  const result = filterEvents(events, { location: 'tokyo' });
  expect(result).toEqual([events[0]]);
});

test('filters by today', () => {
  const result = filterEvents(events, { date: 'today' });
  expect(result).toEqual([events[0]]);
});

test('filters by this week', () => {
  const result = filterEvents(events, { date: 'this-week' });
  expect(result).toEqual([events[0], events[1]]);
});

test('filters by this month', () => {
  const result = filterEvents(events, { date: 'this-month' });
  expect(result).toEqual([events[0], events[1], events[2]]);
});

test('filters by next month', () => {
  const result = filterEvents(events, { date: 'next-month' });
  expect(result).toEqual([events[3], events[4]]);
});

test('filters by combined criteria', () => {
  const result = filterEvents(events, { type: 'meetup', location: 'online', date: 'this-week' });
  expect(result).toEqual([events[1]]);
});

test('filters by keyword in title', () => {
  const result = filterEvents(events, { keyword: 'hack' });
  expect(result).toEqual([events[3]]);
});

test('filters by keyword in description case-insensitively', () => {
  const result = filterEvents(events, { keyword: 'projects' });
  expect(result).toEqual([events[1]]);
});
