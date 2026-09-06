import { validateEnvironment } from '../../../src/config/environment';

describe('Environment Validator', () => {
  it('should parse valid environment and provide sensible defaults', () => {
    const validEnv = {
      NODE_ENV: 'test',
      PORT: '5000',
      MONGODB_URI: 'mongodb://localhost:27017',
      JWT_SECRET: 'a_very_long_test_secret_for_validation',
    };

    const config = validateEnvironment(validEnv);
    expect(config.NODE_ENV).toBe('test');
    expect(config.PORT).toBe(5000);
    expect(config.MONGODB_URI).toBe('mongodb://localhost:27017');
    expect(config.JWT_SECRET).toBe('a_very_long_test_secret_for_validation');
    expect(config.REDIS_ENABLED).toBe(false);
  });

  it('should throw when JWT_SECRET is too short', () => {
    const invalidEnv = {
      JWT_SECRET: 'short',
    };

    expect(() => validateEnvironment(invalidEnv)).toThrow();
  });
});
