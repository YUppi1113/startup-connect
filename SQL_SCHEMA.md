# Database Schema

## profile_embeddings
Stores vector embeddings for each user profile. Requires the `vector` extension.

```sql
create extension if not exists vector;

create table public.profile_embeddings (
  user_id uuid primary key references profiles(id) on delete cascade,
  embedding vector(1536)
);
```

## Functions

### compute_embedding (server.js)
Node service that calls OpenAI's embedding API and upserts the result into
`profile_embeddings`. It also exposes `/api/recommendations` which ranks users
by cosine similarity between embeddings.
