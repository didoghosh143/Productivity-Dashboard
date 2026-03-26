function openFeatures() {
    var allElems = document.querySelectorAll('.elem')
    var fullElemPage = document.querySelectorAll('.fullElem')
    var fullElemPageBackBtn = document.querySelectorAll('.fullElem .back')
    var panelMap = {}

    fullElemPage.forEach(function (panel) {
        var panelKey = panel.dataset.panel

        if (panelKey) {
            panelMap[panelKey] = panel
        }
    })

    function syncNavOffset() {
        var nav = document.querySelector('nav')

        if (!nav) return

        var navHeight = Math.ceil(nav.getBoundingClientRect().height)
        document.documentElement.style.setProperty('--nav-offset', `${navHeight + 24}px`)
    }

    function closeAllPanels() {
        fullElemPage.forEach(function (panel) {
            panel.classList.remove('is-open')
            panel.setAttribute('aria-hidden', 'true')
        })

        document.body.classList.remove('panel-open')
    }

    function openPanel(panelKey) {
        var targetPanel = panelMap[panelKey]

        if (!targetPanel) return

        closeAllPanels()
        targetPanel.classList.add('is-open')
        targetPanel.setAttribute('aria-hidden', 'false')
        document.body.classList.add('panel-open')

        if (panelKey === 'motivation' && typeof window.refreshMotivationalQuote === 'function') {
            window.refreshMotivationalQuote()
        }
    }

    allElems.forEach(function (elem) {
        var panelKey = elem.dataset.panel

        elem.addEventListener('click', function () {
            if (panelKey) {
                openPanel(panelKey)
            }
        })

        elem.addEventListener('keydown', function (e) {
            if ((e.key === 'Enter' || e.key === ' ') && panelKey) {
                e.preventDefault()
                openPanel(panelKey)
            }
        })
    })

    fullElemPageBackBtn.forEach(function (back) {
        back.addEventListener('click', function () {
            closeAllPanels()
        })
    })

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeAllPanels()
        }
    })

    syncNavOffset()
    window.addEventListener('load', syncNavOffset)
    window.addEventListener('resize', syncNavOffset)
}

openFeatures()

function readStoredJson(key, fallbackValue) {
    try {
        var storedValue = localStorage.getItem(key)

        if (!storedValue) {
            return fallbackValue
        }

        var parsedValue = JSON.parse(storedValue)
        return parsedValue == null ? fallbackValue : parsedValue
    } catch (err) {
        console.warn(`Failed to read localStorage key "${key}"`, err)
        return fallbackValue
    }
}

function themeChanger() {
    var themeButton = document.querySelector('.theme')
    var themeIcon = document.querySelector('.theme i')
    var themeCycle = ['dark-black', 'dark-navy', 'dark-graphite', 'light']
    var savedTheme = localStorage.getItem('dashboardTheme')

    if (!savedTheme) {
        savedTheme = 'light'
    }

    if (savedTheme === 'dark') {
        savedTheme = 'dark-black'
    }

    if (!themeButton || !themeIcon) return

    function applyTheme(theme) {
        var isDarkTheme = theme.startsWith('dark')
        var nextLabel = 'Cycle theme'

        document.documentElement.setAttribute('data-theme', theme)
        themeIcon.className = isDarkTheme ? 'ri-moon-clear-line' : 'ri-sun-line'
        themeButton.setAttribute('role', 'button')
        themeButton.setAttribute('tabindex', '0')
        themeButton.setAttribute('aria-pressed', String(isDarkTheme))
        themeButton.setAttribute('aria-label', nextLabel)
        themeButton.setAttribute('title', nextLabel)
    }

    function toggleTheme() {
        var currentTheme = document.documentElement.getAttribute('data-theme')
        var currentIndex = themeCycle.indexOf(currentTheme)
        var nextTheme = themeCycle[(currentIndex + 1 + themeCycle.length) % themeCycle.length] || 'light'

        applyTheme(nextTheme)
        localStorage.setItem('dashboardTheme', nextTheme)
    }

    applyTheme(savedTheme)

    themeButton.addEventListener('click', toggleTheme)

    themeButton.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggleTheme()
        }
    })
}

themeChanger()


