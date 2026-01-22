'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Cookies from 'js-cookie';

// Função auxiliar para mostrar notificações
const notify = {
  success: (msg: string) => {
    // Usar sistema de notificação do browser ou criar toast component
    console.log('✅', msg);
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('toast', { detail: { message: msg, type: 'success' } });
      window.dispatchEvent(event);
    }
  },
  error: (msg: string) => {
    console.error('❌', msg);
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('toast', { detail: { message: msg, type: 'error' } });
      window.dispatchEvent(event);
    }
  }
};

interface AIConfig {
  _id: string;
  enabled: boolean;
  assistant: {
    name: string;
    personality: string;
    role: string;
  };
  behavior: {
    autoResponse: boolean;
    responseDelay: {
      min: number;
      max: number;
    };
    maxMessagesPerConversation: number;
    handoffToHuman: boolean;
    handoffTriggers: string[];
  };
  workingHours: {
    enabled: boolean;
    timezone: string;
    schedule: {
      monday: { start: string; end: string; active: boolean };
      tuesday: { start: string; end: string; active: boolean };
      wednesday: { start: string; end: string; active: boolean };
      thursday: { start: string; end: string; active: boolean };
      friday: { start: string; end: string; active: boolean };
      saturday: { start: string; end: string; active: boolean };
      sunday: { start: string; end: string; active: boolean };
    };
  };
  customPrompts: {
    welcomeMessage: string;
    qualificationQuestions: string[];
    schedulingPrompt: string;
  };
}

interface AIStats {
  aiMessages: number;
  aiConversations: number;
  autoResponseRate: number;
  totalInbound: number;
  intentDistribution: Array<{
    intent: string;
    count: number;
  }>;
}

