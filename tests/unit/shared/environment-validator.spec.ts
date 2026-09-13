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

  it('should parse optional DATABASE, SMTP and Cloudinary configurations', () => {
    const richEnv = {
      NODE_ENV: 'production',
      PORT: '5000',
      DATABASE: 'mongodb://user:pass@cluster.mongodb.net/prod',
      JWT_SECRET: 'production_super_secure_secret_key_123',
      CLOUDINARY_CLOUD_NAME: 'test-cloud',
      CLOUDINARY_API_KEY: '123456',
      CLOUDINARY_API_SECRET: 'secret',
      EMAIL_HOST: 'smtp.gmail.com',
      EMAIL_PORT: '465',
      EMAIL_USERNAME: 'admin@example.com',
      EMAIL_PASSWORD: 'secretpassword',
      EMAIL_FROM_NAME: 'Apex Prod',
    };

    const config = validateEnvironment(richEnv);
    expect(config.DATABASE).toBe('mongodb://user:pass@cluster.mongodb.net/prod');
    expect(config.CLOUDINARY_CLOUD_NAME).toBe('test-cloud');
    expect(config.EMAIL_HOST).toBe('smtp.gmail.com');
    expect(config.EMAIL_PORT).toBe(465);
    expect(config.EMAIL_FROM_NAME).toBe('Apex Prod');
  });

  it('should throw when JWT_SECRET is too short', () => {
    const invalidEnv = {
      JWT_SECRET: 'short',
    };

    expect(() => validateEnvironment(invalidEnv)).toThrow();
  });
});
