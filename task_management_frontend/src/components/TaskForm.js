import React, { useEffect, useMemo, useState } from 'react';

/**
 * @typedef {{ id: string, title: string, description: string, status: "todo"|"doing"|"done", dueDate: string, createdAt: string, updatedAt: string }} Task
 */

function normalizeDueDate(value) {
  // Accept empty, or YYYY-MM-DD (keep as-is).
  return value ? String(value).slice(0, 10) : '';
}

// PUBLIC_INTERFACE
function TaskForm({ mode, initialTask, onCreate, onUpdate, onCancel }) {
  /** Task editor form; controlled inputs with basic validation. */
  const isEdit = mode === 'edit';

  const initial = useMemo(() => {
    return {
      id: initialTask?.id || '',
      title: initialTask?.title || '',
      description: initialTask?.description || '',
      status: initialTask?.status || 'todo',
      dueDate: normalizeDueDate(initialTask?.dueDate || '')
    };
  }, [initialTask]);

  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [status, setStatus] = useState(initial.status);
  const [dueDate, setDueDate] = useState(initial.dueDate);
  const [error, setError] = useState('');

  useEffect(() => {
    setTitle(initial.title);
    setDescription(initial.description);
    setStatus(initial.status);
    setDueDate(initial.dueDate);
    setError('');
  }, [initial]);

  function validate() {
    const t = title.trim();
    if (!t) return 'Title is required.';
    if (t.length > 80) return 'Title is too long (max 80 chars).';
    if (description.trim().length > 280) return 'Description is too long (max 280 chars).';
    if (!['todo', 'doing', 'done'].includes(status)) return 'Invalid status.';
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');

    const payload = {
      id: initial.id,
      title: title.trim(),
      description: description.trim(),
      status,
      dueDate: normalizeDueDate(dueDate)
    };

    if (isEdit) {
      await onUpdate(payload);
    } else {
      await onCreate(payload);
      // Reset on create
      setTitle('');
      setDescription('');
      setStatus('todo');
      setDueDate('');
    }
  }

  return (
    <form className="Form" onSubmit={handleSubmit}>
      <div className="FormTitle">{isEdit ? 'Edit the record' : 'Create a new record'}</div>

      <label className="Field">
        <span className="FieldLabel">Title</span>
        <input
          className="Input"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g., Defrag the floppy…"
          maxLength={120}
          autoFocus={!isEdit}
        />
      </label>

      <label className="Field">
        <span className="FieldLabel">Description</span>
        <textarea
          className="Textarea"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Optional notes for your future self…"
          maxLength={420}
        />
      </label>

      <div className="Controls" style={{ padding: 0, gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <label className="Field">
          <span className="FieldLabel">Status</span>
          <select className="Select" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="todo">To do</option>
            <option value="doing">Doing</option>
            <option value="done">Done</option>
          </select>
        </label>

        <label className="Field">
          <span className="FieldLabel">Due date</span>
          <input className="Input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </label>
      </div>

      {error ? (
        <div className="Banner BannerWarn" role="alert">
          {error}
        </div>
      ) : null}

      <div className="ButtonRow">
        <button className="Button ButtonPrimary" type="submit">
          {isEdit ? 'Save changes' : 'Add task'}
        </button>

        {isEdit ? (
          <button className="Button ButtonGhost" type="button" onClick={onCancel}>
            Cancel edit
          </button>
        ) : null}
      </div>
    </form>
  );
}

export default TaskForm;
