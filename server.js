import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

let movies = [];
try {
  const data = fs.readFileSync('./movies.json', 'utf-8');
  movies = JSON.parse(data);
} catch (error) {
  console.error('Ошибка чтения movies.json', error);
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/movies', async (req, res) => {
  const search = req.query.search ? req.query.search.toLowerCase() : '';
  let filteredMovies = movies;

  if (search) {
    filteredMovies = movies.filter(movie => {
      const localTitle = movie.title && typeof movie.title === 'string' ? movie.title.toLowerCase() : '';
      const tmdbTitle = movie.tmdbData && movie.tmdbData.title && typeof movie.tmdbData.title === 'string' ? movie.tmdbData.title.toLowerCase() : '';
      
      return localTitle.includes(search) || tmdbTitle.includes(search);
    });
  }


  const moviesWithTmdb = await Promise.all(filteredMovies.map(async movie => {
    if (!movie.tmdbId || movie.tmdbData) return movie;
    
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movie.tmdbId}?api_key=${process.env.TMDB_API_KEY}&language=ru-RU`
      );
      if (response.ok) {
        return {
          ...movie,
          tmdbData: await response.json()
        };
      }
    } catch (error) {
      console.error(`Ошибка загрузки TMDb данных для фильма ${movie.id}`, error);
    }
    
    return movie;
  }));

  res.json(moviesWithTmdb);
});

app.get('/movies/:id', async (req, res) => {
  const id = Number(req.params.id);
  const movie = movies.find(m => m.id === id);

  if (!movie) {
    return res.status(404).json({ message: 'Фильм не найден' });
  }

  if (movie.tmdbId) {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movie.tmdbId}?api_key=${process.env.TMDB_API_KEY}&language=ru-RU&append_to_response=videos`
      );

      if (!response.ok) throw new Error('Ошибка TMDb API');

      const tmdbData = await response.json();

      const detailedMovie = {
        ...movie,
        tmdbData,
      };

      return res.json(detailedMovie);
    } catch (error) {
      console.error('Ошибка при запросе к TMDb', error);
      return res.json(movie);
    }
  } else {
    res.json(movie);
  }
});


app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
