const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const quizzes = require('./data/quizzes');
const { renderHome, renderQuizPage, renderResultPage } = require('./views/render');

const app = express();
const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(express.static(path.join(__dirname, 'public')));

function findQuiz(id) {
  return quizzes.find((q) => q.id === id);
}

app.get('/', (req, res) => {
  res.send(renderHome(quizzes));
});

app.get('/q/:id', (req, res) => {
  const quiz = findQuiz(req.params.id);
  if (!quiz) return res.redirect('/');
  res.send(renderQuizPage(quiz));
});

app.get('/q/:id/r/:resultKey', (req, res) => {
  const quiz = findQuiz(req.params.id);
  if (!quiz || !quiz.results[req.params.resultKey]) return res.redirect('/');
  res.send(renderResultPage(quiz, req.params.resultKey));
});

// 不明なパスはホームへリダイレクト
app.get('*', (req, res) => {
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`しんだんラボ サーバーが http://localhost:${PORT} で起動しました`);
});
