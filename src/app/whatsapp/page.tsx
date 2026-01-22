'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { whatsappAPI } from '@/lib/api';
import Cookies from 'js-cookie';

interface WhatsAppConnection {
  _id: string;
  name: string;
  phone: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  qrCode?: string;
  profile?: {
    name?: string;
    avatar?: string;
    about?: string;
  };
  lastConnection?: string;
  isActive: boolean;
  settings: {
    autoReply: {
      enabled: boolean;
      message: string;
    };
    businessHours: {
      enabled: boolean;
    };
    welcomeMessage: {
      enabled: boolean;
      message: string;
    };
  };
  statistics: {
    messagesSent: number;
    messagesReceived: number;
    activeChats: number;
  };
}

interface AddWhatsAppModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddWhatsAppModal({ onClose, onSuccess }: AddWhatsAppModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<{
    name: string;
    phone: string;
  }>();

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 4000);
  };

  const onSubmit = async (data: { name: string; phone: string }) => {
    setIsLoading(true);
    
    try {
      console.log('Tentando criar conexão WhatsApp:', data);
      const response = await whatsappAPI.createConnection(data);
      console.log('Resposta da API:', response);
      
      showMessage('WhatsApp adicionado com sucesso!', 'success');
      reset();
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Erro detalhado:', error);
      console.error('Response:', error.response);
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      
      let msg = 'Erro ao adicionar WhatsApp';
      
      if (error.response?.status === 401) {
        msg = 'Você precisa fazer login primeiro';
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (error.response?.data?.message) {
        msg = error.response.data.message;
      }
      
      showMessage(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Adicionar WhatsApp Business</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded-lg ${
              messageType === 'success' 
                ? 'bg-green-100 border border-green-400 text-green-700'
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Conexão
              </label>
              <input
                type="text"
                {...register('name', { 
                  required: 'Nome é obrigatório',
                  minLength: {
                    value: 2,
                    message: 'Nome deve ter pelo menos 2 caracteres'
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Ex: WhatsApp Principal"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número do WhatsApp
              </label>
              <input
                type="text"
                {...register('phone', { 
                  required: 'Número é obrigatório',
                  pattern: {
                    value: /^[\+]?[1-9][\d]{0,15}$/,
                    message: 'Número inválido (use formato internacional)'
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Ex: +5511999999999"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <strong>📱 Como conectar:</strong>
                <br />
                1. Digite um nome para identificar esta conexão
                <br />
                2. Informe o número no formato internacional (+55...)
                <br />
                3. Após criar, escaneie o QR Code que aparecerá
                <br />
                4. Mantenha o WhatsApp Web deslogado no navegador
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Criando...' : 'Criar Conexão'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function WhatsAppPage() {
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<WhatsAppConnection | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const router = useRouter();

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 4000);
  };

  const fetchConnections = async () => {
    try {
      setIsLoading(true);
      const response = await whatsappAPI.getConnections();
      setConnections(response.data.connections || []);
      
      // Fetch QR codes for connecting connections
      const connectingConnections = (response.data.connections || []).filter(
        (conn: WhatsAppConnection) => conn.status === 'connecting'
      );
      
      for (const conn of connectingConnections) {
        fetchQRCode(conn._id);
      }
    } catch (error: any) {
      console.error('Erro ao carregar conexões:', error);
      
      // Check if it's an auth error
      if (error.response?.status === 401) {
        showMessage('Você precisa fazer login primeiro', 'error');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        showMessage('Erro ao carregar conexões WhatsApp', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQRCode = async (connectionId: string) => {
    try {
      const response = await whatsappAPI.getQRCode(connectionId);
      if (response.data.success && response.data.qrCode) {
        setQrCodes(prev => ({
          ...prev,
          [connectionId]: response.data.qrCode
        }));
      }
    } catch (error: any) {
      console.error(`Erro ao buscar QR Code para ${connectionId}:`, error);
    }
  };

  useEffect(() => {
    // Check authentication first
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchConnections();
    
    // Auto-refresh every 5 seconds to update connection status
    const interval = setInterval(() => {
      fetchConnections();
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      case 'error':
        return 'Erro';
      default:
        return 'Desconectado';
    }
  };

  const handleConnect = async (connectionId: string) => {
    try {
      // Clear any existing QR code
      setQrCodes(prev => ({
        ...prev,
        [connectionId]: ''
      }));
      
      await whatsappAPI.connect(connectionId);
      showMessage('Conectando ao WhatsApp...', 'success');
      fetchConnections();
      
      // Start polling for QR code
      setTimeout(() => {
        fetchQRCode(connectionId);
      }, 1000);
    } catch (error: any) {
      showMessage('Erro ao conectar WhatsApp', 'error');
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      await whatsappAPI.disconnect(connectionId);
      showMessage('WhatsApp desconectado com sucesso', 'success');
      fetchConnections();
    } catch (error: any) {
      showMessage('Erro ao desconectar WhatsApp', 'error');
    }
  };

  const handleReset = async (connectionId: string) => {
    try {
      // Clear QR codes from state
      setQrCodes(prev => ({
        ...prev,
        [connectionId]: ''
      }));
      
      await whatsappAPI.resetConnection(connectionId);
      showMessage('Sessão resetada! Tente conectar novamente.', 'success');
      fetchConnections();
    } catch (error: any) {
      showMessage('Erro ao resetar sessão WhatsApp', 'error');
    }
  };

  const handleReconnect = async (connectionId: string) => {
    try {
      await whatsappAPI.reconnectSession(connectionId);
      showMessage('Tentando reconectar com sessão existente...', 'success');
      fetchConnections();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Erro ao reconectar WhatsApp';
      showMessage(errorMsg, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">WhatsApp Business</h1>
              <p className="mt-1 text-sm text-gray-600">
                Gerencie suas conexões WhatsApp e automações
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                ← Voltar ao Dashboard
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Adicionar WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            messageType === 'success' 
              ? 'bg-green-100 border border-green-400 text-green-700'
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Carregando conexões...</p>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Conectados</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {connections.filter(c => c.status === 'connected').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Mensagens Enviadas</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {connections.reduce((acc, c) => acc + (c.statistics?.messagesSent || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Mensagens Recebidas</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {connections.reduce((acc, c) => acc + (c.statistics?.messagesReceived || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Chats Ativos</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {connections.reduce((acc, c) => acc + (c.statistics?.activeChats || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Connections List */}
            {connections.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-12">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhum WhatsApp conectado</h3>
                  <p className="mt-2 text-gray-500">
                    Comece adicionando sua primeira conexão WhatsApp Business.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Adicionar WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {connections.map((connection) => (
                  <div key={connection._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {connection.profile?.avatar ? (
                            <img 
                              className="h-12 w-12 rounded-full" 
                              src={connection.profile.avatar} 
                              alt={connection.name}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                              <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{connection.name}</h3>
                          <p className="text-sm text-gray-500">{connection.phone}</p>
                          {connection.profile?.about && (
                            <p className="text-xs text-gray-400 mt-1">{connection.profile.about}</p>
                          )}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(connection.status)}`}>
                        {getStatusText(connection.status)}
                      </span>
                    </div>

                    {/* Statistics */}
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-semibold text-gray-900">{connection.statistics?.messagesSent || 0}</p>
                        <p className="text-xs text-gray-500">Enviadas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-semibold text-gray-900">{connection.statistics?.messagesReceived || 0}</p>
                        <p className="text-xs text-gray-500">Recebidas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-semibold text-gray-900">{connection.statistics?.activeChats || 0}</p>
                        <p className="text-xs text-gray-500">Chats</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex space-x-2">
                      {connection.status === 'connected' ? (
                        <>
                          <button
                            onClick={() => handleDisconnect(connection._id)}
                            className="flex-1 bg-red-50 text-red-700 text-sm font-medium py-2 px-3 rounded-md border border-red-200 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            Desconectar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleConnect(connection._id)}
                            className="flex-1 bg-green-50 text-green-700 text-sm font-medium py-2 px-3 rounded-md border border-green-200 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            Conectar
                          </button>
                          {connection.status === 'error' && (
                            <>
                              <button
                                onClick={() => handleReconnect(connection._id)}
                                className="bg-blue-50 text-blue-700 text-sm font-medium py-2 px-3 rounded-md border border-blue-200 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                title="Tentar reconectar com sessão existente"
                              >
                                🔌 Reconectar
                              </button>
                              <button
                                onClick={() => handleReset(connection._id)}
                                className="bg-orange-50 text-orange-700 text-sm font-medium py-2 px-3 rounded-md border border-orange-200 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                title="Reset da sessão - use se não conseguir conectar"
                              >
                                🔄 Reset
                              </button>
                            </>
                          )}
                          {connection.status === 'connecting' && (
                            <button
                              onClick={() => handleReset(connection._id)}
                              className="bg-orange-50 text-orange-700 text-sm font-medium py-2 px-3 rounded-md border border-orange-200 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                              title="Reset da sessão - use se não conseguir conectar"
                            >
                              🔄 Reset
                            </button>
                          )}
                        </>
                      )}
                      {connection.status === 'connected' && (
                        <button
                          onClick={() => router.push(`/conversations?connectionId=${connection._id}`)}
                          className="bg-blue-50 text-blue-700 text-sm font-medium py-2 px-3 rounded-md border border-blue-200 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          💬
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/whatsapp/${connection._id}/settings`)}
                        className="bg-gray-50 text-gray-700 text-sm font-medium py-2 px-3 rounded-md border border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        ⚙️
                      </button>
                    </div>

                    {/* QR Code for connecting */}
                    {connection.status === 'connecting' && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                        <div className="flex items-center mb-3">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                          <p className="text-sm font-medium text-green-800">Aguardando conexão WhatsApp...</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border-2 border-dashed border-green-300">
                          <p className="text-sm text-gray-600 mb-3 text-center">
                            <strong>📱 Como conectar:</strong>
                          </p>
                          <div className="text-xs text-gray-500 space-y-1">
                            <p>1. Abra o WhatsApp no seu celular</p>
                            <p>2. Toque em Configurações → Aparelhos conectados</p>
                            <p>3. Toque em "Conectar um aparelho"</p>
                            <p>4. Aguarde o QR Code aparecer aqui</p>
                          </div>
                          {qrCodes[connection._id] ? (
                            <div className="mt-3 text-center">
                              <img src={qrCodes[connection._id]} alt="QR Code WhatsApp" className="mx-auto max-w-32 border rounded" />
                              <p className="text-xs text-gray-500 mt-2">Escaneie este QR Code com o WhatsApp</p>
                            </div>
                          ) : (
                            <div className="mt-3 text-center">
                              <div className="animate-pulse bg-gray-200 h-32 w-32 mx-auto rounded"></div>
                              <p className="text-xs text-gray-400 mt-2">Gerando QR Code...</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Error Help */}
                    {connection.status === 'error' && (
                      <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center mb-2">
                          <div className="text-red-600 mr-2">⚠️</div>
                          <p className="text-sm font-medium text-red-800">Problema na conexão</p>
                        </div>
                        <div className="text-xs text-red-600 space-y-1">
                          <p>• Clique em "🔄 Reset" para limpar a sessão</p>
                          <p>• Tente "Conectar" novamente</p>
                          <p>• Se continuar com erro, aguarde alguns minutos</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && <AddWhatsAppModal onClose={() => setShowAddModal(false)} onSuccess={fetchConnections} />}


    </div>
  );
}