import { jest } from '@jest/globals';
import { loginAndEnsureProfile } from '../js/auth.js';

test('login inserts profile row when missing', async () => {
  const insert = jest.fn().mockResolvedValue({ error: null });
  const profileApi = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
    insert,
  };
  const supabase = {
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({ data: { user: { id: 1 } } }),
    },
    from: jest.fn(() => profileApi),
  };

  const result = await loginAndEnsureProfile(supabase, 'a@example.com', 'pw');

  expect(result).toEqual({ user: { id: 1 }, profile: { id: 1 } });
  expect(insert).toHaveBeenCalledWith({ id: 1 });
});
