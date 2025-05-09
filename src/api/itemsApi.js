import apiClient from './client';

export const getItems = async (params = {}) => {
  try {
    const response = await apiClient.get('/items', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
};

export const getItemById = async (id) => {
  try {
    const response = await apiClient.get(`/items/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching item ${id}:`, error);
    throw error;
  }
};

export const createItem = async (data) => {
  try {
    const response = await apiClient.post('/items', data);
    return response.data;
  } catch (error) {
    console.error('Error creating item:', error);
    throw error;
  }
};

export const updateItem = async (id, data) => {
  try {
    const response = await apiClient.put(`/items/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating item ${id}:`, error);
    throw error;
  }
};

export const deleteItem = async (id) => {
  try {
    const response = await apiClient.delete(`/items/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting item ${id}:`, error);
    throw error;
  }
};
