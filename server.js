import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { Configuration, OpenAIApi } from 'openai';
import dotenv from 'dotenv';
import webpush from 'web-push';

dotenv.config();

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

async function sendPushNotification(userId, notification) {
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId);
  if (!subs) return;
  const payload = JSON.stringify({
    id: notification.id,
    title: notification.title,
    content: notification.content,
  });
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      );
    } catch (err) {
      console.error('Failed to send push', err);
    }
  }
}

supabase
  .channel('server-notifications')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'notifications' },
    async (payload) => {
      if (payload.new) {
        await sendPushNotification(payload.new.user_id, payload.new);
      }
    }
  )
  .subscribe();

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

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Embedding service running on port ${port}`);
});
