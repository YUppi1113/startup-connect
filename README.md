# startup-connect

Startup Connect is a prototype social platform built with static HTML and JavaScript. It uses Supabase for authentication and data storage. The project showcases pages for login, registering new users, sending messages, managing groups and searching other members.

## Usage

Open `index.html` in your browser to explore the dashboard and navigate through the available pages. You can log in or register an account, view profiles and interact with other pages of the demo.

### Setting up `config.js`

The application expects a `config.js` file defining your Supabase credentials:

```javascript
window.__ENV__ = {
    SUPABASE_URL: 'https://your-project.supabase.co',
    SUPABASE_ANON_KEY: 'your-anon-key',
};
```

Edit `config.js` with the URL and anonymous key from your Supabase project. The repository includes a sample configuration which you can modify to suit your setup.

