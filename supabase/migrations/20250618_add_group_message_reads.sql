-- Track group message reads
CREATE TABLE IF NOT EXISTS public.group_message_reads (
  message_id uuid REFERENCES public.group_messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_group_message_reads_message ON public.group_message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_group_message_reads_user ON public.group_message_reads(user_id);
