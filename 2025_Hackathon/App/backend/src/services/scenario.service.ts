import { v4 as uuidv4 } from 'uuid';
import { injectable, inject } from 'inversify';
import TYPES from '../di/types';
import { IDatabaseService } from './database.service';
import { ILoggerService } from './logger.service';
import { Scenario, PaginatedResponse, ScenarioFilter, ScenarioSort } from '../types';
import { Collection } from 'mongodb';
import { IConfig } from '../di/config';

@injectable()
export class ScenarioService {
  private scenarioCollection: Collection;

  constructor(
    @inject(TYPES.DatabaseService) private databaseService: IDatabaseService,
    @inject(TYPES.LoggerService) private logger: ILoggerService,
    @inject(TYPES.Config) private config: IConfig
  ) {
    // The collection will be initialized when the database service is initialized
  }

  // Initialize collection after database is ready
  public initialize(): void {
    this.scenarioCollection = this.databaseService.getCollection(this.config.mongodb.scenarioCollection);
    this.logger.info('ScenarioService initialized');
  }

  async registerScenario(data: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<Scenario> {
    const id = uuidv4();
    const now = new Date();
    
    const scenarioData = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now
    };
    
    await this.scenarioCollection.insertOne(scenarioData);
    this.logger.info(`Scenario registered with ID: ${id}`);

    return scenarioData;
  }

  async getScenario(id: string): Promise<Scenario | null> {
    const scenario = await this.scenarioCollection.findOne({ id });
    
    if (!scenario) {
      this.logger.debug(`Scenario not found with ID: ${id}`);
      return null;
    }

    return this.mapScenario(scenario);
  }

  async listScenarios(
    filter?: ScenarioFilter,
    sort?: ScenarioSort,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<Scenario>> {
    // Build filter query
    const query: any = {};
    if (filter?.mediaType) {
      query.mediaType = filter.mediaType;
    }
    if (filter?.search) {
      query.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { description: { $regex: filter.search, $options: 'i' } }
      ];
    }

    // Build sort query
    const sortQuery: any = {};
    if (sort) {
      sortQuery[sort.field] = sort.direction === 'asc' ? 1 : -1;
    } else {
      // Default sort by createdAt desc
      sortQuery.createdAt = -1;
    }

    // Calculate pagination
    const skip = (page - 1) * pageSize;
    const limit = pageSize;

    // Execute queries
    const [scenarios, total] = await Promise.all([
      this.scenarioCollection.find(query)
//        .sort(sortQuery) // commenting out for Azure CosmosDB for Mongo doesn't work by default
        .skip(skip)
        .limit(limit)
        .toArray(),
      this.scenarioCollection.countDocuments(query)
    ]);

    return {
      items: scenarios.map(this.mapScenario),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  private mapScenario(scenario: any): Scenario {
    return {
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      mediaType: scenario.mediaType,
      createdAt: scenario.createdAt,
      updatedAt: scenario.updatedAt
    };
  }
}
