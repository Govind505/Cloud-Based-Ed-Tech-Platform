import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course } from './schemas/course.schema';
import { Module } from './schemas/module.schema';
import { Lesson } from './schemas/lesson.schema';
import { Progress } from './schemas/progress.schema';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectModel(Module.name) private moduleModel: Model<Module>,
    @InjectModel(Lesson.name) private lessonModel: Model<Lesson>,
    @InjectModel(Progress.name) private progressModel: Model<Progress>,
  ) {}

  async createCourse(title: string, description: string, thumbnail: string, instructorId: string): Promise<Course> {
    const course = new this.courseModel({
      title,
      description,
      thumbnail,
      instructor: instructorId,
    });
    return course.save();
  }

  async listCourses(): Promise<Course[]> {
    return this.courseModel.find().populate('instructor', 'name email').exec();
  }

  async getCourseDetail(courseId: string): Promise<Course> {
    if (!Types.ObjectId.isValid(courseId)) {
      throw new BadRequestException('Invalid Course ID');
    }
    const course = await this.courseModel
      .findById(courseId)
      .populate({
        path: 'modules',
        populate: {
          path: 'lessons',
        },
      })
      .populate('instructor', 'name email')
      .exec();

    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  async enrollStudent(courseId: string, userEmail: string): Promise<Course> {
    if (!Types.ObjectId.isValid(courseId)) {
      throw new BadRequestException('Invalid Course ID');
    }
    const course = await this.courseModel.findById(courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    if (course.enrolledStudents.includes(userEmail)) {
      return course;
    }
    course.enrolledStudents.push(userEmail);
    await course.save();

    // Create user progress tracker for this course
    await this.progressModel.findOneAndUpdate(
      { userId: userEmail, courseId: course._id },
      { userId: userEmail, courseId: course._id, completedLessons: [], progressPercent: 0, completed: false },
      { upsert: true, new: true }
    );

    return course;
  }

  async addModule(courseId: string, title: string, description?: string): Promise<Module> {
    if (!Types.ObjectId.isValid(courseId)) {
      throw new BadRequestException('Invalid Course ID');
    }
    const course = await this.courseModel.findById(courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    const module = new this.moduleModel({
      courseId: course._id,
      title,
      description,
    });
    const savedModule = await module.save();
    course.modules.push(savedModule._id as Types.ObjectId);
    await course.save();
    return savedModule;
  }

  async addLesson(moduleId: string, title: string, type: string, content?: string, videoId?: string, duration?: number): Promise<Lesson> {
    if (!Types.ObjectId.isValid(moduleId)) {
      throw new BadRequestException('Invalid Module ID');
    }
    const module = await this.moduleModel.findById(moduleId);
    if (!module) {
      throw new NotFoundException('Module not found');
    }
    const lesson = new this.lessonModel({
      moduleId: module._id,
      title,
      type,
      content,
      videoId,
      duration: duration || 0,
    });
    const savedLesson = await lesson.save();
    module.lessons.push(savedLesson._id as Types.ObjectId);
    await module.save();
    return savedLesson;
  }
}
