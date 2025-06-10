const moviesList = document.getElementById('moviesList');
const searchInput = document.getElementById('searchInput');
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modalClose');
const modalTitle = document.getElementById('modalTitle');
const modalYear = document.getElementById('modalYear');
const modalRuntime = document.getElementById('modalRuntime');
const modalGenres = document.getElementById('modalGenres');
const modalRating = document.getElementById('modalRating');
const modalDescription = document.getElementById('modalDescription');
const modalPoster = document.getElementById('modalPoster');
const modalCast = document.getElementById('modalCast');
// Добавляем контейнер для видео
const modalVideoContainer = document.getElementById('modalVideoContainer');

// Загрузка фильмов
async function loadMovies(search = '') {
  try {
    const url = search ? `/movies?search=${encodeURIComponent(search)}` : '/movies';
    const res = await fetch(url);
    
    if (!res.ok) throw new Error('Ошибка загрузки данных');
    
    const movies = await res.json();
    renderMovies(movies);
  } catch (error) {
    moviesList.innerHTML = `<p class="error">${error.message}</p>`;
    console.error('Ошибка:', error);
  }
}

function renderMovies(movies) {
  if (movies.length === 0) {
    moviesList.innerHTML = '<p class="no-results">Фильмы не найдены</p>';
    return;
  }

  moviesList.innerHTML = movies.map(movie => {
    const tmdb = movie.tmdbData || {};
    const posterPath = tmdb.poster_path 
      ? `https://image.tmdb.org/t/p/w300${tmdb.poster_path}` 
      : 'https://via.placeholder.com/300x450?text=No+poster';
    const title = tmdb.title || movie.title || 'Без названия';
    const year = tmdb.release_date 
      ? tmdb.release_date.substring(0, 4) 
      : movie.year || '—';
    const rating = tmdb.vote_average 
      ? tmdb.vote_average.toFixed(1) 
      : movie.rating || '—';

    return `
      <div class="movie-card" data-id="${movie.id}">
        <img class="movie-poster" src="${posterPath}" alt="${title}" loading="lazy">
        <div class="movie-info">
          <h3 class="movie-title">${title}</h3>
          <div class="movie-meta">
            <span class="movie-year">${year}</span>
            ${rating !== '—' ? `<span class="movie-rating">★ ${rating}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.movie-card').forEach(card => {
    card.addEventListener('click', () => {
      const movieId = card.getAttribute('data-id');
      showMovieDetails(movieId);
    });
  });
}

// Показ деталей фильма
async function showMovieDetails(id) {
  try {
    const res = await fetch(`/movies/${id}`);
    if (!res.ok) throw new Error('Фильм не найден');
    
    const movie = await res.json();
    const tmdb = movie.tmdbData || {};

    modalTitle.textContent = tmdb.title || movie.title || 'Без названия';
    modalYear.textContent = tmdb.release_date 
      ? tmdb.release_date.substring(0, 4)
      : movie.year || '—';
    modalRuntime.textContent = tmdb.runtime 
      ? `${Math.floor(tmdb.runtime / 60)}ч ${tmdb.runtime % 60}м`
      : '';
    modalRating.textContent = tmdb.vote_average 
      ? tmdb.vote_average.toFixed(1)
      : movie.rating || '—';
    modalGenres.innerHTML = tmdb.genres 
      ? tmdb.genres.map(genre => `<span>${genre.name}</span>`).join('')
      : movie.genre 
        ? movie.genre.map(g => `<span>${g}</span>`).join('')
        : '<span>—</span>';
    modalDescription.textContent = tmdb.overview 
      ? tmdb.overview
      : movie.description || 'Описание отсутствует';
    modalPoster.src = tmdb.poster_path 
      ? `https://image.tmdb.org/t/p/w500${tmdb.poster_path}`
      : 'https://via.placeholder.com/500x750?text=No+poster';
    modalPoster.alt = `${movie.title} постер`;

    if (tmdb.credits && tmdb.credits.cast) {
      const topCast = tmdb.credits.cast.slice(0, 5);
      modalCast.innerHTML = `
        <h3>Актёры:</h3>
        <div class="cast-grid">
          ${topCast.map(actor => `
            <div class="actor">
              <p class="actor-name">${actor.name}</p>
              <p class="actor-character">${actor.character || '—'}</p>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      modalCast.innerHTML = '';
    }

    // Вставляем YouTube трейлер если есть
    let youtubeVideoId = '';
    if (tmdb.videos && tmdb.videos.results && tmdb.videos.results.length) {
      const trailer = tmdb.videos.results.find(v => v.site === 'YouTube' && v.type === 'Trailer');
      if (trailer) {
        youtubeVideoId = trailer.key;
      }
    }

    if (youtubeVideoId) {
      modalVideoContainer.innerHTML = `
        <iframe
          src="https://www.youtube.com/embed/${youtubeVideoId}"
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      `;
    } else {
      modalVideoContainer.innerHTML = '<p>Трейлер недоступен</p>';
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  } catch (error) {
    console.error('Ошибка:', error);
    alert('Не удалось загрузить информацию о фильме');
  }
}

// Закрытие модального окна
function closeModal() {
  modal.classList.add('hidden');
  document.body.style.overflow = 'auto';
  // Очистим видео, чтобы остановить плеер
  modalVideoContainer.innerHTML = '';
}

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

searchInput.addEventListener('input', debounce(() => {
  loadMovies(searchInput.value);
}, 300));

function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this, args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

loadMovies();
