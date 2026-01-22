import axios from 'axios';
import Cookies from 'js-cookie';
import { Conversation, WhatsAppMessage, ConversationStats } from '@/types/conversation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Remove invalid token
      Cookies.remove('token');
      // Redirect to login if not already there
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { name: string; email: string; password: string; company?: string }) =>
    api.post('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  
  me: () =>
    api.get('/auth/me'),
  
  forgotPassword: (data: { email: string }) =>
    api.post('/auth/forgot-password', data),
  
  resetPassword: (data: { token: string; password: string }) =>
    api.post('/auth/reset-password', data),
  
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
  
  updateProfile: (data: { name?: string; phone?: string; company?: string }) =>
    api.put('/auth/profile', data),
};

// Contacts API
export const contactsAPI = {
  getContacts: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    stage?: string;
    tags?: string;
    whatsappConnectionId?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => api.get('/contacts', { params }),
  
  createContact: (data: {
    phone: string;
    name?: string;
    email?: string;
    whatsappConnectionId: string;
    tags?: Array<{ name: string; color?: string }>;
    customFields?: Record<string, string>;
  }) => api.post('/contacts', data),
  
  getContact: (id: string) =>
    api.get(`/contacts/${id}`),
  
  updateContact: (id: string, data: {
    name?: string;
    email?: string;
    status?: string;
    stage?: string;
    tags?: Array<{ name: string; color?: string }>;
    customFields?: Record<string, string>;
  }) => api.put(`/contacts/${id}`, data),
  
  deleteContact: (id: string) =>
    api.delete(`/contacts/${id}`),
  
  addNote: (id: string, content: string) =>
    api.post(`/contacts/${id}/notes`, { content }),
  
  addTag: (id: string, data: { name: string; color?: string }) =>
    api.post(`/contacts/${id}/tags`, data),
  
  removeTag: (id: string, tagName: string) =>
    api.delete(`/contacts/${id}/tags/${tagName}`),
  
  getContactsStats: (whatsappConnectionId?: string) =>
    api.get('/contacts/stats/overview', { params: { whatsappConnectionId } }),
};

// WhatsApp API
export const whatsappAPI = {
  getConnections: () =>
    api.get('/whatsapp'),

  createConnection: (data: { name: string; phone: string }) =>
    api.post('/whatsapp', data),

  connect: (connectionId: string) =>
    api.post(`/whatsapp/${connectionId}/connect`),

  disconnect: (connectionId: string) =>
    api.post(`/whatsapp/${connectionId}/disconnect`),

  deleteConnection: (connectionId: string) =>
    api.delete(`/whatsapp/${connectionId}`),

  updateSettings: (connectionId: string, settings: any) =>
    api.put(`/whatsapp/${connectionId}/settings`, settings),

  sendMessage: (connectionId: string, data: { to: string; message: string; type?: string }) =>
    api.post(`/whatsapp/${connectionId}/send`, data),

  getQRCode: (connectionId: string) =>
    api.get(`/whatsapp/${connectionId}/qr`),

  getStatus: (connectionId: string) =>
    api.get(`/whatsapp/${connectionId}/status`),

  resetConnection: (connectionId: string) =>
    api.post(`/whatsapp/${connectionId}/reset`),

  reconnectSession: (connectionId: string) =>
    api.post(`/whatsapp/${connectionId}/reconnect`),
};

// Campaigns API
export const campaignsAPI = {
  getCampaigns: (params?: any) => api.get('/campaigns', { params }),
  createCampaign: (data: any) => api.post('/campaigns', data),
  updateCampaign: (id: string, data: any) => api.put(`/campaigns/${id}`, data),
  deleteCampaign: (id: string) => api.delete(`/campaigns/${id}`),
  sendCampaign: (id: string) => api.post(`/campaigns/${id}/send`),
  startCampaign: (id: string) => api.post(`/campaigns/${id}/start`),
  pauseCampaign: (id: string) => api.post(`/campaigns/${id}/pause`),
  getStats: () => api.get('/campaigns/stats'),
};



// Flows API
export const flowsAPI = {
  getFlows: () =>
    api.get('/flows'),

  createFlow: (data: any) => api.post('/flows', data),

  getFlow: (id: string) =>
    api.get(`/flows/${id}`),

  updateFlow: (id: string, data: any) =>
    api.put(`/flows/${id}`, data),

  deleteFlow: (id: string) =>
    api.delete(`/flows/${id}`),

  activateFlow: (id: string) =>
    api.post(`/flows/${id}/activate`),

  deactivateFlow: (id: string) =>
    api.post(`/flows/${id}/deactivate`),

  getTemplates: () =>
    api.get('/flows/templates'),

  createFromTemplate: (templateId: string, data: {
    name?: string;
    whatsappConnectionId?: string;
  }) => api.post(`/flows/templates/${templateId}`, data),
};

