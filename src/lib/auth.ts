const SESSION_KEY = 'wedding_admin';

export function login(username: string, password: string): boolean {
  const validUser = import.meta.env.VITE_ADMIN_USERNAME;
  const validPass = import.meta.env.VITE_ADMIN_PASSWORD;
  if (username === validUser && password === validPass) {
    sessionStorage.setItem(SESSION_KEY, '1');
    return true;
  }
  return false;
}

export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isAuthenticated(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}
