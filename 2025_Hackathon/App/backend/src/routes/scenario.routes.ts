import { Router, Request, Response } from 'express';
import { z } from 'zod';
import container from '../di/container';
import TYPES from '../di/types';
import { ScenarioService } from '../services/scenario.service';
import { ScenarioFilter, ScenarioSort } from '../types';
import { ILoggerService } from '../services/logger.service';
import { 
  asyncErrorHandler, 
  validateBody, 
  validateQuery,
  validateParams
} from '../middleware/error.middleware';
import { NotFoundError } from '../utils/errors';

// Create router
const router = Router();

// Define validation schemas
const createScenarioSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  mediaType: z.enum(['VR', 'web', 'mobile'])
});

const listScenariosQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  pageSize: z.string().regex(/^\d+$/).transform(Number).optional(),
  mediaType: z.enum(['VR', 'web', 'mobile']).optional(),
  search: z.string().optional(),
  sortField: z.enum(['name', 'createdAt', 'mediaType']).optional(),
  sortDirection: z.enum(['asc', 'desc']).optional()
});

const scenarioParamsSchema = z.object({
  id: z.string()
});

// Create scenario route
router.post(
  '/scenarios', 
  validateBody(createScenarioSchema),
  asyncErrorHandler(async (req: Request, res: Response) => {
    const scenarioService = container.get<ScenarioService>(TYPES.ScenarioService);
    const logger = container.get<ILoggerService>(TYPES.LoggerService);
    
    // Use the validated body instead of req.body
    const validatedData = (req as any).validatedBody;
    
    const scenario = await scenarioService.registerScenario(validatedData);
    logger.info(`Created new scenario: ${scenario.id}`);
    res.status(201).json(scenario);
  })
);

// List scenarios route
router.get(
  '/scenarios', 
  validateQuery(listScenariosQuerySchema),
  asyncErrorHandler(async (req: Request, res: Response) => {
    const scenarioService = container.get<ScenarioService>(TYPES.ScenarioService);
    const logger = container.get<ILoggerService>(TYPES.LoggerService);
    
    // Use the validated query instead of req.query
    const query = (req as any).validatedQuery;
    
    const filter: ScenarioFilter = {
      mediaType: query.mediaType as 'VR' | 'web' | 'mobile' | undefined,
      search: query.search as string | undefined
    };

    const sort: ScenarioSort | undefined = query.sortField ? {
      field: query.sortField as 'name' | 'createdAt' | 'mediaType',
      direction: (query.sortDirection as 'asc' | 'desc') || 'asc'
    } : undefined;

    logger.debug(`Listing scenarios with filter: ${JSON.stringify(filter)}, sort: ${JSON.stringify(sort)}`);
    
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;
    
    const scenarios = await scenarioService.listScenarios(
      filter,
      sort,
      page,
      pageSize
    );

    res.json(scenarios);
  })
);

// Get scenario by ID route
router.get(
  '/scenarios/:id', 
  validateParams(scenarioParamsSchema),
  asyncErrorHandler(async (req: Request, res: Response) => {
    const scenarioService = container.get<ScenarioService>(TYPES.ScenarioService);
    const logger = container.get<ILoggerService>(TYPES.LoggerService);
    
    // Use the validated params instead of req.params
    const params = (req as any).validatedParams;
    const id = params.id;
    
    logger.debug(`Fetching scenario with ID: ${id}`);
    
    const scenario = await scenarioService.getScenario(id);
    if (!scenario) {
      throw new NotFoundError(`Scenario with ID ${id} not found`);
    }
    
    res.json(scenario);
  })
);

export const scenarioRoutes = router;
