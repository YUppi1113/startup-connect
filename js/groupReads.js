export function countUnread(messages, reads, userId) {
  const readSet = new Set(reads.filter(r => r.user_id === userId).map(r => r.message_id));
  return messages.reduce((acc, msg) => {
    if (!readSet.has(msg.id)) {
      acc[msg.group_id] = (acc[msg.group_id] || 0) + 1;
    }
    return acc;
  }, {});
}

export function countMessageReads(reads) {
  return reads.reduce((acc, r) => {
    acc[r.message_id] = (acc[r.message_id] || 0) + 1;
    return acc;
  }, {});
}

export function markAsRead(reads, messageIds, userId, timestamp = new Date().toISOString()) {
  messageIds.forEach(id => {
    const exists = reads.some(r => r.message_id === id && r.user_id === userId);
    if (!exists) {
      reads.push({ message_id: id, user_id: userId, read_at: timestamp });
    }
  });
  return reads;
}
