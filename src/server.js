import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import moviesRouter from './movies.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.static(path.join(__dirname, '../public')));
app.use('/movies', moviesRouter);

export default app;
