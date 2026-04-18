# TJ Brand Atelier — Auto-reply webhook (example)

This is a minimal Node.js webhook + sender example that demonstrates how to automatically send a welcome message when your business receives an incoming message via WhatsApp (WhatsApp Cloud API) or Facebook Messenger / Instagram (via the Messenger API).

Important: This is a sample scaffold. To send messages from your business account you must configure and provide tokens from Meta (Facebook) Developer inbox / Business Manager. Do NOT put real tokens into public source control.

Quick setup

1. Copy env example and fill values:

   ```bash
   cp server/.env.example server/.env
   # Edit server/.env and paste your tokens & chosen VERIFY_TOKEN
   ```

2. Install dependencies and start:

   ```bash
   cd server
   npm install
   npm start
   ```

3. Webhook configuration (Meta Developer Console):

- For WhatsApp Cloud API: Add the webhook URL for your app and subscribe to `messages` and `messages_status` for the relevant WhatsApp Business Account. Use the same `VERIFY_TOKEN` value when setting the webhook in the console (hub.verify_token).
- For Messenger / Instagram DMs: add your webhook URL and subscribe to `messages` and `messaging_postbacks` events for your Page. Also configure the `VERIFY_TOKEN`.

4. Environment variables used (see `.env.example`):

- `VERIFY_TOKEN` — string you set in Meta Developer Webhooks for verification.
- `WHATSAPP_TOKEN` — WhatsApp Cloud API token (Bearer) to send messages via `/{phone_number_id}/messages`.
- `PAGE_ACCESS_TOKEN` — Page access token for sending Messenger/Instagram messages via `/me/messages`.
- `WELCOME_MESSAGE` — message text that will be sent automatically.

Notes and cautions

- This scaffold stores a small in-memory dedupe set to avoid repeated replies while the server runs; for production you should persist conversation state and respect user privacy and messaging policies.
- Meta / WhatsApp policies require opt-in / appropriate use of business messaging — ensure your use-case complies with Meta policies.
- This code is provided as an example to help you get started. I can help deploy it to a hosting provider (Heroku, Vercel serverless, Railway, DigitalOcean app) and guide you through Meta App configuration.

If you want, I can now:

- Fill `site/index.html` messenger/instagram placeholders (Facebook page and Instagram username) and wire a small admin note; or
- Continue and help you deploy this server and set up the webhook in your Meta app.
