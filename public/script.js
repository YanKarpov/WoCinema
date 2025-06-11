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
const modalVideoContainer = document.getElementById('modalVideoContainer');

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
    const posterPath = movie.poster 
      ? movie.poster 
      : 'https://via.placeholder.com/300x450?text=No+poster';
    const title = movie.title || 'Без названия';
    const year = movie.year || '—';
    const rating = movie.rating ? movie.rating.toFixed(1) : '—';

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

async function showMovieDetails(id) {
  try {
    const res = await fetch(`/movies/${id}`);
    if (!res.ok) throw new Error('Фильм не найден');

    const movie = await res.json();

    modalTitle.textContent = movie.title || 'Без названия';
    modalYear.textContent = movie.year || '—';
    modalRuntime.textContent = movie.runtime 
      ? `${Math.floor(movie.runtime / 60)}ч ${movie.runtime % 60}м`
      : '';
    modalRating.textContent = movie.rating ? movie.rating.toFixed(1) : '—';
    modalGenres.innerHTML = movie.genre
      ? movie.genre.map(g => `<span>${g}</span>`).join('')
      : '<span>—</span>';
    modalDescription.textContent = movie.description || 'Описание отсутствует';
    modalPoster.src = movie.poster 
      ? movie.poster 
      : 'https://via.placeholder.com/500x750?text=No+poster';
    modalPoster.alt = `${movie.title} постер`;

    modalCast.innerHTML = ''; // Можно будет позже добавить каст

    if (movie.youtubeId) {
      modalVideoContainer.innerHTML = `
        <iframe
          src="https://www.youtube.com/embed/${movie.youtubeId}"
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      `;
    } else {
      modalVideoContainer.innerHTML = '<p>Трейлер нема :(</p>';
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  } catch (error) {
    console.error('Ошибка:', error);
    alert('Не удалось загрузить информацию о фильме');
  }
}

function closeModal() {
  modal.classList.add('hidden');
  document.body.style.overflow = 'auto';
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
  return function () {
    const context = this, args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

loadMovies();
