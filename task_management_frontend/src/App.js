import React, { useEffect, useMemo, useReducer, useState } from 'react';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import './App.css';

/**
 * NOTE: This frontend can work in "local mode" (in-memory tasks) by default.
 * If you provide a backend base URL (REACT_APP_API_BASE or REACT_APP_BACKEND_URL),
 * it will attempt to load/save tasks via HTTP endpoints:
 * - GET    /tasks
 * - POST   /tasks
 * - PUT    /tasks/:id
 * - DELETE /tasks/:id
 *
 * If your backend differs, adjust src/services/tasksApi.js only.
 */

/** @typedef {{ id: string, title: string, description: string, status: "todo"|"doing"|"done", dueDate: string, createdAt: string, updatedAt: string }} Task */

function makeId() {
  // Simple deterministic-enough id for local mode
  return `tsk_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

/** @type {Task[]} */
const seedTasks = [
  {
    id: 'tsk_seed_1',
    title: 'Boot the CRT terminal',
    description: 'Warm up phosphors. Listen for the glorious hum.',
    status: 'todo',
    dueDate: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tsk_seed_2',
    title: 'Write task list on dot-matrix',
    description: 'Feed paper. Avoid jams. Embrace the noise.',
    status: 'doing',
    dueDate: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const initialState = {
  tasks: /** @type {Task[]} */ ([]),
  isLoading: false,
  error: ''
};

function tasksReducer(state, action) {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, isLoading: true, error: '' };
    case 'LOAD_SUCCESS':
      return { ...state, isLoading: false, tasks: action.tasks, error: '' };
    case 'LOAD_ERROR':
      return { ...state, isLoading: false, error: action.error || 'Failed to load tasks.' };
    case 'ADD_TASK':
      return { ...state, tasks: [action.task, ...state.tasks] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => (t.id === action.task.id ? action.task : t))
      };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.id) };
    default:
      return state;
  }
}

// PUBLIC_INTERFACE
function App() {
  /** @type {[("light"|"dark"), Function]} */
  const [theme, setTheme] = useState('dark');
  const [state, dispatch] = useReducer(tasksReducer, initialState);

  const [editingTaskId, setEditingTaskId] = useState(/** @type {string|null} */ (null));
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [announce, setAnnounce] = useState('');

  const apiBase = useMemo(() => {
    const fromEnv = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || '';
    return String(fromEnv || '').replace(/\/+$/, '');
  }, []);

  const isApiEnabled = Boolean(apiBase);

  // Theme side-effect (allowed); do not manipulate DOM otherwise.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load tasks: prefer API, fallback to local seed.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      dispatch({ type: 'LOAD_START' });

      if (!isApiEnabled) {
        // Local mode
        const existing = seedTasks;
        if (!cancelled) dispatch({ type: 'LOAD_SUCCESS', tasks: existing });
        return;
      }

      try {
        const { listTasks } = await import('./services/tasksApi');
        const tasks = await listTasks(apiBase);
        if (!cancelled) dispatch({ type: 'LOAD_SUCCESS', tasks });
      } catch (e) {
        if (!cancelled) {
          dispatch({
            type: 'LOAD_ERROR',
            error:
              'Could not reach the backend. Using local tasks instead. (Set REACT_APP_API_BASE to enable API.)'
          });
          dispatch({ type: 'LOAD_SUCCESS', tasks: seedTasks });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [apiBase, isApiEnabled]);

  useEffect(() => {
    if (!announce) return;
    const t = window.setTimeout(() => setAnnounce(''), 1200);
    return () => window.clearTimeout(t);
  }, [announce]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();

    return state.tasks.filter(t => {
      const matchesQuery =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' ? true : t.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [query, state.tasks, statusFilter]);

  async function apiOrLocalAdd(taskInput) {
    const now = new Date().toISOString();

    /** @type {Task} */
    const newTask = {
      id: makeId(),
      title: taskInput.title,
      description: taskInput.description,
      status: taskInput.status,
      dueDate: taskInput.dueDate || '',
      createdAt: now,
      updatedAt: now
    };

    dispatch({ type: 'ADD_TASK', task: newTask });
    setAnnounce('Task added.');

    if (!isApiEnabled) return;

    try {
      const { createTask } = await import('./services/tasksApi');
      const created = await createTask(apiBase, newTask);

      // If backend returns authoritative id/fields, sync it in.
      dispatch({ type: 'UPDATE_TASK', task: created });
    } catch {
      // Keep optimistic local state; show warning via banner.
      dispatch({
        type: 'LOAD_ERROR',
        error: 'Added locally, but failed to save to backend.'
      });
    }
  }

  async function apiOrLocalUpdate(taskInput) {
    const existing = state.tasks.find(t => t.id === taskInput.id);
    if (!existing) return;

    /** @type {Task} */
    const updated = {
      ...existing,
      title: taskInput.title,
      description: taskInput.description,
      status: taskInput.status,
      dueDate: taskInput.dueDate || '',
      updatedAt: new Date().toISOString()
    };

    dispatch({ type: 'UPDATE_TASK', task: updated });
    setEditingTaskId(null);
    setAnnounce('Task updated.');

    if (!isApiEnabled) return;

    try {
      const { updateTask } = await import('./services/tasksApi');
      const saved = await updateTask(apiBase, updated);
      dispatch({ type: 'UPDATE_TASK', task: saved });
    } catch {
      dispatch({
        type: 'LOAD_ERROR',
        error: 'Updated locally, but failed to save to backend.'
      });
    }
  }

  async function apiOrLocalDelete(id) {
    const existing = state.tasks.find(t => t.id === id);
    if (!existing) return;

    dispatch({ type: 'DELETE_TASK', id });
    setAnnounce('Task deleted.');

    if (!isApiEnabled) return;

    try {
      const { deleteTask } = await import('./services/tasksApi');
      await deleteTask(apiBase, id);
    } catch {
      dispatch({
        type: 'LOAD_ERROR',
        error: 'Deleted locally, but failed to delete from backend.'
      });
    }
  }

  const editingTask = editingTaskId ? state.tasks.find(t => t.id === editingTaskId) : null;

  return (
    <div className="App">
      <div className="Scanlines" aria-hidden="true" />

      <header className="TopBar">
        <div className="Brand">
          <div className="BrandMark" aria-hidden="true">
            TM
          </div>
          <div className="BrandText">
            <div className="BrandTitle">Task Manager</div>
            <div className="BrandSubtitle">Retro Console Edition</div>
          </div>
        </div>

        <div className="TopBarActions">
          <button
            className="Button ButtonGhost"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            type="button"
          >
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>
      </header>

      <main className="Layout">
        <section className="Panel PanelLeft" aria-label="Task list">
          <div className="PanelHeader">
            <div className="PanelTitle">TASKS</div>
            <div className="PanelMeta">
              <span className="Pill">{filteredTasks.length} shown</span>
              <span className="Pill">{state.tasks.length} total</span>
              <span className={`Pill ${isApiEnabled ? 'PillOk' : 'PillWarn'}`}>
                {isApiEnabled ? 'API' : 'LOCAL'}
              </span>
            </div>
          </div>

          <div className="Controls">
            <label className="Field">
              <span className="FieldLabel">Search</span>
              <input
                className="Input"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="title, status, description…"
              />
            </label>

            <label className="Field">
              <span className="FieldLabel">Status</span>
              <select
                className="Select"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="todo">To do</option>
                <option value="doing">Doing</option>
                <option value="done">Done</option>
              </select>
            </label>
          </div>

          {state.error ? (
            <div className="Banner BannerWarn" role="status">
              {state.error}
            </div>
          ) : null}

          {announce ? (
            <div className="SrOnly" aria-live="polite">
              {announce}
            </div>
          ) : null}

          {state.isLoading ? <div className="Loader">Loading…</div> : null}

          <TaskList
            tasks={filteredTasks}
            editingTaskId={editingTaskId}
            onEdit={id => setEditingTaskId(id)}
            onCancelEdit={() => setEditingTaskId(null)}
            onDelete={apiOrLocalDelete}
          />
        </section>

        <aside className="Panel PanelRight" aria-label="Task editor">
          <div className="PanelHeader">
            <div className="PanelTitle">{editingTask ? 'EDIT TASK' : 'ADD TASK'}</div>
            <div className="PanelMeta">
              <span className="Pill">CTRL+S vibes</span>
            </div>
          </div>

          <TaskForm
            mode={editingTask ? 'edit' : 'create'}
            initialTask={editingTask}
            onCreate={apiOrLocalAdd}
            onUpdate={apiOrLocalUpdate}
            onCancel={() => setEditingTaskId(null)}
          />

          <div className="HintBox">
            <div className="HintTitle">Tips</div>
            <ul className="HintList">
              <li>Click a task to edit, or use the Edit button.</li>
              <li>Use statuses: To do → Doing → Done.</li>
              <li>Backend optional: set <code>REACT_APP_API_BASE</code>.</li>
            </ul>
          </div>
        </aside>
      </main>

      <footer className="Footer">
        <div className="FooterText">
          Built with React. No frameworks. All vibes.
        </div>
      </footer>
    </div>
  );
}

export default App;
