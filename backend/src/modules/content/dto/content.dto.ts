import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { VideoStatus } from '../../../types/content.types';

export class CreateVideoDto {
  @ApiProperty({ description: 'Video title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Video description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Course ID' })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({ description: 'Video duration in seconds' })
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiPropertyOptional({ description: 'Thumbnail URL' })
  @IsString()
  @IsOptional()
  thumbnail?: string;

  @ApiProperty({ description: 'Original video file URL' })
  @IsString()
  @IsNotEmpty()
  originalUrl: string;

  @ApiProperty({ description: 'File size in bytes' })
  @IsNumber()
  @Min(0)
  fileSize: number;

  @ApiPropertyOptional({ description: 'Video resolution (e.g., "1920x1080")' })
  @IsString()
  @IsOptional()
  resolution?: string;
}

export class UploadVideoDto {
  @ApiProperty({ description: 'Video title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Video description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Course ID' })
  @IsString()
  @IsNotEmpty()
  courseId: string;
}

export class UpdateVideoDto {
  @ApiPropertyOptional({ description: 'Video title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Video description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Thumbnail URL' })
  @IsString()
  @IsOptional()
  thumbnail?: string;

  @ApiPropertyOptional({ enum: VideoStatus, description: 'Video status' })
  @IsEnum(VideoStatus)
  @IsOptional()
  status?: VideoStatus;
}

export class VideoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  courseId: string;

  @ApiProperty()
  uploadedBy: string;

  @ApiProperty()
  duration: number;

  @ApiPropertyOptional()
  thumbnail?: string;

  @ApiProperty({ enum: VideoStatus })
  status: VideoStatus;

  @ApiProperty()
  originalUrl: string;

  @ApiProperty()
  fileSize: number;

  @ApiPropertyOptional()
  resolution?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class VideoListQueryDto {
  @ApiPropertyOptional({ description: 'Number of videos to skip', default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  skip?: number = 0;

  @ApiPropertyOptional({ description: 'Number of videos to return', default: 10 })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filter by course ID' })
  @IsString()
  @IsOptional()
  courseId?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ enum: VideoStatus, description: 'Filter by status' })
  @IsEnum(VideoStatus)
  @IsOptional()
  status?: VideoStatus;

  @ApiPropertyOptional({ description: 'Search query' })
  @IsString()
  @IsOptional()
  search?: string;
}
