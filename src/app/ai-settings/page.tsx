'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface AIConfig {
  _id: string;
  enabled: boolean;
  assistant: {
    name: string;
    personality: string;
    role: string;
    language: string;
  };
  behavior: {
    autoResponse: boolean;
    responseDelay: {
      min: number;
      max: number;
    };
    maxMessagesPerDay: number;
    workingHours: {
      enabled: boolean;
      timezone: string;
    };
  };
  prompts: {
    welcome: string;
    qualification: string;
    scheduling: string;
    unavailable: string;
  };
  advanced: {
    model: string;
    temperature: number;
    maxTokens: number;
    contextLength: number;
  };
  usage: {
    totalMessages: number;
    currentMonthUsage: number;
    monthlyLimit: number;
    lastUsed?: string;
  };
}

export default function AISettingsPage() {
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [activeTab, setActiveTab] = useState('general');
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestLoading, setIsTestLoading] = useState(false);

  const router = useRouter();

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 4000);
  };

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/ai/config');
      setConfig(response.data.config);
    } catch (error: any) {
      console.error('Error fetching AI config:', error);
      showMessage('Erro ao carregar configurações', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!config) return;

    try {
      setIsSaving(true);
      await api.put('/ai/config', config);
      showMessage('Configurações salvas com sucesso!', 'success');
    } catch (error: any) {
      console.error('Error saving config:', error);
      showMessage('Erro ao salvar configurações', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestAI = async () => {
    if (!testMessage.trim()) {
      showMessage('Digite uma mensagem para testar', 'error');
      return;
    }

    try {
      setIsTestLoading(true);
      const response = await api.post('/ai/test', {
        message: testMessage
      });
      setTestResult(response.data.test);
      showMessage('Teste realizado com sucesso!', 'success');
    } catch (error: any) {
      console.error('Error testing AI:', error);
      showMessage('Erro ao testar IA', 'error');
    } finally {
      setIsTestLoading(false);
    }
  };

  const updateConfig = (path: string, value: any) => {
    if (!config) return;

    const keys = path.split('.');
    const newConfig = { ...config };
    let current: any = newConfig;

    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    setConfig(newConfig);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Erro ao carregar configurações</h2>
          <button
            onClick={fetchConfig}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', name: 'Geral', icon: '🤖' },
    { id: 'prompts', name: 'Prompts', icon: '💬' },
    { id: 'behavior', name: 'Comportamento', icon: '⚙️' },
    { id: 'advanced', name: 'Avançado', icon: '🔧' },
    { id: 'test', name: 'Testar IA', icon: '🧪' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configurações de IA</h1>
              <p className="mt-1 text-sm text-gray-600">
                Configure sua assistente virtual Megan
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-white text-gray-700 px-4 py-2 rounded-lg border hover:bg-gray-50"
              >
                ← Voltar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : '💾 Salvar'}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon} {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações Gerais</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={config.enabled}
                          onChange={(e) => updateConfig('enabled', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                        />
                        <span className="ml-2 text-sm text-gray-700">Habilitar IA</span>
                      </label>
                      <p className="mt-1 text-xs text-gray-500">Ativa ou desativa todas as respostas automáticas</p>
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={config.behavior.autoResponse}
                          onChange={(e) => updateConfig('behavior.autoResponse', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                        />
                        <span className="ml-2 text-sm text-gray-700">Resposta automática</span>
                      </label>
                      <p className="mt-1 text-xs text-gray-500">Responde automaticamente as mensagens recebidas</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome da Assistente
                    </label>
                    <input
                      type="text"
                      value={config.assistant.name}
                      onChange={(e) => updateConfig('assistant.name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Megan"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Função/Papel
                    </label>
                    <input
                      type="text"
                      value={config.assistant.role}
                      onChange={(e) => updateConfig('assistant.role', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Assistente Virtual de Vendas"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Personalidade
                  </label>
                  <textarea
                    value={config.assistant.personality}
                    onChange={(e) => updateConfig('assistant.personality', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descreva como a IA deve se comportar (ex: profissional, amigável, prestativa)"
                  />
                </div>

                {/* Usage Stats */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Estatísticas de Uso</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{config.usage.totalMessages}</p>
                      <p className="text-sm text-gray-600">Total de mensagens</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{config.usage.currentMonthUsage}</p>
                      <p className="text-sm text-gray-600">Este mês</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{config.usage.monthlyLimit}</p>
                      <p className="text-sm text-gray-600">Limite mensal</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">
                        {config.usage.monthlyLimit - config.usage.currentMonthUsage}
                      </p>
                      <p className="text-sm text-gray-600">Restantes</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Prompts Tab */}
            {activeTab === 'prompts' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Prompts Personalizados</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem de Boas-vindas
                  </label>
                  <textarea
                    value={config.prompts.welcome}
                    onChange={(e) => updateConfig('prompts.welcome', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qualificação de Lead
                  </label>
                  <textarea
                    value={config.prompts.qualification}
                    onChange={(e) => updateConfig('prompts.qualification', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agendamento
                  </label>
                  <textarea
                    value={config.prompts.scheduling}
                    onChange={(e) => updateConfig('prompts.scheduling', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fora do Horário
                  </label>
                  <textarea
                    value={config.prompts.unavailable}
                    onChange={(e) => updateConfig('prompts.unavailable', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Test Tab */}
            {activeTab === 'test' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Testar Assistente IA</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem de Teste
                  </label>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Digite uma mensagem para testar a IA..."
                      onKeyPress={(e) => e.key === 'Enter' && handleTestAI()}
                    />
                    <button
                      onClick={handleTestAI}
                      disabled={isTestLoading}
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isTestLoading ? 'Testando...' : '🧪 Testar'}
                    </button>
                  </div>
                </div>

                {testResult && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <h4 className="font-medium text-gray-900">Resultado do Teste</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Análise da Mensagem</h5>
                        <div className="bg-white p-3 rounded border text-sm">
                          <p><strong>Intent:</strong> {testResult.intent.name}</p>
                          <p><strong>Sentimento:</strong> {testResult.intent.sentiment}</p>
                          <p><strong>Confiança:</strong> {(testResult.intent.confidence * 100).toFixed(1)}%</p>
                          <p><strong>Resumo:</strong> {testResult.intent.summary}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Resposta Gerada</h5>
                        <div className="bg-white p-3 rounded border text-sm">
                          <p className="text-gray-800">{testResult.response.text}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}