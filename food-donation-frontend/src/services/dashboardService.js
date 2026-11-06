import apiClient from './apiClient';

const dashboardService = {

  getAdminDashboard: async () => {
    const { data } = await apiClient.get('/dashboard/admin');
    return data.data;
  },

  getDonorDashboard: async () => {
    const { data } = await apiClient.get('/dashboard/donor');
    return data.data;
  },

  getNgoDashboard: async () => {
    const { data } = await apiClient.get('/dashboard/ngo');
    return data.data;
  },

  getAgentDashboard: async () => {
    const { data } = await apiClient.get('/dashboard/agent');
    return data.data;
  },

  getReceiverDashboard: async () => {
    const { data } = await apiClient.get('/dashboard/receiver');
    return data.data;
  },
};

export default dashboardService;
