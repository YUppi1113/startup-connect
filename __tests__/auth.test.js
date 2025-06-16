import { checkAuth } from '../js/auth.js';

test('checkAuth returns user when authenticated', async () => {
  const supabase = { auth: { getUser: async () => ({ data: { user: { id: 1 } } }) } };
  const user = await checkAuth(supabase);
  expect(user).toEqual({ id: 1 });
});

test('checkAuth returns null when not authenticated', async () => {
  const supabase = { auth: { getUser: async () => ({ data: { user: null } }) } };
  const user = await checkAuth(supabase);
  expect(user).toBeNull();
});
