/**
 * Content & Video Types
 * Defines interfaces for content and streaming data
 */

export enum VideoStatus {
  DRAFT = 'draft',
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
}

export enum EncodingStatus {
  PENDING = 'pending',
  ENCODING = 'encoding',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface IVideo {
  _id?: string;
  title: string;
  description?: string;
  courseId: string;
  uploadedBy: string;
  duration: number; // in seconds
  thumbnail?: string;
  status: VideoStatus;
  originalUrl: string;
  fileSize: number; // in bytes
  resolution?: string; // e.g., "1920x1080"
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IEncoding {
  _id?: string;
  videoId: string;
  quality: '240p' | '360p' | '480p' | '720p';
  bitrate: number; // in kbps
  resolution: string; // e.g., "426x240"
  hlsUrl: string;
  status: EncodingStatus;
  fileSize?: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IStreamingSession {
  _id?: string;
  userId: string;
  videoId: string;
  quality: '240p' | '360p' | '480p' | '720p';
  startedAt: Date;
  endedAt?: Date;
  bufferingEvents: number;
  quality_switches: number;
  totalBytesTransferred: number;
}
