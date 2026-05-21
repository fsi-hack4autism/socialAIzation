import { injectable, inject } from 'inversify';
import TYPES from '../di/types';
import { Environment, IConfig } from '../di/config';

export interface ILoggerService {
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
}

@injectable()
export class LoggerService implements ILoggerService {
  private readonly environment: Environment;

  constructor(@inject(TYPES.Config) private config: IConfig) {
    this.environment = config.env;
  }

  info(message: string, ...args: any[]): void {
    console.log(`[INFO] ${message}`, ...args);
  }
  
  warn(message: string, ...args: any[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }
  
  error(message: string, ...args: any[]): void {
    console.error(`[ERROR] ${message}`, ...args);
  }
  
  debug(message: string, ...args: any[]): void {
    if (this.environment !== 'production') {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
}
