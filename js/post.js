/* global supabase */
export async function addComment(postId, content) {
  if (!postId || !content || !content.trim()) {
    throw new Error('postId and content are required');
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const insertRes = await supabase.from('post_comments').insert({
    post_id: postId,
    user_id: user.id,
    content: content.trim(),
  });
  if (insertRes.error) {
    throw new Error('Failed to add comment');
  }

  const { data: post } = await supabase
    .from('posts')
    .select('comments_count')
    .eq('id', postId)
    .single();
  const newCount = (post?.comments_count || 0) + 1;
  const { error: updateError } = await supabase
    .from('posts')
    .update({ comments_count: newCount })
    .eq('id', postId);
  if (updateError) {
    throw new Error('Failed to update comment count');
  }

  const { data: comments } = await supabase
    .from('post_comments')
    .select('id, content, created_at, profiles!post_comments_user_id_fkey(id, first_name, last_name, profile_image_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  return comments || [];
}
