const LABELS = ['A', 'B', 'C', 'D']

let selectedType = null
let currentQuestions = []
let currentIndex = 0
let shuffleMode = false
let correctCount = 0
let wrongCount = 0
let answered = []
let answeredCount = 0

let flashcardQuestions = []
let flashcardIndex = 0

function selectType(type) {
  selectedType = type
  document.getElementById('type-menu').classList.add('hidden')
  document.getElementById('mode-menu').classList.remove('hidden')
  document.getElementById('size-menu').classList.add('hidden')
  document.getElementById('range-input').classList.add('hidden')
  const label = type === 'sep' ? 'SEP G1' : 'F-Gazy'
  document.getElementById('mode-label').textContent = 'Wybierz tryb \u2014 ' + label
}

function backToTypes() {
  document.getElementById('mode-menu').classList.add('hidden')
  document.getElementById('size-menu').classList.add('hidden')
  document.getElementById('range-input').classList.add('hidden')
  document.getElementById('type-menu').classList.remove('hidden')
  selectedType = null
}

function selectMode(mode) {
  document.getElementById('mode-menu').classList.add('hidden')
  if (mode === 'quiz') {
    const total = selectedType === 'sep' ? questionsSEP.length : questionsFGazy.length
    document.getElementById('size-menu').classList.remove('hidden')
    const btns = document.querySelectorAll('#size-menu .size-btn:not(.back-btn)')
    btns[0].setAttribute('onclick', "startQuiz('" + selectedType + "', 10)")
    btns[1].setAttribute('onclick', "startQuiz('" + selectedType + "', 20)")
    btns[2].setAttribute('onclick', "startQuiz('" + selectedType + "', 0)")
    btns[2].textContent = 'Wszystkie (' + total + ')'
    document.querySelector('#size-menu .size-label').textContent = 'Ile pyta\u0144 z ' + (selectedType === 'sep' ? 'SEP G1' : 'F-Gazy') + '?'
  } else if (mode === 'flashcard') {
    startFlashcards(selectedType)
  }
}

function backToModes() {
  document.getElementById('size-menu').classList.add('hidden')
  document.getElementById('range-input').classList.add('hidden')
  document.getElementById('mode-menu').classList.remove('hidden')
}

function showRangeInput() {
  document.getElementById('size-menu').classList.add('hidden')
  document.getElementById('range-input').classList.remove('hidden')
  const total = selectedType === 'sep' ? questionsSEP.length : questionsFGazy.length
  document.getElementById('range-total').textContent = '(1-' + total + ')'
  document.getElementById('range-end').value = total

  const grid = document.getElementById('section-buttons')
  grid.innerHTML = ''
  for (let i = 1; i <= total; i += 30) {
    const end = Math.min(i + 29, total)
    const btn = document.createElement('button')
    btn.className = 'section-btn'
    btn.textContent = i + '-' + end
    btn.onclick = (function(s, e) {
      return function() { setRange(s, e); startRangeQuiz() }
    })(i, end)
    grid.appendChild(btn)
  }
}

function backToSizeMenu() {
  document.getElementById('range-input').classList.add('hidden')
  document.getElementById('size-menu').classList.remove('hidden')
}

function setRange(start, end) {
  document.getElementById('range-start').value = start
  document.getElementById('range-end').value = end
}

function startRangeQuiz() {
  const start = parseInt(document.getElementById('range-start').value, 10)
  const end = parseInt(document.getElementById('range-end').value, 10)
  const full = selectedType === 'sep' ? questionsSEP : questionsFGazy
  const total = full.length

  if (isNaN(start) || start < 1) { alert('Pocz\u0105tek musi by\u0107 \u2265 1'); return }
  if (isNaN(end) || end > total) { alert('Koniec musi by\u0107 \u2264 ' + total); return }
  if (start > end) { alert('Pocz\u0105tek musi by\u0107 \u2264 koniec'); return }

  currentQuestions = full.slice(start - 1, end)
  startQuizFromCurrent()
}

