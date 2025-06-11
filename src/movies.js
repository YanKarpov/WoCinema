import express from 'express';
import fs from 'fs/promises';
import fetch from 'node-fetch';

const router = express.Router();
const MOVIES_PATH = './movies.json';

let movies = [];

async function loadMovies() {
  if (movies.length) return movies;
  try {
    const data = await fs.readFile(MOVIES_PATH, 'utf-8');
    movies = JSON.parse(data);
  } catch (error) {
    console.error('Ошибка чтения movies.json', error);
  }
  return movies;
}

async function saveMovies() {
  try {
    await fs.writeFile(MOVIES_PATH, JSON.stringify(movies, null, 2), 'utf-8');
  } catch (error) {
    console.error('Ошибка записи movies.json', error);
  }
}

// GET /movies?search=
router.get('/', async (req, res) => {
  await loadMovies();
  const search = (req.query.search || '').toLowerCase();

  let filtered = movies;
  if (search) {
    filtered = movies.filter(m => m.title && m.title.toLowerCase().includes(search));
  }

  let updated = false;
  const updatedMovies = await Promise.all(filtered.map(async movie => {
    if (!movie.tmdbId || movie.title) return movie;

    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movie.tmdbId}?api_key=${process.env.TMDB_API_KEY}&language=ru-RU`
      );
      if (response.ok) {
        const tmdb = await response.json();
        movie.title = tmdb.title || movie.title;
        movie.year = tmdb.release_date ? Number(tmdb.release_date.split('-')[0]) : null;
        movie.genre = tmdb.genres ? tmdb.genres.map(g => g.name) : [];
        movie.description = tmdb.overview || '';
        movie.rating = tmdb.vote_average || null;
        movie.poster = tmdb.poster_path ? `https://image.tmdb.org/t/p/w500${tmdb.poster_path}` : null;
        updated = true;
      }
    } catch (e) {
      console.error(`Ошибка загрузки TMDb для фильма ${movie.id}`, e);
    }
    return movie;
  }));

  if (updated) await saveMovies();

  res.json(updatedMovies);
});

// GET /movies/:id
router.get('/:id', async (req, res) => {
  await loadMovies();
  const id = Number(req.params.id);
  const movie = movies.find(m => m.id === id);
  if (!movie) return res.status(404).json({ message: 'Фильм не найден' });

  if (movie.tmdbId) {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movie.tmdbId}?api_key=${process.env.TMDB_API_KEY}&language=ru-RU&append_to_response=videos`
      );
      if (response.ok) {
        const tmdb = await response.json();
        const youtube = (tmdb.videos.results || []).find(v => v.site === 'YouTube' && v.type === 'Trailer');
        movie.youtubeId = youtube ? youtube.key : null;
        await saveMovies();
      }
    } catch (e) {
      console.error('Ошибка TMDb API', e);
    }
  }

  res.json(movie);
});

export default router;
