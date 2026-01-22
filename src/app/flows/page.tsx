"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { flowsAPI } from "@/lib/api";
import type { Flow } from "@/types/flow";

export default function FlowsPage() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFlows = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await flowsAPI.getFlows();
        const list: Flow[] = res.data?.flows ?? res.data ?? [];
        setFlows(Array.isArray(list) ? list : []);
      } catch (e: any) {
        console.error("Erro ao buscar fluxos:", e);
        setError("Não foi possível carregar os fluxos agora.");
      } finally {
        setLoading(false);
      }
    };
    fetchFlows();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fluxos de Automação</h1>
            <p className="mt-2 text-gray-600">Gerencie e crie fluxos para automatizar seu WhatsApp.</p>
          </div>
          <Link href="/flows/new" className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            ➕ Criar Novo Fluxo
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
        )}

        {flows.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum fluxo criado ainda</h3>
            <p className="text-gray-600 mb-6">Comece criando seu primeiro fluxo de automação.</p>
            <Link href="/flows/new" className="inline-flex items-center px-6 py-3 rounded-md text-white bg-blue-600 hover:bg-blue-700">
              🚀 Criar Primeiro Fluxo
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {flows.map((flow) => (
              <div key={flow._id} className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{flow.name}</h3>
                    {flow.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{flow.description}</p>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${flow.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                    {flow.isActive ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                  <div className="space-x-3">
                    <Link href={`/flows/${flow._id}`} className="text-blue-600 hover:text-blue-800">Abrir</Link>
                    <Link href={`/flows/${flow._id}/analytics`} className="text-gray-600 hover:text-gray-800">Analytics</Link>
                  </div>
                  {flow.statistics?.totalExecutions !== undefined && (
                    <div className="text-xs">Execuções: {flow.statistics.totalExecutions}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 Templates Prontos</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { id: "welcome", name: "Boas-vindas", icon: "👋", color: "bg-blue-500", description: "Recepção automática de novos contatos" },
              { id: "sales", name: "Vendas", icon: "💰", color: "bg-green-500", description: "Qualificação e conversão de leads" },
              { id: "support", name: "Suporte", icon: "🎧", color: "bg-purple-500", description: "Atendimento 24/7 inteligente" },
              { id: "qualification", name: "Qualificação", icon: "📋", color: "bg-orange-500", description: "Coleta de dados dos prospects" },
            ].map((t) => (
              <div key={t.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className={`w-12 h-12 ${t.color} rounded-lg flex items-center justify-center text-2xl mb-3`}>{t.icon}</div>
                <h3 className="text-sm font-medium text-gray-900">{t.name}</h3>
                <p className="text-xs text-gray-500">{t.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==== Conteúdo antigo corrompido, mantido apenas como comentário ==== 
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { flowsAPI } from "@/lib/api";
import type { Flow } from "@/types/flow";

export default function FlowsPage() {
  const router = useRouter();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFlows = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await flowsAPI.getFlows();
        // Backend returns { success, flows } or directly an array depending on route; normalize defensively
        const list: Flow[] = res.data?.flows ?? res.data ?? [];
        setFlows(Array.isArray(list) ? list : []);
      } catch (e: any) {
        console.error("Erro ao buscar fluxos:", e);
        setError("Não foi possível carregar os fluxos agora.");
      } finally {
        setLoading(false);
      }
    };
    fetchFlows();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  // Header (tail)
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fluxos de Automação</h1>
            <p className="mt-2 text-gray-600">Gerencie e crie fluxos para automatizar seu WhatsApp.</p>
          </div>
          <Link
            href="/flows/new"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ➕ Criar Novo Fluxo
          </Link>
        </div>

  // Error (tail)
            ➕ Criar Novo Fluxo // (tail)
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

  // Content (tail)
        {flows.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum fluxo criado ainda</h3>
            <p className="text-gray-600 mb-6">Comece criando seu primeiro fluxo de automação.</p>
            <Link
              href="/flows/new"
              className="inline-flex items-center px-6 py-3 rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              🚀 Criar Primeiro Fluxo
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {flows.map((flow) => (
              <div key={flow._id} className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{flow.name}</h3>
                    {flow.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{flow.description}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${flow.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}
                  >
                    {flow.isActive ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                  <div className="space-x-3">
                    <Link href={`/flows/${flow._id}`} className="text-blue-600 hover:text-blue-800">Abrir</Link>
                    <Link href={`/flows/${flow._id}/analytics`} className="text-gray-600 hover:text-gray-800">Analytics</Link>
                  </div>
                  {flow.statistics?.totalExecutions !== undefined && (
                    <div className="text-xs">Execuções: {flow.statistics.totalExecutions}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

  // Templates simples (tail)
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 Templates Prontos</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { id: "welcome", name: "Boas-vindas", icon: "👋", color: "bg-blue-500", description: "Recepção automática de novos contatos" },
              { id: "sales", name: "Vendas", icon: "💰", color: "bg-green-500", description: "Qualificação e conversão de leads" },
              { id: "support", name: "Suporte", icon: "🎧", color: "bg-purple-500", description: "Atendimento 24/7 inteligente" },
              { id: "qualification", name: "Qualificação", icon: "📋", color: "bg-orange-500", description: "Coleta de dados dos prospects" },
            ].map((t) => (
              <div key={t.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className={`w-12 h-12 ${t.color} rounded-lg flex items-center justify-center text-2xl mb-3`}>{t.icon}</div>
                <h3 className="text-sm font-medium text-gray-900">{t.name}</h3>
                <p className="text-xs text-gray-500">{t.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
 

                        ? 'bg-green-100 text-green-800' 

                        : 'bg-gray-100 text-gray-800'    );      reset();

                    }`}>

                      <div className={`w-2 h-2 rounded-full mr-1 ${  }    } catch (error) {

                        flow.isActive ? 'bg-green-400' : 'bg-gray-400'

                      }`}></div>      console.error('Erro ao criar fluxo:', error);

                      {flow.isActive ? 'Ativo' : 'Inativo'}

                    </div>  return (    }

                    <div className="text-xs text-gray-500">

                      v{flow.version || 1}    <div className="min-h-screen bg-gray-50">  };

                    </div>

                  </div>      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">



                  // Flow Info / Header (tail)

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">

                    {flow.name}        <div className="flex justify-between items-center mb-8">    try {

                  </h3>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">          <div>      if (isActive) {

                    {flow.description || 'Sem descrição'}

                  </p>            <h1 className="text-3xl font-bold text-gray-900">Fluxos de Automação</h1>        await flowsAPI.deactivateFlow(flowId);



                  // Flow Stats (tail)

                  <div className="grid grid-cols-2 gap-4 mb-4 text-center">

                    <div>              Gerencie seus fluxos de automação do WhatsApp        await flowsAPI.activateFlow(flowId);

                      <div className="text-2xl font-bold text-blue-600">

                        {flow.statistics?.totalExecutions || 0}            </p>      }

                      </div>
                        const [loading, setLoading] = useState(true);
                      <div className="text-xs text-gray-500">Execuções</div>          </div>      fetchFlows();

                    </div>

                    <div>          <Link    } catch (error) {

                      <div className="text-2xl font-bold text-green-600">

                        {flow.nodes?.length || 0}            href="/flows/new"      console.error('Erro ao alterar status do fluxo:', error);

                      </div>

                      <div className="text-xs text-gray-500">Nós</div>            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"    }

                    </div>

                  </div>          >  };



                  // Trigger Type (tail)

                  <div className="mb-4">

                    <div className="text-xs text-gray-500 mb-1">Gatilho:</div>          </Link>  const handleDeleteFlow = async (flowId: string) => {

                    <div className="text-sm font-medium text-gray-900">

                      {flow.settings?.triggerType === 'new_message' && '📩 Nova Mensagem'}        </div>    if (confirm('Tem certeza que deseja excluir este fluxo?')) {

                      {flow.settings?.triggerType === 'keyword' && '🔤 Palavra-chave'}

                      {flow.settings?.triggerType === 'button' && '🔘 Botão'}      try {

                      {flow.settings?.triggerType === 'schedule' && '⏰ Agendamento'}

                      // Message Alert (tail)

                      {!flow.settings?.triggerType && '📩 Nova Mensagem'}

                    </div>        {message && (        fetchFlows();

                  </div>

          <div className={`mb-4 p-3 rounded-lg text-sm ${      } catch (error) {

                  // Last Modified (tail)

                  <div className="text-xs text-gray-500 mb-4">            messageType === 'success'         console.error('Erro ao excluir fluxo:', error);

                    Modificado em: {flow.updatedAt ? new Date(flow.updatedAt).toLocaleDateString('pt-BR') : 'N/A'}

                  </div>              ? 'bg-green-100 border border-green-400 text-green-700'      }



                  // Actions (tail)

                  <div className="flex space-x-2">

                    <Link          }`}>  };

                      href={`/flows/${flow._id}`}

                      className="flex-1 bg-blue-600 text-white text-center px-3 py-2 text-sm rounded-md hover:bg-blue-700 transition-colors"            {message}

                    >

                      ✏️ Editar          </div>  const handleCreateFromTemplate = async (template: FlowTemplate) => {

                    </Link>

                    <button        )}    try {

                      onClick={() => toggleFlow(flow._id, flow.isActive)}

                      className={`px-3 py-2 text-sm rounded-md transition-colors ${      await flowsAPI.createFromTemplate(template.id, {

                        flow.isActive

                          // Flows Grid (tail)

                          : 'bg-green-100 text-green-700 hover:bg-green-200'

                      }`}        {flows.length === 0 ? (        whatsappConnectionId: whatsappConnections[0]?._id

                      title={flow.isActive ? 'Desativar fluxo' : 'Ativar fluxo'}

                    >          <div className="text-center py-12">      });

                      {flow.isActive ? '⏸️' : '▶️'}

                    </button>            <div className="text-6xl mb-4">🤖</div>      fetchFlows();

                    <button

                      onClick={() => deleteFlow(flow._id)}            <h3 className="text-xl font-medium text-gray-900 mb-2">      setShowTemplatesModal(false);

                      className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"

                      title="Excluir fluxo"              Nenhum fluxo criado ainda      setSelectedTemplate(null);

                    >

                      🗑️            </h3>    } catch (error) {

                    </button>

                  </div>            <p className="text-gray-600 mb-6">      console.error('Erro ao criar fluxo do template:', error);

                </div>

              </div>              Comece criando seu primeiro fluxo de automação    }

            ))}

          </div>            </p>  };

        )}

            <Link

  // Templates Section (tail)

        <div className="mt-12">              href="/flows/new"  const getTriggerText = (trigger: string) => {

          <h2 className="text-2xl font-bold text-gray-900 mb-6">

            📋 Templates Prontos              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"    const texts = {

          </h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">            >      message_received: 'Mensagem Recebida',

            {[

              { id: 'welcome', name: 'Boas-vindas', icon: '👋', color: 'bg-blue-500' },              🚀 Criar Primeiro Fluxo      contact_created: 'Contato Criado',

              { id: 'sales', name: 'Vendas', icon: '💰', color: 'bg-green-500' },

              { id: 'support', name: 'Suporte', icon: '🎧', color: 'bg-purple-500' },            </Link>      manual: 'Manual',

              { id: 'qualification', name: 'Qualificação', icon: '📋', color: 'bg-orange-500' },

            ].map((template) => (          </div>      scheduled: 'Agendado'

              <div

                key={template.id}        ) : (    };

                className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer"

                onClick={() => router.push(`/flows/new?template=${template.id}`)}          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">    return texts[trigger as keyof typeof texts] || trigger;

              >

                <div className={`w-12 h-12 ${template.color} rounded-lg flex items-center justify-center text-2xl mx-auto mb-2`}>            {flows.map((flow) => (  };

                  {template.icon}

                </div>              <div key={flow._id} className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">

                <div className="text-sm font-medium text-gray-900">

                  {template.name}                <div className="p-6">  const getStatusColor = (isActive: boolean) => {

                </div>

                // Flow Status (tail)

                  Usar template

                </div>                  <div className="flex items-center justify-between mb-4">      ? 'bg-green-100 text-green-800' 

              </div>

            ))}                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${      : 'bg-gray-100 text-gray-800';

          </div>

        </div>                      flow.isActive   };

      </div>

    </div>                        ? 'bg-green-100 text-green-800' 

  );

}                        : 'bg-gray-100 text-gray-800'  if (loading) {

                    }`}>    return (

                      <div className={`w-2 h-2 rounded-full mr-1 ${      <div className="flex justify-center items-center min-h-screen">

                        flow.isActive ? 'bg-green-400' : 'bg-gray-400'        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>

                      }`}></div>      </div>

                      {flow.isActive ? 'Ativo' : 'Inativo'}    );

                    </div>  }

                    <div className="text-xs text-gray-500">

                      v{flow.version || 1}  return (

                    </div>    <div className="min-h-screen bg-gray-50">

                  </div>      <div className="bg-white shadow">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                  // Flow Info (tail)

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">            <div className="md:flex md:items-center md:justify-between">

                    {flow.name}              <div className="flex-1 min-w-0">

                  </h3>                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">                  Fluxos de Automação

                    {flow.description || 'Sem descrição'}                </h2>

                  </p>                <p className="mt-1 text-sm text-gray-500">

                  Automatize suas interações com fluxos inteligentes

                  // Flow Stats (tail)

                  <div className="grid grid-cols-2 gap-4 mb-4 text-center">              </div>

                    <div>              <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">

                      <div className="text-2xl font-bold text-blue-600">                <button

                        {flow.statistics?.totalExecutions || 0}                  onClick={() => setShowTemplatesModal(true)}

                      </div>                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"

                      <div className="text-xs text-gray-500">Execuções</div>                >

                    </div>                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                    <div>                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />

                      <div className="text-2xl font-bold text-green-600">                  </svg>

                        {flow.nodes?.length || 0}                  Templates

                      </div>                </button>

                      <div className="text-xs text-gray-500">Nós</div>                <button

                    </div>                  onClick={() => setShowCreateModal(true)}

                  </div>                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"

                >

                  // Trigger Type (tail)

                  <div className="mb-4">                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />

                    <div className="text-xs text-gray-500 mb-1">Gatilho:</div>                  </svg>

                    <div className="text-sm font-medium text-gray-900">                  Novo Fluxo

                      {flow.settings?.triggerType === 'new_message' && '📩 Nova Mensagem'}                </button>

                      {flow.settings?.triggerType === 'keyword' && '🔤 Palavra-chave'}              </div>

                      {flow.settings?.triggerType === 'button' && '🔘 Botão'}            </div>

                      {flow.settings?.triggerType === 'schedule' && '⏰ Agendamento'}          </div>

                      {flow.settings?.triggerType === 'webhook' && '🔗 Webhook'}        </div>

                    </div>      </div>

                  </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                  // Last Modified / Estatísticas (tail)

                  <div className="text-xs text-gray-500 mb-4">        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">

                    Modificado em: {flow.updatedAt ? new Date(flow.updatedAt).toLocaleDateString('pt-BR') : 'N/A'}          <div className="bg-white overflow-hidden shadow rounded-lg">

                  </div>            <div className="p-5">

              <div className="flex items-center">

                  // Actions (tail)

                  <div className="flex space-x-2">                  <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">

                    <Link                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                      href={`/flows/${flow._id}`}                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />

                      className="flex-1 bg-blue-600 text-white text-center px-3 py-2 text-sm rounded-md hover:bg-blue-700 transition-colors"                    </svg>

                    >                  </div>

                      ✏️ Editar                </div>

                    </Link>                <div className="ml-5 w-0 flex-1">

                    <button                  <dl>

                      onClick={() => toggleFlow(flow._id, flow.isActive)}                    <dt className="text-sm font-medium text-gray-500 truncate">Total Fluxos</dt>

                      className={`px-3 py-2 text-sm rounded-md transition-colors ${                    <dd className="text-lg font-medium text-gray-900">{flows.length}</dd>

                        flow.isActive                  </dl>

                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'                </div>

                          : 'bg-green-100 text-green-700 hover:bg-green-200'              </div>

                      }`}            </div>

                      title={flow.isActive ? 'Desativar fluxo' : 'Ativar fluxo'}          </div>

                    >

                      {flow.isActive ? '⏸️' : '▶️'}          <div className="bg-white overflow-hidden shadow rounded-lg">

                    </button>            <div className="p-5">

                    <button              <div className="flex items-center">

                      onClick={() => deleteFlow(flow._id)}                <div className="flex-shrink-0">

                      className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">

                      title="Excluir fluxo"                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                    >                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />

                      🗑️                    </svg>

                    </button>                  </div>

                  </div>                </div>

                </div>                <div className="ml-5 w-0 flex-1">

              </div>                  <dl>

            ))}                    <dt className="text-sm font-medium text-gray-500 truncate">Ativos</dt>

          </div>                    <dd className="text-lg font-medium text-gray-900">

        )}                      {flows.filter(f => f.isActive).length}

                    </dd>

  // Templates Section (tail)

        <div className="mt-12">                </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">              </div>

            📋 Templates Prontos            </div>

          </h2>          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

            {[          <div className="bg-white overflow-hidden shadow rounded-lg">

              { id: 'welcome', name: 'Boas-vindas', icon: '👋', color: 'bg-blue-500' },            <div className="p-5">

              { id: 'sales', name: 'Vendas', icon: '💰', color: 'bg-green-500' },              <div className="flex items-center">

              { id: 'support', name: 'Suporte', icon: '🎧', color: 'bg-purple-500' },                <div className="flex-shrink-0">

              { id: 'qualification', name: 'Qualificação', icon: '📋', color: 'bg-orange-500' },                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">

            ].map((template) => (                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">

              <div                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />

                key={template.id}                    </svg>

                className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer"                  </div>

                onClick={() => router.push(`/flows/new?template=${template.id}`)}                </div>

              >                <div className="ml-5 w-0 flex-1">

                <div className={`w-12 h-12 ${template.color} rounded-lg flex items-center justify-center text-2xl mx-auto mb-2`}>                  <dl>

                  {template.icon}                    <dt className="text-sm font-medium text-gray-500 truncate">Execuções</dt>

                </div>                    <dd className="text-lg font-medium text-gray-900">

                <div className="text-sm font-medium text-gray-900">                      {flows.reduce((acc, flow) => acc + flow.statistics.executions, 0)}

                  {template.name}                    </dd>

                </div>                  </dl>

                <div className="text-xs text-gray-500 mt-1">                </div>

                  Usar template              </div>

                </div>            </div>

              </div>          </div>

            ))}

          </div>          <div className="bg-white overflow-hidden shadow rounded-lg">

        </div>            <div className="p-5">

      </div>              <div className="flex items-center">

    </div>                <div className="flex-shrink-0">

  );                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">

}                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Taxa Sucesso</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {flows.length > 0 
                        ? Math.round((flows.reduce((acc, flow) => acc + flow.statistics.successful, 0) / 
                            Math.max(1, flows.reduce((acc, flow) => acc + flow.statistics.executions, 0))) * 100)
                        : 0}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

  // Lista de Fluxos (tail)
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {flows.length === 0 ? (
              <li className="px-6 py-8 text-center">
                <div className="text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum fluxo criado</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Comece criando seu primeiro fluxo de automação.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Criar Fluxo
                    </button>
                  </div>
                </div>
              </li>
            ) : (
              flows.map((flow) => (
                <li key={flow._id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-md flex items-center justify-center ${
                          flow.isActive ? 'bg-green-500' : 'bg-gray-500'
                        }`}>
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {flow.name}
                          </div>
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(flow.isActive)}`}>
                            {flow.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {flow.description}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          Trigger: {getTriggerText(flow.trigger)} • 
                          Execuções: {flow.statistics.executions} • 
                          Sucesso: {flow.statistics.successful}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleFlow(flow._id, flow.isActive)}
                        className={`inline-flex items-center px-3 py-1 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          flow.isActive
                            ? 'border-red-300 text-red-700 bg-white hover:bg-red-50 focus:ring-red-500'
                            : 'border-green-300 text-green-700 bg-white hover:bg-green-50 focus:ring-green-500'
                        }`}
                      >
                        {flow.isActive ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => handleDeleteFlow(flow._id)}
                        disabled={flow.isActive}
                        className="inline-flex items-center px-3 py-1 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

  // Modal Criar Fluxo (tail)
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Novo Fluxo</h3>
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
                    Nome do Fluxo *
                  </label>
                  <input
                    type="text"
                    {...register('name', { required: 'Nome é obrigatório' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Ex: Boas-vindas automáticas"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Descreva o que este fluxo faz..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trigger *
                  </label>
                  <select
                    {...register('trigger', { required: 'Trigger é obrigatório' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Selecione o trigger</option>
                    <option value="message_received">Mensagem Recebida</option>
                    <option value="contact_created">Contato Criado</option>
                    <option value="manual">Manual</option>
                    <option value="scheduled">Agendado</option>
                  </select>
                  {errors.trigger && (
                    <p className="mt-1 text-sm text-red-600">{errors.trigger.message}</p>
                  )}
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
                    Criar Fluxo
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

  // Modal Templates (tail)
      {showTemplatesModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Templates de Fluxos</h3>
                <button
                  onClick={() => setShowTemplatesModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">{template.name}</h4>
                    <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {getTriggerText(template.trigger)}
                      </span>
                      <button
                        onClick={() => handleCreateFromTemplate(template)}
                        className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Usar Template
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}*/