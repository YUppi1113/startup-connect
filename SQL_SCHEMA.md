# SQL Schema

## Events triggers

```sql
create trigger handle_events_updated_at
before update on events for each row
execute function handle_updated_at();
```

The delete action relies on the foreign key from `event_participants.event_id` with `on delete cascade` so no additional trigger is required.
