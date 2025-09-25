import express from "express";
import session from "express-session";
import path from "path";
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { sequelize } from "./db.js";
import { Role, User, Book, Genre, Publishing_House, Author } from "./models.js";


const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

try {
    await sequelize.authenticate();
    console.log('фурычит')
} catch (e) {
    console.log('не фурычит ', e.message)
};

//  РЕГИСТРАЦИЯ АВТОРИЗАЦИЯ ПРОФИЛЬ АДМИН-ПАНЕЛЬ

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login')
    }
}

function hasRole(roleValue) {
    return async (req, res, next) => {
        if (req.session.user) {
            const user = await User.findByPk(req.session.user.id, { include: Role });
            if (user && user.Role.roleValue === roleValue) {
                next();
            } else {
                res.status(403).send('Доступ запрещен');
            }
        } else {
            res.redirect('/login');
        }
    };
}

app.get('/register', async (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    const { login, password, roleId } = req.body;
    try {
        const role = await Role.findByPk(roleId);
        if (!role) {
            return res.status(400).send('Роль не найдена');

        }
        const user = await User.create({ login, password, roleId });
        res.redirect('/login');
    } catch (e) {
        res.status(400).send('Ошибка регистрации ' + e.message);
    }
});

app.get('/login', async (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    const { login, password } = req.body;
    try {
        const user = await User.findOne({ where: { login, password }, include: Role });
        if (user) {
            req.session.user = { id: user.id, login: user.login, role: user.Role.roleValue };
            res.redirect('/profile')
        } else {
            res.status(401).send('Неверный логин или пароль');
        }
    } catch (e) {
        res.status(500).send('Ошибка сервера: ' + e.message);
    }
});

app.get('/profile', isAuthenticated, (req, res) => {
    res.render('profile');
});

app.get('/admin', isAuthenticated, hasRole('Админ'), async (req, res) => {
    const books = await Book.findAll({
        include: [Genre, Publishing_House, Author],
    });
    res.render('admin', { books });
});

app.get('/logout', isAuthenticated, (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});


// ГЛАВНАЯ СТРАНИЦА

app.get('/', async (req, res) => {
    const books = await Book.findAll({
        include: [Genre, Publishing_House, Author],
    });
    res.render('index', { books });
});


//  КНИГИ ЖАНРЫ ИЗДАТЕЛЬСТВА АВТОРЫ 

app.get('/add-genre', (req, res) => {
    res.render('add-genre');
});

app.get('/add-publishing-house', (req, res) => {
    res.render('add-publishing-house');
});

app.get('/add-author', (req, res) => {
    res.render('add-author');
});

app.get('/add-book', async (req, res) => {
    try {
        const genres = await Genre.findAll();
        const pHouses = await Publishing_House.findAll();
        const authors = await Author.findAll();
        res.render('add-book', { genres, pHouses, authors });
    } catch (e) {
        console.error('Ошибка выбора жанра или издания: ', e);
        res.status(500).send('Ошибка сервера')
    }
});

app.get('/edit-book/:id', async (req, res) => {
    try {
        const bookId = req.params.id;
        const book = await Book.findByPk(bookId, {
            include: [Genre, Publishing_House, Author],
        });
        const genres = await Genre.findAll();
        const pHouses = await Publishing_House.findAll();
        const authors = await Author.findAll();
        res.render('edit-book', { book, genres, pHouses, authors });
    } catch (e) {
        console.error('Ошибка выбора книги для изменения: ', e);
        res.status(500).send('Ошибка сервера')
    }
});

app.post('/add-genre', express.urlencoded({ extended: true }), async (req, res) => {
    const { name } = req.body;
    if (name) {
        await Genre.create({ name });
    }
    res.redirect('/');
});

app.post('/add-publishing-house', express.urlencoded({ extended: true }), async (req, res) => {
    const { name } = req.body;
    if (name) {
        await Publishing_House.create({ name });
    }
    res.redirect('/');
});

app.post('/add-author', express.urlencoded({ extended: true }), async (req, res) => {
    const { surname, name, patronymic } = req.body;
    if (surname && name) {
        await Author.create({ surname, name, patronymic });
    }
    res.redirect('/');
});

app.post('/add-book', express.urlencoded({ extended: true }), async (req, res) => {
    const { name, price, genreId, pHouseId, authorId } = req.body;

    if (name && price && genreId && pHouseId && authorId) {
        try {
            await Book.create({
                name,
                price,
                GenreId: genreId,
                PublishingHouseId: pHouseId,
                AuthorId: authorId,
            });
            res.redirect('/');
        } catch (e) {
            console.error('Ошибка добавления книги: ', e);
            res.status(500).send('Ошибка сервера');
        }
    } else {
        res.status(400).send('Заполнены не все поля');
    }
});

app.post('/delete-book/:id', async (req, res) => {
    try {
        const bookId = req.params.id;
        await Book.destroy(
            { where: { id: bookId } }
        );
        res.redirect('/');
    } catch (e) {
        console.error('Ошибка удаления книги: ', e);
        res.status(500).send('Ошибка сервера');
    }
});

app.post('/edit-book/:id', express.urlencoded({ extended: true }), async (req, res) => {
    try {
        const bookId = req.params.id;
        const { name, price, genreId, pHouseId, authorId } = req.body;

        await Book.update({
            name,
            price,
            GenreId: genreId,
            PublishingHouseId: pHouseId,
            AuthorId: authorId,
        },
            { where: { id: bookId } }
        );

        res.redirect('/');
    } catch (e) {
        console.error('Ошибка изменения книги: ', e);
        res.status(500).send('Ошибка сервера');
    }
});


(async () => {
    try {
        await sequelize.sync({ force: true });

        const roleUs = await Role.create({ roleValue: 'Юзер' });
        const roleAd = await Role.create({ roleValue: 'Админ' });

        const genre1 = await Genre.create({ name: 'Фантастика' });
        const genre2 = await Genre.create({ name: 'Ужасы' });

        const author1 = await Author.create({ surname: 'Герберт', name: 'Фрэнк' });
        const author2 = await Author.create({ surname: 'Лавкрафт', name: 'Говард' });

        const pubHouse1 = await Publishing_House.create({ name: 'АСТ' });
        const pubHouse2 = await Publishing_House.create({ name: 'Эксмо' });

        await User.create({
            login: 'Илья',
            password: '123',
            roleId: roleAd.id
        });

        await User.create({
            login: 'Олег',
            password: '321',
            roleId: roleUs.id
        });

        await User.create({
            login: 'Макар',
            password: '1',
            roleId: roleUs.id
        });

        await Book.create({
            name: 'Данвический ужас',
            price: 4.99,
            GenreId: genre2.id,
            PublishingHouseId: pubHouse1.id,
            AuthorId: author2.id
        });

        await Book.create({
            name: 'Дюна',
            price: 5.99,
            GenreId: genre1.id,
            PublishingHouseId: pubHouse2.id,
            AuthorId: author1.id
        });


        app.listen(PORT, () => console.log(`Фурычит на порту ${PORT}`))

    } catch (e) {
        console.error('Ошибка запуска: ', e);
    }
})();