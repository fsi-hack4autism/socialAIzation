import { ScenarioManagementService } from '../../services/scenarioManagement.service';
import { setupTestDB } from '../helpers/db';
import { Scenario } from '../../types';
import { Collection, Document } from 'mongodb';
import { IDatabaseService } from '../../services/database.service';
import { ILoggerService } from '../../services/logger.service';
import { IConfig, Environment } from '../../di/config';

// Mock dependencies
class MockDatabaseService implements IDatabaseService {
  private collections: Map<string, Collection<Document>> = new Map();
  
  constructor() {
    // The setupTestDB function will handle the actual MongoDB connection
  }
  
  async init(): Promise<boolean> {
    return true;
  }
  
  getCollection(collectionName: string): Collection<Document> {
    if (!this.collections.has(collectionName)) {
      // Cast to Collection<Document> to satisfy TypeScript
      this.collections.set(collectionName, global.mongoose.connection.collection(collectionName) as unknown as Collection<Document>);
    }
    return this.collections.get(collectionName)!;
  }
  
  getDatabase(): any {
    return global.mongoose.connection.db;
  }
  
  async close(): Promise<void> {
    // The setupTestDB function will handle closing the connection
  }
}

class MockLoggerService implements ILoggerService {
  info(message: string, ...args: any[]): void {}
  warn(message: string, ...args: any[]): void {}
  error(message: string, ...args: any[]): void {}
  debug(message: string, ...args: any[]): void {}
}

class MockConfig implements IConfig {
  env: Environment = 'test' as Environment;
  isProduction = false;
  server = {
    port: 3001,
    cors: {
      origin: 'http://localhost:3001',
      credentials: true
    }
  };
  mongodb = {
    connectionString: 'mongodb://localhost:27017',
    databaseName: 'test-db',
    userCollection: 'users',
    scenarioCollection: 'scenarios',
    sessionCollection: 'sessions',
    interactionCollection: 'interactions'
  };
  auth = {
    jwtSecret: 'test-secret',
    tokenExpiry: '1d',
    azureAd: {
      clientId: '',
      tenantId: '',
      clientSecret: '',
      redirectUri: ''
    }
  };
  secrets = {
    provider: 'env' as const,
    vault: {
      address: '',
      token: '',
      secretsPath: ''
    },
    azure: {
      name: '',
      clientId: '',
      clientSecret: '',
      tenantId: ''
    }
  };
}

// Add mongoose to global for TypeScript
declare global {
  var mongoose: typeof import('mongoose');
}
global.mongoose = require('mongoose');

describe('ScenarioManagementService', () => {
  setupTestDB();
  
  let scenarioService: ScenarioManagementService;
  let mockDatabaseService: MockDatabaseService;
  let mockLoggerService: MockLoggerService;
  let mockConfig: MockConfig;

  beforeEach(() => {
    mockDatabaseService = new MockDatabaseService();
    mockLoggerService = new MockLoggerService();
    mockConfig = new MockConfig();
    
    scenarioService = new ScenarioManagementService(
      mockDatabaseService,
      mockLoggerService,
      mockConfig
    );
    
    // Initialize the service
    scenarioService.initialize();
  });

  describe('registerScenario', () => {
    it('should create a new scenario', async () => {
      const scenarioData = {
        name: 'Virtual Meeting',
        description: 'A virtual meeting room for remote teams',
        mediaType: 'VR' as const
      };

      const scenario = await scenarioService.registerScenario(scenarioData);

      expect(scenario).toMatchObject({
        ...scenarioData,
        id: expect.any(String)
      });
      expect(scenario.createdAt).toBeDefined();
      expect(scenario.updatedAt).toBeDefined();
    });
  });

  describe('getScenario', () => {
    it('should return null for non-existent scenario', async () => {
      const scenario = await scenarioService.getScenario('non-existent-id');
      expect(scenario).toBeNull();
    });

    it('should return scenario by id', async () => {
      const scenarioData = {
        name: 'Virtual Meeting',
        description: 'A virtual meeting room for remote teams',
        mediaType: 'VR' as const
      };

      const created = await scenarioService.registerScenario(scenarioData);
      const retrieved = await scenarioService.getScenario(created.id);

      expect(retrieved).toMatchObject(created);
    });
  });

  describe('listScenarios', () => {
    let scenarios: Scenario[];

    beforeEach(async () => {
      // Create test scenarios
      const testData = [
        {
          name: 'Virtual Meeting',
          description: 'A virtual meeting room',
          mediaType: 'VR' as const
        },
        {
          name: 'Web Conference',
          description: 'A web conference room',
          mediaType: 'web' as const
        },
        {
          name: 'Mobile Chat',
          description: 'A mobile chat application',
          mediaType: 'mobile' as const
        }
      ];

      scenarios = await Promise.all(
        testData.map(data => scenarioService.registerScenario(data))
      );
    });

    it('should return paginated results', async () => {
      const result = await scenarioService.listScenarios(undefined, undefined, 1, 2);
      
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(2);
      expect(result.totalPages).toBe(2);
    });

    it('should filter by mediaType', async () => {
      const result = await scenarioService.listScenarios({ mediaType: 'VR' });
      
      expect(result.items).toHaveLength(1);
      expect(result.items[0].mediaType).toBe('VR');
    });

    it('should search by name and description', async () => {
      const result = await scenarioService.listScenarios({ search: 'conference' });
      
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Web Conference');
    });

    it('should sort results', async () => {
      const result = await scenarioService.listScenarios(
        undefined,
        { field: 'name', direction: 'asc' }
      );
      
      expect(result.items.map(s => s.name)).toEqual([
        'Mobile Chat',
        'Virtual Meeting',
        'Web Conference'
      ]);
    });

    it('should combine filter, sort, and pagination', async () => {
      const result = await scenarioService.listScenarios(
        { mediaType: 'web' },
        { field: 'name', direction: 'desc' },
        1,
        1
      );
      
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0].name).toBe('Web Conference');
    });
  });
});