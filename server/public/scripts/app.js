// public/scripts/app.js

const SECRET_KEY = "123ABC";

document.addEventListener("DOMContentLoaded", () => {
  const statusEl = document.getElementById("status");
});

const bcrypt = dcodeIO.bcrypt;
const hashedPassword = bcrypt.hashSync("123456", 10);

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  return passwordRegex.test(password);
}

async function register() {
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;

  if (!validateEmail(email) || !validatePassword(password)) {
    document.getElementById("message").innerText = "Invalid email or password format!";
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    document.getElementById("message").innerText = data.message;

    if (response.ok) window.location.href = "login.html";
  } catch (err) {
    console.error(err);
    document.getElementById("message").innerText = "Something went wrong!";
  }
}

function verifyToken() {
  const token = localStorage.getItem('authToken');
  if (!token) return false;

  try {
    const [headerB64, payloadB64, signature] = token.split(".");
    if (!headerB64 || !payloadB64 || !signature) return false;

    const payload = JSON.parse(atob(payloadB64));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      console.warn("Token expired");
      return false;
    }

    return true;
  } catch (err) {
    console.error("Invalid token", err);
    return false;
  }
}

async function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const response = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    document.getElementById("message").innerText = data.message;

    if (response.ok) {
      localStorage.setItem("authToken", data.token);
      window.location.href = "home.html";
    }
  } catch (err) {
    console.error(err);
    document.getElementById("message").innerText = "Something went wrong!";
  }
}

function getAuthHeaders() {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}
