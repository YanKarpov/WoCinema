const express = require('express');
const fs = require('fs');
const path = require('path');
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

app.get('/movies', (req, res) => {
  const search = req.query.search ? req.query.search.toLowerCase() : '';
  let filteredMovies = movies;

  if (search) {
    filteredMovies = movies.filter(movie =>
      movie.title.toLowerCase().includes(search)
    );
  }

  res.json(filteredMovies);
});

app.get('/movies/:id', (req, res) => {
  const id = Number(req.params.id);
  const movie = movies.find(m => m.id === id);

  if (!movie) {
    return res.status(404).json({ message: 'Фильм не найден' });
  }

  res.json(movie);
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
