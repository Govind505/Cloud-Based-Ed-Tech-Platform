import { Controller, Get, Put, Body, UseGuards, Request, Param, Delete, Patch, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsersService } from './users.service';
import { UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { UserRole } from '../../types/user.types';

/**
 * Users Controller
 * Handles user profile and management endpoints
 */
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  /**
   * Update user avatar
   */
  @Put('profile/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update user avatar' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async updateAvatar(
    @Request() req: any,
    @UploadedFile() file: any,
  ): Promise<UserResponseDto> {
    return this.usersService.updateAvatar(req.user.id, file);
  }

  /**
   * Get current user profile
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved',
    type: UserResponseDto,
  })
  async getProfile(@Request() req: any): Promise<UserResponseDto> {
    return this.usersService.getProfile(req.user.id);
  }

  /**
   * Update user profile
   */
  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated', type: UserResponseDto })
  async updateProfile(
    @Request() req: any,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateProfile(req.user.id, updateUserDto);
  }

  /**
   * Get user by ID (admin only)
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get user by ID (admin only)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async getUserById(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findById(id);
  }

  /**
   * List all users (admin only)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all users (admin only)' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  async listUsers(
    @Query('skip') skip: number = 0,
    @Query('limit') limit: number = 10,
  ): Promise<UserResponseDto[]> {
    return this.usersService.findAll(skip, limit);
  }

  /**
   * Change user role (admin only)
   */
  @Patch(':id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Change user role (admin only)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async changeRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
  ): Promise<UserResponseDto> {
    return this.usersService.changeRole(id, role);
  }

  /**
   * Deactivate user (admin only)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Deactivate user (admin only)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async deactivateUser(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.deactivate(id);
  }
}
