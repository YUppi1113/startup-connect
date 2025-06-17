import { countUnread, countMessageReads, markAsRead } from '../js/groupReads.js';

describe('group message read utilities', () => {
  test('markAsRead adds missing records', () => {
    const reads = [];
    markAsRead(reads, ['m1', 'm2'], 'u1', 't1');
    expect(reads).toEqual([
      { message_id: 'm1', user_id: 'u1', read_at: 't1' },
      { message_id: 'm2', user_id: 'u1', read_at: 't1' }
    ]);
    // calling again should not duplicate
    markAsRead(reads, ['m1'], 'u1', 't2');
    expect(reads.length).toBe(2);
  });

  test('countUnread counts per group', () => {
    const messages = [
      { id: 'm1', group_id: 'g1' },
      { id: 'm2', group_id: 'g1' },
      { id: 'm3', group_id: 'g2' }
    ];
    const reads = [{ message_id: 'm1', user_id: 'u1' }];
    const result = countUnread(messages, reads, 'u1');
    expect(result).toEqual({ g1: 1, g2: 1 });
  });

  test('countMessageReads aggregates correctly', () => {
    const reads = [
      { message_id: 'm1', user_id: 'u1' },
      { message_id: 'm1', user_id: 'u2' },
      { message_id: 'm2', user_id: 'u1' }
    ];
    const result = countMessageReads(reads);
    expect(result).toEqual({ m1: 2, m2: 1 });
  });
});
