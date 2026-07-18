import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { EncodingService } from './encoding.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../types/user.types';

/**
 * Encoding Controller
 * Provides encoding status endpoints (admin/internal use)
 */
@ApiTags('Encoding')
@Controller('encoding')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class EncodingController {
  constructor(private encodingService: EncodingService) {}

  /**
   * Get encodings for a video
   */
  @Get('video/:videoId')
  @ApiOperation({ summary: 'Get all encodings for a video (admin only)' })
  @ApiResponse({ status: 200, description: 'Encodings retrieved' })
  async getVideoEncodings(@Param('videoId') videoId: string) {
    return this.encodingService.findByVideoId(videoId);
  }

  /**
   * Get encoding by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get encoding by ID (admin only)' })
  @ApiResponse({ status: 200, description: 'Encoding retrieved' })
  async getEncoding(@Param('id') id: string) {
    return this.encodingService.findById(id);
  }
}
