import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseConfig } from './config/database.config';
import { RabbitMQConfig } from './config/rabbitmq.config';
import { HealthController } from './common/health.controller';
import { JwtAuthGuardWithPublic } from './common/guards/jwt-with-public.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ContentModule } from './modules/content/content.module';
import { StreamingModule } from './modules/streaming/streaming.module';
import { EncodingModule } from './modules/encoding/encoding.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CommonModule } from './common/common.module';
import { NotificationsModule } from './modules/notifications/notification.module';
import { CoursesModule } from './modules/courses/courses.module';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [
    CommonModule,
    // Static files
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),

    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
        limit: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
      },
    ]),

    // MongoDB
    MongooseModule.forRootAsync({
      useClass: DatabaseConfig,
    }),

    // RabbitMQ (Global)
    RabbitMQConfig,

    // Feature modules
    AuthModule,
    UsersModule,
    ContentModule,
    StreamingModule,
    EncodingModule,
    AnalyticsModule,
    NotificationsModule,
    CoursesModule,
    ChatModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuardWithPublic,
    },
  ],
})
export class AppModule {}
