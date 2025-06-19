import express from 'express';
import fetch from 'node-fetch';
import mongoose from 'mongoose';

const router = express.Router();

const movieSchema = new mongoose.Schema({
  id: Number,          // твой внутренний ID
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

  let updated = false;
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
        updated = true;
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

export default router;
