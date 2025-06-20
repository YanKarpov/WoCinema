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
const showFavoritesBtn = document.getElementById('showFavoritesBtn');

let allMovies = [];
let showOnlyFavorites = false;

async function checkAuth() {
  try {
    console.log('Проверка авторизации...');
    const res = await fetch('/auth/me', {
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Неавторизован');
    const user = await res.json();
    console.log('Пользователь авторизован:', user);

    authContainer.innerHTML = '';
    const userDiv = document.createElement('div');
    userDiv.classList.add('header-user');

    const userNameSpan = document.createElement('span');
    userNameSpan.textContent = `Привет, ${user.username}`;

    const logoutBtn = document.createElement('button');
    logoutBtn.textContent = 'Выйти';
    logoutBtn.onclick = async () => {
      console.log('Запрос выхода из системы...');
      await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      location.reload();
    };

    userDiv.appendChild(userNameSpan);
    userDiv.appendChild(logoutBtn);
    authContainer.appendChild(userDiv);
  } catch (err) {
    console.log('Пользователь не авторизован:', err.message);
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
    console.log('Загрузка фильмов, поиск:', search);
    const [movies, favorites] = await Promise.all([
      fetchMovies(search),
      fetch('/auth/me/favorites', {
        credentials: 'include'
      }).then(res => res.ok ? res.json() : [])
    ]);
    console.log('Фильмы загружены:', movies.length);
    console.log('Избранные фильмы:', favorites);

    movies.forEach(movie => {
      movie.isFavorite = favorites.includes(String(movie.id));
    });

    allMovies = movies;
    renderCurrentMovies();
    setupFavoriteButtons();

  } catch (error) {
    console.error('Ошибка загрузки фильмов:', error);
    moviesList.innerHTML = `<p class="error">${error.message}</p>`;
  }
}

function renderCurrentMovies() {
  const filtered = showOnlyFavorites
    ? allMovies.filter(m => m.isFavorite)
    : allMovies;
  console.log('Рендер фильмов, фильтр избранных:', showOnlyFavorites, 'Всего:', filtered.length);
  renderMovies(filtered, moviesList, showMovieDetails);
  setupFavoriteButtons();
}

async function showMovieDetails(id) {
  try {
    console.log('Запрос деталей фильма, ID:', id);
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
    console.error('Ошибка при загрузке деталей фильма:', error);
    alert('Не удалось загрузить информацию о фильме');
  }
}

function closeModalHandler() {
  closeModal(modal, body, modalVideoContainer);
}

function setupFavoriteButtons() {
  const favButtons = document.querySelectorAll('.favorite-btn');
  console.log('Настройка кнопок избранного:', favButtons.length);
  favButtons.forEach(button => {
    button.onclick = async (e) => {
      e.stopPropagation();

      const movieCard = button.closest('.movie-card');
      const movieId = movieCard.getAttribute('data-id');
      console.log('Клик на избранное, фильм ID:', movieId);

      try {
        const res = await fetch('/auth/me/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ movieId }),
        });
        console.log('Ответ сервера по избранному:', res.status);

        if (!res.ok) {
          const data = await res.json();
          alert(data.message || 'Ошибка при обновлении избранного');
          return;
        }

        const favorites = await res.json();
        console.log('Обновленный список избранных:', favorites);

        allMovies.forEach(m => {
          m.isFavorite = favorites.includes(String(m.id));
        });

        renderCurrentMovies();

      } catch (error) {
        console.error('Ошибка сети при обновлении избранного:', error);
        alert('Ошибка сети');
      }
    };
  });
}

showFavoritesBtn.onclick = () => {
  showOnlyFavorites = !showOnlyFavorites;
  showFavoritesBtn.classList.toggle('active', showOnlyFavorites);
  showFavoritesBtn.textContent = showOnlyFavorites
    ? 'Показать все'
    : 'Показать избранные';

  console.log('Переключение фильтра избранных:', showOnlyFavorites);
  renderCurrentMovies();
};

setupModalHandlers(modal, modalClose, closeModalHandler);
setupSearch(searchInput, loadMovies);

checkAuth();
loadMovies();