function startQuiz(type, limit) {
  const full = type === 'sep' ? questionsSEP : questionsFGazy
  if (limit > 0 && limit < full.length) {
    const pool = full.slice()
    currentQuestions = []
    for (let i = 0; i < limit && pool.length > 0; i++) {
      const idx = Math.floor(Math.random() * pool.length)
      currentQuestions.push(pool[idx])
      pool.splice(idx, 1)
    }
  } else {
    currentQuestions = full.slice()
  }
  startQuizFromCurrent()
}

function startQuizFromCurrent() {
  currentIndex = 0
  correctCount = 0
  wrongCount = 0
  answeredCount = 0
  answered = []
  shuffleMode = false

  document.getElementById('shuffle-btn').classList.remove('active')
  document.getElementById('quiz-view').classList.remove('hidden')
  document.getElementById('menu').classList.add('hidden')
  document.getElementById('main-header').classList.add('hidden')
  document.getElementById('all-flashcards').classList.add('hidden')
  document.getElementById('flashcard-view').classList.add('hidden')

  document.getElementById('quiz-title').textContent = selectedType === 'sep' ? 'SEP G1' : 'F-Gazy'

  showQuestion()
}

function showQuestion() {
  if (answeredCount >= currentQuestions.length) {
    showSummary()
    return
  }

  const q = currentQuestions[currentIndex]
  document.getElementById('question-number').textContent = 'Pytanie ' + (answeredCount + 1) + ' z ' + currentQuestions.length
  document.getElementById('question-text').textContent = q.q

  const options = generateOptions(currentIndex)
  renderOptions(options, q.a)

  document.getElementById('feedback').classList.add('hidden')
  document.getElementById('next-btn').classList.add('hidden')

  updateStats()
}

function generateOptions(qIdx) {
  const correct = currentQuestions[qIdx].a
  const distractors = []
  const used = new Set([correct.toLowerCase().trim()])

  const pool = currentQuestions.filter(function(_, i) { return i !== qIdx })

  while (distractors.length < 3 && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length)
    const candidate = pool[idx].a
    const key = candidate.toLowerCase().trim()
    if (!used.has(key)) {
      used.add(key)
      distractors.push(candidate)
    }
    pool.splice(idx, 1)
  }

  const options = [{ text: correct, correct: true }]
  for (let d = 0; d < distractors.length; d++) {
    options.push({ text: distractors[d], correct: false })
  }

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = options[i]; options[i] = options[j]; options[j] = tmp
  }

  return options
}

function renderOptions(options, correctAnswer) {
  const container = document.getElementById('options-container')
  container.innerHTML = ''

  options.forEach(function(opt, i) {
    const btn = document.createElement('button')
    btn.className = 'option-btn'
    btn.innerHTML = '<span class="opt-label">' + LABELS[i] + '</span><span class="opt-text">' + escapeHtml(opt.text) + '</span>'
    btn.dataset.correct = opt.correct
    btn.dataset.index = i
    btn.addEventListener('click', function() { selectOption(btn, options) })
    container.appendChild(btn)
  })
}

function selectOption(selected, options) {
  const allBtns = document.querySelectorAll('.option-btn')
  allBtns.forEach(function(b) { b.classList.add('disabled') })

  const isCorrect = selected.dataset.correct === 'true'

  if (isCorrect) {
    selected.classList.add('correct')
    correctCount++
    showFeedback(true)
  } else {
    selected.classList.add('wrong')
    allBtns.forEach(function(b) {
      if (b.dataset.correct === 'true') b.classList.add('reveal-correct')
    })
    wrongCount++
    showFeedback(false, getCorrectAnswer(options))
  }

  answered[currentIndex] = isCorrect
  answeredCount++
  document.getElementById('next-btn').classList.remove('hidden')

  if (answeredCount >= currentQuestions.length) {
    document.getElementById('next-btn').textContent = 'Zobacz wyniki \u2192'
  }

  updateStats()
}

