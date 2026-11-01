/**
 * OpenAgriMap - P1 accounts: password hashing + session tokens.
 * Zero dependency: scrypt (node:crypto) for passwords, random 32-byte
 * bearer tokens kept in memory + persisted in the store file.
 *
 * NOTE (prototype): tokens are not JWTs and sessions live in the JSON store;
 * production should move to PostgreSQL/PostGIS with httpOnly cookies.
 */
"use strict";

const crypto = require("crypto");

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 32 };
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, SCRYPT.keylen, SCRYPT);
  return `scrypt$${SCRYPT.N}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

function verifyPassword(password, stored) {
  try {
    const [algo, n, saltHex, hashHex] = stored.split("$");
    if (algo !== "scrypt") return false;
    const hash = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), Buffer.from(hashHex, "hex").length, { N: parseInt(n, 10), r: SCRYPT.r, p: SCRYPT.p });
    return crypto.timingSafeEqual(hash, Buffer.from(hashHex, "hex"));
  } catch {
    return false;
  }
}

class AuthService {
  constructor(store) {
    this.store = store; // ReportStore instance (also holds users/sessions)
    this.store.users = this.store.users || [];
    this.store.sessions = this.store.sessions || [];
  }

  register(email, password, displayName) {
    email = String(email || "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      const err = new Error("invalid email"); err.code = "BAD_EMAIL"; throw err;
    }
    if (String(password).length < 8) {
      const err = new Error("password must be at least 8 characters"); err.code = "WEAK_PASSWORD"; throw err;
    }
    if (!displayName || !displayName.trim()) {
      const err = new Error("displayName is required"); err.code = "BAD_NAME"; throw err;
    }
    if (this.store.users.some((u) => u.email === email)) {
      const err = new Error("email already registered"); err.code = "EMAIL_TAKEN"; throw err;
    }
    const user = {
      id: `user-${this.store.users.length + 1}`,
      email,
      displayName: displayName.trim().slice(0, 80),
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
      role: this.store.users.length === 0 ? "admin" : "contributor"
    };
    this.store.users.push(user);
    this.store.persist();
    return this.publicUser(user);
  }

  login(email, password) {
    const user = this.store.users.find((u) => u.email === String(email || "").trim().toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash)) {
      const err = new Error("invalid credentials"); err.code = "BAD_CREDENTIALS"; throw err;
    }
    const token = crypto.randomBytes(32).toString("hex");
    this.store.sessions.push({ token, userId: user.id, createdAt: Date.now(), expiresAt: Date.now() + SESSION_TTL_MS });
    this.store.persist();
    return { token, user: this.publicUser(user) };
  }

  userFromToken(token) {
    const session = this.store.sessions.find((s) => s.token === token && s.expiresAt > Date.now());
    if (!session) return null;
    return this.store.users.find((u) => u.id === session.userId) || null;
  }

  logout(token) {
    const i = this.store.sessions.findIndex((s) => s.token === token);
    if (i >= 0) { this.store.sessions.splice(i, 1); this.store.persist(); }
  }

  publicUser(user) {
    return { id: user.id, email: user.email, displayName: user.displayName, role: user.role, createdAt: user.createdAt };
  }
}

module.exports = { AuthService, hashPassword, verifyPassword };
