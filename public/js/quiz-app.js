document.addEventListener('DOMContentLoaded', () => {
  const quiz = window.__QUIZ__;
  if (!quiz) return;

  const startBtn = document.getElementById('start-btn');
  const introEl = document.getElementById('quiz-intro');
  const playEl = document.getElementById('quiz-play');
  const progressBar = document.getElementById('progress-bar');
  const questionCountEl = document.getElementById('question-count');
  const questionTextEl = document.getElementById('question-text');
  const optionsListEl = document.getElementById('options-list');

  let currentIndex = 0;
  const scores = {};

  function trackEvent(name, params = {}) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params);
    }
  }

  function renderQuestion() {
    const question = quiz.questions[currentIndex];
    questionCountEl.textContent = `${currentIndex + 1} / ${quiz.questions.length}`;
    progressBar.style.width = `${(currentIndex / quiz.questions.length) * 100}%`;
    questionTextEl.textContent = question.text;

    optionsListEl.innerHTML = '';
    question.options.forEach((option) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option-btn';
      btn.textContent = option.text;
      btn.addEventListener('click', () => selectOption(option));
      optionsListEl.appendChild(btn);
    });
  }

  function selectOption(option) {
    scores[option.type] = (scores[option.type] || 0) + 1;
    currentIndex += 1;

    if (currentIndex >= quiz.questions.length) {
      progressBar.style.width = '100%';
      finishQuiz();
    } else {
      renderQuestion();
    }
  }

  function finishQuiz() {
    let bestType = null;
    let bestScore = -1;
    Object.keys(scores).forEach((type) => {
      if (scores[type] > bestScore) {
        bestScore = scores[type];
        bestType = type;
      }
    });
    const matchPct = Math.round((bestScore / quiz.questions.length) * 100);
    const destination = `/q/${quiz.id}/r/${bestType}?s=${matchPct}`;
    let redirected = false;
    const redirect = () => {
      if (redirected) return;
      redirected = true;
      window.location.href = destination;
    };

    if (typeof window.gtag === 'function') {
      window.gtag('event', 'quiz_complete', {
        quiz_id: quiz.id,
        result_type: bestType,
        event_callback: redirect,
        event_timeout: 800,
      });
      window.setTimeout(redirect, 900);
    } else {
      redirect();
    }
  }

  startBtn.addEventListener('click', () => {
    introEl.hidden = true;
    playEl.hidden = false;
    currentIndex = 0;
    trackEvent('quiz_start', { quiz_id: quiz.id });
    renderQuestion();
  });
});
