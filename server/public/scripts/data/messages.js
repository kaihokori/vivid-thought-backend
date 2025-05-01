// messages.js

async function fetchMessages(spaceId, threadId) {
  const token = localStorage.getItem("authToken");

  try {
    const res = await fetch(`http://localhost:3000/api/messages/${spaceId}/${threadId}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error(await res.text());

    const messages = await res.json();
    return messages;
  } catch (err) {
    console.error("Error fetching messages:", err);
    throw err;
  }
}

async function sendMessage(spaceId, threadId, message) {
  const token = localStorage.getItem("authToken");

  if (!message.trim()) throw new Error("Message is empty.");

  try {
    await fetch(`http://localhost:3000/api/messages/${spaceId}/${threadId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ message })
    });
  } catch (err) {
    console.error("Error sending message:", err);
    throw err;
  }
}
