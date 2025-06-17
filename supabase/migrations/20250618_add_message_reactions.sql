-- Add tables for message reactions
CREATE TABLE IF NOT EXISTS public.group_message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.group_messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gm_reactions_message ON public.group_message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_gm_reactions_user ON public.group_message_reactions(user_id);

CREATE TABLE IF NOT EXISTS public.direct_message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.direct_messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dm_reactions_message ON public.direct_message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_dm_reactions_user ON public.direct_message_reactions(user_id);
