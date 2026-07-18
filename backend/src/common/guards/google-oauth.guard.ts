import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Google OAuth Guard
 * Bypasses real Google OAuth authentication in dev mode if Client ID is not configured
 */
@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'GOOGLE_CLIENT_ID_NOT_SET') {
      // Mark as mock so the controller can handle it with mock data
      request.isMockGoogle = true;
      return true;
    }
    
    return super.canActivate(context);
  }
}
