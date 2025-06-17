import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function completePastEvents() {
  const today = new Date().toISOString().split('T')[0];

  const { data: events, error } = await supabase
    .from('events')
    .select('id')
    .eq('status', 'scheduled')
    .lt('event_date', today);

  if (error) {
    console.error('Failed to fetch events', error);
    process.exit(1);
  }

  if (events.length === 0) {
    console.log('No past scheduled events found.');
    return;
  }

  const ids = events.map(e => e.id);
  const { error: updateError } = await supabase
    .from('events')
    .update({ status: 'completed' })
    .in('id', ids);

  if (updateError) {
    console.error('Failed to update events', updateError);
    process.exit(1);
  }

  console.log(`Updated ${ids.length} events.`);
}

completePastEvents();

