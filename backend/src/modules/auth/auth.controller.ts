import { Controller, Post, Get, Body, UseGuards, Request, HttpCode, HttpStatus, Redirect, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, AuthResponseDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

import { GoogleOAuthGuard } from '../../common/guards/google-oauth.guard';

/**
 * Auth Controller
 * Handles authentication endpoints (register, login, refresh, logout)
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * User Registration
   * Creates a new user account
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  /**
   * User Login
   * Authenticates user and returns tokens
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid email or password',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  /**
   * Refresh Access Token
   * Generates new access token using refresh token
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Request() req: any,
  ): Promise<AuthResponseDto> {
    const payload = await this.authService.validateToken(refreshTokenDto.refreshToken);
    return this.authService.refreshToken(payload.sub, refreshTokenDto.refreshToken);
  }

  /**
   * Logout
   * Invalidates refresh token
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
  })
  async logout(@CurrentUser() user: any): Promise<{ message: string }> {
    return this.authService.logout(user.id);
  }

  /**
   * Get Current User
   * Returns authenticated user info
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({
    status: 200,
    description: 'Current user info',
  })
  async getCurrentUser(@CurrentUser() user: any) {
    return user;
  }

  /**
   * Google OAuth - Redirect to Google consent screen
   */
  @Public()
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth(@Request() req: any, @Res() res: Response) {
    if (req.isMockGoogle) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
      const mockUser = {
        email: 'google.tester@cloudedtech.com',
        firstName: 'Google',
        lastName: 'Tester',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Google',
        googleId: 'mock-google-id-12345',
      };
      const authResponse = await this.authService.googleLogin(mockUser);
      const params = new URLSearchParams({
        token: authResponse.accessToken,
        refresh: authResponse.refreshToken,
        user: JSON.stringify(authResponse.user),
      });
      return res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
    }
    // Passport redirects automatically if Client ID is configured
  }

  /**
   * Google OAuth - Handle callback from Google
   * Issues JWT tokens and redirects to frontend
   */
  @Public()
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback handler' })
  async googleAuthCallback(@Request() req: any, @Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    try {
      const authResponse = await this.authService.googleLogin(req.user);
      const params = new URLSearchParams({
        token: authResponse.accessToken,
        refresh: authResponse.refreshToken,
        user: JSON.stringify(authResponse.user),
      });
      return res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
    } catch (error: any) {
      return res.redirect(`${frontendUrl}/auth?error=${encodeURIComponent(error.message || 'Google login failed')}`);
    }
  }
}
