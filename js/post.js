export async function createPost(supabase, content, files = []) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('not authenticated');

  const imageUrls = [];
  for (const file of files) {
    const ext = file.name ? file.name.split('.').pop() : 'png';
    const fileName = `${user.id}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(fileName, file);
    if (uploadError) throw uploadError;
    const {
      data: { publicUrl },
    } = supabase.storage.from('post-images').getPublicUrl(fileName);
    imageUrls.push(publicUrl);
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({ user_id: user.id, content, image_urls: imageUrls })
    .select()
    .single();
  if (error) throw error;
  return data;
}