function todoList() {
    var STORAGE_KEY = 'currentTask'
    var listEl = document.querySelector('[data-task-list]')
    var form = document.querySelector('.addTask form')
    var taskInput = document.querySelector('#task-input')
    var taskDetailsInput = document.querySelector('#task-details')
    var taskCheckbox = document.querySelector('#check')
    var clearBtn = document.querySelector('[data-task-clear]')
    var statTotal = document.querySelector('[data-task-total]')
    var statFocus = document.querySelector('[data-task-focus]')
    var statDone = document.querySelector('[data-task-done]')
    var progressBar = document.querySelector('[data-progress-bar]')
    var progressLabel = document.querySelector('[data-progress-label]')
    var filterButtons = document.querySelectorAll('[data-task-filter]')
    var activeFilter = 'all'

    function normalizeTasks(list) {
        if (!Array.isArray(list)) return []

        return list.map(function (item, idx) {
            var title = typeof item.task === 'string' ? item.task : typeof item.title === 'string' ? item.title : ''
            var details = typeof item.details === 'string' ? item.details : ''
            var focus = item.imp === true || item.imp === 'true' || item.focus === true || item.focus === 'true'
            var done = item.done === true || item.done === 'true'

            return {
                id: item.id || `t-${Date.now()}-${idx}`,
                title: title || `Task ${idx + 1}`,
                task: title || `Task ${idx + 1}`,
                details: details,
                focus: focus,
                imp: focus,
                done: done,
                createdAt: item.createdAt || new Date().toISOString()
            }
        })
    }

    var currentTask = normalizeTasks(readStoredJson(STORAGE_KEY, []))

    if (!listEl || !form || !taskInput || !taskDetailsInput || !taskCheckbox) return

    function escapeHtml(value) {
        if (typeof value !== 'string') return ''
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
    }

    function formatDate(iso) {
        try {
            var date = new Date(iso)
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        } catch (err) {
            return 'Today'
        }
    }

    function saveTasks() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentTask))
    }

    function filteredTasks() {
        if (activeFilter === 'focus') {
            return currentTask.filter(function (task) { return task.focus && !task.done })
        }
        if (activeFilter === 'done') {
            return currentTask.filter(function (task) { return task.done })
        }
        return currentTask
    }

    function renderStats() {
        var total = currentTask.length
        var done = currentTask.filter(function (task) { return task.done }).length
        var focus = currentTask.filter(function (task) { return task.focus && !task.done }).length
        var completion = total === 0 ? 0 : Math.round((done / total) * 100)

        if (statTotal) statTotal.textContent = total
        if (statDone) statDone.textContent = done
        if (statFocus) statFocus.textContent = focus
        if (progressBar) progressBar.style.width = `${completion}%`
        if (progressLabel) progressLabel.textContent = `${completion}% cleared`
    }

    function taskMarkup(task) {
        var safeTitle = escapeHtml(task.title)
        var safeDetails = escapeHtml(task.details || 'Add a next step so future you knows what to do.')
        var dateLabel = formatDate(task.createdAt)
        var doneLabel = task.done ? 'Undo' : 'Done'

        return `<article class="task-card" data-task-id="${task.id}" data-focus="${task.focus}" data-done="${task.done}">
            <div class="task-check">
                <input type="checkbox" aria-label="Toggle ${safeTitle}" data-task-toggle="${task.id}" ${task.done ? 'checked' : ''}>
            </div>
            <div class="task-body">
                <h3>${safeTitle} ${task.focus ? '<span class="badge focus"><i class="ri-rocket-2-line"></i>Focus</span>' : ''}</h3>
                <p>${safeDetails}</p>
                <div class="task-meta">
                    <span class="badge time"><i class="ri-time-line"></i>${dateLabel}</span>
                    ${task.done ? '<span class="badge"><i class="ri-checkbox-circle-line"></i>Completed</span>' : '<span class="badge"><i class="ri-sparkling-2-line"></i>In progress</span>'}
                </div>
            </div>
            <div class="task-actions">
                <button type="button" class="complete" data-task-complete="${task.id}"><i class="ri-checkbox-circle-line"></i>${doneLabel}</button>
                <button type="button" data-task-delete="${task.id}"><i class="ri-delete-bin-line"></i>Remove</button>
            </div>
        </article>`
    }

    function renderList() {
        var subset = filteredTasks()

        if (!subset.length) {
            listEl.innerHTML = `<div class="empty-state">
                <i class="ri-radar-line"></i>
                <h3>No tasks here</h3>
                <p>Add a task on the left or switch filters.</p>
            </div>`
            renderStats()
            saveTasks()
            return
        }

        listEl.innerHTML = subset.map(taskMarkup).join('')
        renderStats()
        saveTasks()
    }

    renderList()

    form.addEventListener('submit', function (e) {
        e.preventDefault()
        var title = taskInput.value.trim()
        var details = taskDetailsInput.value.trim()
        var focus = taskCheckbox.checked

        if (!title) {
            taskInput.focus()
            return
        }

        currentTask.unshift({
            id: `t-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            title: title,
            task: title,
            details: details,
            focus: focus,
            imp: focus,
            done: false,
            createdAt: new Date().toISOString()
        })

        renderList()
        form.reset()
        taskCheckbox.checked = false
        taskInput.focus()
    })

    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            form.reset()
            taskCheckbox.checked = false
            taskInput.focus()
        })
    }

    listEl.addEventListener('click', function (e) {
        var completeBtn = e.target.closest('[data-task-complete]')
        var deleteBtn = e.target.closest('[data-task-delete]')
        var toggleBtn = e.target.closest('[data-task-toggle]')

        if (completeBtn) {
            var id = completeBtn.dataset.taskComplete
            currentTask = currentTask.map(function (task) {
                if (task.id === id) {
                    return Object.assign({}, task, { done: !task.done })
                }
                return task
            })
            renderList()
        }

        if (deleteBtn) {
            var delId = deleteBtn.dataset.taskDelete
            currentTask = currentTask.filter(function (task) { return task.id !== delId })
            renderList()
        }

        if (toggleBtn) {
            var toggleId = toggleBtn.dataset.taskToggle
            currentTask = currentTask.map(function (task) {
                if (task.id === toggleId) {
                    return Object.assign({}, task, { done: !task.done })
                }
                return task
            })
            renderList()
        }
    })

    filterButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            activeFilter = btn.dataset.taskFilter || 'all'
            filterButtons.forEach(function (b) { b.classList.toggle('is-active', b === btn) })
            renderList()
        })
    })
}

todoList()


function dailyPlanner() {
    var STORAGE_KEY = 'dayplanData'
    var dayplanData = readStoredJson(STORAGE_KEY, {})
    var timelineEl = document.querySelector('[data-planner-timeline]')
    var filledEl = document.querySelector('[data-planner-filled]')
    var nextEl = document.querySelector('[data-planner-next]')
    var nextLabelEl = document.querySelector('[data-planner-next-label]')
    var flowEl = document.querySelector('[data-planner-flow]')
    var clearBtn = document.querySelector('[data-planner-clear]')

    function toneForHour(hour) {
        if (hour < 8) return { tone: 'dawn', caption: 'Prime the day', icon: 'ri-sun-foggy-line' }
        if (hour < 12) return { tone: 'morning', caption: 'Deep work / build', icon: 'ri-sparkling-2-line' }
        if (hour < 17) return { tone: 'day', caption: 'Collab + delivery', icon: 'ri-sun-line' }
        if (hour < 20) return { tone: 'evening', caption: 'Wrap & connect', icon: 'ri-sunset-line' }
        return { tone: 'night', caption: 'Cool down & reset', icon: 'ri-moon-clear-line' }
    }

    var hours = Array.from({ length: 18 }, function (_, idx) {
        var start = 6 + idx
        var end = start + 1
        var meta = toneForHour(start)
        return {
            index: idx,
            start: start,
            end: end,
            label: `${String(start).padStart(2, '0')}:00 - ${String(end).padStart(2, '0')}:00`,
            tone: meta.tone,
            caption: meta.caption,
            icon: meta.icon
        }
    })

    if (!timelineEl) return

    if (!dayplanData || typeof dayplanData !== 'object' || Array.isArray(dayplanData)) {
        dayplanData = {}
    }

    function escapeHtml(value) {
        if (typeof value !== 'string') return ''
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
    }

    function savePlanner() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dayplanData))
    }

    function renderTimeline() {
        var markup = hours.map(function (slot) {
            var value = typeof dayplanData[slot.index] === 'string' ? dayplanData[slot.index] : ''
            var safeValue = escapeHtml(value)
            return `<label class="time-block time-block--${slot.tone}" data-slot="${slot.index}">
                <div class="time-block__rail"></div>
                <div class="time-block__time">
                    <span class="time-block__icon"><i class="${slot.icon}"></i></span>
                    <div>
                        <p class="time-block__label">${slot.label}</p>
                        <small>${slot.caption}</small>
                    </div>
                </div>
                <div class="time-block__input">
                    <input type="text" placeholder="Add your headline move..." value="${safeValue}" data-slot-input="${slot.index}" aria-label="Plan ${slot.label}">
                </div>
            </label>`
        }).join('')

        timelineEl.innerHTML = markup
    }

    function updateStats() {
        var filled = Object.keys(dayplanData).filter(function (key) {
            var value = dayplanData[key]
            return typeof value === 'string' && value.trim() !== ''
        }).length

        var flow = Math.round((filled / hours.length) * 100) || 0
        if (filledEl) filledEl.textContent = filled
        if (flowEl) flowEl.textContent = `${flow}%`

        var nextSlot = hours.find(function (slot) {
            var value = dayplanData[slot.index]
            return !value || (typeof value === 'string' && value.trim() === '')
        })

        if (nextEl) nextEl.textContent = nextSlot ? nextSlot.label : 'All blocks locked in'
        if (nextLabelEl) nextLabelEl.textContent = nextSlot ? nextSlot.caption : 'Everything is planned. Take a breath.'
    }

    function markCurrentBlock() {
        var blocks = timelineEl.querySelectorAll('.time-block')
        blocks.forEach(function (block) {
            block.classList.remove('is-now')
        })

        var now = new Date()
        var currentHour = now.getHours()
        var slotIndex = currentHour - 6

        if (slotIndex >= 0 && slotIndex < hours.length) {
            var active = timelineEl.querySelector('.time-block[data-slot="' + slotIndex + '"]')
            if (active) {
                active.classList.add('is-now')
            }
        }
    }

    renderTimeline()
    updateStats()
    markCurrentBlock()

    timelineEl.addEventListener('input', function (e) {
        var input = e.target.closest('[data-slot-input]')
        if (!input) return

        var slotId = input.dataset.slotInput
        dayplanData[slotId] = input.value
        savePlanner()
        updateStats()
    })

    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            dayplanData = {}
            var inputs = timelineEl.querySelectorAll('[data-slot-input]')
            inputs.forEach(function (input) {
                input.value = ''
            })
            savePlanner()
            updateStats()
        })
    }

    setInterval(markCurrentBlock, 60000)

}

dailyPlanner()

function dailyGoalsExperience() {
    var GOAL_STORAGE_KEY = 'dailyGoalsData'
    var defaultGoals = [
        { id: 'g1', title: 'Redesign the Daily Goals spotlight', note: 'Frame the hero, add focus chips, and make the goal list tactile.', priority: 'high', impact: 'Design' },
        { id: 'g2', title: 'Polish micro-wins stack', note: 'Curate 5 tiny wins users can trigger fast.', priority: 'medium', impact: 'Momentum' },
        { id: 'g3', title: 'Tighten copy', note: 'Keep sentences crisp and motivating without fluff.', priority: 'low', impact: 'Clarity' }
    ]

    var goals = readStoredJson(GOAL_STORAGE_KEY, defaultGoals)

    if (!Array.isArray(goals)) {
        goals = defaultGoals.slice()
    }

    var listEl = document.querySelector('.goals-list')
    var percentEl = document.querySelector('[data-goal-percent]')
    var ringEl = document.querySelector('[data-goal-progress]')
    var statActive = document.querySelector('[data-goal-active]')
    var statPriority = document.querySelector('[data-goal-priority]')
    var statDone = document.querySelector('[data-goal-done]')
    var focusTitle = document.querySelector('[data-focus-title]')
    var focusNote = document.querySelector('[data-focus-note]')
    var focusStep = document.querySelector('[data-focus-step]')
    var form = document.querySelector('.goal-create-form')
    var resetBtn = document.querySelector('[data-reset-goals]')
    var clearCompletedBtn = document.querySelector('[data-clear-completed]')

    if (!listEl || !percentEl || !ringEl || !form) return

    function escapeHtml(value) {
        if (typeof value !== 'string') return ''
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
    }

    function saveGoals() {
        localStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify(goals))
    }

    function sortGoals(arr) {
        var weight = { high: 3, medium: 2, low: 1 }
        return arr.slice().sort(function (a, b) {
            if (a.done !== b.done) return a.done - b.done
            return (weight[b.priority] || 0) - (weight[a.priority] || 0)
        })
    }

    function setProgress(percent) {
        var clamped = Math.max(0, Math.min(100, Math.round(percent)))
        var angle = clamped * 3.6
        ringEl.style.setProperty('--progress-angle', `${angle}deg`)
        percentEl.textContent = `${clamped}%`
    }

    function renderStats() {
        var total = goals.length
        var done = goals.filter(function (g) { return g.done }).length
        var highPriority = goals.filter(function (g) { return g.priority === 'high' }).length
        var active = total - done
        statActive.textContent = active
        statPriority.textContent = highPriority
        statDone.textContent = done
        var completion = total === 0 ? 0 : (done / total) * 100
        setProgress(completion)
    }

    function renderFocus() {
        if (!focusTitle || !focusNote || !focusStep) return

        var spotlight = goals.find(function (g) { return !g.done }) || goals[0]

        if (!spotlight) {
            focusTitle.textContent = 'Nothing queued yet'
            focusNote.textContent = 'Add a goal to set your focus target.'
            focusStep.textContent = 'Write the first actionable bullet.'
            return
        }

        focusTitle.textContent = spotlight.title
        focusNote.textContent = spotlight.note || 'Sketch the success criteria so you know when to stop.'
        focusStep.textContent = spotlight.note ? `Ship a 5-minute slice: ${spotlight.note}` : 'Ship the tiniest shippable slice.'
    }

    function setPulseBars() {
        var total = goals.length || 1
        var done = goals.filter(function (g) { return g.done }).length
        var active = total - done
        var completion = (done / total) * 100
        var clarity = Math.min(95, 40 + completion * 0.6)
        var energy = Math.min(92, 55 + Math.max(0, 5 * (3 - active)))
        var momentum = Math.min(96, 50 + done * 10)

        var pulseMap = {
            clarity: clarity,
            energy: energy,
            momentum: momentum
        }

        Object.keys(pulseMap).forEach(function (key) {
            var bar = document.querySelector('.pulse-bar[data-pulse="' + key + '"] span')
            if (bar) {
                bar.style.width = `${Math.max(10, Math.min(100, Math.round(pulseMap[key])))}%`
            }
        })
    }

    function goalMarkup(goal) {
        var chipIcon = goal.priority === 'high' ? 'ri-flashlight-fill' : goal.priority === 'medium' ? 'ri-sparkling-fill' : 'ri-leaf-line'
        var metaLabel = goal.impact || 'Today'
        var safeTitle = escapeHtml(goal.title)
        var safeNote = escapeHtml(goal.note || 'Add a crisp success detail so you know when you are done.')
        var safeImpact = escapeHtml(metaLabel)
        return `<article class="goal-item" data-goal-id="${goal.id}" data-done="${goal.done}">
            <label class="goal-check">
                <input type="checkbox" aria-label="Toggle ${goal.title}" data-toggle-goal="${goal.id}" ${goal.done ? 'checked' : ''}>
                <div class="check-visual">${goal.done ? '<i class="ri-check-line"></i>' : ''}</div>
            </label>
            <div class="goal-body">
                <div class="goal-title-row">
                    <h3>${safeTitle}</h3>
                    <span class="priority-pill ${goal.priority}"><i class="${chipIcon}"></i>${goal.priority}</span>
                </div>
                <p>${safeNote}</p>
                <div class="goal-meta">
                    <span class="meta-chip"><i class="ri-time-line"></i>Today</span>
                    <span class="meta-chip"><i class="ri-focus-2-line"></i>${safeImpact}</span>
                </div>
            </div>
            <div class="goal-actions">
                <button type="button" aria-label="Delete ${goal.title}" data-delete-goal="${goal.id}"><i class="ri-delete-bin-line"></i></button>
            </div>
        </article>`
    }

    function renderList() {
        var sortedGoals = sortGoals(goals)
        if (!sortedGoals.length) {
            listEl.innerHTML = `<div class="goal-item empty">
                <div class="goal-body">
                    <h3>Add your first goal</h3>
                    <p>Drop a single, sharp goal to light up this space.</p>
                </div>
            </div>`
            return
        }

        listEl.innerHTML = sortedGoals.map(goalMarkup).join('')
    }

    function renderAll() {
        renderList()
        renderStats()
        renderFocus()
        setPulseBars()
        saveGoals()
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault()
        var titleInput = form.querySelector('#goal-title')
        var noteInput = form.querySelector('#goal-note')
        var prioritySelect = form.querySelector('#goal-priority')

        if (!titleInput || !noteInput || !prioritySelect) return

        var title = titleInput.value.trim()
        var note = noteInput.value.trim()
        var priority = prioritySelect.value || 'medium'

        if (!title) {
            titleInput.focus()
            return
        }

        goals.unshift({
            id: `g-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            title: title,
            note: note,
            priority: priority,
            impact: priority === 'high' ? 'Deep work' : priority === 'medium' ? 'Momentum' : 'Light lift',
            done: false
        })

        renderAll()
        form.reset()
        titleInput.focus()
    })

    listEl.addEventListener('change', function (e) {
        if (e.target.matches('[data-toggle-goal]')) {
            var goalId = e.target.dataset.toggleGoal
            goals = goals.map(function (g) {
                if (g.id === goalId) {
                    return Object.assign({}, g, { done: !g.done })
                }
                return g
            })
            renderAll()
        }
    })

    listEl.addEventListener('click', function (e) {
        var deleteTarget = e.target.closest('[data-delete-goal]')

        if (deleteTarget) {
            var delId = deleteTarget.dataset.deleteGoal
            goals = goals.filter(function (g) { return g.id !== delId })
            renderAll()
        }
    })

    if (clearCompletedBtn) {
        clearCompletedBtn.addEventListener('click', function () {
            goals = goals.filter(function (g) { return !g.done })
            renderAll()
        })
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', function () {
            goals = defaultGoals.map(function (g) { return Object.assign({}, g) })
            renderAll()
        })
    }

    renderAll()
}

