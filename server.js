import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { Configuration, OpenAIApi } from 'openai';
import webpush from 'web-push';
import dotenv from 'dotenv';
import { extractHashtags } from './js/posts.js';

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

const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

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

// --- Posts API ---
app.get('/api/posts', async (req, res) => {
  const { user_id } = req.query;
  const limit = parseInt(req.query.limit || '10', 10);
  if (!user_id) return res.status(400).json({ error: 'missing user_id' });
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(
        '*, post_comments(id, user_id, content, created_at, profiles!post_comments_user_id_fkey(id, first_name, last_name, profile_image_url))'
      )
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('fetch posts error', err);
    res.status(500).json({ error: 'failed to fetch posts' });
  }
});

app.post('/api/posts', async (req, res) => {
  const { user_id, content, image_urls } = req.body;
  if (!user_id || !content) {
    return res.status(400).json({ error: 'missing parameters' });
  }
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert({ user_id, content, image_urls: image_urls || [] })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('create post error', err);
    res.status(500).json({ error: 'failed to create post' });
  }
});

app.post('/api/posts/:id/like', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'missing user_id' });
  try {
    const { data: existing } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', user_id)
      .single();
    let liked = true;
    if (existing) {
      await supabase.from('post_likes').delete().eq('id', existing.id);
      liked = false;
    } else {
      await supabase.from('post_likes').insert({ post_id: id, user_id });
    }

    const { count } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', id);
    await supabase.from('posts').update({ likes_count: count }).eq('id', id);
    res.json({ liked, likes_count: count });
  } catch (err) {
    console.error('like post error', err);
    res.status(500).json({ error: 'failed to update like' });
  }
});

app.get('/api/posts/:id/comments', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('post_comments')
      .select(
        '*, profiles!post_comments_user_id_fkey(id, first_name, last_name, profile_image_url)'
      )
      .eq('post_id', id)
      .order('created_at');
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('fetch comments error', err);
    res.status(500).json({ error: 'failed to fetch comments' });
  }
});

app.post('/api/posts/:id/comments', async (req, res) => {
  const { id } = req.params;
  const { user_id, content } = req.body;
  if (!user_id || !content) {
    return res.status(400).json({ error: 'missing parameters' });
  }
  try {
    const { data, error } = await supabase
      .from('post_comments')
      .insert({ post_id: id, user_id, content })
      .select()
      .single();
    if (error) throw error;

    const { count } = await supabase
      .from('post_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', id);
    await supabase
      .from('posts')
      .update({ comments_count: count })
      .eq('id', id);

    res.json(data);
  } catch (err) {
    console.error('add comment error', err);
    res.status(500).json({ error: 'failed to add comment' });
  }
});

app.get('/api/posts/search', async (req, res) => {
  const { q } = req.query;
  const limit = parseInt(req.query.limit || '20', 10);
  if (!q) return res.json([]);
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .ilike('content', `%${q}%`)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('search posts error', err);
    res.status(500).json({ error: 'failed to search posts' });
  }
});

app.get('/api/trending_hashtags', async (req, res) => {
  const days = parseInt(req.query.days || '7', 10);
  const limit = parseInt(req.query.limit || '5', 10);
  const since = new Date();
  since.setDate(since.getDate() - days);
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('content')
      .gte('created_at', since.toISOString());
    if (error) throw error;
    const counts = {};
    for (const p of data || []) {
      const tags = extractHashtags(p.content);
      for (const t of tags) {
        counts[t] = (counts[t] || 0) + 1;
      }
    }
    const trending = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));
    res.json(trending);
  } catch (err) {
    console.error('trending error', err);
    res.status(500).json({ error: 'failed to fetch trending' });
  }
});

app.post('/api/posts/:id/bookmark', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'missing user_id' });
  try {
    const { data: existing } = await supabase
      .from('post_bookmarks')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', user_id)
      .single();
    let bookmarked = true;
    if (existing) {
      await supabase.from('post_bookmarks').delete().eq('id', existing.id);
      bookmarked = false;
    } else {
      await supabase.from('post_bookmarks').insert({ post_id: id, user_id });
    }
    const { count } = await supabase
      .from('post_bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', id);
    res.json({ bookmarked, count });
  } catch (err) {
    console.error('bookmark error', err);
    res.status(500).json({ error: 'failed to update bookmark' });
  }
});

app.get('/api/bookmarked_posts', async (req, res) => {
  const { user_id } = req.query;
  const limit = parseInt(req.query.limit || '10', 10);
  if (!user_id) return res.status(400).json({ error: 'missing user_id' });
  try {
    const { data, error } = await supabase
      .from('post_bookmarks')
      .select('posts(*)')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    const posts = (data || []).map(b => b.posts);
    res.json(posts);
  } catch (err) {
    console.error('fetch bookmarks error', err);
    res.status(500).json({ error: 'failed to fetch bookmarks' });
  }
});

app.post('/api/send_push', async (req, res) => {
  const { user_id, title, body, url, notification_id } = req.body;
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
          JSON.stringify({ title, body, url, id: notification_id })
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
