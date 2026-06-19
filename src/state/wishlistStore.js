import { addToWishlist, getMyWishlist, removeFromWishlist, updateWishlistItem } from '../services/wishlistService.js';

class WishlistStore {
  constructor() {
    this.items = [];
    this.loading = false;
    this.listeners = [];
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener({
      items: this.items,
      loading: this.loading,
    }));
  }

  setItems(items) {
    this.items = Array.isArray(items) ? items : [];
    this.notify();
  }

  clear() {
    this.items = [];
    this.loading = false;
    this.notify();
  }

  async loadMine() {
    this.loading = true;
    this.notify();

    try {
      const items = await getMyWishlist();
      this.setItems(items);
    } finally {
      this.loading = false;
      this.notify();
    }
  }

  getItems() {
    return this.items;
  }

  async add(item) {
    const saved = await addToWishlist(item);
    if (saved) {
      this.setItems([saved, ...this.items]);
      return true;
    }
    throw new Error('No se pudo agregar a la wishlist');
  }

  async remove(rowId) {
    const ok = await removeFromWishlist(rowId);
    if (ok) {
      this.setItems(this.items.filter(entry => entry.rowId !== rowId));
      return true;
    }

    throw new Error('No se pudo quitar de la wishlist');
  }

  async update(rowId, item) {
    const updated = await updateWishlistItem(rowId, item);
    if (updated) {
      this.setItems(this.items.map(entry => entry.rowId === rowId ? updated : entry));
      return updated;
    }

    throw new Error('No se pudo editar la wishlist');
  }
}

export const wishlistStore = new WishlistStore();
