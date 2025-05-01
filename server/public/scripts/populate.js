// populate.js

const spaces = [];

const threads = [];

const currentUserId = "";

const messages = [];

const sharedFiles = [];

const reminders = [];

// Spaces

async function generateSpaces() {
  const container = document.querySelector(".div1 .scrollable.one");
  container.innerHTML = "";

  let spaces = [];
  try {
    spaces = await fetchSpaces();
  } catch (err) {
    console.error("Could not load spaces:", err);
    const p = document.createElement("p");
    p.textContent = "Failed to load spaces.";
    container.appendChild(p);
    return;
  }

  spaces.forEach((space) => {
    const a = document.createElement("a");
    a.classList.add("alt", "fill");

    const div = document.createElement("div");

    if (space.image) {
      const img = document.createElement("img");
      img.src = space.image;
      img.alt = "";
      div.appendChild(img);
    } else {
      const words = space.name.trim().split(/\s+/);
      let initials;

      if (words.length === 1) {
        initials = words[0].substring(0, 2).toUpperCase();
      } else {
        initials = (words[0][0] + words[1][0]).toUpperCase();
      }

      div.textContent = initials;
    }

    a.appendChild(div);
    a.appendChild(document.createTextNode(space.name));

    a.addEventListener("click", async () => {
      
      document.querySelector(".div2").classList.remove("hidden");
      document.querySelector(".div3").classList.add("hidden");

      window.selectedSpaceId = space.id;

      const spaceTitleElement = document.querySelector(
        ".div2 .top-bar p.large.one"
      );
      if (spaceTitleElement) {
        spaceTitleElement.textContent = space.name;
      }

      try {
        const threads = await fetchThreads(space.id);
        renderThreads(threads);
      } catch (err) {
        console.error("Failed to fetch threads:", err);
      }
    });

    container.appendChild(a);
  });
}

// Spaces Share

function setupShareButton() {
  const shareButton = document.querySelector(".div2 .top-bar a.one");

  const newButton = shareButton.cloneNode(true);
  shareButton.parentNode.replaceChild(newButton, shareButton);

  newButton.addEventListener("click", () => {
    const inviteCode = window.selectedSpaceId;
    if (!inviteCode) {
      alert("No space selected.");
      return;
    }

    navigator.clipboard
      .writeText(inviteCode)
      .then(() => {
        alert(`Invite code "${inviteCode}" copied to clipboard!`);
      })
      .catch(() => {
        alert(`Invite code: ${inviteCode}`);
      });
  });
}

// Threads

function generateThreads() {
  const container = document.querySelector(".div2 .scrollable.one");
  container.innerHTML = "";

  threads.forEach((thread) => {
    const a = document.createElement("a");
    const p = document.createElement("p");
    p.classList.add("medium");
    p.textContent = thread.title;
    a.appendChild(p);
    container.appendChild(a);
  });
}

