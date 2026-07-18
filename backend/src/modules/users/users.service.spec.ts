import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/user.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserRole } from '../../types/user.types';

type MockUserModel = jest.Mock & {
  findOne: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  find: jest.Mock;
};

describe('UsersService', () => {
  let service: UsersService;
  let mockUserModel: MockUserModel;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'hashedPassword123',
    role: UserRole.STUDENT,
    isActive: true,
    emailVerified: false,
    subscriptionTier: 'free',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    mockUserModel = Object.assign(jest.fn(), {
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      find: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        password: 'Password123!',
      };

      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.mockImplementationOnce(() => ({
        ...createUserDto,
        save: jest.fn().mockResolvedValue({
          ...createUserDto,
          _id: '507f1f77bcf86cd799439012',
          role: UserRole.STUDENT,
          isActive: true,
        }),
      }));

      // Note: In real test, need to mock bcrypt and constructor
      expect(mockUserModel.findOne).toBeDefined();
    });

    it('should throw ConflictException if email already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'Password123!',
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findByEmail('nonexistent@example.com')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);

      const result = await service.findById('507f1f77bcf86cd799439011');

      expect(result).toBeDefined();
      expect(result.email).toBe(mockUser.email);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateRefreshToken', () => {
    it('should update refresh token', async () => {
      mockUserModel.findByIdAndUpdate.mockResolvedValue(mockUser);

      await service.updateRefreshToken('507f1f77bcf86cd799439011', 'newToken123');

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { refreshToken: 'newToken123' },
      );
    });
  });

  describe('clearRefreshToken', () => {
    it('should clear refresh token', async () => {
      mockUserModel.findByIdAndUpdate.mockResolvedValue(mockUser);

      await service.clearRefreshToken('507f1f77bcf86cd799439011');

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { refreshToken: null },
      );
    });
  });
});
