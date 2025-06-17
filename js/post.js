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

export async function addComment(supabase, postId, content) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('not authenticated');

  const { data: comment, error } = await supabase
    .from('post_comments')
    .insert({ post_id: postId, user_id: user.id, content })
    .select('*, profiles(id, first_name, last_name, profile_image_url)')
    .single();
  if (error) throw error;

  const { data: post } = await supabase
    .from('posts')
    .select('comments_count, user_id')
    .eq('id', postId)
    .single();
  if (post) {
    await supabase
      .from('posts')
      .update({ comments_count: (post.comments_count || 0) + 1 })
      .eq('id', postId);
    if (post.user_id !== user.id) {
      await supabase.from('notifications').insert({
        user_id: post.user_id,
        type: 'comment',
        title: '新しいコメント',
        content: `${comment.profiles?.last_name || ''} ${comment.profiles?.first_name || ''}さんがあなたの投稿にコメントしました`,
        related_id: postId,
      });
    }
  }
  return comment;
}

export async function toggleLike(supabase, postId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('not authenticated');

  const { data: existing } = await supabase
    .from('post_likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .maybeSingle();

  let liked = false;
  const { data: post } = await supabase
    .from('posts')
    .select('likes_count, user_id')
    .eq('id', postId)
    .single();

  if (existing) {
    await supabase.from('post_likes').delete().eq('id', existing.id);
    await supabase
      .from('posts')
      .update({ likes_count: Math.max((post.likes_count || 1) - 1, 0) })
      .eq('id', postId);
  } else {
    await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
    await supabase
      .from('posts')
      .update({ likes_count: (post.likes_count || 0) + 1 })
      .eq('id', postId);
    liked = true;
    if (post.user_id !== user.id) {
      await supabase.from('notifications').insert({
        user_id: post.user_id,
        type: 'like',
        title: '新しいいいね',
        content: `${user.id} さんがあなたの投稿をいいねしました`,
        related_id: postId,
      });
    }
  }

  return { liked, count: liked ? (post.likes_count || 0) + 1 : Math.max((post.likes_count || 1) - 1, 0) };
}

export async function toggleBookmark(supabase, postId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('not authenticated');

  const { data: existing } = await supabase
    .from('post_bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .maybeSingle();

  if (existing) {
    await supabase.from('post_bookmarks').delete().eq('id', existing.id);
    return false;
  } else {
    await supabase.from('post_bookmarks').insert({ post_id: postId, user_id: user.id });
    return true;
  }
}

export function subscribeToPostChanges(supabase, handlers = {}) {
  const channel = supabase.channel('posts');
  channel
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
      handlers.insert && handlers.insert(payload.new);
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, (payload) => {
      handlers.delete && handlers.delete(payload.old);
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'post_likes' }, (payload) => {
      handlers.likeInsert && handlers.likeInsert(payload.new);
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'post_likes' }, (payload) => {
      handlers.likeDelete && handlers.likeDelete(payload.old);
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'post_comments' }, (payload) => {
      handlers.commentInsert && handlers.commentInsert(payload.new);
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'post_comments' }, (payload) => {
      handlers.commentDelete && handlers.commentDelete(payload.old);
    })
    .subscribe();
  return channel;
}
