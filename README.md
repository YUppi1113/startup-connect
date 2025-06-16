Summary：
Startup Connect helps aspiring founders meet co-founders, mentors, and investors.
It offers advanced search, real-time chat, community groups, event management, and
AI-powered matching to streamline building a startup team.

The app now supports web push notifications using a service worker. After login
the client registers a push subscription which is stored in Supabase. The Node
server listens for new notification rows and sends a push payload to each saved
subscription.
