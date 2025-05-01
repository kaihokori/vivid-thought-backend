// reminders.js

async function fetchReminders(spaceId, threadId) {
  const token = localStorage.getItem("authToken");

  const res = await fetch(`http://localhost:3000/api/reminders/${spaceId}/${threadId}`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) throw new Error("Failed to fetch reminders");

  return await res.json();
}

async function createReminder(spaceId, threadId, title, dateString) {
  const token = localStorage.getItem("authToken");

  const res = await fetch(`http://localhost:3000/api/reminders/${spaceId}/${threadId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ title, date: dateString })
  });

  if (!res.ok) throw new Error("Failed to create reminder");
}

async function toggleReminderDone(spaceId, threadId, reminderId, currentDoneState) {
  const token = localStorage.getItem("authToken");

  const res = await fetch(`http://localhost:3000/api/reminders/${spaceId}/${threadId}/${reminderId}/toggle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ currentDone: currentDoneState })
  });

  if (!res.ok) throw new Error("Failed to toggle reminder");
}
