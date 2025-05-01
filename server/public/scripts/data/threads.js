// threads.js

async function fetchThreads(spaceId) {
  try {
    const res = await fetch(`http://localhost:3000/api/spaces/${spaceId}/threads`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch threads");
    return await res.json();
  } catch (err) {
    console.error("Error fetching threads:", err);
    throw err;
  }
}

async function createThread(spaceId, threadTitle) {
  try {
    const res = await fetch(`http://localhost:3000/api/spaces/${spaceId}/threads`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ title: threadTitle })
    });
    if (!res.ok) throw new Error("Failed to create thread");
    const data = await res.json();
    return data.threadId;
  } catch (err) {
    console.error("Error creating thread:", err);
    throw err;
  }
}

window.fetchThreads = fetchThreads;
window.createThread = createThread;
