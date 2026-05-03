import api from './axios';

export const getFoodItems = (page = 1, limit = 10, type = '') => {
  let url = `/food?page=${page}&limit=${limit}`;
  if (type) url += `&type=${type}`;
  return api.get(url);
};

export const createFood = (formData) =>
  api.post('/food', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const likeFood = (foodId) => api.post('/food/like', { foodId });

export const saveFood = (foodId) => api.post('/food/save', { foodId });

export const getSavedFoods = () => api.get('/food/save');

export const addComment = (foodId, comment) =>
  api.post('/food/comment', { foodId, comment });

export const getComments = (foodId) => api.get(`/food/${foodId}/comments`);

export const deleteComment = (commentId) =>
  api.delete(`/food/comment/${commentId}`);

export const replyToComment = (parentCommentId, comment) =>
  api.post(`/food/comment/${parentCommentId}/reply`, { comment });

export const searchFoodByHashtag = (query, page = 1, limit = 10) =>
  api.get(`/food/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);

export const deleteFood = (foodId) => api.delete(`/food/${foodId}`);

export const updateFood = (foodId, data) => api.put(`/food/${foodId}`, data);
