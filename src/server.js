import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';

import moviesRouter from './movies.js';
import authRouter from './auth.js'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(session({
  secret: 'supercat', 
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, 
    maxAge: 1000 * 60 * 60 * 24 
  }
}));

app.use(express.static(path.join(__dirname, '../public')));

app.use('/movies', moviesRouter);
app.use('/auth', authRouter); 

export default app;
