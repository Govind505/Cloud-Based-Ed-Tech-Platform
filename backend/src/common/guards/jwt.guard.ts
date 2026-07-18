import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Auth Guard
 * Protects routes that require authentication
 * Validates JWT token and attaches user to request
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
