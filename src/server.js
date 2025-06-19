import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import MongoDBStore from 'connect-mongodb-session';

import moviesRouter from './movies.js';
import authRouter from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const MongoDBStoreSession = MongoDBStore(session);

const store = new MongoDBStoreSession({
  uri: process.env.MONGODB_URI,
  collection: 'sessions',
});

store.on('error', function(error) {
  console.log('Session store error:', error);
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'supercat',
  resave: false,
  saveUninitialized: false,
  store,
  cookie: {
    secure: false,  
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.use(express.static(path.join(__dirname, '../public')));

app.use('/movies', moviesRouter);
app.use('/auth', authRouter);

export default app;
