export function filterEvents(allEvents, { type = '', location = '', date = '' } = {}) {
  let filtered = allEvents;

  if (type) {
    filtered = filtered.filter(event => event.event_type === type);
  }

  if (location) {
    if (location === 'online') {
      filtered = filtered.filter(event => event.format === 'online');
    } else {
      const loc = location.toLowerCase();
      filtered = filtered.filter(event => event.location && event.location.toLowerCase().includes(loc));
    }
  }

  if (date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    filtered = filtered.filter(event => {
      const eventDate = new Date(event.event_date);
      switch (date) {
        case 'today':
          return eventDate.getTime() === today.getTime();
        case 'this-week': {
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          return eventDate >= weekStart && eventDate <= weekEnd;
        }
        case 'this-month':
          return eventDate.getMonth() === today.getMonth() && eventDate.getFullYear() === today.getFullYear();
        case 'next-month': {
          const nextMonth = new Date(today);
          nextMonth.setMonth(today.getMonth() + 1);
          return eventDate.getMonth() === nextMonth.getMonth() && eventDate.getFullYear() === nextMonth.getFullYear();
        }
        default:
          return true;
      }
    });
  }

  return filtered;
}