dailyGoalsExperience()

function motivationalQuote() {
    let motivationQuote = document.querySelector('.motivation-2 h1')
    let motivationAuthor = document.querySelector('.motivation-3 h2')
    let quoteStorageKey = 'motivationalQuoteCache'
    let activeQuoteRequest = null
    let fallbackQuotes = [
        {
            quote: 'Stay focused. Tiny consistent steps beat rare bursts of effort.',
            author: 'James Clear'
        },
        {
            quote: 'Success is the sum of small efforts, repeated day in and day out.',
            author: 'Robert Collier'
        },
        {
            quote: 'It always seems impossible until it is done.',
            author: 'Nelson Mandela'
        },
        {
            quote: 'Do not wait; the time will never be just right.',
            author: 'Napoleon Hill'
        }
    ]

    if (!motivationQuote || !motivationAuthor) return

    function showQuote(quote, author) {
        motivationQuote.textContent = quote
        motivationAuthor.textContent = author
    }

    function getCurrentDisplayedQuote() {
        return {
            quote: motivationQuote.textContent.trim(),
            author: motivationAuthor.textContent.trim()
        }
    }

    function hasResolvedQuote() {
        let currentQuote = getCurrentDisplayedQuote()

        if (!currentQuote.quote || !currentQuote.author) {
            return false
        }

        return currentQuote.quote !== 'Loading a fresh quote...' &&
            currentQuote.author !== 'Fetching author...'
    }

    function readCachedQuote() {
        let cachedQuote = readStoredJson(quoteStorageKey, null)

        if (!cachedQuote || typeof cachedQuote !== 'object') {
            return null
        }

        if (typeof cachedQuote.quote !== 'string' || typeof cachedQuote.author !== 'string') {
            return null
        }

        if (!cachedQuote.quote.trim() || !cachedQuote.author.trim()) {
            return null
        }

        return cachedQuote
    }

    function cacheQuote(quote, author) {
        try {
            localStorage.setItem(quoteStorageKey, JSON.stringify({
                quote: quote,
                author: author
            }))
        } catch (err) {
            console.warn('Motivation quote cache write failed:', err)
        }
    }

    function showLoadingState() {
        if (!hasResolvedQuote()) {
            showQuote('Loading a fresh quote...', 'Fetching author...')
        }
    }

    function showFallbackQuote(preferCachedQuote) {
        let cachedQuote = preferCachedQuote ? readCachedQuote() : null

        if (cachedQuote) {
            showQuote(cachedQuote.quote, cachedQuote.author)
            return
        }

        let randomIndex = Math.floor(Math.random() * fallbackQuotes.length)
        let fallbackQuote = fallbackQuotes[randomIndex]
        showQuote(fallbackQuote.quote, fallbackQuote.author)
        cacheQuote(fallbackQuote.quote, fallbackQuote.author)
    }

    async function fetchQuote(options) {
        let fetchOptions = options || {}
        let shouldPreserveCurrentQuote = fetchOptions.preserveCurrentQuote !== false

        if (activeQuoteRequest) {
            return activeQuoteRequest
        }

        activeQuoteRequest = (async function () {
            let controller = typeof AbortController === 'function' ? new AbortController() : null
            let timeoutId = null

            if (!shouldPreserveCurrentQuote) {
                showLoadingState()
            }

            if (shouldPreserveCurrentQuote && !hasResolvedQuote()) {
                showLoadingState()
            }

            if (controller) {
                timeoutId = setTimeout(function () {
                    controller.abort()
                }, 4000)
            }

            try {
                let response = await fetch(`https://dummyjson.com/quotes/random?ts=${Date.now()}`, {
                    cache: 'no-store',
                    signal: controller ? controller.signal : undefined
                })

                if (!response.ok) {
                    throw new Error('Quote API error')
                }

                let data = await response.json()

                if (!data.quote || !data.author) {
                    throw new Error('Invalid quote payload')
                }

                showQuote(data.quote, data.author)
                cacheQuote(data.quote, data.author)
            } catch (err) {
                console.error('Motivation quote fetch failed:', err)

                if (!hasResolvedQuote()) {
                    showFallbackQuote(true)
                }
            } finally {
                if (timeoutId) {
                    clearTimeout(timeoutId)
                }

                activeQuoteRequest = null
            }
        })()

        return activeQuoteRequest
    }

    showFallbackQuote(true)

    window.refreshMotivationalQuote = function () {
        return fetchQuote({
            preserveCurrentQuote: true
        })
    }

    fetchQuote({
        preserveCurrentQuote: true
    })

}

