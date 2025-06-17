import express from 'express';
import { createClient } from '@supabase/supabase-js';
import OpenAI from "openai";
import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

app.get('/api/placeholder/:width/:height', (req, res) => {
  const width = parseInt(req.params.width, 10) || 100;
  const height = parseInt(req.params.height, 10) || 100;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">\n` +
    `<rect width="100%" height="100%" fill="#ddd"/>` +
    `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#888" font-family="sans-serif" font-size="14">${width}x${height}</text>` +
    `</svg>`;
  res.set('Content-Type', 'image/svg+xml');
  res.send(svg);
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

if (process.env.PUSH_VAPID_PUBLIC_KEY && process.env.PUSH_VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:example@example.com',
    process.env.PUSH_VAPID_PUBLIC_KEY,
    process.env.PUSH_VAPID_PRIVATE_KEY
  );
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


async function computeEmbedding(text) {
  const { data } = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  });
  return data[0].embedding;
}

app.post('/api/compute_embedding', async (req, res) => {
  const { user_id, profile_text } = req.body;
  if (!user_id || !profile_text) {
    return res.status(400).json({ error: 'missing parameters' });
  }
  try {
    const embedding = await computeEmbedding(profile_text);
    const { error } = await supabase
      .from('profile_embeddings')
      .upsert({ user_id, embedding });
    if (error) throw error;
    res.json({ status: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'embedding failed' });
  }
});

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

app.get('/api/recommendations', async (req, res) => {
  const { user_id } = req.query;
  const limit = parseInt(req.query.limit || '3', 10);
  if (!user_id) return res.status(400).json({ error: 'missing user_id' });

  const { data: target, error: targetError } = await supabase
    .from('profile_embeddings')
    .select('embedding')
    .eq('user_id', user_id)
    .single();
  if (targetError || !target) return res.status(404).json({ error: 'embedding not found' });

  const { data: others } = await supabase
    .from('profile_embeddings')
    .select('user_id, embedding')
    .neq('user_id', user_id);

  const similarities = others.map(o => ({
    user_id: o.user_id,
    score: cosineSimilarity(target.embedding, o.embedding)
  })).sort((a, b) => b.score - a.score).slice(0, limit);
  const ids = similarities.map(s => s.user_id);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*, startup_info(*)')
    .in('id', ids);

  res.json(profiles || []);
});


app.post('/api/send_push', async (req, res) => {
  const { user_id, title, body, url, notification_id, event } = req.body;
  if (!user_id) return res.status(400).json({ error: 'missing user_id' });
  if (!process.env.PUSH_VAPID_PUBLIC_KEY || !process.env.PUSH_VAPID_PRIVATE_KEY) {
    return res.json({ status: 'push disabled' });
  }
  try {
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id);
    for (const sub of subs || []) {
      const subscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };
      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify({ title, body, url, id: notification_id, event })
        );
      } catch (err) {
        console.error('push error', err);
      }
    }
    res.json({ status: 'sent' });
  } catch (err) {
    console.error('send push error', err);
    res.status(500).json({ error: 'failed' });
  }
});

app.post('/mark_notification', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'missing id' });
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('mark notification error', err);
    res.status(500).json({ error: 'failed' });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Embedding service running on port ${port}`);
});
