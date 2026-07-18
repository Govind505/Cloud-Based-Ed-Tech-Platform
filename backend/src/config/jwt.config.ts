import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

/**
 * JWT Configuration Module
 * Handles JWT token generation, validation, and strategies
 */
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRATION || '7d') as any,
        algorithm: 'HS256',
      },
    }),
  ],
  exports: [JwtModule, PassportModule],
})
export class JwtConfig {}
