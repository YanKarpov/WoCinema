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

loadMovies();
