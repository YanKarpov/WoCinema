export async function fetchMovies(search = '') {
  const url = search ? `/movies?search=${encodeURIComponent(search)}` : '/movies';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Ошибка загрузки данных');
  return res.json();
}

export async function fetchMovieDetails(id) {
  const res = await fetch(`/movies/${id}`);
  if (!res.ok) throw new Error('Фильм не найден');
  return res.json();
}
