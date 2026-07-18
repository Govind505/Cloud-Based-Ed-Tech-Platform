import { Injectable, Logger } from '@nestjs/common';

/**
 * Quality Selector Service
 * Determines optimal streaming quality based on bandwidth
 */
@Injectable()
export class QualitySelectorService {
  private readonly logger = new Logger(QualitySelectorService.name);

  /**
   * Select optimal quality based on bandwidth
   */
  selectQuality(bandwidthKbps: number): '240p' | '360p' | '480p' | '720p' {
    // Bandwidth thresholds (in kbps)
    if (bandwidthKbps >= 2000) {
      return '720p';
    } else if (bandwidthKbps >= 1200) {
      return '480p';
    } else if (bandwidthKbps >= 600) {
      return '360p';
    } else {
      return '240p';
    }
  }

  /**
   * Recommend quality switch based on current metrics
   */
  recommendQualitySwitch(
    currentQuality: string,
    bandwidthKbps: number,
    bufferingEvents: number,
  ): 'up' | 'down' | 'stay' {
    const optimalQuality = this.selectQuality(bandwidthKbps);
    const qualityOrder = ['240p', '360p', '480p', '720p'];
    const currentIndex = qualityOrder.indexOf(currentQuality);
    const optimalIndex = qualityOrder.indexOf(optimalQuality);

    // If too many buffering events, recommend downgrade
    if (bufferingEvents > 3) {
      return 'down';
    }

    // If bandwidth allows higher quality
    if (optimalIndex > currentIndex) {
      return 'up';
    }

    // If bandwidth requires lower quality
    if (optimalIndex < currentIndex) {
      return 'down';
    }

    return 'stay';
  }

  /**
   * Get next quality level
   */
  getNextQuality(currentQuality: string, direction: 'up' | 'down'): string {
    const qualityOrder = ['240p', '360p', '480p', '720p'];
    const currentIndex = qualityOrder.indexOf(currentQuality);

    if (direction === 'up' && currentIndex < qualityOrder.length - 1) {
      return qualityOrder[currentIndex + 1];
    } else if (direction === 'down' && currentIndex > 0) {
      return qualityOrder[currentIndex - 1];
    }

    return currentQuality;
  }
}
