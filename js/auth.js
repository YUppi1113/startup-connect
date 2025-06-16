export async function checkAuth(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  return user || null;
}
