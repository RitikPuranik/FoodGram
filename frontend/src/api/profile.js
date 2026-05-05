import axios from './axios';

export const getMyProfile = () => axios.get('/profile/me');
export const updateProfile = (data) => axios.patch('/profile/me', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
