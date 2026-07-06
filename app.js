const LABELS = ['A', 'B', 'C', 'D']

let selectedType = null
let currentQuestions = []
let currentIndex = 0
let shuffleMode = false
let correctCount = 0
let wrongCount = 0
let answered = []
let answeredCount = 0

function selectType(type) {
  selectedType = type
  document.getElementById('size-menu').classList.remove('hidden')
  const btns = document.querySelectorAll('.size-btn')
  const total = type === 'sep' ? questionsSEP.length : questionsFGazy.length
  btns[0].setAttribute('onclick', `startQuiz('${type}', 10)`)
  btns[1].setAttribute('onclick', `startQuiz('${type}', 20)`)
  btns[2].setAttribute('onclick', `startQuiz('${type}', 0)`)
  btns[2].textContent = `Wszystkie (${total})`
  document.querySelector('.size-label').textContent = `Ile pytań z ${type === 'sep' ? 'SEP G1' : 'F-Gazy'}?`
}

function backToTypes() {
  document.getElementById('size-menu').classList.add('hidden')
  selectedType = null
}

function startQuiz(type, limit) {
  const full = type === 'sep' ? questionsSEP : questionsFGazy
  if (limit > 0 && limit < full.length) {
    const pool = [...full]
    currentQuestions = []
    for (let i = 0; i < limit && pool.length > 0; i++) {
      const idx = Math.floor(Math.random() * pool.length)
      currentQuestions.push(pool[idx])
      pool.splice(idx, 1)
    }
  } else {
    currentQuestions = [...full]
  }

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

  document.getElementById('quiz-title').textContent = type === 'sep' ? 'SEP G1' : 'F-Gazy'

  showQuestion()
}

function showQuestion() {
  if (answeredCount >= currentQuestions.length) {
    showSummary()
    return
  }

  const q = currentQuestions[currentIndex]
  document.getElementById('question-number').textContent = `Pytanie ${answeredCount + 1} z ${currentQuestions.length}`
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

  const pool = currentQuestions.filter((_, i) => i !== qIdx)

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
  for (const d of distractors) {
    options.push({ text: d, correct: false })
  }

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]]
  }

  return options
}

function renderOptions(options, correctAnswer) {
  const container = document.getElementById('options-container')
  container.innerHTML = ''

  options.forEach((opt, i) => {
    const btn = document.createElement('button')
    btn.className = 'option-btn'
    btn.innerHTML = `<span class="opt-label">${LABELS[i]}</span><span class="opt-text">${escapeHtml(opt.text)}</span>`
    btn.dataset.correct = opt.correct
    btn.dataset.index = i
    btn.addEventListener('click', () => selectOption(btn, options))
    container.appendChild(btn)
  })
}

function selectOption(selected, options) {
  const allBtns = document.querySelectorAll('.option-btn')
  allBtns.forEach(b => b.classList.add('disabled'))

  const isCorrect = selected.dataset.correct === 'true'

  if (isCorrect) {
    selected.classList.add('correct')
    correctCount++
    showFeedback(true)
  } else {
    selected.classList.add('wrong')
    allBtns.forEach(b => {
      if (b.dataset.correct === 'true') b.classList.add('reveal-correct')
    })
    wrongCount++
    showFeedback(false, getCorrectAnswer(options))
  }

  answered[currentIndex] = isCorrect
  answeredCount++
  document.getElementById('next-btn').classList.remove('hidden')

  if (answeredCount >= currentQuestions.length) {
    document.getElementById('next-btn').textContent = 'Zobacz wyniki →'
  }

  updateStats()
}

function getCorrectAnswer(options) {
  for (const opt of options) {
    if (opt.correct) return opt.text
  }
  return ''
}

function showFeedback(correct, correctAnswer) {
  const el = document.getElementById('feedback')
  el.className = 'feedback'
  if (correct) {
    el.classList.add('correct')
    el.textContent = '✅ Dobra odpowiedź!'
  } else {
    el.classList.add('wrong')
    el.innerHTML = `❌ Błędna odpowiedź.<br><span style="font-weight:400;font-size:14px">Poprawna: ${escapeHtml(correctAnswer)}</span>`
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
  document.getElementById('next-btn').textContent = 'Następne →'
  showQuestion()
}

function backToMenu() {
  document.getElementById('quiz-view').classList.add('hidden')
  document.getElementById('menu').classList.remove('hidden')
  document.getElementById('main-header').classList.remove('hidden')
  document.getElementById('size-menu').classList.add('hidden')
  document.getElementById('next-btn').textContent = 'Następne →'
  selectedType = null
}

function updateStats() {
  document.getElementById('correct-count').textContent = correctCount
  document.getElementById('wrong-count').textContent = wrongCount
  const total = correctCount + wrongCount
  const pct = total > 0 ? Math.round(correctCount / total * 100) : 0
  document.getElementById('progress-pct').textContent = total > 0 ? `${pct}%` : '0%'
  document.getElementById('progress-badge').textContent = `${answeredCount} / ${currentQuestions.length}`
}

function showSummary() {
  const total = correctCount + wrongCount
  const pct = total > 0 ? Math.round(correctCount / total * 100) : 0

  document.getElementById('question-number').textContent = 'Koniec!'
  document.getElementById('question-text').innerHTML = `
    <div style="text-align:center;padding:20px 0">
      <div style="font-size:48px;margin-bottom:16px">🎉</div>
      <div style="font-size:22px;font-weight:600;margin-bottom:8px">Quiz ukończony!</div>
      <div style="font-size:16px;color:#666;margin-bottom:12px">
        Poprawnych: <strong style="color:#16a34a">${correctCount}</strong> |
        Błędnych: <strong style="color:#dc2626">${wrongCount}</strong>
      </div>
      <div style="font-size:14px;color:#888">Skuteczność: ${pct}%</div>
    </div>
  `
  document.getElementById('options-container').innerHTML = ''
  document.getElementById('feedback').classList.add('hidden')
  document.getElementById('next-btn').classList.add('hidden')
  updateStats()
}

function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
