/**
 * Minimal HTTP client for a tasks backend.
 * Expected endpoints:
 * - GET    {baseUrl}/tasks
 * - POST   {baseUrl}/tasks
 * - PUT    {baseUrl}/tasks/{id}
 * - DELETE {baseUrl}/tasks/{id}
 *
 * Adjust these functions if your backend differs.
 */

/**
 * @typedef {{ id: string, title: string, description: string, status: "todo"|"doing"|"done", dueDate: string, createdAt: string, updatedAt: string }} Task
 */

async function jsonFetch(url, options) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options && options.headers ? options.headers : {})
    }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }

  // Some DELETE endpoints may return empty body
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;
  return res.json();
}

// PUBLIC_INTERFACE
export async function listTasks(baseUrl) {
  /** Fetch all tasks from the backend. */
  const data = await jsonFetch(`${baseUrl}/tasks`, { method: 'GET' });
  if (!Array.isArray(data)) return [];
  return data;
}

// PUBLIC_INTERFACE
export async function createTask(baseUrl, task) {
  /** Create a task in the backend. */
  const data = await jsonFetch(`${baseUrl}/tasks`, {
    method: 'POST',
    body: JSON.stringify(task)
  });
  return data || task;
}

// PUBLIC_INTERFACE
export async function updateTask(baseUrl, task) {
  /** Update a task in the backend. */
  const data = await jsonFetch(`${baseUrl}/tasks/${encodeURIComponent(task.id)}`, {
    method: 'PUT',
    body: JSON.stringify(task)
  });
  return data || task;
}

// PUBLIC_INTERFACE
export async function deleteTask(baseUrl, id) {
  /** Delete a task in the backend. */
  await jsonFetch(`${baseUrl}/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return true;
}
