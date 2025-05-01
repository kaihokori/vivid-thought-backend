// server.js

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();
const PORT = 3000;
const JWT_SECRET = "secret_key";

app.use(cors());
app.use(bodyParser.json());

// Firebase setup
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Static file serving
app.use(express.static(path.join(__dirname, "public")));

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// === API Routes ===

app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  const snapshot = await db.collection("users").where("email", "==", email).get();
  if (!snapshot.empty)
    return res.status(400).json({ message: "Email already exists" });

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  await db.collection("users").doc(email).set({
    email,
    password: hashedPassword,
    spaces: [],
    createdAt: new Date()
  });  

  res.json({ message: "Registered successfully" });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const snapshot = await db.collection("users").where("email", "==", email).get();
  if (snapshot.empty)
    return res.status(400).json({ message: "Wrong email or password" });

  const user = snapshot.docs[0].data();
  const isMatch = bcrypt.compareSync(password, user.password);

  if (!isMatch)
    return res.status(400).json({ message: "Wrong password" });

  const token = jwt.sign(
    { email, uid: snapshot.docs[0].id },
    JWT_SECRET,
    { expiresIn: "2h" }
  );

  res.json({ message: "Login successful", token });
});

app.get("/api/spaces", authenticateToken, async (req, res) => {
  try {
    const userRef = db.collection("users").doc(req.user.email);
    const userDoc = await userRef.get();

    if (!userDoc.exists) return res.status(404).json({ message: "User not found" });

    const userData = userDoc.data();
    const spaceIds = userData.spaces || [];

    const spaceFetches = spaceIds.map(id => db.collection("spaces").doc(id).get());
    const spaceDocs = await Promise.all(spaceFetches);

    const spaces = spaceDocs
      .filter(doc => doc.exists)
      .map(doc => ({ id: doc.id, ...doc.data() }));

    res.json(spaces);
  } catch (err) {
    console.error("Error fetching spaces:", err);
    res.status(500).json({ error: "Failed to fetch spaces" });
  }
});

app.post("/api/spaces", authenticateToken, async (req, res) => {
  const { name, image = null } = req.body;

  if (!name) return res.status(400).json({ message: "Space name required" });

  try {
    const spaceRef = db.collection("spaces").doc();
    await spaceRef.set({ name, image });

    const userRef = db.collection("users").doc(req.user.email);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      await userRef.set({
        email: req.user.email,
        spaces: [spaceRef.id],
        createdAt: new Date()
      });
    } else {
      await userRef.update({
        spaces: admin.firestore.FieldValue.arrayUnion(spaceRef.id)
      });
    }

    res.json({ message: "Space created", spaceId: spaceRef.id });
  } catch (err) {
    console.error("Error creating space:", err);
    res.status(500).json({ error: "Failed to create space" });
  }
});

app.post("/api/spaces/join", authenticateToken, async (req, res) => {
  const { spaceId } = req.body;

  if (!spaceId) return res.status(400).json({ message: "spaceId required" });

  try {
    const userRef = db.collection("users").doc(req.user.email);
    const userDoc = await userRef.get();

    if (!userDoc.exists) return res.status(404).json({ message: "User not found" });

    const userData = userDoc.data();
    if ((userData.spaces || []).includes(spaceId))
      return res.status(400).json({ message: "Already joined" });

    const spaceDoc = await db.collection("spaces").doc(spaceId).get();
    if (!spaceDoc.exists) return res.status(404).json({ message: "Space not found" });

    if (!userDoc.exists) {
      await userRef.set({
        email: req.user.email,
        spaces: [spaceRef.id],
        createdAt: new Date()
      });
    } else {
      await userRef.update({
        spaces: admin.firestore.FieldValue.arrayUnion(spaceRef.id)
      });
    }

    res.json({ message: "Joined space", space: spaceDoc.data() });
  } catch (err) {
    console.error("Error joining space:", err);
    res.status(500).json({ error: "Failed to join space" });
  }
});

app.get("/api/spaces/:spaceId/threads", authenticateToken, async (req, res) => {
  const { spaceId } = req.params;

  try {
    const threadsRef = db.collection("spaces").doc(spaceId).collection("threads");
    const snapshot = await threadsRef.orderBy("createdAt", "asc").get();

    const threads = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(threads);
  } catch (err) {
    console.error("Error fetching threads:", err);
    res.status(500).json({ error: "Failed to fetch threads" });
  }
});

