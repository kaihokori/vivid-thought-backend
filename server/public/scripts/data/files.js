// files.js

async function saveFileMetadata(spaceId, threadId, file) {
  const token = localStorage.getItem("authToken");

  const res = await fetch(`http://localhost:3000/api/files/${spaceId}/${threadId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      name: file.name,
      url: file.url,
      type: file.type,
      createdAt: file.createdAt
    })
  });

  if (!res.ok) throw new Error("Failed to save file metadata");
}

async function fetchFiles(spaceId, threadId) {
  const token = localStorage.getItem("authToken");

  const res = await fetch(`http://localhost:3000/api/files/${spaceId}/${threadId}`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) throw new Error("Failed to fetch files");

  return await res.json();
}

window.fetchFiles = fetchFiles;
window.saveFileMetadata = saveFileMetadata;
