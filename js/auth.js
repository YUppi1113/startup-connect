export async function checkAuth(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  return user || null;
}

// Log in and ensure a profile row exists for the user
export async function loginAndEnsureProfile(supabase, email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data?.user) {
    throw new Error('login failed');
  }
  const user = data.user;

  let { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({ id: user.id });
    if (insertError) {
      throw new Error('failed to create profile');
    }
    profile = { id: user.id };
  }

  return { user, profile };
}
