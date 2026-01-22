'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { conversationsAPI } from '@/lib/api';
import { Conversation, ConversationStats } from '@/types/conversation';
import { useSocket } from '@/hooks/useSocket';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stats, setStats] = useState<ConversationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const connectionId = searchParams.get('connectionId');

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 4000);
  };

  const fetchConversations = async () => {
    if (!connectionId) {
      showMessage('ID da conexão WhatsApp é obrigatório', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const [conversationsResponse, statsResponse] = await Promise.all([
        conversationsAPI.getConversations({ connectionId }),
        conversationsAPI.getStats({ connectionId, period: '7d' })
      ]);

      setConversations(conversationsResponse.data.conversations);
      setStats(statsResponse.data.stats);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      showMessage('Erro ao carregar conversas', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [connectionId]);

  // Realtime updates: escuta eventos de atualização da lista
  const { isConnected, on } = useSocket({});

  useEffect(() => {
    if (!isConnected) return;

    const handler = (data: any) => {
      // Apenas atualiza se for a mesma conexão
      if (!connectionId || String(data?.connectionId) !== String(connectionId)) return;
      // Debounce pequeno para agrupar múltiplos eventos
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = setTimeout(() => {
        fetchConversations();
      }, 300);
    };

    const cleanup = on?.('conversations_updated', handler);
    return () => {
      cleanup?.();
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    };
  }, [isConnected, connectionId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Agora há pouco';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h atrás`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', text: 'Ativa' },
      closed: { color: 'bg-gray-100 text-gray-800', text: 'Fechada' },
      waiting: { color: 'bg-yellow-100 text-yellow-800', text: 'Aguardando' },
      bot_active: { color: 'bg-blue-100 text-blue-800', text: 'Bot Ativo' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (!connectionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Conexão WhatsApp necessária</h2>
          <p className="text-gray-600 mb-6">Selecione uma conexão WhatsApp para visualizar as conversas.</p>
          <button
            onClick={() => router.push('/whatsapp')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Ir para WhatsApp
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Conversas WhatsApp</h1>
              <p className="mt-1 text-sm text-gray-600">
                Gerencie suas conversas e mensagens em tempo real
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/whatsapp')}
                className="bg-white text-gray-700 px-4 py-2 rounded-lg border hover:bg-gray-50"
              >
                ← Voltar
              </button>
              <button
                onClick={fetchConversations}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                🔄 Atualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`mx-4 mt-4 p-4 rounded-lg ${messageType === 'success' ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}>
          {message}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Conversas Totais</h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.conversations.total}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Conversas Ativas</h3>
              <p className="text-2xl font-bold text-green-600 mt-2">{stats.conversations.active}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Mensagens (7d)</h3>
              <p className="text-2xl font-bold text-blue-600 mt-2">{stats.messages.total}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">Taxa de Resposta</h3>
              <p className="text-2xl font-bold text-purple-600 mt-2">{stats.messages.responseRate}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Conversations List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Lista de Conversas</h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <p className="mt-2 text-gray-600">Carregando conversas...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma conversa encontrada</h3>
              <p className="text-gray-600">
                As conversas aparecerão aqui quando alguém enviar uma mensagem para seu WhatsApp.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {conversations.map((conversation) => (
                <div 
                  key={conversation._id}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/conversations/${conversation._id}?connectionId=${connectionId}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-lg font-medium text-gray-700">
                            {conversation.contactId?.name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {conversation.contactId?.name || conversation.contactPhone}
                          </p>
                          {getStatusBadge(conversation.status)}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {conversation.contactPhone}
                        </p>
                        {conversation.lastMessage && (
                          <p className="text-sm text-gray-600 mt-1 truncate">
                            {conversation.lastMessage.fromBot && '🤖 '}
                            {conversation.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      {conversation.lastMessage && (
                        <span className="text-xs text-gray-500">
                          {formatDate(conversation.lastMessage.timestamp)}
                        </span>
                      )}
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{conversation.statistics.messageCount} msgs</span>
                        {conversation.automationSettings.aiEnabled && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            IA
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}