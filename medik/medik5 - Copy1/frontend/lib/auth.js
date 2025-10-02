"use client";

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('nb_token');
}

export function setToken(token) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem('nb_token', token);
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('nb_token');
}
