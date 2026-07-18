import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthResponse = {
    accessToken: 'access123',
    refreshToken: 'refresh123',
    user: {
      id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'student',
    },
  };

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a user', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        password: 'Password123!',
      };

      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(mockAuthResponse);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockAuthResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('logout', () => {
    it('should successfully logout a user', async () => {
      const mockUser = { id: '507f1f77bcf86cd799439011' };
      const logoutResponse = { message: 'Logged out successfully' };

      mockAuthService.logout.mockResolvedValue(logoutResponse);

      const result = await controller.logout(mockUser);

      expect(result).toEqual(logoutResponse);
      expect(mockAuthService.logout).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user info', async () => {
      const mockUser = {
        id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'student',
      };

      const result = await controller.getCurrentUser(mockUser);

      expect(result).toEqual(mockUser);
    });
  });
});
