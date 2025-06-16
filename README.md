Summary：
Startup Connect helps aspiring founders meet co-founders, mentors, and investors.
It offers advanced search, real-time chat, community groups, event management, and
AI-powered matching to streamline building a startup team.

## Setup

1. Copy `.env.example` to `.env` and provide your Supabase credentials:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your values:

   ```env
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_ANON_KEY=<your-anon-key>
   PUSH_VAPID_PUBLIC_KEY=<your-vapid-key>
   ```

2. Generate `config.js` from the template:

   ```bash
   npm run build
   ```

   This command reads the `.env` file and writes a `config.js` file used by the
   frontend. If `config.js` still contains placeholder values, authentication will
   fail.

3. Install dependencies and start the server:

   ```bash
   npm install
   npm start
   ```

4. (Optional) Run tests to verify the basic functionality:

   ```bash
   npm test --silent
   ```

### Troubleshooting

If you see an alert that `config.js` is not configured when opening the login or
registration pages, check that your `.env` values are correct and rerun
`npm run build`.

If `config.js` is not generated correctly, the login and registration pages will
fail to connect to Supabase. Ensure the environment variables are set and the
build step has been executed.
