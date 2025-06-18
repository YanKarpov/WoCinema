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
const header = document.querySelector('header');

async function checkAuth() {
  try {
    const res = await fetch('/auth/me');
    if (!res.ok) throw new Error('Неавторизован');
    const user = await res.json();

    // Удаляем ссылку входа/регистрации
    const loginLink = header.querySelector('a[href="/auth.html"]');
    if (loginLink) loginLink.remove();

    // Добавляем имя пользователя и кнопку выхода
    const userDiv = document.createElement('div');
    userDiv.style.color = 'white';
    userDiv.style.marginLeft = '20px';
    userDiv.style.fontWeight = 'bold';
    userDiv.textContent = `Привет, ${user.username}`;

    const logoutBtn = document.createElement('button');
    logoutBtn.textContent = 'Выйти';
    logoutBtn.style.marginLeft = '10px';
    logoutBtn.style.cursor = 'pointer';
    logoutBtn.onclick = async () => {
      await fetch('/auth/logout', { method: 'POST' });
      location.reload();
    };

    header.appendChild(userDiv);
    header.appendChild(logoutBtn);
  } catch {
    // Не авторизован — оставляем ссылку на вход
  }
}

async function loadMovies(search = '') {
  try {
    const movies = await fetchMovies(search);
    renderMovies(movies, moviesList, showMovieDetails);
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

setupModalHandlers(modal, modalClose, closeModalHandler);
setupSearch(searchInput, loadMovies);

checkAuth();
loadMovies();
