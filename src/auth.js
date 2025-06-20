import express from 'express';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

const router = express.Router();

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  favorites: { type: [Number], default: [] },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
});

const User = mongoose.model('User', userSchema);

// Middleware для проверки авторизации
function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ message: 'Нет авторизации' });
  next();
}

// Middleware для проверки админа
async function requireAdmin(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ message: 'Нет авторизации' });
  const user = await User.findById(req.session.userId);
  if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Доступ запрещён' });
  req.user = user;
  next();
}

// Регистрация
router.post('/register', express.json(), async (req, res) => {
  const { username, password, adminCode } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Имя и пароль обязательны' });

  const existingUser = await User.findOne({ username });
  if (existingUser) return res.status(400).json({ message: 'Пользователь уже есть' });

  const passwordHash = await bcrypt.hash(password, 10);

  // Если передан секретный код для админа (задать в env)
  const isAdmin = adminCode === process.env.ADMIN_CODE;

  const user = new User({ username, passwordHash, role: isAdmin ? 'admin' : 'user' });

  try {
    await user.save();
  } catch (e) {
    return res.status(500).json({ message: 'Ошибка сервера' });
  }

  req.session.userId = user._id;
  res.json({ id: user._id, username: user.username, role: user.role });
});

// Логин
router.post('/login', express.json(), async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: 'Неверные данные' });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(400).json({ message: 'Неверные данные' });

  req.session.userId = user._id;
  res.json({ id: user._id, username: user.username, role: user.role });
});

// Выход
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: 'OK' }));
});

// Проверка
router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.session.userId);
  if (!user) return res.status(401).json({ message: 'Нет авторизации' });

  res.json({ id: user._id, username: user.username, role: user.role });
});

// Избранное
router.get('/me/favorites', requireAuth, async (req, res) => {
  const user = await User.findById(req.session.userId);
  if (!user) return res.status(401).json({ message: 'Нет авторизации' });

  res.json(user.favorites);
});

router.post('/me/favorites', requireAuth, express.json(), async (req, res) => {
  const { movieId } = req.body;
  if (!movieId) return res.status(400).json({ message: 'movieId обязателен' });

  const user = await User.findById(req.session.userId);
  if (!user) return res.status(401).json({ message: 'Нет авторизации' });

  const index = user.favorites.indexOf(movieId);
  if (index >= 0) {
    user.favorites.splice(index, 1);
  } else {
    user.favorites.push(movieId);
  }

  await user.save();
  res.json(user.favorites);
});

export { requireAuth, requireAdmin };
export default router;
