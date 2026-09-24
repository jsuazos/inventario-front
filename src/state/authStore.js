const USER_KEY = 'authUser';

class AuthStore {
  constructor() {
    this.user = null;
    this.listeners = [];
  }

  init() {
    const user = localStorage.getItem(USER_KEY);
    localStorage.removeItem('authToken');

    if (user) {
      this.user = user;
      this.notify();
      return true;
    }
    return false;
  }

  login(user) {
    this.user = user;
    localStorage.setItem(USER_KEY, user);
    this.notify();
  }

  logout() {
    this.user = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem(USER_KEY);
    this.notify();
  }

  get isLoggedIn() {
    return !!this.user;
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