function getCorrectAnswer(options) {
  for (let i = 0; i < options.length; i++) {
    if (options[i].correct) return options[i].text
  }
  return ''
}

function showFeedback(correct, correctAnswer) {
  const el = document.getElementById('feedback')
  el.className = 'feedback'
  if (correct) {
    el.classList.add('correct')
    el.textContent = '\u2705 Dobra odpowied\u017a!'
  } else {
    el.classList.add('wrong')
    el.innerHTML = '\u274c B\u0142\u0119dna odpowied\u017a.<br><span style="font-weight:400;font-size:14px">Poprawna: ' + escapeHtml(correctAnswer) + '</span>'
  }
  el.classList.remove('hidden')
}

function nextQuestion() {
  if (answeredCount >= currentQuestions.length) {
    showSummary()
    return
  }

  if (shuffleMode) {
    const remaining = []
    for (let i = 0; i < currentQuestions.length; i++) {
      if (answered[i] === undefined) remaining.push(i)
    }
    if (remaining.length > 0) {
      currentIndex = remaining[Math.floor(Math.random() * remaining.length)]
    }
  } else {
    currentIndex++
    while (currentIndex < currentQuestions.length && answered[currentIndex] !== undefined) {
      currentIndex++
    }
  }

  if (currentIndex >= currentQuestions.length) {
    showSummary()
    return
  }

  showQuestion()
}

function toggleShuffle() {
  shuffleMode = !shuffleMode
  document.getElementById('shuffle-btn').classList.toggle('active')
}

function resetQuiz() {
  currentIndex = 0
  correctCount = 0
  wrongCount = 0
  answeredCount = 0
  answered = []
  document.getElementById('next-btn').textContent = 'Nast\u0119pne \u2192'
  showQuestion()
}

function updateStats() {
  document.getElementById('correct-count').textContent = correctCount
  document.getElementById('wrong-count').textContent = wrongCount
  const total = correctCount + wrongCount
  const pct = total > 0 ? Math.round(correctCount / total * 100) : 0
  document.getElementById('progress-pct').textContent = total > 0 ? pct + '%' : '0%'
  document.getElementById('progress-badge').textContent = answeredCount + ' / ' + currentQuestions.length
}

function showSummary() {
  const total = correctCount + wrongCount
  const pct = total > 0 ? Math.round(correctCount / total * 100) : 0

  document.getElementById('question-number').textContent = 'Koniec!'
  document.getElementById('question-text').innerHTML =
    '<div style="text-align:center;padding:20px 0">' +
      '<div style="font-size:48px;margin-bottom:16px">\ud83c\udf89</div>' +
      '<div style="font-size:22px;font-weight:600;margin-bottom:8px">Quiz uko\u0144czony!</div>' +
      '<div style="font-size:16px;color:#666;margin-bottom:12px">' +
        'Poprawnych: <strong style="color:#16a34a">' + correctCount + '</strong> | ' +
        'B\u0142\u0119dnych: <strong style="color:#dc2626">' + wrongCount + '</strong>' +
      '</div>' +
      '<div style="font-size:14px;color:#888">Skuteczno\u015b\u0107: ' + pct + '%</div>' +
    '</div>'
  document.getElementById('options-container').innerHTML = ''
  document.getElementById('feedback').classList.add('hidden')
  document.getElementById('next-btn').classList.add('hidden')
  updateStats()
}

function startFlashcards(type) {
  flashcardQuestions = type === 'sep' ? questionsSEP.slice() : questionsFGazy.slice()
  flashcardIndex = 0

  document.getElementById('menu').classList.add('hidden')
  document.getElementById('main-header').classList.add('hidden')
  document.getElementById('quiz-view').classList.add('hidden')
  document.getElementById('all-flashcards').classList.add('hidden')
  document.getElementById('flashcard-view').classList.remove('hidden')

  document.getElementById('flashcard-title').textContent = type === 'sep' ? 'SEP G1' : 'F-Gazy'

  showFlashcard()
}

