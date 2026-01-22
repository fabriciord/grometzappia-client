'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { conversationsAPI } from '@/lib/api';
import { Conversation, WhatsAppMessage } from '@/types/conversation';
import { useSocket } from '@/hooks/useSocket';

interface TypingUser {
  userId: string;
  isTyping: boolean;
}

export default function ChatPage() {
  // DEBUG: Log when component mounts
  console.log('🎬 [ChatPage] Component mounted/re-rendered');
  console.log('🎬 [ChatPage] Timestamp:', new Date().toISOString());
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const conversationId = params.id as string;
  const connectionId = searchParams.get('connectionId');
  
  console.log('🎬 [ChatPage] ConversationId:', conversationId);
  console.log('🎬 [ChatPage] ConnectionId:', connectionId);

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 4000);
  };

  // Socket.IO integration
  console.log('🔌 [ChatPage] About to call useSocket...');
  const {
    isConnected,
    isAuthenticated,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    markAsRead,
    on,
    off
  } = useSocket({
    autoConnect: true, // Garantir que conecta automaticamente
    onConnect: () => {
      console.log('📡 [ChatPage] Socket connected to realtime service');
      console.log('📡 [ChatPage] Current conversationId:', conversationId);
      // Aguardar autenticação antes de join
    },
    onDisconnect: () => {
      console.log('📡 [ChatPage] Socket disconnected from realtime service');
    }
  });
  console.log('🔌 [ChatPage] useSocket returned, isConnected:', isConnected, 'isAuthenticated:', isAuthenticated);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversation = async () => {
    try {
      const response = await conversationsAPI.getConversation(conversationId);
      setConversation(response.data.conversation);
    } catch (error: any) {
      console.error('Error fetching conversation:', error);
      showMessage('Erro ao carregar conversa', 'error');
    }
  };

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const response = await conversationsAPI.getMessages(conversationId);
      setMessages(response.data.messages);
      
      // Mark messages as read
      response.data.messages.forEach(msg => {
        if (msg.direction === 'inbound') {
          markAsRead(conversationId, msg._id);
        }
      });
      
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      showMessage('Erro ao carregar mensagens', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    try {
      setIsSending(true);
      const messageToSend = newMessage.trim();
      setNewMessage('');
      
      // Stop typing indicator
      stopTyping(conversationId);

      const response = await conversationsAPI.sendMessage(conversationId, {
        message: messageToSend,
        type: 'text'
      });

      showMessage('Mensagem enviada!', 'success');
      
      // Refresh messages after sending
      setTimeout(() => {
        fetchMessages();
      }, 500);

    } catch (error: any) {
      console.error('Error sending message:', error);
      showMessage('Erro ao enviar mensagem', 'error');
      setNewMessage(newMessage); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    
    // Handle typing indicator
    if (value.trim()) {
      startTyping(conversationId);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(conversationId);
      }, 2000);
    } else {
      stopTyping(conversationId);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageSenderName = (msg: WhatsAppMessage) => {
    if (msg.direction === 'outbound') {
      return msg.senderType === 'bot' ? '🤖 Megan' : '👤 Você';
    }
    return conversation?.contactId?.name || 'Cliente';
  };

  // Socket event listeners - registrar uma única vez
  useEffect(() => {
    if (!conversationId) {
      console.log('⚠️ No conversationId, skipping socket setup');
      return;
    }

    console.log('🔌 Setting up socket listeners for conversation:', conversationId);
    console.log('🔌 Socket connected:', isConnected);

    // Registrar listeners primeiro
    console.log('� Registering socket event listeners...');
    
    // Listen for new messages
    const handleNewMessage = (data: any) => {
      console.log('📨 New message received via socket:', data);
      console.log('📨 Current conversationId:', conversationId);
      console.log('📨 Message conversationId:', data.conversationId);
      
      if (data.conversationId === conversationId) {
        console.log('✅ Message belongs to current conversation, refreshing...');
        fetchMessages(); // Refresh messages
      } else {
        console.log('⏭️ Message is for different conversation, ignoring');
      }
    };

    // Listen for typing indicators
    const handleUserTyping = (data: any) => {
      if (data.conversationId === conversationId) {
        setTypingUsers(prev => {
          const filtered = prev.filter(u => u.userId !== data.userId);
          if (data.isTyping) {
            return [...filtered, { userId: data.userId, isTyping: true }];
          }
          return filtered;
        });
      }
    };

    // Listen for conversation updates
    const handleConversationUpdate = (data: any) => {
      console.log('🔄 Conversation update received:', data);
      if (data.conversationId === conversationId) {
        fetchConversation();
      }
    };

    const cleanupNewMessage = on?.('new_message', handleNewMessage);
    const cleanupTyping = on?.('user_typing', handleUserTyping);
    const cleanupUpdate = on?.('conversation_updated', handleConversationUpdate);
    console.log('✅ Socket listeners registered!');

    // Note: Join will be handled by the separate useEffect that watches isConnected + isAuthenticated

    return () => {
      console.log('🚪 Leaving conversation room:', conversationId);
      leaveConversation(conversationId);
      cleanupNewMessage?.();
      cleanupTyping?.();
      cleanupUpdate?.();
    };
  }, [conversationId]); // Apenas conversationId como dependência

  // Separate effect to handle connection changes
  useEffect(() => {
    console.log('🔄 Connection/Auth state changed:', { isConnected, isAuthenticated });
    if (isConnected && isAuthenticated && conversationId) {
      console.log('📱 Socket connected AND authenticated, joining conversation now!');
      // Pequeno delay para garantir que o backend processou a autenticação
      setTimeout(() => {
        joinConversation(conversationId);
      }, 100);
    }
  }, [isConnected, isAuthenticated]);

  // Initial data fetch
  useEffect(() => {
    if (conversationId) {
      fetchConversation();
      fetchMessages();
    }
  }, [conversationId]);

  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Conversa não encontrada</h2>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push(`/conversations?connectionId=${connectionId}`)}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Voltar
            </button>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white font-medium">
                  {conversation.contactId?.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {conversation.contactId?.name || conversation.contactPhone}
                </h1>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>{conversation.contactPhone}</span>
                  <span>•</span>
                  <span className={`flex items-center ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                    <div className={`w-2 h-2 rounded-full mr-1 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    {isConnected ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs rounded-full ${
              conversation.status === 'active' ? 'bg-green-100 text-green-800' :
              conversation.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {conversation.status === 'active' ? 'Ativa' : 
               conversation.status === 'waiting' ? 'Aguardando' : 'Inativa'}
            </span>
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`mx-4 mt-2 p-3 rounded-lg text-sm ${messageType === 'success' ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}>
          {message}
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-4xl mb-2">💬</div>
            <p>Nenhuma mensagem ainda</p>
            <p className="text-sm">Inicie a conversa enviando uma mensagem!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.direction === 'outbound'
                  ? msg.senderType === 'bot'
                    ? 'bg-purple-500 text-white' // Bot messages
                    : 'bg-blue-500 text-white'   // Human messages
                  : 'bg-white text-gray-900 border border-gray-200' // Incoming messages
              }`}>
                <div className="text-xs opacity-75 mb-1">
                  {getMessageSenderName(msg)}
                </div>
                <p className="text-sm">{msg.content.text}</p>
                <div className="text-xs opacity-75 mt-1 text-right">
                  {formatTime(msg.createdAt)}
                  {msg.direction === 'outbound' && (
                    <span className="ml-1">
                      {msg.whatsappData.status === 'read' ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-200 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-600 ml-2">digitando...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t p-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSending}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSending}
            className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}