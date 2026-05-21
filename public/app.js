const STORAGE_KEY = 'todos';
const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const dateInput = document.getElementById('todo-date');
const priorityInput = document.getElementById('todo-priority');
const categoryInput = document.getElementById('todo-category');
const list = document.getElementById('todo-list');
const emptyMsg = document.getElementById('empty-msg');
const actionButtons = document.getElementById('action-buttons');
const pickRandomBtn = document.getElementById('pick-random-btn');

function loadTodos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTodos(todos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

let sortableInstance = null;

function render() {
  const todos = loadTodos();
  list.innerHTML = '';
  emptyMsg.style.display = todos.length ? 'none' : 'block';
  actionButtons.style.display = todos.length ? 'block' : 'none';

  todos.forEach((todo) => {
    const li = document.createElement('li');
    li.className = todo.done ? 'done' : '';
    // Optional: give li an attribute to help sortable if needed, or just rely on index
    li.dataset.id = todo.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.done;
    checkbox.addEventListener('change', () => toggleTodo(todo.id));

    const contentDiv = document.createElement('div');
    contentDiv.className = 'todo-content';

    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = todo.text;
    contentDiv.appendChild(span);

    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'todo-details';

    if (todo.priority) {
      const priorityBadge = document.createElement('span');
      priorityBadge.className = `badge priority-${todo.priority.toLowerCase()}`;
      priorityBadge.textContent = todo.priority + ' Priority';
      detailsDiv.appendChild(priorityBadge);
    }

    if (todo.category) {
      const categoryBadge = document.createElement('span');
      categoryBadge.className = 'badge category-badge';
      categoryBadge.textContent = todo.category;
      detailsDiv.appendChild(categoryBadge);
    }

    if (todo.dueDate) {
      const dateBadge = document.createElement('span');
      dateBadge.className = 'badge date-badge';
      // Append time to ensure it parses as local time instead of UTC to avoid off-by-one errors
      const localDate = new Date(todo.dueDate + 'T00:00:00');
      dateBadge.textContent = localDate.toLocaleDateString();
      detailsDiv.appendChild(dateBadge);
    }

    if (detailsDiv.hasChildNodes()) {
      contentDiv.appendChild(detailsDiv);
    }

    const delBtn = document.createElement('button');
    delBtn.textContent = '✕';
    delBtn.className = 'del';
    delBtn.addEventListener('click', () => deleteTodo(todo.id));

    li.append(checkbox, contentDiv, delBtn);
    list.appendChild(li);
  });

  if (!sortableInstance) {
    sortableInstance = new Sortable(list, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      onEnd: (evt) => {
        const currentTodos = loadTodos();
        const [movedItem] = currentTodos.splice(evt.oldIndex, 1);
        currentTodos.splice(evt.newIndex, 0, movedItem);
        saveTodos(currentTodos);
      }
    });
  }

  updateStats(todos);
}

function updateStats(todos) {
  const statCompletedToday = document.getElementById('stat-completed-today');
  const statTotalActive = document.getElementById('stat-total-active');

  const today = new Date().toDateString();
  const completedToday = todos.filter((t) => {
    if (!t.done || !t.completedAt) return false;
    return new Date(t.completedAt).toDateString() === today;
  }).length;

  const totalActive = todos.filter((t) => !t.done).length;

  statCompletedToday.textContent = completedToday;
  statTotalActive.textContent = totalActive;
}

function addTodo(text, dueDate, priority, category) {
  const todos = loadTodos();
  todos.push({ id: Date.now(), text, done: false, dueDate, priority, category });
  saveTodos(todos);
  render();
}

function toggleTodo(id) {
  const todos = loadTodos().map((t) => {
    if (t.id === id) {
      const isDone = !t.done;
      return { 
        ...t, 
        done: isDone, 
        completedAt: isDone ? Date.now() : null 
      };
    }
    return t;
  });
  saveTodos(todos);
  render();
}

function deleteTodo(id) {
  const todos = loadTodos().filter((t) => t.id !== id);
  saveTodos(todos);
  render();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  const dueDate = dateInput.value;
  const priority = priorityInput.value;
  const category = categoryInput.value;

  if (!text) return;
  
  addTodo(text, dueDate, priority, category);
  
  input.value = '';
  dateInput.value = '';
  priorityInput.value = 'Med';
  categoryInput.value = '';
});

pickRandomBtn.addEventListener('click', () => {
  const todos = loadTodos();
  const uncompleted = todos.filter((t) => !t.done);
  const pool = uncompleted.length > 0 ? uncompleted : todos;
  if (pool.length === 0) return;
  
  const randomIndex = Math.floor(Math.random() * pool.length);
  const picked = pool[randomIndex];
  
  const listItems = list.querySelectorAll('li');
  listItems.forEach((li) => li.classList.remove('highlight'));
  
  const pickedItemIndex = todos.findIndex((t) => t.id === picked.id);
  if (pickedItemIndex !== -1) {
    const pickedLi = listItems[pickedItemIndex];
    pickedLi.classList.add('highlight');
    pickedLi.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});

// Pomodoro Timer
let pomodoroTime = 25 * 60;
let pomodoroInterval = null;
let isPomodoroRunning = false;

const pomodoroTimeEl = document.getElementById('pomodoro-time');
const pomodoroToggleBtn = document.getElementById('pomodoro-toggle');

function updatePomodoroDisplay() {
  const minutes = Math.floor(pomodoroTime / 60);
  const seconds = pomodoroTime % 60;
  pomodoroTimeEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

pomodoroToggleBtn.addEventListener('click', () => {
  if (isPomodoroRunning) {
    clearInterval(pomodoroInterval);
    isPomodoroRunning = false;
    pomodoroToggleBtn.textContent = 'Start';
  } else {
    isPomodoroRunning = true;
    pomodoroToggleBtn.textContent = 'Pause';
    pomodoroInterval = setInterval(() => {
      if (pomodoroTime > 0) {
        pomodoroTime--;
        updatePomodoroDisplay();
      } else {
        clearInterval(pomodoroInterval);
        isPomodoroRunning = false;
        pomodoroToggleBtn.textContent = 'Start';
        pomodoroTime = 25 * 60;
        updatePomodoroDisplay();
        alert('Pomodoro completed! Time for a break.');
      }
    }, 1000);
  }
});

updatePomodoroDisplay();
render();