motivationalQuote()

function pomodoroTimer() {


    let timer = document.querySelector('.pomo-timer h1')
    var startBtn = document.querySelector('.pomo-timer .start-timer')
    var pauseBtn = document.querySelector('.pomo-timer .pause-timer')
    var resetBtn = document.querySelector('.pomo-timer .reset-timer')
    var session = document.querySelector('.pomodoro-fullpage .session')
    var isWorkSession = true

    let totalSeconds = 25 * 60
    let timerInterval = null

    if (!timer || !startBtn || !pauseBtn || !resetBtn || !session) return

    function setSessionState(mode) {
        var isBreakSession = mode === 'break'
        session.dataset.session = isBreakSession ? 'break' : 'work'
        session.innerHTML = isBreakSession ? 'Take a Break' : 'Work Session'
    }

    function updateTimer() {
        let minutes = Math.floor(totalSeconds / 60)
        let seconds = totalSeconds % 60

        timer.innerHTML = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }

    function startTimer() {
        clearInterval(timerInterval)

        if (isWorkSession) {

            timerInterval = setInterval(function () {
                if (totalSeconds > 0) {
                    totalSeconds--
                    updateTimer()
                } else {
                    isWorkSession = false
                    clearInterval(timerInterval)
                    totalSeconds = 5 * 60
                    setSessionState('break')
                    updateTimer()
                }
            }, 1000)
        } else {


            timerInterval = setInterval(function () {
                if (totalSeconds > 0) {
                    totalSeconds--
                    updateTimer()
                } else {
                    isWorkSession = true
                    clearInterval(timerInterval)
                    totalSeconds = 25 * 60
                    setSessionState('work')
                    updateTimer()
                }
            }, 1000)
        }

    }

    function pauseTimer() {
        clearInterval(timerInterval)
    }
    function resetTimer() {
        isWorkSession = true
        totalSeconds = 25 * 60
        clearInterval(timerInterval)
        setSessionState('work')
        updateTimer()

    }

    setSessionState('work')
    updateTimer()
    startBtn.addEventListener('click', startTimer)
    pauseBtn.addEventListener('click', pauseTimer)
    resetBtn.addEventListener('click', resetTimer)



}

