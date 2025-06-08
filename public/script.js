const moviesList = document.getElementById('moviesList');
const searchInput = document.getElementById('searchInput');

const modal = document.getElementById('modal');
const modalClose = document.getElementById('modalClose');
const modalTitle = document.getElementById('modalTitle');
const modalYear = document.getElementById('modalYear');
const modalGenres = document.getElementById('modalGenres');
const modalRating = document.getElementById('modalRating');
const modalDescription = document.getElementById('modalDescription');

async function loadMovies(search = '') {
  const url = search ? `/movies?search=${encodeURIComponent(search)}` : '/movies';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Ошибка сети');
    const movies = await res.json();
    renderMovies(movies);
  } catch (error) {
    moviesList.innerHTML = `<p>Ошибка загрузки данных: ${error.message}</p>`;
  }
}

function renderMovies(movies) {
  if (movies.length === 0) {
    moviesList.innerHTML = '<p>Фильмы не найдены.</p>';
    return;
  }
  moviesList.innerHTML = movies.map(movie => `
    <div class="movie" data-id="${movie.id}">
      <p class="movie-title">
        ${movie.title} <span class="movie-year">(${movie.year || '—'})</span>
      </p>
      <p class="movie-desc">${movie.description || ''}</p>
    </div>
  `).join('');

  document.querySelectorAll('.movie').forEach(el => {
    el.addEventListener('click', () => {
      const movieId = el.getAttribute('data-id');
      showMovieDetails(movieId);
    });
  });
}

async function showMovieDetails(id) {
  try {
    const res = await fetch(`/movies/${id}`);
    if (!res.ok) throw new Error('Фильм не найден');
    const movie = await res.json();

    // Заголовок
    modalTitle.textContent = movie.title || 'Без названия';
    // Год — берем либо локально, либо из tmdbData.release_date
    modalYear.textContent = movie.year || (movie.tmdbData?.release_date ? movie.tmdbData.release_date.slice(0, 4) : '—');

    // Жанры — приоритет tmdbData.genres, иначе локальный genre
    if (movie.tmdbData?.genres && movie.tmdbData.genres.length) {
      modalGenres.textContent = movie.tmdbData.genres.map(g => g.name).join(', ');
    } else if (movie.genre && movie.genre.length) {
      modalGenres.textContent = movie.genre.join(', ');
    } else {
      modalGenres.textContent = '—';
    }

    // Рейтинг — приоритет tmdbData.vote_average, иначе локальный rating
    modalRating.textContent = movie.tmdbData?.vote_average ? movie.tmdbData.vote_average.toFixed(1) : (movie.rating || '—');

    // Описание — приоритет tmdbData.overview, иначе локальный description
    modalDescription.textContent = movie.tmdbData?.overview || movie.description || 'Описание отсутствует';

    // Удаляем предыдущий постер и iframe, если есть
    const oldPoster = modal.querySelector('.poster');
    if (oldPoster) oldPoster.remove();

    const oldIframe = modal.querySelector('iframe');
    if (oldIframe) oldIframe.remove();

    // Постер из TMDb, если есть
    if (movie.tmdbData?.poster_path) {
      const poster = document.createElement('img');
      poster.classList.add('poster');
      poster.src = `https://image.tmdb.org/t/p/w500${movie.tmdbData.poster_path}`;
      poster.alt = `${movie.title} постер`;
      modalTitle.insertAdjacentElement('afterend', poster);
    }

    // Видео с YouTube, если есть
    if (movie.youtubeId) {
      const iframe = document.createElement('iframe');
      iframe.width = "100%";
      iframe.height = "315";
      iframe.src = `https://www.youtube.com/embed/${movie.youtubeId}`;
      iframe.frameBorder = "0";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;

      modalDescription.insertAdjacentElement('afterend', iframe);
    }

    modal.classList.remove('hidden');
  } catch (error) {
    alert(error.message);
  }
}

function closeModal() {
  modal.classList.add('hidden');
  const oldPoster = modal.querySelector('.poster');
  if (oldPoster) oldPoster.remove();
  const oldIframe = modal.querySelector('iframe');
  if (oldIframe) oldIframe.remove();
}

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

searchInput.addEventListener('input', () => {
  loadMovies(searchInput.value);
});

loadMovies();
