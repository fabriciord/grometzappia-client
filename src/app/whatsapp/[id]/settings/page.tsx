'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { whatsappAPI } from '@/lib/api';

interface WhatsAppConnection {
  _id: string;
  name: string;
  phone: string;
  status: string;
  settings: {
    autoReply: {
      enabled: boolean;
      message: string;
    };
    businessHours: {
      enabled: boolean;
      schedule: {
        [key: string]: {
          start: string;
          end: string;
          enabled: boolean;
        };
      };
    };
    welcomeMessage: {
      enabled: boolean;
      message: string;
    };
  };
}

export default function WhatsAppSettingsPage() {
  const [connection, setConnection] = useState<WhatsAppConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const router = useRouter();
  const params = useParams();

  const { register, handleSubmit, setValue, watch } = useForm();

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 4000);
  };

  const fetchConnection = async () => {
    try {
      setIsLoading(true);
      const response = await whatsappAPI.getConnections();
      const foundConnection = response.data.connections.find(
        (conn: WhatsAppConnection) => conn._id === params.id
      );
      
      if (foundConnection) {
        setConnection(foundConnection);
        // Set form values
        setValue('autoReplyEnabled', foundConnection.settings?.autoReply?.enabled || false);
        setValue('autoReplyMessage', foundConnection.settings?.autoReply?.message || 'Obrigado pela mensagem! Em breve entraremos em contato.');
        setValue('businessHoursEnabled', foundConnection.settings?.businessHours?.enabled || false);
        setValue('welcomeEnabled', foundConnection.settings?.welcomeMessage?.enabled || false);
        setValue('welcomeMessage', foundConnection.settings?.welcomeMessage?.message || 'Olá! Seja bem-vindo(a)!');
      } else {
        showMessage('Conexão não encontrada', 'error');
        router.push('/whatsapp');
      }
    } catch (error) {
      showMessage('Erro ao carregar configurações', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchConnection();
    }
  }, [params.id]);

  const onSubmit = async (data: any) => {
    if (!connection) return;

    setIsSaving(true);
    try {
      const settings = {
        autoReply: {
          enabled: data.autoReplyEnabled,
          message: data.autoReplyMessage
        },
        businessHours: {
          enabled: data.businessHoursEnabled,
          schedule: connection.settings?.businessHours?.schedule || {}
        },
        welcomeMessage: {
          enabled: data.welcomeEnabled,
          message: data.welcomeMessage
        }
      };

      await whatsappAPI.updateSettings(connection._id, { settings });
      showMessage('Configurações salvas com sucesso!', 'success');
    } catch (error) {
      showMessage('Erro ao salvar configurações', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  if (!connection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Conexão não encontrada</h2>
          <button
            onClick={() => router.push('/whatsapp')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Voltar para WhatsApp
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configurações WhatsApp</h1>
              <p className="mt-1 text-sm text-gray-600">
                {connection.name} ({connection.phone})
              </p>
            </div>
            <button
              onClick={() => router.push('/whatsapp')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              ← Voltar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Auto Reply Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Resposta Automática</h3>
                <p className="text-sm text-gray-500">
                  Envie uma mensagem automática quando receber uma nova mensagem
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('autoReplyEnabled')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {watch('autoReplyEnabled') && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem de resposta automática
                </label>
                <textarea
                  {...register('autoReplyMessage')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Digite a mensagem que será enviada automaticamente..."
                />
              </div>
            )}
          </div>

          {/* Welcome Message Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Mensagem de Boas-vindas</h3>
                <p className="text-sm text-gray-500">
                  Envie uma mensagem de boas-vindas para novos contatos
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('welcomeEnabled')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {watch('welcomeEnabled') && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem de boas-vindas
                </label>
                <textarea
                  {...register('welcomeMessage')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Digite a mensagem de boas-vindas..."
                />
              </div>
            )}
          </div>

          {/* Business Hours Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Horário Comercial</h3>
                <p className="text-sm text-gray-500">
                  Defina horários específicos para funcionamento das automações
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('businessHoursEnabled')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {watch('businessHoursEnabled') && (
              <div className="mt-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-700">
                    <strong>🕒 Em breve:</strong> Configuração detalhada de horários por dia da semana estará disponível na próxima atualização.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Connection Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informações da Conexão</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome da Conexão</label>
                <p className="mt-1 text-sm text-gray-900">{connection.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Número</label>
                <p className="mt-1 text-sm text-gray-900">{connection.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  connection.status === 'connected' 
                    ? 'bg-green-100 text-green-800'
                    : connection.status === 'connecting'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {connection.status === 'connected' ? 'Conectado' : 
                   connection.status === 'connecting' ? 'Conectando' : 'Desconectado'}
                </span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}