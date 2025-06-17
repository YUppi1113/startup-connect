# SQL Schema


-- enable vector extension for profile embeddings
create extension if not exists vector;

-- ========== Groups ==========
-- 3) トリガー関数定義
-- 3-1) updated_at を自動更新
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3-2) privacy_settings, notification_settings, security_settings を自動作成
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.privacy_settings   (user_id) VALUES (NEW.id);
  INSERT INTO public.notification_settings(user_id) VALUES (NEW.id);
  INSERT INTO public.security_settings  (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3-3) updated_at 用の共通関数（別名でも可）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3-4) profiles を自動作成
CREATE OR REPLACE FUNCTION create_profile()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles(id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile();

-- 4) テーブル定義（依存先→依存元の順に）

-- 4-1) Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  location text NOT NULL,
  age_range text NOT NULL,
  bio text,
  linkedin_url text,
  profile_image_url text,
  skills text[] DEFAULT '{}'::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  phone varchar(20),
  timezone varchar(50) DEFAULT 'Asia/Tokyo',
  is_private boolean DEFAULT false
);
CREATE INDEX idx_profiles_user_id ON public.profiles(id);
CREATE TRIGGER create_user_settings_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION create_user_settings();
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 4-2) Groups
CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  is_private boolean DEFAULT false,
  admin_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_groups_admin     ON public.groups(admin_id);
CREATE INDEX idx_groups_category  ON public.groups(category);
CREATE INDEX idx_groups_created_at ON public.groups(created_at DESC);
CREATE TRIGGER handle_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 4-3) Group Messages
CREATE TABLE public.group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  file_urls text[] DEFAULT '{}'::text[],
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_group_messages_group   ON public.group_messages(group_id);
CREATE INDEX idx_group_messages_created ON public.group_messages(created_at DESC);
CREATE INDEX idx_group_messages_user    ON public.group_messages(user_id);

-- 4-3b) Group Message Reads
CREATE TABLE public.group_message_reads (
  message_id uuid REFERENCES public.group_messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);
CREATE INDEX idx_group_message_reads_message ON public.group_message_reads(message_id);
CREATE INDEX idx_group_message_reads_user    ON public.group_message_reads(user_id);

-- 4-3c) Group Message Reactions
CREATE TABLE public.group_message_reactions (
  message_id uuid REFERENCES public.group_messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  sticker_url text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);
CREATE INDEX idx_gm_reactions_msg ON public.group_message_reactions(message_id);
CREATE INDEX idx_gm_reactions_user ON public.group_message_reactions(user_id);

-- 4-4) Group Members
CREATE TABLE public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  CONSTRAINT group_members_group_id_user_id_key UNIQUE (group_id, user_id)
);
CREATE INDEX idx_group_members_group ON public.group_members(group_id);
CREATE INDEX idx_group_members_user  ON public.group_members(user_id);

-- 4-5) Follows
CREATE TABLE public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT follows_follower_id_following_id_key UNIQUE (follower_id, following_id)
);
CREATE INDEX idx_follows_follower  ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

-- 4-6) Follow Requests
CREATE TABLE public.follow_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status varchar(20) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT follow_requests_requester_target_key UNIQUE (requester_id, target_id)
);
CREATE INDEX idx_follow_requests_requester ON public.follow_requests(requester_id);
CREATE INDEX idx_follow_requests_target   ON public.follow_requests(target_id);

-- 4-7) Events
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  location text NOT NULL,
  event_date timestamptz NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  organizer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  max_attendees integer,
  event_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  address text,
  online_url text,
  fee integer NOT NULL DEFAULT 0,
  image_url text,
  format text,
  status text DEFAULT 'scheduled'
);
CREATE INDEX idx_events_date ON public.events(event_date);
CREATE TRIGGER handle_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 4-8) Event Participants
CREATE TABLE public.event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'registered',
  registered_at timestamptz DEFAULT now(),
  CONSTRAINT event_participants_event_id_user_id_key UNIQUE (event_id, user_id)
);
CREATE INDEX idx_event_participants_event ON public.event_participants(event_id);
CREATE INDEX idx_event_participants_user  ON public.event_participants(user_id);

-- 4-9) Blocked Users
CREATE TABLE public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT current_timestamp,
  CONSTRAINT blocked_users_blocker_id_blocked_id_key UNIQUE (blocker_id, blocked_id)
);
CREATE INDEX idx_blocked_users_blocker_id ON public.blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked_id ON public.blocked_users(blocked_id);

