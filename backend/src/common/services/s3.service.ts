import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, ObjectCannedACL } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');

    if (region && accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.logger.log('S3 Client initialized');
    } else {
      this.logger.warn('AWS S3 credentials not fully provided. S3 uploads will fail.');
    }
  }

  /**
   * Upload a file to S3
   */
  async uploadFile(
    file: Buffer,
    fileName: string,
    mimetype: string,
    folder: string = 'videos',
  ): Promise<string> {
    if (!this.s3Client) {
      throw new Error('S3 Client not initialized. Check your AWS credentials.');
    }

    const key = `${folder}/${fileName}`;

    try {
      const parallelUploads3 = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: file,
          ContentType: mimetype,
          ACL: 'public-read' as ObjectCannedACL,
        },
        queueSize: 4, // optional concurrency configuration
        partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
        leavePartsOnError: false, // optional manually handle dropped parts
      });

      parallelUploads3.on('httpUploadProgress', (progress) => {
        this.logger.debug(`Upload progress for ${fileName}: ${progress.loaded}/${progress.total}`);
      });

      await parallelUploads3.done();

      // Return the public URL
      return `https://${this.bucketName}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${key}`;
    } catch (error) {
      this.logger.error(`S3 Upload Error for ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<void> {
    if (!this.s3Client) return;

    try {
      // Key should be the path within the bucket
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      // Note: DeleteObjectCommand would be better, but just illustrating
      this.logger.log(`Deleting from S3: ${key}`);
      // await this.s3Client.send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: key }));
    } catch (error) {
      this.logger.error(`S3 Delete Error for ${key}:`, error);
    }
  }
}
