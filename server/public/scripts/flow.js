// flow.js

document.addEventListener("DOMContentLoaded", () => {
  const showOne = () => {
    document.querySelectorAll(".one").forEach((el) => {
      el.style.display = "flex";
    });
    document.querySelectorAll(".two").forEach((el) => {
      el.style.display = "none";
    });
  };

  const showTwo = () => {
    document.querySelectorAll(".one").forEach((el) => {
      el.style.display = "none";
    });
    document.querySelectorAll(".two").forEach((el) => {
      el.style.display = "flex";
    });
  };

  showOne();

  const workspaceBtn = document.getElementById("workspace-button");
  const returnBtn = document.getElementById("return-button");

  if (workspaceBtn) workspaceBtn.addEventListener("click", showTwo);
  if (returnBtn) returnBtn.addEventListener("click", showOne);

  const overlay = document.getElementById("overlay");
  const overlayContent = document.getElementById("overlay-content");
  const closeOverlayBtn = document.getElementById("close-overlay");

  const overlayTemplates = {
    "Create Space": `
      <p class="large">Join or Create Space</p>
      <p class="small">Once joined or created, you cannot leave the space</p>

      <div class="input-group">
        <input type="text" id="space-code" required />
        <label for="space-code">Code</label>
      </div>
      <a id="joinSpaceButton" style="margin-top: 20px;" class="centered-action">
        <img src="assets/icons/join.svg" alt="Join Icon" />Join
      </a>

      <hr>

      <div class="input-group">
        <input type="text" id="space-name" required />
        <label for="space-name">Name</label>
      </div>
      <div class="input-group">
        <input type="text" id="space-image-url" placeholder="https://..." />
        <label for="space-image-url">Image URL (optional)</label>
      </div>
      <a id="createSpaceButton" style="margin-top: 20px;" class="centered-action">
        <img src="assets/icons/plus.svg" alt="Plus Icon" />Create
      </a>
    `,
    "Create Thread": `
      <p class="large">Create Thread</p>
      <p class="small">Once created, you cannot delete the thread</p>
      <div class="input-group">
        <input type="text" id="thread-name" required />
        <label for="thread-name">Name</label>
      </div>
      <a id="createThreadButton" style="margin-top: 40px;" class="centered-action">
        <img src="assets/icons/plus.svg" alt="Plus Icon" />Create
      </a>
    `,
    "Create Reminder": `
      <p class="large">Create Reminder</p>
      <p class="small">Reminders will automatically be shared with the space and cannot be deleted</p>
      <div class="input-group">
        <input type="text" id="reminder-title" required />
        <label for="reminder-title">Title</label>
      </div>
      <div class="input-group">
        <input type="date" id="reminder-date" required />
        <label for="reminder-date">Date</label>
      </div>
      <a id="createReminderButton" style="margin-top: 40px;" class="centered-action">
        <img src="assets/icons/plus.svg" alt="Plus Icon" />Create
      </a>
    `,
    "Create File": `
      <p class="large">Create File</p>
      <p class="small">Files will automatically be shared with the space and cannot be deleted from here</p>
      <a id="file-docs" style="margin: 20px 0;"><img src="assets/icons/docs.svg" alt="Docs Icon" />Docs</a>
      <a id="file-slides" style="margin: 20px 0;"><img src="assets/icons/slides.svg" alt="Slides Icon" />Slides</a>
      <a id="file-sheets" style="margin: 20px 0;"><img src="assets/icons/sheets.svg" alt="Sheets Icon" />Sheets</a>
    `,
  };

  function showOverlay(action) {
    const content =
      overlayTemplates[action] || `<p>Unknown action: ${action}</p>`;
    overlayContent.innerHTML = content;
    overlay.classList.remove("hidden");

    if (action === "Create Space") {
      const createBtn = document.getElementById("createSpaceButton");
      const joinBtn = document.getElementById("joinSpaceButton");

      if (createBtn) {
        createBtn.addEventListener("click", async () => {
          const nameInput = document.getElementById("space-name");
          const imageUrlInput = document.getElementById("space-image-url");

          const spaceName = nameInput?.value?.trim();
          const imageUrl = imageUrlInput?.value?.trim();

          if (!spaceName) {
            alert("Please enter a space name.");
            return;
          }

          try {
            const newId = await createSpace(spaceName, imageUrl || null);
            overlay.classList.add("hidden");
            overlayContent.innerHTML = "";
            await generateSpaces();
          } catch (err) {
            alert(`Failed to create space: ${err.message}`);
          }
        });
      }

      if (joinBtn) {
        joinBtn.addEventListener("click", async () => {
          const codeInput = document.getElementById("space-code");
          const spaceId = codeInput?.value?.trim();

          if (!spaceId) {
            alert("Please enter a space code.");
            return;
          }

          try {
            await joinSpace(spaceId);
            alert("Joined space!");
            overlay.classList.add("hidden");
            overlayContent.innerHTML = "";
            await generateSpaces();
          } catch (err) {
            alert(`Failed to join space: ${err.message}`);
          }
        });
      }
    }

    if (action === "Create Thread") {
      const createThreadBtn = document.getElementById("createThreadButton");

      if (createThreadBtn) {
        createThreadBtn.addEventListener("click", async () => {
          const input = document.getElementById("thread-name");
          const threadTitle = input?.value?.trim();

          if (!threadTitle) {
            alert("Please enter a thread title.");
            return;
          }

          const spaceId = window.selectedSpaceId;
          if (!spaceId) {
            alert("No space selected.");
            return;
          }

          try {
            await createThread(spaceId, threadTitle);
            overlay.classList.add("hidden");
            overlayContent.innerHTML = "";
            const threads = await fetchThreads(spaceId);
            renderThreads(threads);
          } catch (err) {
            alert(`Failed to create thread: ${err.message}`);
          }
        });
      }
    }

    if (action === "Create Reminder") {
      const reminderBtn = document.getElementById("createReminderButton");

      if (reminderBtn) {
        reminderBtn.addEventListener("click", async () => {
          const title = document
            .getElementById("reminder-title")
            ?.value?.trim();
          const date = document.getElementById("reminder-date")?.value;

          if (!title || !date) {
            alert("Please enter a title and date.");
            return;
          }

          const spaceId = window.selectedSpaceId;
          const threadId = window.selectedThreadId;

          if (!spaceId || !threadId) {
            alert("No thread selected.");
            return;
          }

          try {
            await createReminder(spaceId, threadId, title, date);
            overlay.classList.add("hidden");
            overlayContent.innerHTML = "";
            const reminders = await fetchReminders(spaceId, threadId);
            generateReminders(reminders);
          } catch (err) {
            alert(`Failed to create reminder: ${err.message}`);
          }
        });
      }
    }

    if (action === "Create File") {
      const types = ["docs", "slides", "sheets"];

      types.forEach((type) => {
        const btn = document.getElementById(`file-${type}`);
        if (btn) {
          btn.addEventListener("click", async () => {
            const spaceId = window.selectedSpaceId;
            const threadId = window.selectedThreadId;

            if (!spaceId || !threadId) {
              alert("Please select a thread.");
              return;
            }

            const fileName = prompt(`Enter name for new ${type}:`);
            if (!fileName) return;

            try {
              const file = {
                name: fileName,
                url: "https://google.com",
                type: type,
                createdAt: new Date()
              };              
              
              await saveFileMetadata(spaceId, threadId, file);              
              overlay.classList.add("hidden");
              overlayContent.innerHTML = "";

              const updatedFiles = await fetchFiles(spaceId, threadId);
              generateFiles(updatedFiles);
            } catch (err) {
              alert(`Failed to create file: ${err.message}`);
            }
          });
        }
      });
    }
  }

  closeOverlayBtn.addEventListener("click", () => {
    overlay.classList.add("hidden");
    overlayContent.innerHTML = "";
  });

  const buttons = [
    "Create Space",
    "Create Thread",
    "Create Reminder",
    "Create File",
  ];

  buttons.forEach((label) => {
    document.querySelectorAll(".alt, a.one, a.two").forEach((btn) => {
      if (btn.textContent.includes(label)) {
        btn.addEventListener("click", () => showOverlay(label));
      }
    });
  });

  const inputBox = document.querySelector(".input-box");
  const sendBtn = document.querySelector(".bottom-bar a:last-of-type");

  if (sendBtn) {
    sendBtn.addEventListener("click", async () => {
      const message = inputBox.value;
      const spaceId = window.selectedSpaceId;
      const threadId = window.selectedThreadId;

      if (!message || !spaceId || !threadId) return;

      try {
        await sendMessage(spaceId, threadId, message);
        inputBox.value = "";

        startMessageListener(spaceId, threadId);
      } catch (err) {
        alert(`Failed to send message: ${err.message}`);
      }
    });
  }

  const pokeBtn = document.getElementById("poke-button");

  if (pokeBtn) {
    pokeBtn.addEventListener("click", async () => {
      const spaceId = window.selectedSpaceId;
      const threadId = window.selectedThreadId;

      if (!spaceId || !threadId) return;

      try {
        await sendMessage(spaceId, threadId, "Poke");
        startMessageListener(spaceId, threadId);
      } catch (err) {
        alert(`Failed to poke: ${err.message}`);
      }
    });
  }

  let messagePoller = null;

  function startMessageListener(spaceId, threadId) {
    if (!spaceId || !threadId) return;
  
    if (messagePoller) {
      clearInterval(messagePoller);
      messagePoller = null;
    }
  
    const pollMessages = async () => {
      try {
        const messages = await fetchMessages(spaceId, threadId);
        generateChat(messages);
      } catch (err) {
        console.error("Polling messages failed:", err);
      }
    };
  
    pollMessages();
    messagePoller = setInterval(pollMessages, 2000);
  }

  (async () => {
    try {
      await generateSpaces();
    } catch (err) {
      console.error("Failed to load and render spaces on init:", err);
    }
  })();  
});
