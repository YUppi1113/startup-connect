import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set');
}

const content = `window.__ENV__ = {\n  SUPABASE_URL: '${SUPABASE_URL}',\n  SUPABASE_ANON_KEY: '${SUPABASE_ANON_KEY}'\n};\n`;

fs.writeFileSync('env.js', content);
console.log('env.js generated');