app.post("/api/spaces/:spaceId/threads", authenticateToken, async (req, res) => {
  const { spaceId } = req.params;
  const { title } = req.body;

  if (!title) return res.status(400).json({ message: "Thread title required" });

  try {
    const threadRef = db.collection("spaces").doc(spaceId).collection("threads").doc();
    await threadRef.set({
      title,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: "Thread created", threadId: threadRef.id });
  } catch (err) {
    console.error("Error creating thread:", err);
    res.status(500).json({ error: "Failed to create thread" });
  }
});

app.get("/api/messages/:spaceId/:threadId", authenticateToken, async (req, res) => {
  const { spaceId, threadId } = req.params;

  try {
    const messagesRef = db
      .collection("spaces")
      .doc(spaceId)
      .collection("threads")
      .doc(threadId)
      .collection("messages")
      .orderBy("sentAt", "asc");

    const snapshot = await messagesRef.get();
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        sentAt: data.sentAt?.toDate() || null
      };
    });

    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.post("/api/messages/:spaceId/:threadId", authenticateToken, async (req, res) => {
  const { spaceId, threadId } = req.params;
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ message: "Message is empty" });
  }

  try {
    const messagesRef = db
      .collection("spaces")
      .doc(spaceId)
      .collection("threads")
      .doc(threadId)
      .collection("messages");

    await messagesRef.add({
      senderId: req.user.email,
      message: message.trim(),
      sentAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: "Message sent" });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

app.get("/api/reminders/:spaceId/:threadId", authenticateToken, async (req, res) => {
  const { spaceId, threadId } = req.params;

  try {
    const ref = db
      .collection("spaces")
      .doc(spaceId)
      .collection("threads")
      .doc(threadId)
      .collection("reminders");

    const snapshot = await ref.orderBy("date", "asc").get();

    const reminders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate()
    }));

    res.json(reminders);
  } catch (err) {
    console.error("Error fetching reminders:", err);
    res.status(500).json({ error: "Failed to fetch reminders" });
  }
});

app.post("/api/reminders/:spaceId/:threadId", authenticateToken, async (req, res) => {
  const { spaceId, threadId } = req.params;
  const { title, date } = req.body;

  if (!title || !date) return res.status(400).json({ message: "Title and date are required" });

  try {
    const ref = db
      .collection("spaces")
      .doc(spaceId)
      .collection("threads")
      .doc(threadId)
      .collection("reminders");

    await ref.add({
      title,
      date: admin.firestore.Timestamp.fromDate(new Date(date)),
      done: false
    });

    res.json({ message: "Reminder created" });
  } catch (err) {
    console.error("Error creating reminder:", err);
    res.status(500).json({ error: "Failed to create reminder" });
  }
});

app.post("/api/reminders/:spaceId/:threadId/:reminderId/toggle", authenticateToken, async (req, res) => {
  const { spaceId, threadId, reminderId } = req.params;
  const { currentDone } = req.body;

  try {
    const ref = db
      .collection("spaces")
      .doc(spaceId)
      .collection("threads")
      .doc(threadId)
      .collection("reminders")
      .doc(reminderId);

    await ref.update({ done: !currentDone });

    res.json({ message: "Reminder toggled" });
  } catch (err) {
    console.error("Error toggling reminder:", err);
    res.status(500).json({ error: "Failed to toggle reminder" });
  }
});

app.post("/api/files/:spaceId/:threadId", authenticateToken, async (req, res) => {
  const { spaceId, threadId } = req.params;
  const { name, url, type, createdAt } = req.body;

  if (!name || !url || !type) return res.status(400).json({ message: "Missing file metadata" });

  try {
    const ref = db
      .collection("spaces")
      .doc(spaceId)
      .collection("threads")
      .doc(threadId)
      .collection("files");

    await ref.add({
      name,
      url,
      type,
      createdAt: admin.firestore.Timestamp.fromDate(new Date(createdAt))
    });

    res.json({ message: "File metadata saved" });
  } catch (err) {
    console.error("Error saving file metadata:", err);
    res.status(500).json({ error: "Failed to save file metadata" });
  }
});

app.get("/api/files/:spaceId/:threadId", authenticateToken, async (req, res) => {
  const { spaceId, threadId } = req.params;

  try {
    const ref = db
      .collection("spaces")
      .doc(spaceId)
      .collection("threads")
      .doc(threadId)
      .collection("files");

    const snapshot = await ref.orderBy("createdAt", "desc").get();

    const files = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate()
      };
    });

    res.json(files);
  } catch (err) {
    console.error("Error fetching files:", err);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

// === HTML Routes ===

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

app.get("/404", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "404.html"));
});

// === Start server ===
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
