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
    loginLink.textContent = 'Войти / Зарегистрироваться';
    loginLink.style.color = 'white';
    loginLink.style.fontWeight = 'bold';
    loginLink.style.textDecoration = 'underline';
    authContainer.appendChild(loginLink);
  }
}

async function loadMovies(search = '') {
  try {
    // Параллельно загружаем фильмы и избранное
    const [movies, favorites] = await Promise.all([
      fetchMovies(search),
      fetch('/auth/me/favorites').then(res => res.ok ? res.json() : [])
    ]);

    // Добавляем флаг избранного к каждому фильму
    movies.forEach(movie => {
      movie.isFavorite = favorites.includes(String(movie.id));
    });

    renderMovies(movies, moviesList, showMovieDetails);

    setupFavoriteButtons(); // Навесим обработчики на кнопки избранного

  } catch (error) {
    moviesList.innerHTML = `<p class="error">${error.message}</p>`;
    console.error('Ошибка:', error);
  }
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
      e.stopPropagation(); // чтобы клик по звёздочке не открывал модалку

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

        if (favorites.includes(movieId)) {
          button.textContent = '★'; // Заполненная звезда
          button.classList.add('favorite-active');
        } else {
          button.textContent = '☆'; // Пустая звезда
          button.classList.remove('favorite-active');
        }

      } catch (error) {
        console.error(error);
        alert('Ошибка сети');
      }
    };
  });
}

setupModalHandlers(modal, modalClose, closeModalHandler);
setupSearch(searchInput, loadMovies);

checkAuth();
loadMovies();
