'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Cookies from 'js-cookie';
import { campaignsAPI, whatsappAPI, contactsAPI } from '@/lib/api';

interface Campaign {
  _id: string;
  name: string;
  message: string;
  type: 'immediate' | 'scheduled' | 'drip';
  status: 'draft' | 'running' | 'paused' | 'completed' | 'failed';
  whatsappConnectionId: {
    _id: string;
    name: string;
    phone: string;
  };
  targetContacts: string[];
  filters: {
    status?: string;
    stage?: string;
    tags?: string[];
  };
  scheduledFor?: string;
  startedAt?: string;
  completedAt?: string;
  results?: {
    sent: number;
    failed: number;
    total: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface CampaignFormData {
  name: string;
  message: string;
  type: 'immediate' | 'scheduled' | 'drip';
  whatsappConnectionId: string;
  scheduledFor?: string;
  filterStatus?: string;
  filterStage?: string;
  filterTags?: string[];
}

interface WhatsAppConnection {
  _id: string;
  name: string;
  phone: string;
  status: string;
}

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [whatsappConnections, setWhatsappConnections] = useState<WhatsAppConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    byStatus: {
      draft: 0,
      running: 0,
      paused: 0,
      completed: 0,
      failed: 0
    }
  });

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<CampaignFormData>();
  const watchType = watch('type');

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    fetchCampaigns();
    fetchWhatsAppConnections();
    fetchStats();
  }, [router, statusFilter, typeFilter]);

  const fetchCampaigns = async () => {
    try {
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;

      const response = await campaignsAPI.getCampaigns(params);
      setCampaigns(response.data.campaigns);
    } catch (error) {
      console.error('Erro ao buscar campanhas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWhatsAppConnections = async () => {
    try {
      const response = await whatsappAPI.getConnections();
      setWhatsappConnections(response.data.connections.filter((c: any) => c.status === 'connected'));
    } catch (error) {
      console.error('Erro ao buscar conexões WhatsApp:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await campaignsAPI.getStats();
      setStats(response.data.overview);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const onSubmit = async (data: CampaignFormData) => {
    try {
      const campaignData = {
        name: data.name,
        message: data.message,
        type: data.type,
        whatsappConnectionId: data.whatsappConnectionId,
        scheduledFor: data.type === 'scheduled' ? data.scheduledFor : undefined,
        filters: {
          status: data.filterStatus && data.filterStatus !== 'all' ? data.filterStatus : undefined,
          stage: data.filterStage && data.filterStage !== 'all' ? data.filterStage : undefined,
          tags: data.filterTags && data.filterTags.length > 0 ? data.filterTags : undefined
        }
      };

      await campaignsAPI.createCampaign(campaignData);
      
      fetchCampaigns();
      fetchStats();
      setShowCreateModal(false);
      reset();
    } catch (error) {
      console.error('Erro ao criar campanha:', error);
    }
  };

  const handleStartCampaign = async (campaignId: string) => {
    try {
      await campaignsAPI.startCampaign(campaignId);
      fetchCampaigns();
      fetchStats();
    } catch (error) {
      console.error('Erro ao iniciar campanha:', error);
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      await campaignsAPI.pauseCampaign(campaignId);
      fetchCampaigns();
      fetchStats();
    } catch (error) {
      console.error('Erro ao pausar campanha:', error);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (confirm('Tem certeza que deseja excluir esta campanha?')) {
      try {
        await campaignsAPI.deleteCampaign(campaignId);
        fetchCampaigns();
        fetchStats();
      } catch (error) {
        console.error('Erro ao excluir campanha:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      running: 'bg-blue-100 text-blue-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts = {
      draft: 'Rascunho',
      running: 'Executando',
      paused: 'Pausada',
      completed: 'Concluída',
      failed: 'Falhou'
    };
    return texts[status as keyof typeof texts] || status;
  };

  const getTypeText = (type: string) => {
    const texts = {
      immediate: 'Imediata',
      scheduled: 'Agendada',
      drip: 'Gotejamento'
    };
    return texts[type as keyof typeof texts] || type;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  Campanhas
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Crie e gerencie campanhas de WhatsApp
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nova Campanha
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4V8a3 3 0 016 0v2M7 7a3 3 0 000 6h10a3 3 0 000-6M9 12v3" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Executando</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.byStatus.running}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Concluídas</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.byStatus.completed}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pausadas</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.byStatus.paused}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a.997.997 0 01-.707.293H7a4 4 0 01-4-4V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Rascunhos</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.byStatus.draft}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">Todos</option>
                <option value="draft">Rascunho</option>
                <option value="running">Executando</option>
                <option value="paused">Pausada</option>
                <option value="completed">Concluída</option>
                <option value="failed">Falhou</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">Todos</option>
                <option value="immediate">Imediata</option>
                <option value="scheduled">Agendada</option>
                <option value="drip">Gotejamento</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Campanhas */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {campaigns.length === 0 ? (
              <li className="px-6 py-4 text-center text-gray-500">
                Nenhuma campanha encontrada
              </li>
            ) : (
              campaigns.map((campaign) => (
                <li key={campaign._id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-indigo-500 rounded-md flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {campaign.name}
                          </div>
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                            {getStatusText(campaign.status)}
                          </span>
                          <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            {getTypeText(campaign.type)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          WhatsApp: {campaign.whatsappConnectionId.name}
                        </div>
                        <div className="text-sm text-gray-400 mt-1 truncate max-w-md">
                          {campaign.message}
                        </div>
                        {campaign.results && (
                          <div className="text-sm text-gray-500 mt-1">
                            Enviadas: {campaign.results.sent} | Falharam: {campaign.results.failed} | Total: {campaign.results.total}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {campaign.status === 'draft' && (
                        <button
                          onClick={() => handleStartCampaign(campaign._id)}
                          className="inline-flex items-center px-3 py-1 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Iniciar
                        </button>
                      )}
                      {campaign.status === 'running' && (
                        <button
                          onClick={() => handlePauseCampaign(campaign._id)}
                          className="inline-flex items-center px-3 py-1 border border-yellow-300 rounded-md text-sm font-medium text-yellow-700 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                        >
                          Pausar
                        </button>
                      )}
                      {(campaign.status === 'draft' || campaign.status === 'paused' || campaign.status === 'completed') && (
                        <button
                          onClick={() => handleDeleteCampaign(campaign._id)}
                          className="inline-flex items-center px-3 py-1 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Modal Criar Campanha */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Nova Campanha</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    reset();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Campanha *
                  </label>
                  <input
                    type="text"
                    {...register('name', { required: 'Nome é obrigatório' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Ex: Promoção Black Friday"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conexão WhatsApp *
                  </label>
                  <select
                    {...register('whatsappConnectionId', { required: 'Conexão é obrigatória' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Selecione uma conexão</option>
                    {whatsappConnections.map((connection) => (
                      <option key={connection._id} value={connection._id}>
                        {connection.name} ({connection.phone})
                      </option>
                    ))}
                  </select>
                  {errors.whatsappConnectionId && (
                    <p className="mt-1 text-sm text-red-600">{errors.whatsappConnectionId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Campanha *
                  </label>
                  <select
                    {...register('type', { required: 'Tipo é obrigatório' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Selecione o tipo</option>
                    <option value="immediate">Imediata</option>
                    <option value="scheduled">Agendada</option>
                    <option value="drip">Gotejamento</option>
                  </select>
                  {errors.type && (
                    <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                  )}
                </div>

                {watchType === 'scheduled' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agendar para *
                    </label>
                    <input
                      type="datetime-local"
                      {...register('scheduledFor', { required: 'Data é obrigatória para campanhas agendadas' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {errors.scheduledFor && (
                      <p className="mt-1 text-sm text-red-600">{errors.scheduledFor.message}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem *
                  </label>
                  <textarea
                    {...register('message', { required: 'Mensagem é obrigatória' })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Digite sua mensagem aqui..."
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Filtros de Segmentação</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status dos Contatos
                      </label>
                      <select
                        {...register('filterStatus')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="all">Todos</option>
                        <option value="lead">Lead</option>
                        <option value="prospect">Prospect</option>
                        <option value="customer">Cliente</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estágio dos Contatos
                      </label>
                      <select
                        {...register('filterStage')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="all">Todos</option>
                        <option value="cold">Frio</option>
                        <option value="warm">Morno</option>
                        <option value="hot">Quente</option>
                        <option value="qualified">Qualificado</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      reset();
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    Criar Campanha
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}