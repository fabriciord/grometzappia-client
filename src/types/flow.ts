import { Node, Edge } from 'reactflow';

// Flow Node Types
export type FlowNodeType = 
  | 'trigger' 
  | 'condition' 
  | 'action' 
  | 'delay' 
  | 'webhook' 
  | 'ai_response' 
  | 'human_takeover' 
  | 'save_data' 
  | 'send_media';

// Trigger Types
export type TriggerType = 
  | 'new_message' 
  | 'keyword' 
  | 'button_click' 
  | 'media_received' 
  | 'first_contact' 
  | 'schedule';

// Action Types
export type ActionType = 
  | 'send_text' 
  | 'send_media' 
  | 'add_tag' 
  | 'remove_tag' 
  | 'save_field' 
  | 'webhook_call';

// Condition Operators
export type ConditionOperator = 
  | '==' | '!=' | '>' | '<' | '>=' | '<=' 
  | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' 
  | 'regex' | 'is_empty' | 'is_not_empty';

// Flow Node Data
export interface FlowNodeData {
  label: string;
  description?: string;
  backgroundColor?: string;
  textColor?: string;
  icon?: string;
  
  // Trigger node data
  trigger?: TriggerType;
  keywords?: string[];
  
  // Condition node data
  condition?: {
    field: string;
    operator: ConditionOperator;
    value: string;
    logicalOperator?: 'and' | 'or';
  };
  conditions?: Array<{
    field: string;
    operator: ConditionOperator;
    value: string;
  }>;
  
  // Action node data
  action?: {
    type: ActionType;
  };
  message?: string;
  mediaUrl?: string;
  mediaType?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  webhookUrl?: string;
  webhookMethod?: string;
  
  // Delay node data
  delay?: {
    duration: number;
    unit: 'seconds' | 'minutes' | 'hours' | 'days';
  };
  
  // AI response node data
  aiPrompt?: string;
  aiModel?: string;
  temperature?: number;
}

// Flow Node (extends ReactFlow Node)
export interface FlowNode extends Node {
  type: FlowNodeType;
  data: FlowNodeData;
}

// Flow Edge Data
export interface FlowEdgeData {
  condition?: string;
  priority?: number;
  label?: string;
}

// Flow Edge (extends ReactFlow Edge)
export interface FlowEdge extends Omit<Edge, 'data'> {
  data?: FlowEdgeData;
}

// Flow Settings
export interface FlowSettings {
  triggerType: TriggerType;
  triggerKeywords: string[];
  priority: number;
  maxExecutions?: number;
  cooldownMinutes?: number;
  allowReentry: boolean;
}

// Flow Statistics
export interface FlowStatistics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgExecutionTime: number;
  conversionRate: number;
  lastExecution?: string;
  nodeStats: Array<{
    nodeId: string;
    executionCount: number;
    successCount: number;
    avgExecutionTime: number;
  }>;
}

// Flow Execution Log
export interface FlowExecutionLog {
  contactPhone: string;
  nodeId: string;
  nodeType: FlowNodeType;
  executedAt: string;
  data: any;
  success: boolean;
  error?: string;
  executionTime: number;
}

// Complete Flow
export interface Flow {
  _id: string;
  name: string;
  description?: string;
  userId: string;
  whatsappConnectionId?: string;
  isActive: boolean;
  isTemplate: boolean;
  templateCategory?: 'welcome' | 'sales' | 'support' | 'lead_qualification' | 'appointment' | 'ecommerce' | 'custom';
  
  nodes: FlowNode[];
  edges: FlowEdge[];
  settings: FlowSettings;
  statistics: FlowStatistics;
  executionLogs: FlowExecutionLog[];
  
  tags: string[];
  version: number;
  lastModified: string;
  createdAt: string;
  updatedAt: string;
}

// Flow Template
export interface FlowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  defaultSettings: Partial<FlowSettings>;
  tags: string[];
  complexity: 'basic' | 'intermediate' | 'advanced';
  estimatedSetupTime: number; // em minutos
}

// Node Templates for drag & drop
export interface NodeTemplate {
  type: FlowNodeType;
  label: string;
  description: string;
  icon: string;
  color: string;
  category: 'triggers' | 'conditions' | 'actions' | 'integrations' | 'advanced';
  defaultData: Partial<FlowNodeData>;
  configurable: boolean;
}

// Flow Validation Result
export interface FlowValidationResult {
  isValid: boolean;
  errors: Array<{
    nodeId?: string;
    edgeId?: string;
    type: 'error' | 'warning';
    message: string;
    suggestion?: string;
  }>;
  warnings: Array<{
    nodeId?: string;
    edgeId?: string;
    message: string;
    suggestion?: string;
  }>;
}

// Flow Execution Result
export interface FlowExecutionResult {
  success: boolean;
  flowId: string;
  contactPhone: string;
  startTime: number;
  endTime?: number;
  totalTime?: number;
  nodes: Array<{
    nodeId: string;
    type: FlowNodeType;
    startTime: number;
    endTime?: number;
    executionTime?: number;
    success: boolean;
    data?: any;
    error?: string;
  }>;
  error?: string;
}

// Flow Builder Context
export interface FlowBuilderContext {
  flow: Flow;
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNode: FlowNode | null;
  selectedEdge: FlowEdge | null;
  isEditing: boolean;
  isDirty: boolean;
  validationResult: FlowValidationResult | null;
}

// Flow Builder Actions
export type FlowBuilderAction = 
  | { type: 'SET_FLOW'; payload: Flow }
  | { type: 'ADD_NODE'; payload: FlowNode }
  | { type: 'UPDATE_NODE'; payload: { id: string; data: Partial<FlowNodeData> } }
  | { type: 'DELETE_NODE'; payload: string }
  | { type: 'ADD_EDGE'; payload: FlowEdge }
  | { type: 'UPDATE_EDGE'; payload: { id: string; data: Partial<FlowEdgeData> } }
  | { type: 'DELETE_EDGE'; payload: string }
  | { type: 'SELECT_NODE'; payload: FlowNode | null }
  | { type: 'SELECT_EDGE'; payload: FlowEdge | null }
  | { type: 'SET_EDITING'; payload: boolean }
  | { type: 'SET_DIRTY'; payload: boolean }
  | { type: 'SET_VALIDATION'; payload: FlowValidationResult | null }
  | { type: 'RESET_FLOW' };

// Flow API Responses
export interface FlowListResponse {
  success: boolean;
  flows: Flow[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

export interface FlowResponse {
  success: boolean;
  flow: Flow;
}

export interface FlowTemplateResponse {
  success: boolean;
  templates: FlowTemplate[];
}

export interface FlowExecutionResponse {
  success: boolean;
  executionId: string;
  result: FlowExecutionResult;
}

export interface FlowValidationResponse {
  success: boolean;
  validation: FlowValidationResult;
}