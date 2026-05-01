import api from './axios';

// Follow/Unfollow a vendor
export const followVendor = (vendorId) => api.post('/notifications/follow', { vendorId });

// Get all vendors with follow state
export const getAllVendors = () => api.get('/notifications/vendors');

// Get vendors the user follows
export const getFollowedVendors = () => api.get('/notifications/following');

// Get vendor's followers (vendor only)
export const getVendorFollowers = () => api.get('/notifications/followers');

// Get user notifications
export const getUserNotifications = () => api.get('/notifications/user');

// Get vendor notifications
export const getVendorNotifications = () => api.get('/notifications/vendor');

// Mark notifications as read
export const markNotificationsRead = (notificationIds) => api.post('/notifications/read', { notificationIds });
