export function renderMovies(movies, container, onMovieClick) {
  if (movies.length === 0) {
    container.innerHTML = '<p class="no-results">Фильмы не найдены</p>';
    return;
  }

  container.innerHTML = movies.map(movie => {
    const posterPath = movie.poster || 'https://via.placeholder.com/300x450?text=No+poster';
    const title = movie.title || 'Без названия';
    const year = movie.year || '—';
    const rating = movie.rating ? movie.rating.toFixed(1) : '—';

    return `
      <div class="movie-card" data-id="${movie.id}">
        <img class="movie-poster" src="${posterPath}" alt="${title}" loading="lazy">
        <button class="favorite-btn" aria-label="Добавить в избранное" title="Добавить в избранное">
          ${movie.isFavorite ? '★' : '☆'}
        </button>
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

  container.querySelectorAll('.movie-card').forEach(card => {
    card.addEventListener('click', () => {
      const movieId = card.getAttribute('data-id');
      onMovieClick(movieId);
    });
  });
}

export function renderMovieDetails(movie, modalElements) {
  const {
    modalTitle,
    modalYear,
    modalRuntime,
    modalRating,
    modalGenres,
    modalDescription,
    modalPoster,
    modalCast,
    modalVideoContainer,
  } = modalElements;

  modalTitle.textContent = movie.title || 'Без названия';
  modalYear.textContent = movie.year || '—';
  modalRuntime.textContent = movie.runtime ? `${Math.floor(movie.runtime / 60)}ч ${movie.runtime % 60}м` : '';
  modalRating.textContent = movie.rating ? movie.rating.toFixed(1) : '—';

  modalGenres.innerHTML = movie.genre
    ? movie.genre.map(g => `<span>${g}</span>`).join('')
    : '<span>—</span>';

  modalDescription.textContent = movie.description || 'Описание отсутствует';

  modalPoster.src = movie.poster || 'https://via.placeholder.com/500x750?text=No+poster';
  modalPoster.alt = `${movie.title} постер`;

  modalCast.innerHTML = ''; // Можно добавить позже

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
}
