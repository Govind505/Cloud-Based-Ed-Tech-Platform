import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../../../types/user.types';

/**
 * User Schema
 * MongoDB document for user accounts
 */
@Schema({
  timestamps: true,
  collection: 'users',
})
export class User extends Document {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, select: false }) // Don't return password by default
  password: string;

  @Prop({ enum: Object.values(UserRole), default: UserRole.STUDENT })
  role: UserRole;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop({ type: String, nullable: true })
  avatar?: string;

  @Prop({ type: String, nullable: true })
  bio?: string;

  @Prop({ enum: ['free', 'premium'], default: 'free' })
  subscriptionTier: 'free' | 'premium';

  @Prop({ type: [{ courseId: String, title: String, progress: Number, image: String }], default: [] })
  enrolledCourses: any[];

  @Prop({ type: String, nullable: true, select: false })
  refreshToken?: string;

  @Prop({ type: Date, nullable: true })
  lastLogin?: Date;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Create indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ createdAt: 1 });
UserSchema.index({ isActive: 1 });
