import React from 'react';

/**
 * @typedef {{ id: string, title: string, description: string, status: "todo"|"doing"|"done", dueDate: string, createdAt: string, updatedAt: string }} Task
 */

// PUBLIC_INTERFACE
function TaskList({ tasks, editingTaskId, onEdit, onCancelEdit, onDelete }) {
  /** This component renders the task list with edit/delete actions. */
  if (!tasks.length) {
    return <div className="EmptyState">NO SIGNAL. No tasks match your filters.</div>;
  }

  return (
    <ul className="TaskList">
      {tasks.map(task => {
        const isEditing = editingTaskId === task.id;

        const statusClass =
          task.status === 'done' ? 'TagDone' : task.status === 'doing' ? 'TagDoing' : 'TagTodo';

        const statusLabel =
          task.status === 'done' ? 'DONE' : task.status === 'doing' ? 'DOING' : 'TO DO';

        return (
          <li key={task.id} className="TaskCard">
            <div className="TaskCardHeader">
              <div className="TaskTitleRow">
                <div className="TaskTitle">{task.title}</div>
                {task.description ? <p className="TaskDesc">{task.description}</p> : null}
              </div>

              <div className="ButtonRow" aria-label={`Actions for ${task.title}`}>
                {!isEditing ? (
                  <button className="Button ButtonPrimary" type="button" onClick={() => onEdit(task.id)}>
                    Edit
                  </button>
                ) : (
                  <button className="Button ButtonGhost" type="button" onClick={onCancelEdit}>
                    Cancel
                  </button>
                )}

                <button
                  className="Button ButtonDanger"
                  type="button"
                  onClick={() => onDelete(task.id)}
                  aria-label={`Delete ${task.title}`}
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="TaskMetaRow">
              <div className="TagRow">
                <span className={`Tag ${statusClass}`}>{statusLabel}</span>
                {task.dueDate ? <span className="Tag">DUE {task.dueDate}</span> : <span className="Tag">NO DUE</span>}
              </div>

              <div className="MiniMeta">
                UPDATED {new Date(task.updatedAt || task.createdAt).toLocaleString()}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default TaskList;
