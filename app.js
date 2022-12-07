const { query } = require("express");
const { user, password } = require("./config");
const express = require("express");
const mysql = require('mysql');
const moment = require('moment');
const session = require('express-session');
const bcrypt = require('bcrypt');
const axios = require('axios');
const cheerio = require('cheerio');
const currentTime = moment();
const app = express();
const PORT = 3000;

app.use('/public', express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: false}));

const connection = mysql.createConnection({
    host: 'localhost',
    user: user,
    password: password,
    database: 'muscle_app'
});

/*
const URL = 'https://www.esquire.com/jp/menshealth/fitness/a32441572/how-to-do-a-perfect-pushup/';
const data = [];

axios(URL)
  .then((res) => {
    const htmlParser = res.data;
    const $ = cheerio.load(htmlParser);
    $('.content-header', htmlParser).each(function () {
        const title = $(this).find('.content-hed').text();
        data.push({title});
        console.log(data);
    })
}).catch((error) => {
    console.log(error);
});
*/

app.use(
    session({
        secret: 'secret',
        resave: false,
        secure: false, //http通信:false, https通信:true
        saveUninitialized: false,
    })
);

app.use((req, res, next) => {
    if (req.session.userId === undefined) {
        res.locals.username = 'ゲスト';
        res.locals.isLoggedIn = false;
    } else {
        res.locals.username = req.session.username;
        res.locals.isLoggedIn = true;
    }
    next();
});

app.get('/', (req, res) => {
    res.render('top.ejs');
});

app.get('/news', (req, res) => {
    connection.query(
        'SELECT * FROM articles ORDER BY id DESC',
        (error, results) => {
            res.render('news.ejs', {articles: results});
        }
    );
});

app.get('/article/:id', (req, res) => {
    const id = req.params.id;
    connection.query(
        'SELECT * FROM articles WHERE id = ?',
        [id],
        (error, results) => {
            res.render('article.ejs', {article: results[0]});
        }
    );
});

app.get('/create', (req, res) => {
    res.render('create.ejs');
});

app.post('/create', (req, res) => {
    const title = req.body.title;
    const summary = req.body.summary;
    const content = req.body.content;
    connection.query(
        'INSERT INTO articles (title, summary, content) VALUES (?, ?, ?)',
        [title, summary, content],
        (error, results) => {
            res.redirect('/news');
        }
    );
});

app.get('/record', (req, res) => {
    const username = req.session.username;
    connection.query(
        'SELECT * FROM trainingRecord WHERE username = ?',
        [username],
        (error, results) => {
            console.log(results);
            res.render('record.ejs', {records: results});
        }
    );   
});

app.get('/train-record', (req, res) => {
    res.render('train-record.ejs');
});

app.post('/train-record', (req, res) => {
    const username = req.session.username;
    const now_day = currentTime.format("YYYY-MM-DD");
    const now_time = currentTime.format("HH:mm:ss");
    const content = req.body.content;
    connection.query(
        'INSERT INTO trainingRecord (username, trainingDay, trainingTime, content) VALUES (?, ?, ?, ?)',
        [username, now_day, now_time, content],
        (error, results) => {
            res.redirect('/record');
        }
    );
});

app.get('/record/edit/:id', (req, res) => {
    const id = req.params.id;
    connection.query(
        'SELECT * FROM trainingRecord WHERE id = ?',
        [id],
        (error, results) => {
            res.render('edit.ejs', {item: results[0]});
        }
    );
});

app.post('/record/edit/:id', (req, res) => {
    const id = req.params.id;
    const content = req.body.content;
    connection.query(
        'UPDATE trainingRecord SET content = ? WHERE id = ?',
        [content, id],
        (error, results) => {
            res.redirect('/record');
        }
    );
});

app.post('/record/delete/:id', (req, res) => {
    const id = req.params.id;
    connection.query(
        'DELETE FROM trainingRecord WHERE id = ?',
        [id],
        (error, results) => {
            res.redirect('/record');
        }
    );
});

