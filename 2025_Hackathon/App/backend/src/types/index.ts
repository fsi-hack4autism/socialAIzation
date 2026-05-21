export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  mediaType: 'VR' | 'web' | 'mobile';
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  scenarioId: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Interaction {
  id: string;
  sessionId: string;
  actor: 'user' | 'system' | 'npc';
  content: {
    type: 'text' | 'image' | 'audio' | 'video';
    data: string;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ScenarioFilter {
  mediaType?: 'VR' | 'web' | 'mobile';
  search?: string;
}

export interface ScenarioSort {
  field: 'name' | 'createdAt' | 'mediaType';
  direction: 'asc' | 'desc';
}

