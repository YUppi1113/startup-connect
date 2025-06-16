export function extractHashtags(text = '') {
  return (text.match(/#(\w+)/g) || []).map(tag => tag.slice(1).toLowerCase());
}

export function buildPostSearchQuery(keyword = '') {
  const query = { ilike: {} };
  if (keyword) {
    query.ilike.content = `%${keyword}%`;
  }
  return query;
}
