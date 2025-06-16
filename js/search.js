export function buildSearchQuery(currentUserId, filters = {}) {
  const query = {
    from: 'profiles',
    select: ['*', 'startup_info!inner(*)'],
    neq: { id: currentUserId },
    or: [],
    eq: {},
    in: {},
    contains: {}
  };

  if (filters.keyword) {
    query.or.push(`first_name.ilike.%${filters.keyword}%,last_name.ilike.%${filters.keyword}%,bio.ilike.%${filters.keyword}%`);
  }
  if (filters.region) {
    query.eq.location = filters.region;
  }
  if (filters.ages && filters.ages.length) {
    query.in.age_range = filters.ages;
  }
  if (filters.skills && filters.skills.length) {
    query.contains.skills = filters.skills;
  }
  if (filters.industries && filters.industries.length) {
    query.contains['startup_info.industries'] = filters.industries;
  }
  if (filters.stages && filters.stages.length) {
    query.in['startup_info.startup_status'] = filters.stages;
  }

  return query;
}
