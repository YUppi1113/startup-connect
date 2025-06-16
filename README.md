Summary：
Startup Connect helps aspiring founders meet co-founders, mentors, and investors.
It offers advanced search, real-time chat, community groups, event management, and
AI-powered matching to streamline building a startup team.

## Setup

1. Create a `.env` file with your Supabase credentials:

   ```env
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_ANON_KEY=<your-anon-key>
   PUSH_VAPID_PUBLIC_KEY=<your-vapid-key>
   ```

2. Generate `config.js` from the template:

   ```bash
   npm run build
   ```

3. Install dependencies and start the server:

   ```bash
   npm install
   npm start
   ```

If `config.js` is not generated correctly, the login and registration pages will
fail to connect to Supabase. Ensure the environment variables are set and the
build step has been executed.
