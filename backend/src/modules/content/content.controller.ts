import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ContentService } from './content.service';
import {
  CreateVideoDto,
  UpdateVideoDto,
  VideoResponseDto,
  VideoListQueryDto,
  UploadVideoDto,
} from './dto/content.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../types/user.types';

/**
 * Content Controller
 * Handles video content endpoints
 */
@ApiTags('Content')
@Controller('content')
@ApiBearerAuth()
export class ContentController {
  constructor(private contentService: ContentService) {}

  /**
   * Upload Video File
   */
  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        title: { type: 'string' },
        description: { type: 'string' },
        courseId: { type: 'string' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload a new video file (Admin only)' })
  @ApiResponse({ status: 201, type: VideoResponseDto })
  async uploadVideo(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: any,
    @Body() uploadVideoDto: UploadVideoDto,
  ): Promise<VideoResponseDto> {
    return this.contentService.upload(userId, file, uploadVideoDto);
  }

  /**
   * Upload/Create Video
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new video' })
  @ApiResponse({
    status: 201,
    description: 'Video created successfully',
    type: VideoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() createVideoDto: CreateVideoDto,
  ): Promise<VideoResponseDto> {
    return this.contentService.create(userId, createVideoDto);
  }

  /**
   * Get Video by ID
   */
  @Public()
  @Get('trending/list')
  @ApiOperation({ summary: 'Get trending videos' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Trending videos retrieved',
    type: [VideoResponseDto],
  })
  async getTrending(@Query('limit') limit?: number): Promise<VideoResponseDto[]> {
    return this.contentService.getTrending(limit ? parseInt(limit.toString()) : 10);
  }

  /**
   * Get User's Videos
   */
  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get user's videos" })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: "User's videos retrieved",
    type: [VideoResponseDto],
  })
  async getUserVideos(
    @Param('userId') userId: string,
    @Query('skip') skip?: number,
    @Query('limit') limit?: number,
  ): Promise<VideoResponseDto[]> {
    return this.contentService.getUserVideos(
      userId,
      skip ? parseInt(skip.toString()) : 0,
      limit ? parseInt(limit.toString()) : 10,
    );
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get video by ID' })
  @ApiResponse({
    status: 200,
    description: 'Video retrieved successfully',
    type: VideoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Video not found' })
  async findById(@Param('id') id: string): Promise<VideoResponseDto> {
    return this.contentService.findById(id);
  }

  /**
   * Update Video (Owner Only)
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update video metadata (owner only)' })
  @ApiResponse({
    status: 200,
    description: 'Video updated successfully',
    type: VideoResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not the owner' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateVideoDto: UpdateVideoDto,
  ): Promise<VideoResponseDto> {
    return this.contentService.update(id, userId, updateVideoDto);
  }

  /**
   * Delete Video (Owner Only)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete video (owner only)' })
  @ApiResponse({ status: 200, description: 'Video deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the owner' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ message: string }> {
    return this.contentService.delete(id, userId);
  }

  /**
   * List Videos
   */
  @Get()
  @Public()
  @ApiOperation({ summary: 'List videos with filters and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Videos retrieved successfully',
    type: [VideoResponseDto],
  })
  async findAll(@Query() query: VideoListQueryDto): Promise<VideoResponseDto[]> {
    return this.contentService.findAll(query);
  }

}
