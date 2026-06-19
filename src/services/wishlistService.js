import { apiClient } from './api.js';

export async function getMyWishlist() {
  const response = await apiClient.get('/wishlist/me', { timeout: 15000 });
  return response.items || [];
}

export async function getPublicWishlist(usuario) {
  const response = await apiClient.get(`/wishlist/${encodeURIComponent(usuario)}`, { timeout: 15000 });
  return response.items || [];
}

export async function getWishlistUsers() {
  const response = await apiClient.get('/wishlist-users', { timeout: 15000 });
  return response.users || [];
}

export async function addToWishlist(item) {
  const response = await apiClient.post('/wishlist', item, { timeout: 15000 });
  return response.item;
}

export async function removeFromWishlist(rowId) {
  const response = await apiClient.delete(`/wishlist/${encodeURIComponent(rowId)}`, { timeout: 15000 });
  return !!response.ok;
}
