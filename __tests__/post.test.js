import { jest } from '@jest/globals';
import { addComment } from '../js/post.js';

test('addComment inserts comment and updates count', async () => {
  const insert = jest.fn().mockResolvedValue({ error: null });
  const select = jest.fn().mockReturnThis();
  const eq = jest.fn().mockReturnThis();
  const order = jest.fn().mockResolvedValue({ data: [{ id: 'c1' }], error: null });
  const single = jest.fn().mockResolvedValue({ data: { comments_count: 1 } });
  const updateEq = jest.fn().mockResolvedValue({ error: null });
  const update = jest.fn().mockReturnValue({ eq: updateEq });

  const postCommentsApi = { insert, select, eq, order };
  const postsApi = { select, eq, single, update };
  const from = jest.fn((table) => {
    if (table === 'post_comments') return postCommentsApi;
    if (table === 'posts') return postsApi;
    return null;
  });

  const supabase = {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from,
  };
  global.supabase = supabase;

  const comments = await addComment('p1', 'hello');

  expect(insert).toHaveBeenCalledWith({ post_id: 'p1', user_id: 'u1', content: 'hello' });
  expect(update).toHaveBeenCalledWith({ comments_count: 2 });
  expect(updateEq).toHaveBeenCalledWith('id', 'p1');
  expect(comments).toEqual([{ id: 'c1' }]);
});