-- 4-10) Direct Messages
CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  file_url text[] DEFAULT '{}'::text[],
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_direct_messages_sender   ON public.direct_messages(sender_id);
CREATE INDEX idx_direct_messages_receiver ON public.direct_messages(receiver_id);
CREATE INDEX idx_direct_messages_created  ON public.direct_messages(created_at DESC);

-- 4-10b) Direct Message Reactions
CREATE TABLE public.direct_message_reactions (
  message_id uuid REFERENCES public.direct_messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  sticker_url text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);
CREATE INDEX idx_dm_reactions_msg ON public.direct_message_reactions(message_id);
CREATE INDEX idx_dm_reactions_user ON public.direct_message_reactions(user_id);

-- 4-11) Projects
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  image_url text,
  project_url text,
  technologies text[] DEFAULT '{}'::text[],
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE TRIGGER handle_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 4-12) Privacy Settings
CREATE TABLE public.privacy_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_visibility varchar(20) DEFAULT 'public',
  contact_visibility varchar(20) DEFAULT 'connections',
  activity_projects boolean DEFAULT true,
  activity_groups boolean DEFAULT true,
  created_at timestamptz DEFAULT current_timestamp,
  updated_at timestamptz DEFAULT current_timestamp,
  CONSTRAINT privacy_settings_contact_visibility_check
    CHECK (contact_visibility IN ('public','connections','private')),
  CONSTRAINT privacy_settings_profile_visibility_check
    CHECK (profile_visibility IN ('public','connections','private'))
);
CREATE INDEX idx_privacy_settings_user_id ON public.privacy_settings(user_id);
CREATE TRIGGER update_privacy_settings_updated_at
  BEFORE UPDATE ON public.privacy_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4-17) Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  related_id uuid,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(is_read);

-- Notification types include:
--  follow, follow_request, follow_back, message,
--  event, event_reminder, group_invite, group_activity,
--  mention, reaction, follow_request_accepted,
--  event_join, event_update, event_cancel, report

-- 4-18) Notification Settings
CREATE TABLE public.notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_direct_messages boolean DEFAULT true,
  email_mentions boolean DEFAULT true,
  email_follow boolean DEFAULT false,
  email_events boolean DEFAULT true,
  email_marketing boolean DEFAULT false,
  app_messages boolean DEFAULT true,
  app_activity boolean DEFAULT true,
  created_at timestamptz DEFAULT current_timestamp,
  updated_at timestamptz DEFAULT current_timestamp
);
CREATE INDEX idx_notification_settings_user_id ON public.notification_settings(user_id);
CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4-19) User Sessions
CREATE TABLE public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token text UNIQUE,
  device_info text,
  ip_address inet,
  location text,
  user_agent text,
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT current_timestamp,
  last_activity timestamptz DEFAULT current_timestamp,
  expires_at timestamptz
);
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);

-- 4-20) Startup Info
CREATE TABLE public.startup_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  startup_status text NOT NULL,
  industries text[] DEFAULT '{}'::text[],
  business_idea text,
  looking_for text NOT NULL,
  challenges text[] DEFAULT '{}'::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_startup_info_user_id ON public.startup_info(user_id);
CREATE TRIGGER handle_startup_info_updated_at
  BEFORE UPDATE ON public.startup_info
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 4-21) Shared Files
CREATE TABLE public.shared_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  file_type text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid,
  message_id uuid,
  created_at timestamptz DEFAULT now()
);

-- 4-22) Security Settings
CREATE TABLE public.security_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  two_factor_enabled boolean DEFAULT false,
  two_factor_secret text,
  backup_codes text[],
  last_password_change timestamptz DEFAULT current_timestamp,
  login_notifications boolean DEFAULT true,
  created_at timestamptz DEFAULT current_timestamp,
  updated_at timestamptz DEFAULT current_timestamp
);
CREATE INDEX idx_security_settings_user_id ON public.security_settings(user_id);
CREATE TRIGGER update_security_settings_updated_at
  BEFORE UPDATE ON public.security_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4-23) Push Subscriptions
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- 4-24) Profile Embeddings
CREATE TABLE public.profile_embeddings (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  embedding vector(1536)
);


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
