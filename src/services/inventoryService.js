import { apiClient } from './api.js';

export async function addToInventory(item) {
  const response = await apiClient.post('/inventario', item, { timeout: 15000 });
  return response.item;
}
