// Login and registration. Passwords are never stored in plain text:
// we store a SHA-256 hash of "email:password".

import * as Crypto from 'expo-crypto';
import { getDb } from '../db/database';

export const ROLES = ['buyer', 'seller', 'agent'];

export async function hashPassword(email, password) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${email.trim().toLowerCase()}:${password}`
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns an object of field -> error message. Empty object means the form is valid. */
export function validateLogin({ email, password }) {
  const errors = {};
  if (!email || !email.trim()) errors.email = 'Enter your email address.';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address, like name@example.com.';
  if (!password) errors.password = 'Enter your password.';
  return errors;
}

export function validateRegister({ fullName, email, password, confirmPassword, role }) {
  const errors = validateLogin({ email, password });
  if (!fullName || fullName.trim().length < 2) errors.fullName = 'Enter your full name.';
  if (password && password.length < 6) errors.password = 'Use at least 6 characters.';
  if (password !== confirmPassword) errors.confirmPassword = 'The two passwords do not match.';
  if (!ROLES.includes(role)) errors.role = 'Choose buyer, seller or agent.';
  return errors;
}

function toUser(row) {
  return { id: row.id, fullName: row.full_name, email: row.email, role: row.role, phone: row.phone };
}

export async function login(email, password) {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT * FROM users WHERE email = ?', email.trim());
  if (!row) throw new Error('No account uses this email address.');
  const hash = await hashPassword(email, password);
  if (hash !== row.password_hash) throw new Error('Wrong password. Try again.');
  return toUser(row);
}

export async function register({ fullName, email, password, role, phone }) {
  const db = await getDb();
  const taken = await db.getFirstAsync('SELECT id FROM users WHERE email = ?', email.trim());
  if (taken) throw new Error('An account already uses this email address.');
  const hash = await hashPassword(email, password);
  const r = await db.runAsync(
    'INSERT INTO users (full_name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
    fullName.trim(), email.trim().toLowerCase(), hash, role, phone ? phone.trim() : null
  );
  const row = await db.getFirstAsync('SELECT * FROM users WHERE id = ?', r.lastInsertRowId);
  return toUser(row);
}
