import { apiClient } from './api.js';

export async function addToInventory(item) {
  const response = await apiClient.post('/inventario', item, { timeout: 15000 });
  return response.item;
}

export async function updateInventory(originalItem, item) {
  const response = await apiClient.put('/inventario', { originalItem, item }, { timeout: 15000 });
  return response.item;
}

export async function removeFromInventory(originalItem) {
  const response = await apiClient.delete('/inventario', { originalItem }, { timeout: 15000 });
  return response.item;
}
