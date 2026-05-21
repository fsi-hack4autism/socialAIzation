import axios from 'axios';
import type { Scenario, ScenarioInput, PaginatedResponse, ScenarioFilter, ScenarioSort } from '../types/scenario';
import config from '../config';

const api = axios.create({
  baseURL: config.api.baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const scenarioApi = {
  // Get all scenarios with pagination, filtering, and sorting
  getScenarios: async (page = 1, pageSize = 10, filter?: ScenarioFilter, sort?: ScenarioSort): Promise<PaginatedResponse<Scenario>> => {
    const params = { page, pageSize, ...filter, ...sort };
    const response = await api.get('/scenarios', { params });
    return response.data;
  },

  // Get a single scenario by ID
  getScenario: async (id: string): Promise<Scenario> => {
    const response = await api.get(`/scenarios/${id}`);
    return response.data;
  },

  // Create a new scenario
  createScenario: async (scenario: ScenarioInput): Promise<Scenario> => {
    const response = await api.post('/scenarios', scenario);
    return response.data;
  },

  // Update an existing scenario
  updateScenario: async (id: string, scenario: ScenarioInput): Promise<Scenario> => {
    const response = await api.put(`/scenarios/${id}`, scenario);
    return response.data;
  },

  // Delete a scenario
  deleteScenario: async (id: string): Promise<void> => {
    await api.delete(`/scenarios/${id}`);
  },
};
