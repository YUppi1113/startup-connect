import fs from 'fs';
import https from 'https';
import { execSync } from 'child_process';

const SUPABASE_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
const TEMP_FILE = 'supabase.tmp.js';
const OUT_DIR = 'legacy';
const OUT_FILE = `${OUT_DIR}/supabase.js`;

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch ${url}: ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }
  await download(SUPABASE_URL, TEMP_FILE);
  execSync(`npx babel ${TEMP_FILE} --out-file ${OUT_FILE} --presets=@babel/preset-env`);
  fs.unlinkSync(TEMP_FILE);
  console.log(`Transpiled Supabase to ${OUT_FILE}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
