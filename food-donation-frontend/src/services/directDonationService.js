import apiClient from './apiClient';

const directDonationService = {

  // ─── Donor ────────────────────────────────────────────────
  create: async (payload) => {
    const { data } = await apiClient.post('/direct-donations', payload);
    return data.data;
  },

  update: async (id, payload) => {
    const { data } = await apiClient.put(`/direct-donations/${id}`, payload);
    return data.data;
  },

  cancel: async (id, reason) => {
    const { data } = await apiClient.put(`/direct-donations/${id}/cancel`, { reason });
    return data;
  },

  complete: async (id) => {
    const { data } = await apiClient.put(`/direct-donations/${id}/complete`);
    return data.data;
  },

  getMyDonations: async (params = {}) => {
    const { data } = await apiClient.get('/direct-donations/my-donations', { params });
    return data.data;
  },

  // ─── Receiver ─────────────────────────────────────────────
  browse: async (params = {}) => {
    const { data } = await apiClient.get('/direct-donations/browse', { params });
    return data.data;
  },

  accept: async (id, note = '') => {
    const { data } = await apiClient.post(`/direct-donations/${id}/accept`, { note });
    return data.data;
  },

  getMyReceived: async (params = {}) => {
    const { data } = await apiClient.get('/direct-donations/my-received', { params });
    return data.data;
  },

  // ─── Shared ───────────────────────────────────────────────
  getById: async (id) => {
    const { data } = await apiClient.get(`/direct-donations/${id}`);
    return data.data;
  },

  // ─── Messaging ────────────────────────────────────────────
  sendMessage: async (donationId, message) => {
    const { data } = await apiClient.post('/direct-donations/messages', { donationId, message });
    return data.data;
  },

  getConversation: async (donationId) => {
    const { data } = await apiClient.get(`/direct-donations/${donationId}/messages`);
    return data.data;
  },

  markConversationRead: async (donationId) => {
    await apiClient.put(`/direct-donations/${donationId}/messages/read`);
  },

  getUnreadCount: async () => {
    const { data } = await apiClient.get('/direct-donations/messages/unread-count');
    return data.data?.unreadCount || 0;
  },
};

// ── Helper: safely get the display string from a foodType/quantityUnit ──
// Backend sends either an enum object like { name: "VEG" } or a plain string "VEG"
export const getFoodTypeLabel = (foodType) => {
  if (!foodType) return '';
  if (typeof foodType === 'string') return foodType.replace('_', ' ');
  if (typeof foodType === 'object' && foodType.name) return foodType.name.replace('_', ' ');
  return String(foodType).replace('_', ' ');
};

export const getQuantityUnitLabel = (quantityUnit) => {
  if (!quantityUnit) return '';
  if (typeof quantityUnit === 'string') return quantityUnit.toLowerCase();
  if (typeof quantityUnit === 'object' && quantityUnit.name) return quantityUnit.name.toLowerCase();
  return String(quantityUnit).toLowerCase();
};

export default directDonationService;