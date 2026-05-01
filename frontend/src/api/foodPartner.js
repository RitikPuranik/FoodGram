import api from './axios';

export const getFoodPartnerById = (id) => api.get(`/food-partner/${id}`);
