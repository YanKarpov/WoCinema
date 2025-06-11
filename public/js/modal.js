export function openModal(modal, body, createRoomBtn, movieId) {
  modal.classList.remove('hidden');
  body.style.overflow = 'hidden';

  createRoomBtn.onclick = () => {
    window.location.href = `/room.html?movieId=${movieId}`;
  };
}

export function closeModal(modal, body, modalVideoContainer) {
  modal.classList.add('hidden');
  body.style.overflow = 'auto';
  modalVideoContainer.innerHTML = '';
}

export function setupModalHandlers(modal, modalClose, closeModalFn) {
  modalClose.addEventListener('click', closeModalFn);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModalFn();
  });
}
