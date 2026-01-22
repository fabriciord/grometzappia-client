'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Zap,
  PhoneCall,
  BarChart3,
  Bot,
  Settings
} from 'lucide-react';
import { authAPI, contactsAPI } from '@/lib/api';
import Cookies from 'js-cookie';

interface User {
  id: string;
  name: string;
  email: string;
  subscription: {
    plan: string;
    tokensUsed: number;
    tokensLimit: number;
  };
}

interface ContactsStats {
  overview: {
    total: number;
    byStatus: {
      leads: number;
      prospects: number;
      customers: number;
      blocked: number;
    };
  };
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [contactsStats, setContactsStats] = useState<ContactsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const router = useRouter();

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 4000);
  };

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const [userResponse, statsResponse] = await Promise.all([
        authAPI.me(),
        contactsAPI.getContactsStats()
      ]);

      setUser(userResponse.data.user);
      setContactsStats(statsResponse.data);
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      if (error.response?.status === 401) {
        Cookies.remove('token');
        router.push('/login');
      } else {
        showMessage('Erro ao carregar dashboard', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove('token');
    showMessage('Logout realizado com sucesso', 'success');
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total de Contatos',
      value: contactsStats?.overview.total || 0,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      name: 'Leads',
      value: contactsStats?.overview.byStatus.leads || 0,
      icon: TrendingUp,
      color: 'bg-green-500',
      change: '+5%'
    },
    {
      name: 'Prospects',
      value: contactsStats?.overview.byStatus.prospects || 0,
      icon: MessageSquare,
      color: 'bg-yellow-500',
      change: '+8%'
    },
    {
      name: 'Clientes',
      value: contactsStats?.overview.byStatus.customers || 0,
      icon: Zap,
      color: 'bg-purple-500',
      change: '+15%'
    }
  ];

  const quickActions = [
    {
      name: 'Conectar WhatsApp',
      description: 'Conecte um novo número',
      icon: PhoneCall,
      href: '/whatsapp',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      name: 'Criar Campanha',
      description: 'Nova campanha de marketing',
      icon: MessageSquare,
      href: '/campaigns',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      name: 'Ver Analytics',
      description: 'Relatórios detalhados',
      icon: BarChart3,
      href: '/analytics',
      color: 'bg-indigo-600 hover:bg-indigo-700'
    },
    {
      name: 'IA Megan',
      description: 'Configurar assistente',
      icon: Bot,
      href: '/ai',
      color: 'bg-pink-600 hover:bg-pink-700'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">GrometZappIA</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Olá, {user?.name}</span>
              <button
                onClick={() => router.push('/settings')}
                className="p-2 rounded-full text-gray-400 hover:text-gray-500"
              >
                <Settings className="h-5 w-5" />
              </button>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo ao seu Dashboard
          </h2>
          <p className="text-gray-600">
            Gerencie suas automações WhatsApp e acompanhe seus resultados
          </p>
        </div>

        {/* Subscription Info */}
        {user && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 mb-8 text-white">
            <h3 className="text-lg font-semibold mb-2">Plano {user.subscription.plan}</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Tokens utilizados</p>
                <p className="text-2xl font-bold">
                  {user.subscription.tokensUsed.toLocaleString()} / {user.subscription.tokensLimit.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50">
                  Fazer Upgrade
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className={`${stat.color} rounded-lg p-3`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                  <span className="text-sm text-gray-500"> vs último mês</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => router.push(action.href)}
                  className={`${action.color} text-white rounded-lg p-6 text-left transition-colors`}
                >
                  <IconComponent className="h-8 w-8 mb-3" />
                  <h4 className="text-lg font-semibold mb-1">{action.name}</h4>
                  <p className="text-sm opacity-90">{action.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Atividade Recente</h3>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-500 py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma atividade recente</p>
              <p className="text-sm">Conecte um WhatsApp para começar</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}