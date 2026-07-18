import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../types/user.types';

export const ROLES_KEY = 'roles';

/**
 * Roles Decorator
 * Specifies required roles for a route
 * Must be used with RolesGuard
 *
 * @example
 * @Roles(UserRole.ADMIN)
 * @Delete(':id')
 * deleteUser(@Param('id') id: string) { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
