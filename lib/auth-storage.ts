const AUTH_RUNTIME_KEY = "sr_runtime";
const AUTH_TOKEN_KEY = "sr_token";
const AUTH_USER_KEY = "sr_user";

type AuthUser = {
  name?: string;
  email?: string;
};

function getCurrentRuntimeId() {
  if (typeof document === "undefined") {
    return null;
  }

  return document.body.dataset.runtimeId || null;
}

export function syncAuthStorageWithRuntime() {
  if (typeof window === "undefined") {
    return null;
  }

  const currentRuntimeId = getCurrentRuntimeId();
  if (!currentRuntimeId) {
    return null;
  }

  const storedRuntimeId = localStorage.getItem(AUTH_RUNTIME_KEY);
  if (storedRuntimeId && storedRuntimeId !== currentRuntimeId) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }

  localStorage.setItem(AUTH_RUNTIME_KEY, currentRuntimeId);
  return currentRuntimeId;
}

export function readStoredToken() {
  syncAuthStorageWithRuntime();

  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function readStoredUser(): AuthUser | null {
  syncAuthStorageWithRuntime();

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function persistAuth(token: string, user: AuthUser) {
  const runtimeId = syncAuthStorageWithRuntime();

  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

  if (runtimeId) {
    localStorage.setItem(AUTH_RUNTIME_KEY, runtimeId);
  }
}

export function clearAuthStorage() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_RUNTIME_KEY);
}