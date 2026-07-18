import { Module, Global } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';

/**
 * RabbitMQ Config Module
 * Provides RabbitMQService globally
 */
@Global()
@Module({
  providers: [RabbitMQService],
  exports: [RabbitMQService],
})
export class RabbitMQConfig {}

// Export the service for direct use
export { RabbitMQService };
