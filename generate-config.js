import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const { SUPABASE_URL, SUPABASE_ANON_KEY, PUSH_VAPID_PUBLIC_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

let template = fs.readFileSync('config.template.js', 'utf8');

template = template
  .replace('__SUPABASE_URL__', SUPABASE_URL)
  .replace('__SUPABASE_ANON_KEY__', SUPABASE_ANON_KEY)
  .replace('__PUSH_VAPID_PUBLIC_KEY__', PUSH_VAPID_PUBLIC_KEY || '');

fs.writeFileSync('config.js', template);
console.log('config.js generated');
