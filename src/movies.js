import express from 'express';
import fetch from 'node-fetch';
import mongoose from 'mongoose';
import { requireAdmin } from './auth.js';

const router = express.Router();

const movieSchema = new mongoose.Schema({
  id: Number,          
  tmdbId: Number,
  title: String,
  year: Number,
  genre: [String],
  description: String,
  rating: Number,
  poster: String,
  youtubeId: String
});

const Movie = mongoose.model('Movie', movieSchema);

// GET /movies?search=
router.get('/', async (req, res) => {
  const search = (req.query.search || '').toLowerCase();

  let filter = {};
  if (search) {
    filter.title = { $regex: search, $options: 'i' };
  }

  let movies = await Movie.find(filter);

  const updatedMovies = await Promise.all(movies.map(async movie => {
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
        await movie.save();
      }
    } catch (e) {
      console.error(`Ошибка загрузки TMDb для фильма ${movie.id}`, e);
    }
    return movie;
  }));

  res.json(updatedMovies);
});

// GET /movies/:id
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const movie = await Movie.findOne({ id });
  if (!movie) return res.status(404).json({ message: 'Фильм не найден' });

  if (movie.tmdbId && !movie.youtubeId) {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movie.tmdbId}?api_key=${process.env.TMDB_API_KEY}&language=ru-RU&append_to_response=videos`
      );
      if (response.ok) {
        const tmdb = await response.json();
        const youtube = (tmdb.videos.results || []).find(v => v.site === 'YouTube' && v.type === 'Trailer');
        movie.youtubeId = youtube ? youtube.key : null;
        await movie.save();
      }
    } catch (e) {
      console.error('Ошибка TMDb API', e);
    }
  }

  res.json(movie);
});

// POST /movies — создать фильм (только админ)
router.post('/', requireAdmin, express.json(), async (req, res) => {
  const { id, tmdbId } = req.body;

  let movieData = {
    id,
    tmdbId,
    title: req.body.title,
    year: req.body.year,
    genre: req.body.genre,
    description: req.body.description,
    rating: req.body.rating,
    poster: req.body.poster,
    youtubeId: req.body.youtubeId
  };

  // Если указан tmdbId — подтянуть данные
  if (tmdbId) {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${process.env.TMDB_API_KEY}&language=ru-RU&append_to_response=videos`
      );
      if (response.ok) {
        const tmdb = await response.json();
        movieData.title = tmdb.title;
        movieData.year = tmdb.release_date ? Number(tmdb.release_date.split('-')[0]) : null;
        movieData.genre = tmdb.genres ? tmdb.genres.map(g => g.name) : [];
        movieData.description = tmdb.overview;
        movieData.rating = tmdb.vote_average;
        movieData.poster = tmdb.poster_path ? `https://image.tmdb.org/t/p/w500${tmdb.poster_path}` : null;

        const youtube = (tmdb.videos.results || []).find(v => v.site === 'YouTube' && v.type === 'Trailer');
        movieData.youtubeId = youtube ? youtube.key : null;
      }
    } catch (e) {
      console.error('Ошибка при загрузке TMDb', e);
    }
  }

  if (!movieData.title) {
    return res.status(400).json({ message: 'Название обязательно (укажите вручную или через tmdbId)' });
  }

  try {
    const movie = new Movie(movieData);
    await movie.save();
    res.json(movie);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка при сохранении фильма' });
  }
});

// PUT /movies/:id — обновить фильм (только админ)
router.put('/:id', requireAdmin, express.json(), async (req, res) => {
  try {
    const movie = await Movie.findOne({ id: Number(req.params.id) });
    if (!movie) return res.status(404).json({ message: 'Фильм не найден' });

    // Если обновляют tmdbId — подтянуть свежие данные
    if (req.body.tmdbId) {
      const tmdbId = req.body.tmdbId;
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${process.env.TMDB_API_KEY}&language=ru-RU&append_to_response=videos`
        );
        if (response.ok) {
          const tmdb = await response.json();
          movie.tmdbId = tmdbId;
          movie.title = tmdb.title;
          movie.year = tmdb.release_date ? Number(tmdb.release_date.split('-')[0]) : null;
          movie.genre = tmdb.genres ? tmdb.genres.map(g => g.name) : [];
          movie.description = tmdb.overview;
          movie.rating = tmdb.vote_average;
          movie.poster = tmdb.poster_path ? `https://image.tmdb.org/t/p/w500${tmdb.poster_path}` : null;

          const youtube = (tmdb.videos.results || []).find(v => v.site === 'YouTube' && v.type === 'Trailer');
          movie.youtubeId = youtube ? youtube.key : null;
        }
      } catch (e) {
        console.error('Ошибка TMDb API при обновлении', e);
      }
    } else {
      // Если tmdbId не обновляют — просто обновить поля вручную
      Object.assign(movie, req.body);
    }

    await movie.save();
    res.json(movie);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка при обновлении фильма' });
  }
});

// DELETE /movies/:id — удалить фильм (только админ)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const movie = await Movie.findOneAndDelete({ id: Number(req.params.id) });
    if (!movie) return res.status(404).json({ message: 'Фильм не найден' });

    res.json({ message: 'Фильм удалён' });
  } catch (e) {
    res.status(500).json({ message: 'Ошибка при удалении фильма' });
  }
});

export default router;
