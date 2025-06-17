export function composeMessage(senderId, receiverId, content = '', fileUrl = null) {
  if (!senderId || !receiverId) {
    throw new Error('senderId and receiverId are required');
  }
  return {
    sender_id: senderId,
    receiver_id: receiverId,
    content: content.trim() || '',
    file_url: fileUrl,
    is_read: false
  };
}

export async function sendMessage(supabase, message) {
  const { error } = await supabase.from('direct_messages').insert(message);
  if (error) {
    throw new Error('Failed to send message');
  }
  return true;
}

export async function updateDirectMessage(supabase, id, updates) {
  const { error } = await supabase
    .from('direct_messages')
    .update(updates)
    .eq('id', id);
  if (error) throw new Error('Failed to update message');
  return true;
}

export async function deleteDirectMessage(supabase, id) {
  const { error } = await supabase
    .from('direct_messages')
    .delete()
    .eq('id', id);
  if (error) throw new Error('Failed to delete message');
  return true;
}

export async function updateGroupMessage(supabase, id, updates) {
  const { error } = await supabase
    .from('group_messages')
    .update(updates)
    .eq('id', id);
  if (error) throw new Error('Failed to update group message');
  return true;
}

export async function deleteGroupMessage(supabase, id) {
  const { error } = await supabase
    .from('group_messages')
    .delete()
    .eq('id', id);
  if (error) throw new Error('Failed to delete group message');
  return true;
}
