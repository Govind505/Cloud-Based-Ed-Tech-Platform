import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum StreamingQuality {
  Q240P = '240p',
  Q360P = '360p',
  Q480P = '480p',
  Q720P = '720p',
}

export class StartSessionDto {
  @ApiProperty({ description: 'Video ID' })
  @IsString()
  @IsNotEmpty()
  videoId: string;

  @ApiProperty({ enum: StreamingQuality, description: 'Initial quality' })
  @IsEnum(StreamingQuality)
  quality: StreamingQuality;
}

export class SessionEventDto {
  @ApiProperty({ description: 'Session ID' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiPropertyOptional({ description: 'Current quality' })
  @IsEnum(StreamingQuality)
  @IsOptional()
  quality?: StreamingQuality;

  @ApiPropertyOptional({ description: 'Bandwidth in kbps' })
  @IsOptional()
  bandwidth?: number;
}

export class StreamingSessionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  videoId: string;

  @ApiProperty()
  quality: string;

  @ApiProperty()
  startedAt: Date;

  @ApiPropertyOptional()
  endedAt?: Date;
}