function showFlashcard() {
  const q = flashcardQuestions[flashcardIndex]
  document.getElementById('flashcard-number').textContent = 'Pytanie ' + (flashcardIndex + 1) + ' z ' + flashcardQuestions.length
  document.getElementById('flashcard-question').textContent = q.q
  document.getElementById('flashcard-answer-text').innerHTML = escapeHtml(q.a).replace(/\n/g, '<br>')
  document.getElementById('flashcard-answer').classList.add('hidden')
  document.getElementById('flashcard-hint').classList.remove('hidden')
  document.getElementById('flashcard-progress').textContent = (flashcardIndex + 1) + ' / ' + flashcardQuestions.length

  document.getElementById('flashcard-prev').disabled = flashcardIndex === 0
  document.getElementById('flashcard-next').disabled = flashcardIndex === flashcardQuestions.length - 1
}

function toggleAnswer() {
  const answer = document.getElementById('flashcard-answer')
  const hint = document.getElementById('flashcard-hint')
  if (answer.classList.contains('hidden')) {
    answer.classList.remove('hidden')
    hint.classList.add('hidden')
  } else {
    answer.classList.add('hidden')
    hint.classList.remove('hidden')
  }
}

function nextFlashcard() {
  if (flashcardIndex < flashcardQuestions.length - 1) {
    flashcardIndex++
    showFlashcard()
  }
}

function prevFlashcard() {
  if (flashcardIndex > 0) {
    flashcardIndex--
    showFlashcard()
  }
}

function goToFlashcard() {
  const input = document.getElementById('flashcard-goto')
  const num = parseInt(input.value, 10)
  if (isNaN(num) || num < 1 || num > flashcardQuestions.length) {
    input.value = ''
    input.placeholder = '1-' + flashcardQuestions.length
    return
  }
  flashcardIndex = num - 1
  input.value = ''
  showFlashcard()
}

function showAllFlashcards() {
  document.getElementById('flashcard-view').classList.add('hidden')
  document.getElementById('all-flashcards').classList.remove('hidden')

  const list = document.getElementById('all-flashcards-list')
  list.innerHTML = ''

  flashcardQuestions.forEach(function(q, i) {
    const card = document.createElement('div')
    card.className = 'card flashcard-item'
    card.innerHTML =
      '<div class="card-number">Pytanie ' + (i + 1) + '</div>' +
      '<div class="card-question">' + escapeHtml(q.q) + '</div>' +
      '<div class="flashcard-answer hidden" id="all-answer-' + i + '">' +
        '<hr>' +
        '<div class="answer-label">Odpowied\u017a:</div>' +
        '<div class="answer-text">' + escapeHtml(q.a).replace(/\n/g, '<br>') + '</div>' +
      '</div>' +
      '<div class="flashcard-hint" id="all-hint-' + i + '">\ud83d\udc46 Kliknij, aby zobaczy\u0107 odpowied\u017a</div>'
    card.onclick = (function(idx) {
      return function() {
        const answer = document.getElementById('all-answer-' + idx)
        const hint = document.getElementById('all-hint-' + idx)
        if (answer) answer.classList.toggle('hidden')
        if (hint) hint.classList.toggle('hidden')
      }
    })(i)
    list.appendChild(card)
  })
}

function closeAllFlashcards() {
  document.getElementById('all-flashcards').classList.add('hidden')
  document.getElementById('flashcard-view').classList.remove('hidden')
}

function backToMenu() {
  document.getElementById('quiz-view').classList.add('hidden')
  document.getElementById('flashcard-view').classList.add('hidden')
  document.getElementById('all-flashcards').classList.add('hidden')
  document.getElementById('menu').classList.remove('hidden')
  document.getElementById('main-header').classList.remove('hidden')
  document.getElementById('next-btn').textContent = 'Nast\u0119pne \u2192'
  document.getElementById('size-menu').classList.add('hidden')
  document.getElementById('mode-menu').classList.add('hidden')
  document.getElementById('range-input').classList.add('hidden')
  document.getElementById('type-menu').classList.remove('hidden')
  selectedType = null
}

function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
