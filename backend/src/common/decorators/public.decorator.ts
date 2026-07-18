import { SetMetadata } from '@nestjs/common';

export const PUBLIC_KEY = 'isPublic';

/**
 * Public Decorator
 * Marks routes that don't require authentication
 * Used to override JwtAuthGuard
 *
 * @example
 * @Public()
 * @Post('login')
 * login(@Body() loginDto: LoginDto) { ... }
 */
export const Public = () => SetMetadata(PUBLIC_KEY, true);
