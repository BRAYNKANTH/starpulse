import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;
export const SESSION_COOKIE = 'sp_session';
export const SESSION_DAYS = 30;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

// A fixed hash lets sign-in for an unknown email take as long as a wrong password.
const dummyHash = await hashPassword(randomBytes(16).toString('hex'));

export async function verifyPassword(password, stored = dummyHash) {
  const [scheme, salt, expected] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !expected) return false;
  const key = await scryptAsync(password, Buffer.from(salt, 'base64'), KEY_LENGTH);
  const target = Buffer.from(expected, 'base64');
  return key.length === target.length && timingSafeEqual(key, target);
}

// 12 characters without look-alikes (0/O, 1/l/I), for an admin to read out or paste to a client.
export const temporaryPassword = () => [...randomBytes(12)].map(b => 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 55]).join('');
export const newSessionToken = () => randomBytes(32).toString('base64url');
export const hashToken = token => createHash('sha256').update(token).digest('hex');

export function readCookie(req, name) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return decodeURIComponent(value.join('='));
  }
  return '';
}

export function sessionCookie(req, token, maxAge = SESSION_DAYS * 86400) {
  // Secure whenever the browser reached us over HTTPS, including through a TLS-terminating proxy.
  const secure = req.socket?.encrypted || req.headers['x-forwarded-proto'] === 'https';
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

export const validEmail = value => typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
export const validPassword = value => typeof value === 'string' && value.length >= 8 && value.length <= 200;
