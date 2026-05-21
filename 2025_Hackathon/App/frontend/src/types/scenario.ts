export interface Scenario {
  id: string;
  name: string;
  description: string;
  mediaType: 'VR' | 'web' | 'mobile';
  createdAt: Date;
  updatedAt: Date;
}

export interface ScenarioInput {
  name: string;
  description: string;
  mediaType: 'VR' | 'web' | 'mobile';
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