pomodoroTimer()

function weatherFunctionality() {
    var city = 'Bankura, West Bengal'
    var coords = { lat: 23.2353, lon: 87.0718 }

    var header1Time = document.querySelector('.header1 h1')
    var header1Date = document.querySelector('.header1 h2')
    var header1Location = document.querySelector('.header1 .wx-location')
    var header2Temp = document.querySelector('.header2 h2')
    var header2Condition = document.querySelector('.header2 h4')
    var precipitation = document.querySelector('.header2 .precipitation')
    var humidity = document.querySelector('.header2 .humidity')
    var wind = document.querySelector('.header2 .wind')
    var feelsLike = document.querySelector('.header2 .feels')
    var updatedAt = document.querySelector('.header2 .wx-updated')

    if (header1Location) header1Location.textContent = city

    function describeWeatherCode(code) {
        var map = {
            0: 'Clear sky',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Foggy',
            48: 'Depositing rime fog',
            51: 'Light drizzle',
            53: 'Drizzle',
            55: 'Dense drizzle',
            56: 'Freezing drizzle',
            57: 'Heavy freezing drizzle',
            61: 'Light rain',
            63: 'Rain',
            65: 'Heavy rain',
            66: 'Freezing rain',
            67: 'Heavy freezing rain',
            71: 'Snow',
            73: 'Snowfall',
            75: 'Heavy snow',
            77: 'Snow grains',
            80: 'Light showers',
            81: 'Showers',
            82: 'Violent showers',
            85: 'Snow showers',
            86: 'Heavy snow showers',
            95: 'Thunderstorm',
            99: 'Thunderstorm w/ hail'
        }
        return map[code] || 'Weather'
    }

    function directionFromDegrees(degrees) {
        if (typeof degrees !== 'number' || isNaN(degrees)) return ''
        var dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
        var idx = Math.round(degrees / 45) % 8
        return dirs[idx]
    }

    function formatTemp(value) {
        return typeof value === 'number' ? value.toFixed(1) + '\u00b0C' : '--\u00b0C'
    }

    function renderWeather(payload) {
        if (header2Temp) header2Temp.textContent = payload.tempC
        if (header2Condition) header2Condition.textContent = payload.condition
        if (wind) wind.textContent = payload.wind
        if (humidity) humidity.textContent = payload.humidity
        if (precipitation) precipitation.textContent = payload.precipitation
        if (feelsLike) feelsLike.textContent = payload.feelsLike || 'Feels like: --'
        if (updatedAt) updatedAt.textContent = payload.updated || 'Updated just now - Bankura'
    }

    function showUnavailable(msg) {
        renderWeather({
            tempC: '--\u00b0C',
            condition: msg || 'Weather unavailable',
            wind: 'Wind: --',
            humidity: 'Humidity: --',
            precipitation: 'Rain chance: --',
            feelsLike: 'Feels like: --',
            updated: 'Offline fallback - Bankura'
        })
    }

    async function fetchBankuraWeather() {
        var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + coords.lat +
            '&longitude=' + coords.lon +
            '&timezone=Asia/Kolkata' +
            '&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code' +
            '&hourly=precipitation_probability'

        var response = await fetch(url)
        if (!response.ok) throw new Error('Open-Meteo fetch failed: ' + response.status)

        var data = await response.json()
        var cur = data.current || {}

        var rainChance = '--'
        var hourlyTimes = data.hourly && data.hourly.time
        var hourlyPrecip = data.hourly && data.hourly.precipitation_probability
        if (Array.isArray(hourlyTimes) && Array.isArray(hourlyPrecip)) {
            var idx = hourlyTimes.indexOf(cur.time)
            if (idx >= 0 && hourlyPrecip[idx] != null) {
                rainChance = hourlyPrecip[idx]
            } else if (hourlyPrecip.length) {
                rainChance = hourlyPrecip[0]
            }
        }

        return {
            tempC: formatTemp(cur.temperature_2m),
            condition: describeWeatherCode(cur.weather_code),
            wind: 'Wind: ' + (cur.wind_speed_10m != null ? cur.wind_speed_10m.toFixed(0) + ' km/h ' + directionFromDegrees(cur.wind_direction_10m) : '--'),
            humidity: 'Humidity: ' + (cur.relative_humidity_2m != null ? cur.relative_humidity_2m + '%' : '--'),
            precipitation: 'Rain chance: ' + (rainChance !== '--' ? rainChance + '%' : '--'),
            feelsLike: 'Feels like: ' + formatTemp(cur.apparent_temperature),
            updated: 'Updated just now - Bankura '
        }
    }

    async function refreshWeather() {
        try {
            var wx = await fetchBankuraWeather()
            renderWeather(wx)
        } catch (err) {
            console.error('Weather refresh failed; using fallback sample', err)
            renderWeather({
                tempC: '31.0\u00b0C',
                condition: 'Hot and humid',
                wind: 'Wind: 9 km/h SW',
                humidity: 'Humidity: 64%',
                precipitation: 'Rain chance: 18%',
                feelsLike: 'Feels like: 35\u00b0C',
                updated: 'Last known sample - Bankura'
            })
        }
    }

    refreshWeather()

    function timeDate() {
        var totalDaysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        var monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ]
        var date = new Date()
        var dayOfWeek = totalDaysOfWeek[date.getDay()]
        var hours = date.getHours()
        var minutes = date.getMinutes()
        var seconds = date.getSeconds()
        var tarik = date.getDate()
        var month = monthNames[date.getMonth()]
        var year = date.getFullYear()

        header1Date.innerHTML = tarik + ' ' + month + ', ' + year

        var isPM = hours >= 12
        var displayHours = hours % 12
        if (displayHours === 0) displayHours = 12
        header1Time.innerHTML = dayOfWeek + ', ' + String(displayHours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0') + (isPM ? ' PM' : ' AM')
    }

    setInterval(function () {
        timeDate()
    }, 1000)

    timeDate()

}

weatherFunctionality()







