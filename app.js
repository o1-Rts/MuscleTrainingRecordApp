const { query } = require("express");
const express = require("express");
const mysql = require('mysql');
const moment = require('moment');
const { user, password } = require("./config");
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
    connection.query(
        'SELECT * FROM trainingRecord WHERE userId = ?',
        ['user1'],
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
    const user_id = 'user1';
    const now_day = currentTime.format("YYYY-MM-DD");
    const now_time = currentTime.format("HH:mm:ss");
    const content = req.body.content;
    connection.query(
        'INSERT INTO trainingRecord (userId, trainingDay, trainingTime, content) VALUES (?, ?, ?, ?)',
        [user_id, now_day, now_time, content],
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

app.listen(PORT, () =>{
    console.log("サーバーが起動しました．");
});
