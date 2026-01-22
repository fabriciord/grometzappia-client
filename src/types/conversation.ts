export interface WhatsAppMessage {
  _id: string;
  conversationId: string;
  whatsappConnectionId: string;
  direction: 'inbound' | 'outbound';
  senderType: 'contact' | 'bot' | 'human';
  whatsappData: {
    messageId: string;
    jid: string;
    participant?: string;
    timestamp: string;
    status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  };
  content: {
    text?: string;
    type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'location' | 'contact';
    media?: {
      url?: string;
      mimetype?: string;
      filename?: string;
      caption?: string;
      size?: number;
    };
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    contact?: {
      name: string;
      phone?: string;
      vcard?: string;
    };
  };
  aiProcessing?: {
    processed: boolean;
    intent?: string;
    entities?: string[];
    sentiment?: 'positive' | 'neutral' | 'negative';
    confidence?: number;
    summary?: string;
  };
  automation?: {
    triggeredFlow?: string;
    flowStep?: number;
    isAutomated: boolean;
    responseGenerated: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  userId: string;
  whatsappConnectionId: string;
  contactPhone: string;
  contactJid: string;
  status: 'active' | 'closed' | 'waiting' | 'bot_active';
  lastMessage?: {
    content: string;
    timestamp: string;
    fromBot: boolean;
    messageType: string;
  };
  assignedTo?: string;
  tags: string[];
  notes?: string;
  metadata?: {
    leadSource?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    customFields?: Record<string, any>;
  };
  automationSettings: {
    enabled: boolean;
    aiEnabled: boolean;
    flowId?: string;
    currentFlowStep?: number;
  };
  statistics: {
    messageCount: number;
    botMessageCount: number;
    humanMessageCount: number;
    avgResponseTime?: number;
    lastBotActivity?: string;
    lastHumanActivity?: string;
  };
  contactId: {
    _id: string;
    name: string;
    phone: string;
    email?: string;
    avatar?: string;
    tags: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface ConversationStats {
  period: string;
  conversations: {
    total: number;
    active: number;
    new: number;
  };
  messages: {
    total: number;
    inbound: number;
    outbound: number;
    responseRate: string;
  };
}