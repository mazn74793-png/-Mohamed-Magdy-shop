import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import webpush from 'web-push';
import admin from 'firebase-admin';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
if (!admin.apps.length) {
  const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const db = admin.firestore();

// VAPID Keys setup
let vapidKeys = {
  publicKey: process.env.VITE_VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || ''
};

if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  const generated = webpush.generateVAPIDKeys();
  vapidKeys = generated;
  console.log('--- NEW VAPID KEYS GENERATED ---');
  console.log('VITE_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
  console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
  console.log('--- PLEASE SAVE THESE TO YOUR .env.example AND SETTINGS ---');
}

webpush.setVapidDetails(
  'mailto:motaem23y@gmail.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/vapid-public-key', (req, res) => {
    res.json({ publicKey: vapidKeys.publicKey });
  });

  app.post('/api/subscribe', async (req, res) => {
    const { subscription, userId } = req.body;
    try {
      await db.collection('subscriptions').doc(userId).set({
        subscription,
        userId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      res.status(201).json({});
    } catch (e) {
      res.status(500).json({ error: 'Failed to subscribe' });
    }
  });

  app.post('/api/notify-order', async (req, res) => {
    const { orderId } = req.body;
    
    try {
      // Find all admin subscriptions
      const adminsSnapshot = await db.collection('admins').get();
      const adminUids = adminsSnapshot.docs.map(doc => doc.id);
      
      // Also include the root admin
      const rootAdminEmail = 'motaem23y@gmail.com';
      // We need to find the UID for this email if possible, 
      // or just rely on the admins collection having the relevant UIDs.
      
      const subscriptionsSnapshot = await db.collection('subscriptions').get();
      const subscriptions = subscriptionsSnapshot.docs
        .filter(doc => adminUids.includes(doc.id) || doc.id === 'root_admin_placeholder_check') // In practice we'd match better
        .map(doc => doc.data().subscription);

      const payload = JSON.stringify({
        title: 'New Order! 🛍️',
        body: `Order #${orderId} just arrived. Check your dashboard!`,
        url: '/#orders'
      });

      const notifications = subscriptions.map(sub => 
        webpush.sendNotification(sub, payload).catch(err => {
          if (err.statusCode === 410) {
            // Subscription expired or removed
            // db.collection('subscriptions').doc(...).delete();
          }
          console.error('Push error:', err);
        })
      );

      await Promise.all(notifications);
      res.json({ success: true, notified: subscriptions.length });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to send notifications' });
    }
  });

  // Vite Middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
