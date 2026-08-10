import { Injectable, ConflictException, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User } from './schemas/user.schema';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { UserRole } from '../../types/user.types';
import { S3Service } from '../../common/services/s3.service';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

/**
 * Users Service
 * Handles user CRUD operations and profile management
 */
@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private s3Service: S3Service,
  ) {}

  async onModuleInit() {
    try {
      const count = await this.userModel.countDocuments();
      if (count === 0) {
        console.log('No users found in database. Auto-seeding default student, instructor, and admin accounts...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        await this.userModel.insertMany([
          {
            email: 'student@cloudedtech.com',
            firstName: 'Sarah',
            lastName: 'Chen',
            password: hashedPassword,
            role: UserRole.STUDENT,
            isActive: true,
            emailVerified: true,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
            bio: 'Aspiring Frontend Developer',
            subscriptionTier: 'free',
          },
          {
            email: 'instructor@cloudedtech.com',
            firstName: 'Marcus',
            lastName: 'Aurelius',
            password: hashedPassword,
            role: UserRole.INSTRUCTOR,
            isActive: true,
            emailVerified: true,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
            bio: 'Senior Technical Instructor & Author',
            subscriptionTier: 'premium',
          },
          {
            email: 'admin@cloudedtech.com',
            firstName: 'Alex',
            lastName: 'Rivera',
            password: hashedPassword,
            role: UserRole.ADMIN,
            isActive: true,
            emailVerified: true,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
            bio: 'Senior Infrastructure Engineer',
            subscriptionTier: 'premium',
          },
        ]);
        console.log('✓ Default accounts auto-seeded successfully!');
      }
    } catch (err) {
      console.error('Error auto-seeding default users on init:', err);
    }
  }

  /**
   * Update user avatar
   */
  async updateAvatar(userId: string, file: any): Promise<UserResponseDto> {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    let avatarUrl: string;

    try {
      avatarUrl = await this.s3Service.uploadFile(
        file.buffer,
        fileName,
        file.mimetype,
        'avatars',
      );
    } catch (error) {
      // For local dev fallback if S3 fails
      avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
    }

    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toResponseDto(user);
  }

  /**
   * Create a new user
   * Hashes password before storing
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Check if user exists
    const existingUser = await this.userModel.findOne({ email: createUserDto.email });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    // Create user with dummy enrolled courses
    const dummyCourses = [
      { courseId: 'react-basics', title: 'React Basics', progress: 0, image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800' },
      { courseId: 'python-beginners', title: 'Python for Beginners', progress: 0, image: 'https://images.unsplash.com/photo-1649180556628-9ba704115795?w=800' }
    ];

    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role || UserRole.STUDENT,
      enrolledCourses: dummyCourses
    });

    const savedUser = await user.save();
    return this.toResponseDto(savedUser);
  }

  /**
   * Find user by email (with password for auth)
   */
  async findByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toResponseDto(user);
  }

  /**
   * Get user profile (for authenticated user)
   */
  async getProfile(userId: string): Promise<UserResponseDto> {
    return this.findById(userId);
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.userModel.findByIdAndUpdate(userId, updateUserDto, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toResponseDto(user);
  }

  /**
   * Verify password
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Update refresh token
   */
  async updateRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { refreshToken });
  }

  /**
   * Clear refresh token
   */
  async clearRefreshToken(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { refreshToken: null });
  }

  /**
   * Update last login
   */
  async updateLastLogin(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { lastLogin: new Date() });
  }

  /**
   * List all users (admin only)
   */
  async findAll(skip = 0, limit = 10): Promise<UserResponseDto[]> {
    const users = await this.userModel.find().skip(skip).limit(limit);
    return users.map((user) => this.toResponseDto(user));
  }

  /**
   * Deactivate user (admin)
   */
  async deactivate(userId: string): Promise<UserResponseDto> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toResponseDto(user);
  }

  /**
   * Change user role (admin)
   */
  async changeRole(userId: string, newRole: UserRole): Promise<UserResponseDto> {
    const user = await this.userModel.findByIdAndUpdate(userId, { role: newRole }, { new: true });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toResponseDto(user);
  }

  /**
   * Convert Mongoose document to response DTO
   */
  private toResponseDto(user: User): UserResponseDto {
    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      avatar: user.avatar,
      bio: user.bio,
      subscriptionTier: user.subscriptionTier,
      enrolledCourses: user.enrolledCourses,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