app.get('/mypage', (req, res) => {
    const username = req.session.username;
    connection.query(
        'SELECT * FROM users WHERE username = ?',
        [username],
        (error, results) => {
            res.render('mypage.ejs', {user: results[0]});
        }
    );
})

app.get('/signup', (req, res) => {
    res.render('signup.ejs', {errors: []});
});

app.post('/signup', 
    (req, res, next) => {
        //入力値の空チェック
        const username = req.body.username;
        const email = req.body.email;
        const password = req.body.password;
        const errors = [];

        if (username === '') {
            errors.push('ユーザー名を入力してください');
        }
        if (email === '') {
            errors.push('メールアドレスを入力してください');
        }
        if (password === '') {
            errors.push('パスワードを入力してください');
        }
        
        if (errors.length > 0) {
            res.render('signup.ejs', {errors: errors});
        } else {
            next();
        }
    },
    (req, res, next) => {
        //ユーザー名の重複チェック
        const username = req.body.username;
        const errors = [];
        connection.query(
            'SELECT * FROM users WHERE username = ?',
            [username],
            (error, results) => {
                if (results.length > 0) {
                    errors.push('このユーザー名は既に登録されています');
                    res.render('signup.ejs', {errors: errors});
                } else {
                    next();
                }
            }
        );
    },
    (req, res, next) => {
        //メールアドレスの重複チェック
        const email = req.body.email;
        const errors = [];
        connection.query(
            'SELECT * FROM users WHERE email = ?',
            [email],
            (error, results) => {
                if (results.length > 0) {
                    errors.push('このメールアドレスは既に登録されています');
                    res.render('signup.ejs', {errors: errors});
                } else {
                    next();
                }
            }
        );
    },
    (req, res) => {
        //ユーザー登録
        const username = req.body.username;
        const email = req.body.email;
        const password = req.body.password;
        bcrypt.hash(password, 10, (error, hash) => {
            connection.query(
                'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                [username, email, hash],
                (error, results) => {
                    req.session.userId = results.insertId;
                    req.session.username = username;
                    res.redirect('/news');
                }
            );
        })
    }
);

app.get('/login', (req, res) => {
    res.render('login.ejs', {errors: []});
});

app.post('/login',
    (req, res, next) => {
        //入力値の空チェック
        const username = req.body.username;
        const password = req.body.password;
        const errors = [];
        if (username === '') {
            errors.push('ユーザー名を入力してください');
        }
        if (password === '') {
            errors.push('パスワードを入力してください');
        }

        if (errors.length > 0) {
            res.render('login.ejs', {errors: errors});
        } else {
            next();
        }
    },
    (req, res, next) => {
        //ユーザー名の有無チェック
        const username = req.body.username;
        const errors = [];
        connection.query(
            'SELECT * FROM users WHERE username = ?',
            [username],
            (error, results) => {
                if (results.length > 0) {
                    next();
                } else {
                    errors.push('ユーザー名が違います');
                    res.render('login.ejs', {errors: errors});
                }
            }
        );
    },
    (req, res) => {
        //パスワードチェック
        const username = req.body.username;
        const password = req.body.password;
        const errors = [];
        connection.query(
            'SELECT * FROM users WHERE username = ?',
            [username],
            (error, results) => {
                const hash = results[0].password;
                bcrypt.compare(password, hash, (error, isEqual) => {
                    if (isEqual) {
                            req.session.userId = results[0].id;
                            req.session.username = results[0].username;
                            res.redirect('/news');
                        } else {
                            errors.push('パスワードが違います');
                            res.render('login.ejs', {errors: errors});
                        }
                    });
            }
        );
    }  
);

app.get('/logout', (req, res) => {
    req.session.destroy((error) => {
        res.redirect('/news');
    })
})

app.listen(PORT, () =>{
    console.log("サーバーが起動しました．");
});
