import { jest } from '@jest/globals';
import { createPost } from '../js/post.js';

test('createPost uploads images and inserts row', async () => {
  const upload = jest.fn().mockResolvedValue({ error: null });
  const getPublicUrl = jest.fn((path) => ({ data: { publicUrl: `https://cdn/${path}` } }));
  const insert = jest.fn().mockReturnThis();
  const select = jest.fn().mockReturnThis();
  const single = jest.fn().mockResolvedValue({ data: { id: 'p1' }, error: null });

  const supabase = {
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
    storage: { from: () => ({ upload, getPublicUrl }) },
    from: () => ({ insert, select, single }),
  };

  const files = [{ name: 'a.png' }];
  const post = await createPost(supabase, 'hello', files);
  expect(post).toEqual({ id: 'p1' });
  expect(upload).toHaveBeenCalled();
  const inserted = insert.mock.calls[0][0];
  expect(inserted.user_id).toBe('u1');
  expect(inserted.content).toBe('hello');
  expect(Array.isArray(inserted.image_urls)).toBe(true);
});

test('createPost throws when not authenticated', async () => {
  const supabase = { auth: { getUser: async () => ({ data: { user: null } }) } };
  await expect(createPost(supabase, 'hi')).rejects.toThrow('not authenticated');
});
