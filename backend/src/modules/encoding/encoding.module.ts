import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EncodingController } from './encoding.controller';
import { EncodingService } from './encoding.service';
import { EncodingConsumer } from './encoding.consumer';
import { Encoding, EncodingSchema } from './schemas/encoding.schema';
import { ContentModule } from '../content/content.module';
import { RabbitMQConfig } from '../../config/rabbitmq.config';

@Module({
  imports: [MongooseModule.forFeature([{ name: Encoding.name, schema: EncodingSchema }]), ContentModule],
  controllers: [EncodingController],
  providers: [EncodingService, EncodingConsumer],
  exports: [EncodingService],
})
export class EncodingModule {}
