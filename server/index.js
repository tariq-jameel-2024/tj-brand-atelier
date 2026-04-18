require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json({ limit: '5mb' }));

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'change_me';
const WELCOME_MESSAGE = process.env.WELCOME_MESSAGE || 'Welcome to TJ Brand Atelier — we\'re happy to assist you.';

// Simple in-memory dedupe to avoid replying repeatedly during runtime.
const replied = new Set();

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified');
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  }
  res.sendStatus(400);
});

// Main webhook receiver (WhatsApp & Page events)
app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    // Handle WhatsApp Business events
    if (body.object === 'whatsapp_business_account' && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        for (const change of entry.changes || []) {
          const value = change.value || {};
          const messages = Array.isArray(value.messages) ? value.messages : [];
          const phoneNumberId = value.metadata && value.metadata.phone_number_id;

          for (const message of messages) {
            const from = message.from; // user's phone number
            if (!from || !phoneNumberId) continue;

            const key = `wa:${phoneNumberId}:${from}`;
            if (replied.has(key)) {
              console.log('Already replied to', key);
              continue;
            }

            // Only reply to text messages (basic safeguard)
            if (!message.text && message.type && message.type !== 'text') {
              continue;
            }

            await sendWhatsAppText(phoneNumberId, from, WELCOME_MESSAGE);
            replied.add(key);
          }
        }
      }

      return res.status(200).send('EVENT_RECEIVED');
    }

    // Handle Facebook Page (Messenger / IG via Messenger API) events
    if (body.object === 'page' && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        for (const event of entry.messaging || []) {
          const senderId = event.sender && event.sender.id;
          if (!senderId) continue;

          // Skip echoes (messages sent by the page itself)
          if (event.message && event.message.is_echo) continue;

          const key = `page:${senderId}`;
          if (replied.has(key)) {
            console.log('Already replied to page sender', key);
            continue;
          }

          if (event.message) {
            await sendMessengerText(senderId, WELCOME_MESSAGE);
            replied.add(key);
          }
        }
      }

      return res.status(200).send('EVENT_RECEIVED');
    }

    // Unhandled event types
    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook handler error:', err?.response?.data || err.message || err);
    res.sendStatus(500);
  }
});

async function sendWhatsAppText(phoneNumberId, to, text) {
  const token = process.env.WHATSAPP_TOKEN;
  if (!token) {
    console.warn('WHATSAPP_TOKEN not configured; skipping WhatsApp send.');
    return;
  }

  const url = `https://graph.facebook.com/v16.0/${phoneNumberId}/messages`;
  try {
    const payload = {
      messaging_product: 'whatsapp',
      to: to,
      text: { body: text }
    };

    const resp = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('WhatsApp message sent:', resp.data || '(no response body)');
  } catch (err) {
    console.error('WhatsApp send error:', err?.response?.data || err.message || err);
  }
}

async function sendMessengerText(recipientId, text) {
  const PAGE_TOKEN = process.env.PAGE_ACCESS_TOKEN;
  if (!PAGE_TOKEN) {
    console.warn('PAGE_ACCESS_TOKEN not configured; skipping Messenger send.');
    return;
  }

  const url = `https://graph.facebook.com/v16.0/me/messages?access_token=${encodeURIComponent(PAGE_TOKEN)}`;
  try {
    const payload = {
      recipient: { id: recipientId },
      message: { text: text }
    };

    const resp = await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' } });
    console.log('Messenger message sent:', resp.data || '(no response body)');
  } catch (err) {
    console.error('Messenger send error:', err?.response?.data || err.message || err);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`TJ auto-reply server listening on port ${PORT}`));
