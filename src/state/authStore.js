const AUTH_KEY = 'authToken';
const USER_KEY = 'authUser';

class AuthStore {
  constructor() {
    this.token = null;
    this.user = null;
    this.listeners = [];
  }

  init() {
    const stored = localStorage.getItem(AUTH_KEY);
    const user = localStorage.getItem(USER_KEY);
    if (stored && user) {
      const payload = this.decodeToken(stored);
      if (payload && payload.exp * 1000 > Date.now()) {
        this.token = stored;
        this.user = user;
        this.notify();
        return true;
      }
      this.logout();
    }
    return false;
  }

  login(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem(AUTH_KEY, token);
    localStorage.setItem(USER_KEY, user);
    this.notify();
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
    this.notify();
  }

  get isLoggedIn() {
    return !!this.token;
  }

  getToken() {
    return this.token;
  }

  decodeToken(token) {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.listeners.forEach(cb => cb({
      isLoggedIn: this.isLoggedIn,
      user: this.user
    }));
  }
}

export const authStore = new AuthStore();
