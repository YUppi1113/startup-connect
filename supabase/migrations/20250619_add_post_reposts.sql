-- Post Reposts table
CREATE TABLE public.post_reposts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  original_post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  comment text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_post_reposts_user ON public.post_reposts(user_id);
CREATE INDEX idx_post_reposts_original ON public.post_reposts(original_post_id);