export default function AIPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activeTab, setActiveTab] = useState('config');
  
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState('');

  useEffect(() => {
    // Verificar autenticação
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    loadConfig();
    loadStats();
  }, [router]);

  const loadConfig = async () => {
    try {
      const response = await api.get('/ai/config');
      const loadedConfig = response.data.config;
      
      // Garantir que todos os campos necessários existam
      const completeConfig = {
        ...loadedConfig,
        assistant: loadedConfig.assistant || { name: 'Megan', personality: '', role: 'Assistente' },
        behavior: loadedConfig.behavior || {
          autoResponse: true,
          responseDelay: { min: 1, max: 3 },
          maxMessagesPerConversation: 10,
          handoffToHuman: true,
          handoffTriggers: []
        },
        workingHours: loadedConfig.workingHours || {
          enabled: false,
          timezone: 'America/Sao_Paulo',
          schedule: {
            monday: { start: '09:00', end: '18:00', active: true },
            tuesday: { start: '09:00', end: '18:00', active: true },
            wednesday: { start: '09:00', end: '18:00', active: true },
            thursday: { start: '09:00', end: '18:00', active: true },
            friday: { start: '09:00', end: '18:00', active: true },
            saturday: { start: '09:00', end: '13:00', active: false },
            sunday: { start: '09:00', end: '13:00', active: false }
          }
        },
        customPrompts: loadedConfig.customPrompts || {
          welcomeMessage: 'Olá! Como posso ajudar você hoje?',
          qualificationQuestions: [],
          schedulingPrompt: 'Gostaria de agendar uma conversa?'
        }
      };
      
      setConfig(completeConfig);
    } catch (error: any) {
      console.error('Erro ao carregar config da IA:', error);
      
      // Se erro 401, redirecionar para login
      if (error.response?.status === 401) {
        Cookies.remove('token');
        router.push('/login');
        return;
      }
      
      notify.error('Erro ao carregar configurações da IA');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/ai/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Erro ao carregar stats:', error);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    
    setSaving(true);
    try {
      await api.put('/ai/config', config);
      notify.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      notify.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAI = async () => {
    if (!config) return;
    
    try {
      const newEnabled = !config.enabled;
      await api.post('/ai/toggle', { enabled: newEnabled });
      setConfig({ ...config, enabled: newEnabled });
      notify.success(`IA ${newEnabled ? 'ativada' : 'desativada'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao alternar IA:', error);
      notify.error('Erro ao alterar status da IA');
    }
  };

  const handleTestAI = async () => {
    if (!testMessage.trim()) {
      notify.error('Digite uma mensagem para testar');
      return;
    }
    
    setTesting(true);
    setTestResponse('');
    
    try {
      const response = await api.post('/ai/test', { message: testMessage });
      setTestResponse(response.data.response.text || response.data.response);
      notify.success('Teste realizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao testar IA:', error);
      notify.error('Erro ao testar IA: ' + (error.response?.data?.details || 'Erro desconhecido'));
    } finally {
      setTesting(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar configurações da IA</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🤖 Assistente IA - Megan</h1>
              <p className="mt-1 text-sm text-gray-600">
                Configure sua assistente virtual inteligente para atendimento automatizado
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Voltar ao Dashboard
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Status:</span>
                <button
                  onClick={handleToggleAI}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.enabled ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm font-medium ${config.enabled ? 'text-green-600' : 'text-gray-500'}`}>
                  {config.enabled ? 'Ativa' : 'Inativa'}
                </span>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            {[
              { id: 'config', label: 'Configuração', icon: '⚙️' },
              { id: 'prompts', label: 'Prompts', icon: '💬' },
              { id: 'behavior', label: 'Comportamento', icon: '🎯' },
              { id: 'test', label: 'Testar', icon: '🧪' },
              { id: 'stats', label: 'Estatísticas', icon: '📊' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6 pb-12">
          {/* Configuração */}
          {activeTab === 'config' && (
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Configuração da Assistente</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome da Assistente
                    </label>
                    <input
                      type="text"
                      value={config.assistant.name}
                      onChange={(e) => updateConfig('assistant.name', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Megan"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cargo/Função
                    </label>
                    <input
                      type="text"
                      value={config.assistant.role}
                      onChange={(e) => updateConfig('assistant.role', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Assistente de Vendas"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Personalidade
                    </label>
                    <textarea
                      value={config.assistant.personality}
                      onChange={(e) => updateConfig('assistant.personality', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Descreva a personalidade da sua assistente..."
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Ex: "Profissional, amigável e prestativa. Sempre disposta a ajudar e resolver problemas."
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Horário de Funcionamento</h3>
                
                <div className="mb-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.workingHours.enabled}
                      onChange={(e) => updateConfig('workingHours.enabled', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Ativar horário de funcionamento</span>
                  </label>
                </div>

                {config.workingHours?.enabled && config.workingHours?.schedule && (
                  <div className="space-y-2">
                    {Object.entries(config.workingHours.schedule).map(([day, schedule]) => (
                      <div key={day} className="flex items-center gap-4">
                        <label className="flex items-center gap-2 w-32">
                          <input
                            type="checkbox"
                            checked={schedule.active}
                            onChange={(e) => updateConfig(`workingHours.schedule.${day}.active`, e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm capitalize">{day === 'monday' ? 'Segunda' : day === 'tuesday' ? 'Terça' : day === 'wednesday' ? 'Quarta' : day === 'thursday' ? 'Quinta' : day === 'friday' ? 'Sexta' : day === 'saturday' ? 'Sábado' : 'Domingo'}</span>
                        </label>
                        {schedule.active && (
                          <>
                            <input
                              type="time"
                              value={schedule.start}
                              onChange={(e) => updateConfig(`workingHours.schedule.${day}.start`, e.target.value)}
                              className="px-3 py-1 border border-gray-300 rounded"
                            />
                            <span className="text-gray-500">até</span>
                            <input
                              type="time"
                              value={schedule.end}
                              onChange={(e) => updateConfig(`workingHours.schedule.${day}.end`, e.target.value)}
                              className="px-3 py-1 border border-gray-300 rounded"
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Prompts */}
          {activeTab === 'prompts' && (
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Mensagens Personalizadas</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mensagem de Boas-vindas
                    </label>
                    <textarea
                      value={config.customPrompts?.welcomeMessage || ''}
                      onChange={(e) => updateConfig('customPrompts.welcomeMessage', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Olá! Sou a Megan, assistente virtual. Como posso ajudar você hoje?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Perguntas de Qualificação
                    </label>
                    {(config.customPrompts?.qualificationQuestions || []).map((question, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={question}
                          onChange={(e) => {
                            const newQuestions = [...(config.customPrompts?.qualificationQuestions || [])];
                            newQuestions[index] = e.target.value;
                            updateConfig('customPrompts.qualificationQuestions', newQuestions);
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder={`Pergunta ${index + 1}`}
                        />
                        <button
                          onClick={() => {
                            const newQuestions = (config.customPrompts?.qualificationQuestions || []).filter((_, i) => i !== index);
                            updateConfig('customPrompts.qualificationQuestions', newQuestions);
                          }}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        updateConfig('customPrompts.qualificationQuestions', [
                          ...(config.customPrompts?.qualificationQuestions || []),
                          ''
                        ]);
                      }}
                      className="mt-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      + Adicionar Pergunta
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prompt de Agendamento
                    </label>
                    <textarea
                      value={config.customPrompts?.schedulingPrompt || ''}
                      onChange={(e) => updateConfig('customPrompts.schedulingPrompt', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Ótimo! Vou agendar uma conversa com nossa equipe. Qual o melhor dia e horário para você?"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Comportamento */}
          {activeTab === 'behavior' && (
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Comportamento da IA</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 mb-4">
                      <input
                        type="checkbox"
                        checked={config.behavior?.autoResponse || false}
                        onChange={(e) => updateConfig('behavior.autoResponse', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-700">Resposta Automática</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delay de Resposta (segundos)
                    </label>
                    <div className="flex gap-4 items-center">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500">Mínimo</label>
                        <input
                          type="number"
                          value={config.behavior?.responseDelay?.min || 1}
                          onChange={(e) => updateConfig('behavior.responseDelay.min', parseInt(e.target.value))}
                          min="0"
                          max="10"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <span className="text-gray-500 pt-5">-</span>
                      <div className="flex-1">
                        <label className="text-xs text-gray-500">Máximo</label>
                        <input
                          type="number"
                          value={config.behavior?.responseDelay?.max || 3}
                          onChange={(e) => updateConfig('behavior.responseDelay.max', parseInt(e.target.value))}
                          min="0"
                          max="10"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Simula um tempo de digitação humano antes de responder
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Máximo de Mensagens por Conversa
                    </label>
                    <input
                      type="number"
                      value={config.behavior?.maxMessagesPerConversation || 10}
                      onChange={(e) => updateConfig('behavior.maxMessagesPerConversation', parseInt(e.target.value))}
                      min="1"
                      max="50"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Após esse limite, a conversa será transferida para um atendente humano
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={config.behavior?.handoffToHuman || false}
                        onChange={(e) => updateConfig('behavior.handoffToHuman', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-700">Transferir para Humano</span>
                    </label>
                    <p className="text-sm text-gray-500 ml-6">
                      A IA pode transferir conversas complexas para atendentes humanos
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Testar */}
          {activeTab === 'test' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Testar Assistente IA</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem de Teste
                  </label>
                  <textarea
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Digite uma mensagem para testar a resposta da IA..."
                  />
                </div>

                <button
                  onClick={handleTestAI}
                  disabled={testing || !testMessage.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {testing ? '🔄 Testando...' : '🧪 Testar Resposta'}
                </button>

                {testResponse && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Resposta da IA:</h3>
                    <p className="text-gray-900 whitespace-pre-wrap">{testResponse}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Estatísticas */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {stats ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-sm text-gray-600 mb-1">Mensagens IA</div>
                      <div className="text-3xl font-bold text-blue-600">{stats.aiMessages || 0}</div>
                      <div className="text-xs text-gray-500 mt-1">últimos 30 dias</div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-sm text-gray-600 mb-1">Conversas Ativas</div>
                      <div className="text-3xl font-bold text-green-600">{stats.aiConversations || 0}</div>
                      <div className="text-xs text-gray-500 mt-1">com IA habilitada</div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-sm text-gray-600 mb-1">Taxa de Resposta</div>
                      <div className="text-3xl font-bold text-purple-600">{stats.autoResponseRate || 0}%</div>
                      <div className="text-xs text-gray-500 mt-1">mensagens automatizadas</div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-sm text-gray-600 mb-1">Total Recebidas</div>
                      <div className="text-3xl font-bold text-orange-600">{stats.totalInbound || 0}</div>
                      <div className="text-xs text-gray-500 mt-1">mensagens inbound</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Distribuição de Intents</h3>
                    <div className="space-y-3">
                      {(stats.intentDistribution || []).length > 0 ? (
                        stats.intentDistribution.map((item, index) => (
                          <div key={index} className="flex items-center gap-4">
                            <div className="w-32 text-sm text-gray-700 capitalize">
                              {item.intent.replace('_', ' ')}
                            </div>
                            <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                              <div
                                className="bg-blue-600 h-full flex items-center justify-end px-2 text-white text-xs font-medium"
                                style={{
                                  width: `${stats.aiMessages > 0 ? (item.count / stats.aiMessages) * 100 : 0}%`
                                }}
                              >
                                {item.count}
                              </div>
                            </div>
                            <div className="w-16 text-sm text-gray-500 text-right">
                              {stats.aiMessages > 0 ? ((item.count / stats.aiMessages) * 100).toFixed(1) : '0.0'}%
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>Nenhum dado de intent disponível ainda</p>
                          <p className="text-sm mt-2">As estatísticas aparecerão após a IA processar mensagens</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Carregando estatísticas...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
