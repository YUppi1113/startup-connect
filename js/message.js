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
