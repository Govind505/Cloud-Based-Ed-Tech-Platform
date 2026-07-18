import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StreamingController } from './streaming.controller';
import { StreamingService } from './streaming.service';
import { HlsGeneratorService } from './services/hls-generator.service';
import { QualitySelectorService } from './services/quality-selector.service';
import { StreamingSession, StreamingSessionSchema } from './schemas/streaming-session.schema';
import { ContentModule } from '../content/content.module';
import { EncodingModule } from '../encoding/encoding.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StreamingSession.name, schema: StreamingSessionSchema },
    ]),
    ContentModule,
    EncodingModule,
  ],
  controllers: [StreamingController],
  providers: [StreamingService, HlsGeneratorService, QualitySelectorService],
  exports: [StreamingService],
})
export class StreamingModule {}
