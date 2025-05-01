// spaces.js

async function fetchSpaces() {
  try {
    const res = await fetch("http://localhost:3000/api/spaces", {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch spaces");
    return await res.json();
  } catch (err) {
    console.error("Error fetching spaces:", err);
    throw err;
  }
}

async function createSpace(spaceName, imageUrl = null) {
  try {
    const res = await fetch("http://localhost:3000/api/spaces", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name: spaceName, image: imageUrl })
    });
    if (!res.ok) throw new Error("Failed to create space");
    const data = await res.json();
    return data.spaceId;
  } catch (err) {
    console.error("Error creating space:", err);
    throw err;
  }
}

async function joinSpace(spaceId) {
  try {
    const res = await fetch("http://localhost:3000/api/spaces/join", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ spaceId })
    });
    if (!res.ok) throw new Error("Failed to join space");
    const data = await res.json();
    return data.space;
  } catch (err) {
    console.error("Error joining space:", err);
    throw err;
  }
}

window.fetchSpaces = fetchSpaces;
window.createSpace = createSpace;
window.joinSpace = joinSpace;