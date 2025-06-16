# SQL Schema

create table public.groups (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text not null,
  category text not null,
  is_private boolean null default false,
  admin_id uuid not null,
  group_image_url text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint groups_pkey primary key (id),
  constraint groups_admin_id_fkey foreign KEY (admin_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_groups_admin on public.groups using btree (admin_id) TABLESPACE pg_default;

create index IF not exists idx_groups_category on public.groups using btree (category) TABLESPACE pg_default;

create index IF not exists idx_groups_created_at on public.groups using btree (created_at desc) TABLESPACE pg_default;

create trigger handle_groups_updated_at BEFORE
update on groups for EACH row
execute FUNCTION handle_updated_at ();


zcreate table public.group_messages (
  id uuid not null default gen_random_uuid (),
  group_id uuid not null,
  user_id uuid not null,
  content text not null,
  file_urls text[] null default '{}'::text[],
  created_at timestamp with time zone null default now(),
  constraint group_messages_pkey primary key (id),
  constraint group_messages_group_id_fkey foreign KEY (group_id) references groups (id) on delete CASCADE,
  constraint group_messages_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_group_messages_group on public.group_messages using btree (group_id) TABLESPACE pg_default;

create index IF not exists idx_group_messages_created on public.group_messages using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_group_messages_user on public.group_messages using btree (user_id) TABLESPACE pg_default;


create table public.group_members (
  id uuid not null default gen_random_uuid (),
  group_id uuid not null,
  user_id uuid not null,
  role text null default 'member'::text,
  joined_at timestamp with time zone null default now(),
  constraint group_members_pkey primary key (id),
  constraint group_members_group_id_user_id_key unique (group_id, user_id),
  constraint group_members_group_id_fkey foreign KEY (group_id) references groups (id) on delete CASCADE,
  constraint group_members_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_group_members_group on public.group_members using btree (group_id) TABLESPACE pg_default;

create index IF not exists idx_group_members_user on public.group_members using btree (user_id) TABLESPACE pg_default;


create table public.follows (
  id uuid not null default gen_random_uuid (),
  follower_id uuid null,
  following_id uuid null,
  created_at timestamp with time zone null default now(),
  constraint follows_pkey primary key (id),
  constraint follows_follower_id_following_id_key unique (follower_id, following_id),
  constraint follows_follower_id_fkey foreign KEY (follower_id) references auth.users (id) on delete CASCADE,
  constraint follows_following_id_fkey foreign KEY (following_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_follows_follower on public.follows using btree (follower_id) TABLESPACE pg_default;

create index IF not exists idx_follows_following on public.follows using btree (following_id) TABLESPACE pg_default;


create table public.events (
  id uuid not null default gen_random_uuid (),
  title text not null,
  description text not null,
  location text not null,
  event_date timestamp with time zone not null,
  start_time time without time zone not null,
  end_time time without time zone not null,
  organizer_id uuid null,
  max_attendees integer null,
  event_type text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  address text null,
  online_url text null,
  fee integer not null default 0,
  image_url text null,
  format text null,
  constraint events_pkey primary key (id),
  constraint events_organizer_id_fkey foreign KEY (organizer_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_events_date on public.events using btree (event_date) TABLESPACE pg_default;

create trigger handle_events_updated_at BEFORE
update on events for EACH row
execute FUNCTION handle_updated_at ();


create table public.event_participants (
  id uuid not null default gen_random_uuid (),
  event_id uuid null,
  user_id uuid null,
  status text null default 'registered'::text,
  registered_at timestamp with time zone null default now(),
  constraint event_participants_pkey primary key (id),
  constraint event_participants_event_id_user_id_key unique (event_id, user_id),
  constraint event_participants_event_id_fkey foreign KEY (event_id) references events (id) on delete CASCADE,
  constraint event_participants_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_event_participants_event on public.event_participants using btree (event_id) TABLESPACE pg_default;

create index IF not exists idx_event_participants_user on public.event_participants using btree (user_id) TABLESPACE pg_default;


create table public.blocked_users (
  id uuid not null default gen_random_uuid (),
  blocker_id uuid null,
  blocked_id uuid null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint blocked_users_pkey primary key (id),
  constraint blocked_users_blocker_id_blocked_id_key unique (blocker_id, blocked_id),
  constraint blocked_users_blocked_id_fkey foreign KEY (blocked_id) references auth.users (id) on delete CASCADE,
  constraint blocked_users_blocker_id_fkey foreign KEY (blocker_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_blocked_users_blocker_id on public.blocked_users using btree (blocker_id) TABLESPACE pg_default;

create index IF not exists idx_blocked_users_blocked_id on public.blocked_users using btree (blocked_id) TABLESPACE pg_default;


create table public.direct_messages (
  id uuid not null default gen_random_uuid (),
  sender_id uuid null,
  receiver_id uuid null,
  content text not null,
  is_read boolean null default false,
  file_url text[] null default '{}'::text[],
  created_at timestamp with time zone null default now(),
  constraint direct_messages_pkey primary key (id),
  constraint direct_messages_receiver_id_fkey foreign KEY (receiver_id) references profiles (id) on delete CASCADE,
  constraint direct_messages_sender_id_fkey foreign KEY (sender_id) references profiles (id) on delete CASCADE,
  constraint direct_messages_sender_id_fkey1 foreign KEY (sender_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_direct_messages_sender on public.direct_messages using btree (sender_id) TABLESPACE pg_default;

create index IF not exists idx_direct_messages_receiver on public.direct_messages using btree (receiver_id) TABLESPACE pg_default;

create index IF not exists idx_direct_messages_created on public.direct_messages using btree (created_at desc) TABLESPACE pg_default;


create table public.projects (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  title text not null,
  description text null,
  image_url text null,
  project_url text null,
  technologies text[] null default '{}'::text[],
  start_date date null,
  end_date date null,
  status text not null default 'completed'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint projects_pkey primary key (id),
  constraint projects_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_projects_user_id on public.projects using btree (user_id) TABLESPACE pg_default;

create trigger handle_projects_updated_at BEFORE
update on projects for EACH row
execute FUNCTION handle_updated_at ();


create table public.profiles (
  id uuid not null,
  first_name text not null,
  last_name text not null,
  location text not null,
  age_range text not null,
  bio text null,
  linkedin_url text null,
  profile_image_url text null,
  skills text[] null default '{}'::text[],
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  phone character varying(20) null,
  timezone character varying(50) null default 'Asia/Tokyo'::character varying,
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists idx_profiles_user_id on public.profiles using btree (id) TABLESPACE pg_default;

create trigger create_user_settings_trigger
after INSERT on profiles for EACH row
execute FUNCTION create_user_settings ();

create trigger handle_profiles_updated_at BEFORE
update on profiles for EACH row
execute FUNCTION handle_updated_at ();


create table public.privacy_settings (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  profile_visibility character varying(20) null default 'public'::character varying,
  contact_visibility character varying(20) null default 'connections'::character varying,
  activity_projects boolean null default true,
  activity_groups boolean null default true,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint privacy_settings_pkey primary key (id),
  constraint privacy_settings_user_id_key unique (user_id),
  constraint privacy_settings_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint privacy_settings_contact_visibility_check check (
    (
      (contact_visibility)::text = any (
        (
          array[
            'public'::character varying,
            'connections'::character varying,
            'private'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint privacy_settings_profile_visibility_check check (
    (
      (profile_visibility)::text = any (
        (
          array[
            'public'::character varying,
            'connections'::character varying,
            'private'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_privacy_settings_user_id on public.privacy_settings using btree (user_id) TABLESPACE pg_default;

create trigger update_privacy_settings_updated_at BEFORE
update on privacy_settings for EACH row
execute FUNCTION update_updated_at_column ();


create table public.posts (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  content text not null,
  image_urls text[] null default '{}'::text[],
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint posts_pkey primary key (id),
  constraint posts_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_posts_user_id on public.posts using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_posts_created_at on public.posts using btree (created_at) TABLESPACE pg_default;

create trigger handle_posts_updated_at BEFORE
update on posts for EACH row
execute FUNCTION handle_updated_at ();


create table public.post_likes (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  post_id uuid null,
  created_at timestamp with time zone null default now(),
  constraint post_likes_pkey primary key (id),
  constraint post_likes_user_id_post_id_key unique (user_id, post_id),
  constraint post_likes_post_id_fkey foreign KEY (post_id) references posts (id) on delete CASCADE,
  constraint post_likes_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_post_likes_user_id on public.post_likes using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_post_likes_post_id on public.post_likes using btree (post_id) TABLESPACE pg_default;


create table public.post_comments (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  post_id uuid null,
  content text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint post_comments_pkey primary key (id),
  constraint post_comments_post_id_fkey foreign KEY (post_id) references posts (id) on delete CASCADE,
  constraint post_comments_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_post_comments_user_id on public.post_comments using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_post_comments_post_id on public.post_comments using btree (post_id) TABLESPACE pg_default;

create trigger handle_post_comments_updated_at BEFORE
update on post_comments for EACH row
execute FUNCTION handle_updated_at ();


create table public.notifications (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  type text not null,
  title text not null,
  content text not null,
  is_read boolean null default false,
  related_id uuid null,
  created_at timestamp with time zone null default now(),
  constraint notifications_pkey primary key (id),
  constraint notifications_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_notifications_user on public.notifications using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_notifications_read on public.notifications using btree (is_read) TABLESPACE pg_default;


create table public.notification_settings (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  email_direct_messages boolean null default true,
  email_mentions boolean null default true,
  email_follow boolean null default false,
  email_events boolean null default true,
  email_marketing boolean null default false,
  app_messages boolean null default true,
  app_activity boolean null default true,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint notification_settings_pkey primary key (id),
  constraint notification_settings_user_id_key unique (user_id),
  constraint notification_settings_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_notification_settings_user_id on public.notification_settings using btree (user_id) TABLESPACE pg_default;

create trigger update_notification_settings_updated_at BEFORE
update on notification_settings for EACH row
execute FUNCTION update_updated_at_column ();


create table public.user_sessions (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  session_token text null,
  device_info text null,
  ip_address inet null,
  location text null,
  user_agent text null,
  is_current boolean null default false,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  last_activity timestamp with time zone null default CURRENT_TIMESTAMP,
  expires_at timestamp with time zone null,
  constraint user_sessions_pkey primary key (id),
  constraint user_sessions_session_token_key unique (session_token),
  constraint user_sessions_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_sessions_user_id on public.user_sessions using btree (user_id) TABLESPACE pg_default;


create table public.startup_info (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  startup_status text not null,
  industries text[] null default '{}'::text[],
  business_idea text null,
  looking_for text not null,
  challenges text[] null default '{}'::text[],
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint startup_info_pkey primary key (id),
  constraint startup_info_profile_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_startup_info_user_id on public.startup_info using btree (user_id) TABLESPACE pg_default;

create trigger handle_startup_info_updated_at BEFORE
update on startup_info for EACH row
execute FUNCTION handle_updated_at ();


create table public.shared_files (
  id uuid not null default gen_random_uuid (),
  name text not null,
  file_url text not null,
  file_size integer null,
  file_type text null,
  uploaded_by uuid null,
  group_id uuid null,
  message_id uuid null,
  created_at timestamp with time zone null default now(),
  constraint shared_files_pkey primary key (id),
  constraint shared_files_uploaded_by_fkey foreign KEY (uploaded_by) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;


create table public.security_settings (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  two_factor_enabled boolean null default false,
  two_factor_secret text null,
  backup_codes text[] null,
  last_password_change timestamp with time zone null default CURRENT_TIMESTAMP,
  login_notifications boolean null default true,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint security_settings_pkey primary key (id),
  constraint security_settings_user_id_key unique (user_id),
  constraint security_settings_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_security_settings_user_id on public.security_settings using btree (user_id) TABLESPACE pg_default;

create trigger update_security_settings_updated_at BEFORE
update on security_settings for EACH row
execute FUNCTION update_updated_at_column ();




