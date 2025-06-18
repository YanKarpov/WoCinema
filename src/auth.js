import express from 'express';
import fs from 'fs/promises';
import bcrypt from 'bcrypt';

const router = express.Router();
const USERS_PATH = './users.json';

let users = [];

async function loadUsers() {
  if (users.length) return users;
  try {
    const data = await fs.readFile(USERS_PATH, 'utf-8');
    users = JSON.parse(data);
  } catch {
    users = [];
  }
}

async function saveUsers() {
  await fs.writeFile(USERS_PATH, JSON.stringify(users, null, 2));
}

// Регистрация
router.post('/register', express.json(), async (req, res) => {
  await loadUsers();
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Имя и пароль обязательны' });

  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: 'Пользователь уже есть' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: Date.now(), username, passwordHash, favorites: [] };
  users.push(user);
  await saveUsers();

  req.session.userId = user.id;
  res.json({ id: user.id, username: user.username });
});

// Логин
router.post('/login', express.json(), async (req, res) => {
  await loadUsers();
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) return res.status(400).json({ message: 'Неверные данные' });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(400).json({ message: 'Неверные данные' });

  req.session.userId = user.id;
  res.json({ id: user.id, username: user.username });
});

// Выход
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: 'OK' }));
});

// Проверка
router.get('/me', async (req, res) => {
  await loadUsers();
  const user = users.find(u => u.id === req.session.userId);
  if (!user) return res.status(401).json({ message: 'Нет авторизации' });
  res.json({ id: user.id, username: user.username });
});

// Избранное
router.get('/me/favorites', async (req, res) => {
  await loadUsers();
  const user = users.find(u => u.id === req.session.userId);
  if (!user) return res.status(401).json({ message: 'Нет авторизации' });
  res.json(user.favorites || []);
});

router.post('/me/favorites', express.json(), async (req, res) => {
  await loadUsers();
  const user = users.find(u => u.id === req.session.userId);
  if (!user) return res.status(401).json({ message: 'Нет авторизации' });

  const { movieId } = req.body;
  if (!movieId) return res.status(400).json({ message: 'movieId обязателен' });

  if (user.favorites.includes(movieId)) {
    user.favorites = user.favorites.filter(id => id !== movieId);
  } else {
    user.favorites.push(movieId);
  }

  await saveUsers();
  res.json(user.favorites);
});

export default router;
