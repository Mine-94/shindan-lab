document.addEventListener('DOMContentLoaded', () => {
  const data = window.__TYPE16_TEST__;
  const root = document.querySelector('[data-type16-test]');
  const compareContext = window.__TYPE16_COMPARE__ || {};
  if (!data || !root || !Array.isArray(data.questions)) return;

  const intro = document.getElementById('type16-intro');
  const play = document.getElementById('type16-play');
  const startButton = document.getElementById('type16-start-btn');
  const backButton = document.getElementById('type16-back-btn');
  const progressBar = document.getElementById('type16-progress-bar');
  const count = document.getElementById('type16-question-count');
  const axisHint = document.getElementById('type16-axis-hint');
  const questionText = document.getElementById('type16-question-text');
  const options = document.getElementById('type16-options');

  let currentIndex = 0;
  let answers = [];
  let redirecting = false;

  function track(name, params = {}) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params);
    }
  }

  function axisLabel(axis) {
    const labels = {
      EI: 'エネルギーの向き',
      SN: '情報の受け取り方',
      TF: '判断のよりどころ',
      JP: '予定との付き合い方',
    };
    return labels[axis] || axis;
  }

  function renderQuestion() {
    const question = data.questions[currentIndex];
    if (!question) return;

    count.textContent = `${currentIndex + 1} / ${data.questions.length}`;
    axisHint.textContent = axisLabel(question.axis);
    questionText.textContent = question.text;
    progressBar.style.width = `${(currentIndex / data.questions.length) * 100}%`;
    backButton.hidden = currentIndex === 0;
    options.innerHTML = '';

    question.options.forEach((option, optionIndex) => {
      const button = document.createElement('button');
      button.className = 'quiz-option-btn';
      button.type = 'button';
      button.textContent = option.text;
      button.dataset.optionIndex = String(optionIndex);
      button.addEventListener('click', () => selectOption(question, option));
      options.appendChild(button);
    });
  }

  function selectOption(question, option) {
    if (redirecting) return;
    answers.push({ axis: question.axis, pole: option.pole });
    currentIndex += 1;

    if (currentIndex >= data.questions.length) {
      progressBar.style.width = '100%';
      finish();
      return;
    }
    renderQuestion();
  }

  function calculateResult() {
    const score = {
      E: 0,
      I: 0,
      S: 0,
      N: 0,
      T: 0,
      F: 0,
      J: 0,
      P: 0,
    };
    answers.forEach((answer) => {
      if (Object.prototype.hasOwnProperty.call(score, answer.pole)) {
        score[answer.pole] += 1;
      }
    });

    const code = [
      score.E > score.I ? 'E' : 'I',
      score.S > score.N ? 'S' : 'N',
      score.T > score.F ? 'T' : 'F',
      score.J > score.P ? 'J' : 'P',
    ].join('');

    return {
      code,
      e: Math.round((score.E / (score.E + score.I)) * 100),
      s: Math.round((score.S / (score.S + score.N)) * 100),
      t: Math.round((score.T / (score.T + score.F)) * 100),
      j: Math.round((score.J / (score.J + score.P)) * 100),
    };
  }

  function finish() {
    const result = calculateResult();
    const params = new URLSearchParams({
      e: String(result.e),
      s: String(result.s),
      t: String(result.t),
      j: String(result.j),
    });
    if (compareContext.compare) params.set('compare', compareContext.compare);
    if (compareContext.relation) params.set('relation', compareContext.relation);
    const destination = `${data.resultBase}${encodeURIComponent(result.code)}?${params.toString()}`;
    redirecting = true;
    options.querySelectorAll('button').forEach((button) => {
      button.disabled = true;
    });

    let redirected = false;
    const redirect = () => {
      if (redirected) return;
      redirected = true;
      window.location.assign(destination);
    };

    if (typeof window.gtag === 'function') {
      window.gtag('event', 'type16_complete', {
        result_type: result.code,
        axis_e: result.e,
        axis_s: result.s,
        axis_t: result.t,
        axis_j: result.j,
        event_callback: redirect,
        event_timeout: 800,
      });
      window.setTimeout(redirect, 900);
    } else {
      redirect();
    }
  }

  startButton.addEventListener('click', () => {
    intro.hidden = true;
    play.hidden = false;
    currentIndex = 0;
    answers = [];
    redirecting = false;
    track('type16_start', { question_count: data.questions.length });
    renderQuestion();
  });

  backButton.addEventListener('click', () => {
    if (redirecting || currentIndex === 0) return;
    answers.pop();
    currentIndex -= 1;
    renderQuestion();
  });
});
