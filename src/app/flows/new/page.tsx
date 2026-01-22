'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { flowsAPI } from '@/lib/api';

export default function NewFlowPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    triggerType: 'new_message'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      showMessage('Nome do fluxo é obrigatório', 'error');
      return;
    }

    try {
      setIsLoading(true);
      
      const flowData = {
        name: formData.name,
        description: formData.description,
        settings: {
          triggerType: formData.triggerType
        },
        nodes: [
          {
            id: 'start',
            type: 'trigger',
            position: { x: 250, y: 100 },
            data: {
              label: 'Início',
              triggerType: formData.triggerType
            }
          }
        ],
        edges: [],
        isActive: false
      };

      const response = await flowsAPI.createFlow(flowData);
      
      showMessage('Fluxo criado com sucesso!', 'success');
      
      // Redirect to the flow builder
      setTimeout(() => {
        router.push(`/flows/${response.data.flow._id}`);
      }, 1000);
      
    } catch (error: any) {
      console.error('Error creating flow:', error);
      showMessage('Erro ao criar fluxo', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const templates = [
    {
      id: 'welcome',
      name: 'Boas-vindas',
      description: 'Recebe novos contatos e apresenta sua empresa',
      icon: '👋',
      color: 'bg-blue-500'
    },
    {
      id: 'sales',
      name: 'Vendas',
      description: 'Qualifica leads e direciona para vendas',
      icon: '💰',
      color: 'bg-green-500'
    },
    {
      id: 'support',
      name: 'Suporte',
      description: 'Atendimento automatizado para dúvidas comuns',
      icon: '🎧',
      color: 'bg-purple-500'
    },
    {
      id: 'qualification',
      name: 'Qualificação',
      description: 'Coleta informações dos prospects',
      icon: '📋',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
          >
            ← Voltar
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Criar Novo Fluxo</h1>
          <p className="mt-2 text-gray-600">
            Configure um novo fluxo de automação para seu WhatsApp
          </p>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            messageType === 'success' 
              ? 'bg-green-100 border border-green-400 text-green-700'
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Form */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Configuração Básica
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Flow Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Fluxo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Fluxo de Boas-vindas"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descreva o objetivo deste fluxo..."
                  rows={3}
                />
              </div>

              {/* Trigger Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Gatilho
                </label>
                <select
                  value={formData.triggerType}
                  onChange={(e) => setFormData({ ...formData, triggerType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="new_message">📩 Nova Mensagem</option>
                  <option value="keyword">🔤 Palavra-chave</option>
                  <option value="button">🔘 Botão</option>
                  <option value="schedule">⏰ Agendamento</option>
                  <option value="webhook">🔗 Webhook</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando...
                  </div>
                ) : (
                  '🚀 Criar Fluxo'
                )}
              </button>
            </form>
          </div>

          {/* Templates */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              📋 Templates Prontos
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Comece com um template pronto e personalize conforme sua necessidade
            </p>
            
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer"
                  onClick={() => {
                    setFormData({
                      name: `Fluxo de ${template.name}`,
                      description: template.description,
                      triggerType: 'new_message'
                    });
                  }}
                >
                  <div className="flex items-start">
                    <div className={`w-12 h-12 ${template.color} rounded-lg flex items-center justify-center text-2xl mr-4 flex-shrink-0`}>
                      {template.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {template.name}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {template.description}
                      </p>
                    </div>
                    <div className="text-blue-600 text-sm font-medium">
                      Usar →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}