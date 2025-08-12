Summary：
Startup Connect helps aspiring founders meet co-founders, mentors, and investors.
It offers advanced search, real-time chat, community groups, event management, and
AI-powered matching to streamline building a startup team.

## Setup

1. Create a `.env` file with your Supabase and OpenAI credentials. The previous
   Supabase key has been revoked; store your new credentials **only** in this file:

   ```env
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_ANON_KEY=<your-anon-key>
   OPENAI_API_KEY=<your-openai-api-key>
   ```

   To enable optional push notifications, also provide `PUSH_VAPID_PUBLIC_KEY`
   and `PUSH_VAPID_PRIVATE_KEY`.

2. Run the build script to generate `config.js`:

   ```bash
   npm run build
   ```

   This executes `generate-config.js`, which reads the values from `.env` and
   writes a `config.js` file. The generated file is ignored by Git and must be
   regenerated whenever environment variables change.

3. *(Optional)* Build ES5-compatible scripts for older browsers:

   ```bash
   npm run build:legacy
   ```
4. Install dependencies, build Tailwind CSS and start the server:

   ```bash
   npm install
   npm run build:css
   npm start
   ```

If `config.js` is not generated correctly, the login and registration pages will
fail to connect to Supabase. Ensure the environment variables are set and the
build step has been executed.

## User Registration Flow

1. **Sign Up** – Visit `register.html` and create an account with your email
   and password or use the Google/GitHub buttons.
2. **Email Verification** – Supabase sends a verification link to the provided
   address. Clicking the link redirects you back to `login.html` so you can sign
   in.
3. **Automatic Profile Creation** – When your email is confirmed, a blank
   profile record is inserted along with default privacy, notification and
   security settings.
4. **Complete Startup Info** – After the first login you continue to step 2 of
   registration to fill out personal details and your startup information. This
   data is saved to the `profiles` and `startup_info` tables and a profile
   embedding is generated.
5. **Dashboard Access** – Upon completion you return to the login screen with a
   success message. Signing in then takes you to `dashboard.html` where your
   personalized feed and messages appear.

## Maintenance

To automatically mark past events as completed, run the following command. This
can be scheduled with cron for daily execution.

```bash
npm run complete-events
```
