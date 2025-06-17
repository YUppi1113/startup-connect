export async function checkFollowStatus(supabase, followerId, followingId) {
  const { data: follow } = await supabase
    .from('follows')
    .select('*')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single();
  const isFollowing = !!follow;
  let isRequested = false;
  if (!isFollowing) {
    const { data: request } = await supabase
      .from('follow_requests')
      .select('*')
      .eq('requester_id', followerId)
      .eq('target_id', followingId)
      .single();
    isRequested = !!request;
  }
  return { isFollowing, isRequested };
}

export async function sendFollowRequest(supabase, followerId, followingId) {
  return supabase.from('follow_requests').insert({
    requester_id: followerId,
    target_id: followingId,
  });
}

export async function followUser(supabase, followerId, followingId) {
  return supabase.from('follows').insert({
    follower_id: followerId,
    following_id: followingId,
  });
}

export async function unfollowUser(supabase, followerId, followingId) {
  return supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);
}

export async function cancelFollowRequest(supabase, followerId, followingId) {
  return supabase
    .from('follow_requests')
    .delete()
    .eq('requester_id', followerId)
    .eq('target_id', followingId);
}

export function updateFollowButton(button, isFollowing, isRequested) {
  if (!button) return;
  const isProfileStyle = button.dataset.style === 'profile';
  if (isProfileStyle) {
    if (isFollowing) {
      button.textContent = 'フォロー中';
      button.classList.remove('bg-blue-600', 'hover:bg-blue-700', 'follow-requested');
      button.classList.add('bg-gray-600', 'hover:bg-gray-700');
    } else if (isRequested) {
      button.textContent = 'リクエスト済み';
      button.classList.remove('bg-blue-600', 'hover:bg-blue-700');
      button.classList.add('bg-gray-600', 'hover:bg-gray-700', 'follow-requested');
    } else {
      button.textContent = 'フォローする';
      button.classList.remove('bg-gray-600', 'hover:bg-gray-700', 'follow-requested');
      button.classList.add('bg-blue-600', 'hover:bg-blue-700');
    }
  } else {
    if (isFollowing) {
      button.textContent = 'フォロー中';
      button.classList.remove('follow-requested', 'text-blue-600', 'border-blue-600');
      button.classList.add('text-gray-600', 'border-gray-600');
    } else if (isRequested) {
      button.textContent = 'リクエスト済み';
      button.classList.remove('text-blue-600', 'border-blue-600');
      button.classList.add('follow-requested', 'text-gray-600', 'border-gray-600');
    } else {
      button.textContent = 'フォローする';
      button.classList.remove('follow-requested', 'text-gray-600', 'border-gray-600');
      button.classList.add('text-blue-600', 'border-blue-600');
    }
  }
  button.disabled = false;
}
