export interface AiUserContext {
  organizationId: string;
  branchId?: string;
  userId?: string;
}

export interface AiToolResult {
  toolName: string;
  success: boolean;
  data: Record<string, unknown> | Array<Record<string, unknown>>;
  summary: string;
}

export interface AiAgentReply {
  reply: string;
  toolsUsed?: string[];
  data?: unknown;
  timestamp: string;
}
