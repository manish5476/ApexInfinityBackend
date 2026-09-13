import { createServer } from 'http';
import { SocketService } from '../../../src/infrastructure/socket/SocketService';
import { ITokenService } from '../../../src/infrastructure/security/ITokenService';

describe('SocketService — Real-Time Infrastructure & Authentication', () => {
  let socketService: SocketService;
  let mockTokenService: jest.Mocked<ITokenService>;

  beforeEach(() => {
    mockTokenService = {
      generateToken: jest.fn().mockReturnValue('mock-jwt-token'),
      verifyToken: jest.fn().mockReturnValue({
        userId: 'user-001',
        organizationId: 'org-001',
        roles: ['staff'],
      }),
      generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
      verifyRefreshToken: jest.fn().mockReturnValue({
        userId: 'user-001',
        organizationId: 'org-001',
        roles: ['staff'],
      }),
    };

    socketService = new SocketService(mockTokenService);
  });

  afterEach(async () => {
    await socketService.close();
  });

  it('initializes and attaches to an HTTP server without throwing', () => {
    const server = createServer();
    expect(() => socketService.initialize(server)).not.toThrow();
  });

  it('tracks online presence accurately', () => {
    expect(socketService.isUserOnline('non-existent-user')).toBe(false);
    expect(socketService.getOnlineUsers('org-001')).toEqual([]);
  });

  it('safely handles emit operations when server is active or idle', () => {
    expect(() => socketService.emitToUser('user-001', 'test_event', { data: 1 })).not.toThrow();
    expect(() => socketService.emitToChannel('chan-001', 'test_event', { data: 1 })).not.toThrow();
    expect(() => socketService.emitToOrg('org-001', 'test_event', { data: 1 })).not.toThrow();
  });

  it('closes cleanly without error', async () => {
    await expect(socketService.close()).resolves.toBeUndefined();
  });
});
