(function () {
  'use strict';

  const TOTAL_QUIZZES = 8;
  const STORAGE_KEY = 'gerry_completed';

  function getCompleted() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  }
  function markCompleted(id) {
    const c = getCompleted();
    if (!c.includes(id)) { c.push(id); localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); }
    updateProgress();
  }
  function updateProgress() {
    const c = getCompleted();
    const pct = Math.round((c.length / TOTAL_QUIZZES) * 100);
    const bar = document.getElementById('progressBar');
    const lbl = document.getElementById('progressPercent');
    if (bar) bar.style.width = pct + '%';
    if (lbl) lbl.textContent = pct + '%';
    document.querySelectorAll('.nav-check[data-page]').forEach(el => {
      if (c.includes(el.dataset.page)) el.classList.add('done');
    });
  }


  function initAccordions() {
    document.querySelectorAll('.accordion-item').forEach(item => {
      const btn  = item.querySelector('.accordion-header');
      const body = item.querySelector('.accordion-body');
      if (!btn || !body) return;

      if (item.classList.contains('open')) {
        body.style.maxHeight = body.scrollHeight + 'px';
      }

      btn.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        const accordion = item.closest('.accordion');
        if (accordion && accordion.dataset.type === 'single') {
          accordion.querySelectorAll('.accordion-item.open').forEach(other => {
            if (other !== item) {
              other.classList.remove('open');
              other.querySelector('.accordion-body').style.maxHeight = '0';
            }
          });
        }

        if (isOpen) {
          item.classList.remove('open');
          body.style.maxHeight = '0';
        } else {
          item.classList.add('open');
          body.style.maxHeight = body.scrollHeight + 'px';
        }
      });
    });
  }

  function initQuiz(container) {
    const dataEl = container.querySelector('.quiz-data');
    if (!dataEl) return;
    let config;
    try { config = JSON.parse(dataEl.textContent); } catch { return; }

    const { quizId, title, questions } = config;
    const answers = {};
    let submitted = false;

    function render() {
      container.innerHTML = '';


      const hdr = document.createElement('div');
      hdr.className = 'quiz-header';
      hdr.innerHTML = '<h2>' + escHtml(title) + ' Quiz</h2>';
      container.appendChild(hdr);


      const body = document.createElement('div');
      body.className = 'quiz-body';

      questions.forEach((q, qi) => {
        const qDiv = document.createElement('div');
        qDiv.className = 'quiz-question';

        const qNum = qi + 1;
        qDiv.innerHTML = '<h3>' + qNum + '. ' + escHtml(q.text) + '</h3>';

        const opts = document.createElement('div');
        opts.className = 'quiz-options';

        q.options.forEach(opt => {
          const label = document.createElement('label');
          label.className = 'quiz-option';
          if (answers[q.id] === opt.id) label.classList.add('selected');
          if (submitted) {
            if (opt.id === q.correctOptionId) label.classList.add('correct-answer');
            if (answers[q.id] === opt.id && opt.id !== q.correctOptionId) label.classList.add('incorrect');
            if (answers[q.id] === opt.id && opt.id === q.correctOptionId) label.classList.add('correct');
          }

          const radio = document.createElement('input');
          radio.type = 'radio';
          radio.name = 'q_' + q.id;
          radio.value = opt.id;
          radio.checked = answers[q.id] === opt.id;
          radio.disabled = submitted;

          if (!submitted) {
            radio.addEventListener('change', () => {
              answers[q.id] = opt.id;
              render();
            });
          }

          label.appendChild(radio);
          label.appendChild(document.createTextNode(' ' + opt.text));
          opts.appendChild(label);
        });

        qDiv.appendChild(opts);


        if (submitted) {
          const isCorrect = answers[q.id] === q.correctOptionId;
          const fb = document.createElement('div');
          fb.className = 'quiz-feedback ' + (isCorrect ? 'correct' : 'incorrect');
          fb.innerHTML = '<strong>' + (isCorrect ? 'Correct! ' : 'Incorrect. ') + '</strong>' + escHtml(q.explanation);
          qDiv.appendChild(fb);
        }

        body.appendChild(qDiv);
      });

      container.appendChild(body);


      const footer = document.createElement('div');
      footer.className = 'quiz-footer';

      if (!submitted) {
        const allAnswered = questions.every(q => answers[q.id]);
        const btn = document.createElement('button');
        btn.className = 'btn-quiz btn-quiz-submit';
        btn.textContent = 'Submit Answers';
        btn.disabled = !allAnswered;
        btn.addEventListener('click', () => {
          submitted = true;
          markCompleted(quizId);
          render();
        });
        footer.appendChild(btn);
      } else {
        const score = questions.filter(q => answers[q.id] === q.correctOptionId).length;
        const scoreEl = document.createElement('div');
        scoreEl.className = 'quiz-score';
        scoreEl.textContent = 'Score: ' + score + ' / ' + questions.length + ' correct';

        const retake = document.createElement('button');
        retake.className = 'btn-quiz btn-quiz-retake';
        retake.textContent = 'Retake Quiz';
        retake.addEventListener('click', () => {
          submitted = false;
          Object.keys(answers).forEach(k => delete answers[k]);
          render();
        });
        footer.appendChild(scoreEl);
        footer.appendChild(retake);
      }

      container.appendChild(footer);
    }

    render();
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }


  function initMobileSidebar() {
    const toggle  = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (!toggle || !sidebar) return;

    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('open');
    });
    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
      });
    }
  }


  document.addEventListener('DOMContentLoaded', () => {
    initMobileSidebar();
    initAccordions();
    document.querySelectorAll('.quiz-section').forEach(initQuiz);
    updateProgress();
  });
})();
