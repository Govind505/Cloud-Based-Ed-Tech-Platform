import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { UserRole } from '../../types/user.types';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = {
    id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'hashedPassword123',
    role: UserRole.STUDENT,
  };

  const mockUsersService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    verifyPassword: jest.fn(),
    updateRefreshToken: jest.fn(),
    clearRefreshToken: jest.fn(),
    updateLastLogin: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        password: 'Password123!',
      };

      mockUsersService.create.mockResolvedValue({
        id: '1',
        ...registerDto,
        role: UserRole.STUDENT,
      });

      mockJwtService.sign.mockReturnValue('token123');
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(registerDto.email);
      expect(mockUsersService.create).toHaveBeenCalledWith(registerDto);
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'Password123!',
      };

      mockUsersService.create.mockRejectedValue(
        new ConflictException('User with this email already exists'),
      );

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      mockUsersService.findByEmail.mockResolvedValue({
        ...mockUser,
        _id: mockUser.id,
      });

      mockUsersService.verifyPassword.mockResolvedValue(true);
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);
      mockJwtService.sign.mockReturnValue('token123');
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(loginDto.email);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockUsersService.verifyPassword).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      mockUsersService.findByEmail.mockResolvedValue({
        ...mockUser,
        _id: mockUser.id,
      });

      mockUsersService.verifyPassword.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException with non-existent email', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      mockUsersService.findByEmail.mockRejectedValue(
        new Error('User not found'),
      );

      await expect(service.login(loginDto)).rejects.toThrow();
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token with valid refresh token', async () => {
      const refreshToken = 'validRefreshToken';

      mockUsersService.findById.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
      });

      mockJwtService.verify.mockReturnValue({ sub: mockUser.id });
      mockJwtService.sign.mockReturnValue('newToken123');
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.refreshToken(mockUser.id, refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockJwtService.verify).toHaveBeenCalledWith(refreshToken);
    });

    it('should throw UnauthorizedException with invalid refresh token', async () => {
      const invalidRefreshToken = 'invalidToken';

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(
        service.refreshToken(mockUser.id, invalidRefreshToken),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      mockUsersService.clearRefreshToken.mockResolvedValue(undefined);

      const result = await service.logout(mockUser.id);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(mockUsersService.clearRefreshToken).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('validateUser', () => {
    it('should return user for valid token payload', async () => {
      const payload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      };

      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await service.validateUser(payload);

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findById).toHaveBeenCalledWith(mockUser.id);
    });
  });
});
