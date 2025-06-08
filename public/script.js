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
        ${movie.title} <span class="movie-year">(${movie.year})</span>
      </p>
      <p class="movie-desc">${movie.description}</p>
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

    modalTitle.textContent = movie.title;
    modalYear.textContent = movie.year;
    modalGenres.textContent = movie.genre.join(', ');
    modalRating.textContent = movie.rating;
    modalDescription.textContent = movie.description;

    const oldIframe = modal.querySelector('iframe');
    if (oldIframe) oldIframe.remove();

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
