import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { AuthResponseDto } from './dto/auth.dto';
import { ITokenPayload, UserRole } from '../../types/user.types';

/**
 * Auth Service
 * Handles authentication logic (registration, login, token refresh)
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly ACCESS_TOKEN_EXPIRATION = process.env.JWT_EXPIRATION || '7d';
  private readonly REFRESH_TOKEN_EXPIRATION = process.env.REFRESH_TOKEN_EXPIRATION || '30d';

  constructor(private usersService: UsersService, private jwtService: JwtService) {}

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    this.logger.debug(`Registering new user: ${registerDto.email}`);

    // Create user
    const user = await this.usersService.create(registerDto);

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email, user.role);

    // Store refresh token
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    this.logger.log(`User registered successfully: ${registerDto.email}`);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   * Login user
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    this.logger.debug(`Login attempt for: ${loginDto.email}`);

    // Find user
    const user = await this.usersService.findByEmail(loginDto.email);

    // Verify password
    const isPasswordValid = await this.usersService.verifyPassword(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for user: ${loginDto.email}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    await this.usersService.updateLastLogin(user._id.toString());

    // Generate tokens
    const tokens = this.generateTokens(user._id.toString(), user.email, user.role);

    // Store refresh token
    await this.usersService.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    this.logger.log(`User logged in successfully: ${loginDto.email}`);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(userId: string, refreshToken: string): Promise<AuthResponseDto> {
    this.logger.debug(`Token refresh for user: ${userId}`);

    // Get user
    const user = await this.usersService.findById(userId);

    // Verify refresh token (validate with stored token would be ideal)
    try {
      const payload = this.jwtService.verify(refreshToken);
      if (payload.sub !== userId) {
        throw new UnauthorizedException('Invalid refresh token');
      }
    } catch (error) {
      this.logger.warn(`Invalid refresh token for user: ${userId}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Generate new tokens
    const tokens = this.generateTokens(user.id, user.email, user.role);

    // Store new refresh token
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    this.logger.log(`Token refreshed for user: ${userId}`);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   * Logout user (clear refresh token)
   */
  async logout(userId: string): Promise<{ message: string }> {
    this.logger.debug(`Logout for user: ${userId}`);
    await this.usersService.clearRefreshToken(userId);
    this.logger.log(`User logged out: ${userId}`);
    return { message: 'Logged out successfully' };
  }

  /**
   * Validate JWT payload
   * Called by JWT strategy
   */
  async validateUser(payload: ITokenPayload) {
    this.logger.debug(`Validating user: ${payload.sub}`);
    return await this.usersService.findById(payload.sub);
  }

  /**
   * Google OAuth Login
   * Finds existing user by email or creates a new one from Google profile,
   * then returns the same AuthResponseDto as regular login.
   */
  async googleLogin(googleUser: {
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    googleId: string;
  }): Promise<AuthResponseDto> {
    this.logger.debug(`Google login attempt for: ${googleUser.email}`);

    let user: any;

    try {
      // Try to find existing user by email
      const existingUser = await this.usersService.findByEmail(googleUser.email);
      user = existingUser;
      this.logger.debug(`Existing user found for Google login: ${googleUser.email}`);
    } catch {
      // User not found — create a new one
      this.logger.debug(`Creating new user from Google profile: ${googleUser.email}`);
      const randomPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
      const newUser = await this.usersService.create({
        email: googleUser.email,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        password: randomPassword,
        role: UserRole.STUDENT,
      } as RegisterDto);

      // Fetch the full user object (findByEmail returns with password field)
      user = await this.usersService.findByEmail(googleUser.email);
    }

    const userId = user._id?.toString() || user.id;
    await this.usersService.updateLastLogin(userId);

    const tokens = this.generateTokens(userId, user.email, user.role);
    await this.usersService.updateRefreshToken(userId, tokens.refreshToken);

    this.logger.log(`Google login successful: ${googleUser.email}`);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   * Validate a raw JWT token (used for refresh token endpoint)
   */
  async validateToken(token: string): Promise<ITokenPayload> {
    try {
      return this.jwtService.verify<ITokenPayload>(token);
    } catch (error) {
      this.logger.warn('Invalid token provided to validateToken');
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Generate JWT tokens (access + refresh)
   */
  private generateTokens(
    userId: string,
    email: string,
    role: import('../../types/user.types').UserRole,
  ): { accessToken: string; refreshToken: string } {
    const payload: ITokenPayload = {
      sub: userId,
      email,
      role,
      iat: Math.floor(Date.now() / 1000),
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRATION as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.REFRESH_TOKEN_EXPIRATION as any,
    });

    this.logger.debug(`Tokens generated for user: ${userId}`);

    return { accessToken, refreshToken };
  }
}
