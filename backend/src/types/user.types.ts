/**
 * User Types
 * Defines interfaces for user-related data structures
 */

export enum UserRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
}

export interface IUser {
  _id?: string;
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  role: UserRole;
  isActive: boolean;
  avatar?: string;
  bio?: string;
  subscriptionTier?: 'free' | 'premium';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface IAuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: Omit<IUser, 'password'>;
}