function renderThreads(threads) {
  const container = document.querySelector(".div2 .scrollable.one");
  container.innerHTML = "";

  threads.forEach((thread) => {
    const a = document.createElement("a");
    const p = document.createElement("p");
    p.classList.add("medium");
    p.textContent = thread.title;
    a.appendChild(p);

    a.addEventListener("click", async () => {
      document.querySelector(".div3").classList.remove("hidden");

      window.selectedThreadId = thread.id;

      const threadTitleEl = document.getElementById("thread-title");
      if (threadTitleEl) threadTitleEl.textContent = thread.title;

      try {
        const messages = await fetchMessages(window.selectedSpaceId, thread.id);
        generateChat(messages);

        const reminders = await fetchReminders(
          window.selectedSpaceId,
          thread.id
        );
        generateReminders(reminders);

        const files = await fetchFiles(window.selectedSpaceId, thread.id);
        generateFiles(files);
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    });

    container.appendChild(a);
  });
}

// Messages

function generateChat(messages) {
  const container = document.getElementById("chat-scroll");
  container.innerHTML = "";

  let currentDate = "";

  messages.forEach((msg) => {
    const msgDate = formatDate(msg.sentAt?.toDate?.() ?? msg.sentAt);
    if (msgDate !== currentDate) {
      const dateP = document.createElement("p");
      dateP.classList.add("small", "date");
      dateP.textContent = msgDate;
      container.appendChild(dateP);
      currentDate = msgDate;
    }

    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");
    
    const token = localStorage.getItem("authToken");
    const userEmail = token ? JSON.parse(atob(token.split(".")[1])).email : "";

    if (msg.senderId === userEmail) {
      messageDiv.classList.add("you");
    }

    const senderP = document.createElement("p");
    senderP.classList.add("small");
    senderP.textContent = `${msg.senderId} - ${formatTime(
      msg.sentAt?.toDate?.() ?? msg.sentAt
    )}`;

    messageDiv.appendChild(senderP);

    if (msg.message.trim().toLowerCase() === "poke") {
      const pokeDiv = document.createElement("div");
      pokeDiv.classList.add("poke");

      const pokeImg = document.createElement("img");
      pokeImg.src = "assets/icons/poke.svg";
      pokeImg.alt = "Poke Icon";

      pokeDiv.appendChild(pokeImg);
      messageDiv.appendChild(pokeDiv);
    } else {
      const contentP = document.createElement("p");
      contentP.classList.add("medium");
      contentP.textContent = msg.message;
      messageDiv.appendChild(contentP);
    }

    container.appendChild(messageDiv);
  });

  const chatScrollContainer = container?.parentElement;
  if (chatScrollContainer) {
    chatScrollContainer.scrollTop = chatScrollContainer.scrollHeight;
  }
}

// Files

function generateFiles(files) {
  const container = document.querySelector(".div2 .scrollable.two");
  container.innerHTML = "";

  files.forEach((file) => {
    const a = document.createElement("a");
    a.classList.add("file");
    a.href = file.url;
    a.target = "_blank";

    const div = document.createElement("div");

    const titleP = document.createElement("p");
    titleP.classList.add("medium");
    titleP.textContent = file.name;

    const typeP = document.createElement("p");
    typeP.classList.add("small");
    typeP.textContent = `Type: ${file.type}`;

    const dateP = document.createElement("p");
    dateP.classList.add("small");
    dateP.textContent = `Created: ${formatDate(
      file.createdAt.toDate?.() ?? file.createdAt
    )}`;

    div.appendChild(titleP);
    div.appendChild(typeP);
    div.appendChild(dateP);

    const icon = document.createElement("img");
    icon.src = "assets/icons/open.svg";
    icon.alt = "Open";

    a.appendChild(div);
    a.appendChild(icon);
    container.appendChild(a);
  });
}

// Reminders

function generateReminders(reminders) {
  const container = document.querySelector(".div1 .scrollable.two");
  container.innerHTML = "";

  reminders.forEach((reminder) => {
    const a = document.createElement("a");
    a.classList.add("reminder");

    const circle = document.createElement("div");
    circle.classList.add("circle");
    if (reminder.done) {
      circle.classList.add("checked");
    }

    const textContainer = document.createElement("div");

    const titleP = document.createElement("p");
    titleP.classList.add("medium");
    titleP.textContent = reminder.title;

    const dateP = document.createElement("p");
    dateP.classList.add("small");
    dateP.textContent = formatDate(reminder.date?.toDate?.() ?? reminder.date);

    textContainer.appendChild(titleP);
    textContainer.appendChild(dateP);

    a.appendChild(circle);
    a.appendChild(textContainer);

    a.addEventListener("click", async () => {
      try {
        await toggleReminderDone(
          window.selectedSpaceId,
          window.selectedThreadId,
          reminder.id,
          reminder.done
        );

        const updated = await fetchReminders(
          window.selectedSpaceId,
          window.selectedThreadId
        );
        generateReminders(updated);
      } catch (err) {
        alert(`Failed to update reminder: ${err.message}`);
      }
    });

    container.appendChild(a);
  });
}

// Helper functions

function formatDate(dateString) {
  const options = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

function formatTime(dateString) {
  const options = { hour: "numeric", minute: "2-digit", hour12: true };
  return new Date(dateString).toLocaleTimeString(undefined, options);
}
