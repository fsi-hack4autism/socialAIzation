import { Container } from 'inversify';
import 'reflect-metadata';

// Create and export the DI container
const container = new Container({
  defaultScope: 'Singleton',
  autoBindInjectable: true
});

export default container;
