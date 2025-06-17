export async function toggleLike(supabase, postId, userId) {
  const { data: existing } = await supabase
    .from('post_likes')
    .select('id')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .single();
  let liked;
  if (existing) {
    await supabase.from('post_likes').delete().eq('id', existing.id);
    liked = false;
  } else {
    await supabase.from('post_likes').insert({ user_id: userId, post_id: postId });
    liked = true;
  }

  const { count } = await supabase
    .from('post_likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);
  await supabase.from('posts').update({ likes_count: count }).eq('id', postId);

  return { liked, likesCount: count };
}

export async function toggleBookmark(supabase, postId, userId) {
  const { data: existing } = await supabase
    .from('post_bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .single();
  if (existing) {
    await supabase.from('post_bookmarks').delete().eq('id', existing.id);
    return { bookmarked: false };
  }
  await supabase.from('post_bookmarks').insert({ user_id: userId, post_id: postId });
  return { bookmarked: true };
}

export function updateLikeButton(button, liked) {
  if (!button) return;
  if (liked) {
    button.textContent = 'いいね済み';
    button.classList.add('text-blue-600');
    button.classList.remove('text-gray-600');
    button.setAttribute('aria-pressed', 'true');
  } else {
    button.textContent = 'いいね';
    button.classList.remove('text-blue-600');
    button.classList.add('text-gray-600');
    button.setAttribute('aria-pressed', 'false');
  }
  button.disabled = false;
}

export function updateBookmarkButton(button, bookmarked) {
  if (!button) return;
  if (bookmarked) {
    button.textContent = '保存済み';
    button.classList.add('text-blue-600');
    button.classList.remove('text-gray-600');
    button.setAttribute('aria-pressed', 'true');
  } else {
    button.textContent = '保存';
    button.classList.remove('text-blue-600');
    button.classList.add('text-gray-600');
    button.setAttribute('aria-pressed', 'false');
  }
  button.disabled = false;
}
