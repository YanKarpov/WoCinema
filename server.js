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

// Функция для сохранения фильмов в файл
function saveMoviesToFile() {
  try {
    fs.writeFileSync('./movies.json', JSON.stringify(movies, null, 2), 'utf-8');
  } catch (error) {
    console.error('Ошибка при сохранении movies.json', error);
  }
}

app.use(express.static(path.join(__dirname, 'public')));

// Маршрут: список фильмов с возможностью поиска
app.get('/movies', async (req, res) => {
  const search = req.query.search ? req.query.search.toLowerCase() : '';
  let filteredMovies = movies;

  if (search) {
    filteredMovies = movies.filter(movie => {
      const localTitle = movie.title && typeof movie.title === 'string' ? movie.title.toLowerCase() : '';
      return localTitle.includes(search);
    });
  }

  const updated = [];

  const moviesWithTmdb = await Promise.all(filteredMovies.map(async movie => {
    if (!movie.tmdbId || movie.title) return movie; // если уже загружено

    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movie.tmdbId}?api_key=${process.env.TMDB_API_KEY}&language=ru-RU`
      );

      if (response.ok) {
        const tmdbData = await response.json();

        movie.title = tmdbData.title || movie.title;
        movie.year = tmdbData.release_date ? Number(tmdbData.release_date.split('-')[0]) : null;
        movie.genre = tmdbData.genres ? tmdbData.genres.map(g => g.name) : [];
        movie.description = tmdbData.overview || '';
        movie.rating = tmdbData.vote_average || null;
        movie.poster = tmdbData.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` : null;

        updated.push(true);
      }
    } catch (error) {
      console.error(`Ошибка загрузки TMDb данных для фильма ${movie.id}`, error);
    }

    return movie;
  }));

  if (updated.length > 0) {
    saveMoviesToFile();
  }

  res.json(moviesWithTmdb);
});

// Маршрут: детальная информация по фильму
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

      const youtubeVideo = (tmdbData.videos.results || []).find(
        v => v.site === 'YouTube' && v.type === 'Trailer'
      );

      movie.youtubeId = youtubeVideo ? youtubeVideo.key : null;

      saveMoviesToFile(); // если нашли youtubeId и обновили

      return res.json(movie);
    } catch (error) {
      console.error('Ошибка при запросе к TMDb', error);
      return res.json(movie);
    }
  } else {
    res.json(movie);
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
