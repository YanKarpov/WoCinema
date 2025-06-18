import { fetchMovies, fetchMovieDetails } from './api.js';
import { renderMovies, renderMovieDetails } from './render.js';
import { openModal, closeModal, setupModalHandlers } from './modal.js';
import { setupSearch } from './search.js';

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
const createRoomBtn = document.getElementById('createRoomBtn');
const body = document.body;
const authContainer = document.getElementById('authContainer');
const showFavoritesBtn = document.getElementById('showFavoritesBtn'); // Добавили кнопку

// Новый флаг и массив
let allMovies = [];
let showOnlyFavorites = false;

async function checkAuth() {
  try {
    const res = await fetch('/auth/me');
    if (!res.ok) throw new Error('Неавторизован');
    const user = await res.json();

    authContainer.innerHTML = ''; // очистить
    const userDiv = document.createElement('div');
    userDiv.classList.add('header-user');

    const userNameSpan = document.createElement('span');
    userNameSpan.textContent = `Привет, ${user.username}`;

    const logoutBtn = document.createElement('button');
    logoutBtn.textContent = 'Выйти';
    logoutBtn.onclick = async () => {
      await fetch('/auth/logout', { method: 'POST' });
      location.reload();
    };

    userDiv.appendChild(userNameSpan);
    userDiv.appendChild(logoutBtn);
    authContainer.appendChild(userDiv);
  } catch {
    // Не авторизован — показать ссылку на вход
    authContainer.innerHTML = '';
    const loginLink = document.createElement('a');
    loginLink.href = '/auth.html';
    loginLink.textContent = 'Уже с нами? Войдите или зарегистрируйтесь';
    loginLink.style.color = 'white';
    loginLink.style.fontWeight = 'bold';
    authContainer.appendChild(loginLink);
  }
}

async function loadMovies(search = '') {
  try {
    const [movies, favorites] = await Promise.all([
      fetchMovies(search),
      fetch('/auth/me/favorites').then(res => res.ok ? res.json() : [])
    ]);

    movies.forEach(movie => {
      movie.isFavorite = favorites.includes(String(movie.id));
    });

    allMovies = movies; // Сохраняем все фильмы
    renderCurrentMovies();
    setupFavoriteButtons();

  } catch (error) {
    moviesList.innerHTML = `<p class="error">${error.message}</p>`;
    console.error('Ошибка:', error);
  }
}

// Новый рендер с фильтрацией
function renderCurrentMovies() {
  const filtered = showOnlyFavorites
    ? allMovies.filter(m => m.isFavorite)
    : allMovies;

  renderMovies(filtered, moviesList, showMovieDetails);
  setupFavoriteButtons(); // Чтобы кнопки заново навесились
}

async function showMovieDetails(id) {
  try {
    const movie = await fetchMovieDetails(id);
    renderMovieDetails(movie, {
      modalTitle,
      modalYear,
      modalRuntime,
      modalRating,
      modalGenres,
      modalDescription,
      modalPoster,
      modalCast,
      modalVideoContainer
    });

    openModal(modal, body, createRoomBtn, id);
  } catch (error) {
    console.error('Ошибка:', error);
    alert('Не удалось загрузить информацию о фильме');
  }
}

function closeModalHandler() {
  closeModal(modal, body, modalVideoContainer);
}

function setupFavoriteButtons() {
  const favButtons = document.querySelectorAll('.favorite-btn');
  favButtons.forEach(button => {
    button.onclick = async (e) => {
      e.stopPropagation();

      const movieCard = button.closest('.movie-card');
      const movieId = movieCard.getAttribute('data-id');

      try {
        const res = await fetch('/auth/me/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ movieId }),
        });

        if (!res.ok) {
          const data = await res.json();
          alert(data.message || 'Ошибка при обновлении избранного');
          return;
        }

        const favorites = await res.json();

        allMovies.forEach(m => {
          m.isFavorite = favorites.includes(String(m.id));
        });

        renderCurrentMovies(); // Перерендерим с новым избранным

      } catch (error) {
        console.error(error);
        alert('Ошибка сети');
      }
    };
  });
}

// Новый обработчик кнопки Показывать Избранные
showFavoritesBtn.onclick = () => {
  showOnlyFavorites = !showOnlyFavorites;
  showFavoritesBtn.classList.toggle('active', showOnlyFavorites);
  showFavoritesBtn.textContent = showOnlyFavorites
    ? 'Показать все'
    : 'Показать избранные';

  renderCurrentMovies();
};

setupModalHandlers(modal, modalClose, closeModalHandler);
setupSearch(searchInput, loadMovies);

checkAuth();
loadMovies();
