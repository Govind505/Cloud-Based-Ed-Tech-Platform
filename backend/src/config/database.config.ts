import { Injectable } from '@nestjs/common';
import { MongooseModuleOptions, MongooseOptionsFactory } from '@nestjs/mongoose';

/**
 * Database Configuration Service
 * Provides MongoDB connection options
 */
@Injectable()
export class DatabaseConfig implements MongooseOptionsFactory {
  createMongooseOptions(): MongooseModuleOptions {
    const uri =
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cloudedtech';
    const retryAttempts = 5;
    const retryDelay = 3000;

    return {
      uri,
      retryAttempts,
      retryDelay,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      // Enable automatic index creation in development
      autoIndex: process.env.NODE_ENV !== 'production',
      // Connection pooling
      maxPoolSize: 10,
    };
  }
}
