import { apiFetch } from "./client";

export function signup(payload) {
  return apiFetch("/api/auth/signup", {
    method: "POST",
    body: payload
  });
}

export function login(payload) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: {
      email: payload.email,
      password: payload.password
    }
  });
}

export function fetchSession(token) {
  return apiFetch("/api/auth/me", { token });
}
