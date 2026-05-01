import api from './axios';

// ---- User Auth ----
export const registerUser = (data) => api.post('/auth/user/register', data);
export const loginUser = (data) => api.post('/auth/user/login', data);
export const logoutUser = () => api.get('/auth/user/logout');

// ---- Food Partner Auth ----
export const registerFoodPartner = (data) => api.post('/auth/food-partner/register', data);
export const loginFoodPartner = (data) => api.post('/auth/food-partner/login', data);
export const logoutFoodPartner = () => api.get('/auth/food-partner/logout');

// ---- Profile ----
export const getMyProfile = () => api.get('/profile/me');
export const updateProfile = (formData) =>
  api.patch('/profile/me', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
