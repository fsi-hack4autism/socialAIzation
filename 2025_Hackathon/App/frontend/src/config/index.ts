/**
 * Configuration module for the frontend application
 * Provides a centralized, type-safe way to access configuration values
 * with fail-fast behavior for missing required values
 */

// Environment determination
const nodeEnv = import.meta.env?.MODE || 'development';
const isProduction = nodeEnv === 'production';

/**
 * Gets a required environment variable or throws an error
 * @param key The environment variable key
 * @returns The environment variable value
 * @throws Error if the variable is not set
 */
function getRequiredEnv(key: string): string {
  // For Vite, use import.meta.env
  const envKey = `VITE_${key}`;
  const value = typeof import.meta.env[envKey] === 'string' ? import.meta.env[envKey] as string : undefined;
  
  if (!value) {
    throw new Error(`Environment variable ${key} is required but not provided`);
  }
  
  return value;
}

const config = {
  env: nodeEnv,
  isProduction,
  
  api: {
    // Always require API_URL in all environments - no fallbacks
    baseUrl: getRequiredEnv('API_URL'),
  },
  
  auth: {
    // Auth configuration
    tokenStorageKey: 'auth_token',
  }
};

export default config;