// CRM API
export const crmAPI = {
  // Leads
  getLeads: (params?: any) => api.get('/crm/leads', { params }),
  createLead: (data: any) => api.post('/crm/leads', data),
  getLead: (id: string) => api.get(`/crm/leads/${id}`),
  updateLead: (id: string, data: any) => api.put(`/crm/leads/${id}`, data),
  deleteLead: (id: string) => api.delete(`/crm/leads/${id}`),
  
  // Lead actions
  changeLeadStage: (id: string, stage: string, note?: string) => 
    api.put(`/crm/leads/${id}/stage`, { stage, note }),
  addLeadInteraction: (id: string, type: string, content: string, metadata?: any) =>
    api.post(`/crm/leads/${id}/interactions`, { type, content, metadata }),
  
  // Pipeline stats
  getPipelineStats: (params?: any) => api.get('/crm/pipeline/stats', { params }),
  
  // Configuration
  getConfig: () => api.get('/crm/config'),
  updateConfig: (data: any) => api.put('/crm/config', data),
  
  // Stages
  getStages: () => api.get('/crm/config/stages'),
  createStage: (data: any) => api.post('/crm/config/stages', data),
  updateStage: (key: string, data: any) => api.put(`/crm/config/stages/${key}`, data),
  deleteStage: (key: string) => api.delete(`/crm/config/stages/${key}`),
  
  // Custom fields
  getCustomFields: () => api.get('/crm/config/fields'),
  createCustomField: (data: any) => api.post('/crm/config/fields', data),
};

// Analytics API
export const analyticsAPI = {
  getOverview: (params?: any) =>
    api.get('/analytics', { params }),

  getCampaignsAnalytics: (params?: any) =>
    api.get('/analytics/campaigns', { params }),

  getContactsAnalytics: (params?: any) =>
    api.get('/analytics/contacts', { params }),

  getWhatsAppAnalytics: (params?: any) =>
    api.get('/analytics/whatsapp', { params })
};

// Conversations API
export const conversationsAPI = {
  // Buscar conversas
  getConversations: (params: {
    connectionId: string;
    page?: number;
    limit?: number;
    status?: string;
  }) => api.get<{
    success: boolean;
    conversations: Conversation[];
    pagination: {
      current: number;
      pages: number;
      total: number;
    };
  }>('/conversations', { params }),

  // Buscar conversa específica
  getConversation: (id: string) => 
    api.get<{
      success: boolean;
      conversation: Conversation;
    }>(`/conversations/${id}`),

  // Buscar mensagens de uma conversa
  getMessages: (conversationId: string, params?: {
    page?: number;
    limit?: number;
  }) => api.get<{
    success: boolean;
    messages: WhatsAppMessage[];
    pagination: {
      current: number;
      pages: number;
      total: number;
    };
  }>(`/conversations/${conversationId}/messages`, { params }),

  // Enviar mensagem
  sendMessage: (conversationId: string, data: {
    message: string;
    type?: string;
  }) => api.post<{
    success: boolean;
    message: string;
    messageId: string;
    whatsappMessageId?: string;
  }>(`/conversations/${conversationId}/messages`, data),

  // Atualizar conversa
  updateConversation: (id: string, data: {
    status?: 'active' | 'closed' | 'waiting' | 'bot_active';
    assignedTo?: string;
    tags?: string[];
    notes?: string;
    automationSettings?: {
      enabled?: boolean;
      aiEnabled?: boolean;
      flowId?: string;
      currentFlowStep?: number;
    };
  }) => api.put<{
    success: boolean;
    conversation: Conversation;
  }>(`/conversations/${id}`, data),

  // Marcar mensagem como lida
  markAsRead: (conversationId: string, messageId: string) =>
    api.post(`/conversations/${conversationId}/messages/${messageId}/read`),

  // Assumir conversa (tirar do bot)
  takeOverConversation: (id: string) => 
    api.post(`/conversations/${id}/takeover`),

  // Atribuir conversa a um agente
  assignConversation: (id: string, agentId: string) => 
    api.post(`/conversations/${id}/assign`, { agentId }),

  // Estatísticas de conversas
  getStats: (params: {
    connectionId: string;
    period?: '1d' | '7d' | '30d';
  }) => api.get<{
    success: boolean;
    stats: ConversationStats;
  }>('/conversations/stats/summary', { params })
};

export default api;