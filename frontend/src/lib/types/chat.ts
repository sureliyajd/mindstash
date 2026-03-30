// SSE event types from the chat endpoint
export type ChatSSEEventType =
  | 'session_id'
  | 'text_delta'
  | 'tool_start'
  | 'tool_result'
  | 'confirmation_required'
  | 'error'
  | 'done';

// Data payloads for each SSE event
export interface SessionIdData {
  session_id: string;
}

export interface TextDeltaData {
  text: string;
}

export interface ToolStartData {
  tool: string;
  message: string;
}

export interface ToolResultData {
  tool: string;
  success: boolean;
  mutated: boolean;
}

export interface ConfirmationRequiredData {
  confirmation_id: string;
  tool: string;
  tool_input: Record<string, unknown>;
  description: string;
}

export interface ErrorData {
  message: string;
}

// Tool call status displayed in the UI
export interface ToolCallStatus {
  tool: string;
  message: string;
  status: 'running' | 'done' | 'error' | 'awaiting_confirmation';
  confirmationId?: string;
  confirmationDescription?: string;
}

// Chat message as represented in the UI
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCallStatus[];
  isStreaming?: boolean;
  isPlanLimit?: boolean;
}

// Chat session from the API
export interface ChatSession {
  id: string;
  title: string | null;
  agent_type: string;
  is_active: boolean;
  created_at: string;
  last_active_at: string;
  message_count: number;
}
