import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Quiz } from './schemas/quiz.schema';
import { Submission } from './schemas/submission.schema';
import { Progress } from './schemas/progress.schema';
import { Lesson } from './schemas/lesson.schema';
import { Module } from './schemas/module.schema';
import { Course } from './schemas/course.schema';

@Injectable()
export class AssessmentsService {
  constructor(
    @InjectModel(Quiz.name) private quizModel: Model<Quiz>,
    @InjectModel(Submission.name) private submissionModel: Model<Submission>,
    @InjectModel(Progress.name) private progressModel: Model<Progress>,
    @InjectModel(Lesson.name) private lessonModel: Model<Lesson>,
    @InjectModel(Module.name) private moduleModel: Model<Module>,
    @InjectModel(Course.name) private courseModel: Model<Course>,
  ) {}

  async createQuiz(lessonId: string, questions: any[]): Promise<Quiz> {
    if (!Types.ObjectId.isValid(lessonId)) {
      throw new BadRequestException('Invalid Lesson ID');
    }
    const lesson = await this.lessonModel.findById(lessonId);
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
    const quiz = new this.quizModel({
      lessonId: lesson._id,
      questions,
    });
    return quiz.save();
  }

  async getQuiz(lessonId: string, isAdminOrInstructor = false): Promise<any> {
    if (!Types.ObjectId.isValid(lessonId)) {
      throw new BadRequestException('Invalid Lesson ID');
    }
    const quiz = await this.quizModel.findOne({ lessonId }).exec();
    if (!quiz) {
      throw new NotFoundException('Quiz not found for this lesson');
    }

    if (isAdminOrInstructor) {
      return quiz;
    }

    // Hide correct answers for students
    const clientQuestions = quiz.questions.map(q => ({
      question: q.question,
      options: q.options,
    }));

    return {
      _id: quiz._id,
      lessonId: quiz.lessonId,
      questions: clientQuestions,
    };
  }

  async submitQuiz(userId: string, quizId: string, answers: number[]): Promise<Submission> {
    if (!Types.ObjectId.isValid(quizId)) {
      throw new BadRequestException('Invalid Quiz ID');
    }
    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (answers.length !== quiz.questions.length) {
      throw new BadRequestException('Answers count mismatch');
    }

    let correctCount = 0;
    quiz.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswerIndex) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= 70; // 70% passing threshold

    const submission = new this.submissionModel({
      userId,
      quizId: quiz._id,
      answers,
      score,
      passed,
    });

    return submission.save();
  }

  async completeLesson(userId: string, lessonId: string): Promise<Progress> {
    if (!Types.ObjectId.isValid(lessonId)) {
      throw new BadRequestException('Invalid Lesson ID');
    }
    const lesson = await this.lessonModel.findById(lessonId);
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const moduleDoc = await this.moduleModel.findById(lesson.moduleId);
    if (!moduleDoc) {
      throw new NotFoundException('Parent module not found');
    }

    const courseId = moduleDoc.courseId;
    const course = await this.courseModel
      .findById(courseId)
      .populate({
        path: 'modules',
        populate: { path: 'lessons' },
      })
      .exec();

    if (!course) {
      throw new NotFoundException('Parent course not found');
    }

    // Find or create progress document
    let progress = await this.progressModel.findOne({ userId, courseId: course._id });
    if (!progress) {
      progress = new this.progressModel({
        userId,
        courseId: course._id,
        completedLessons: [],
        progressPercent: 0,
        completed: false,
      });
    }

    // Add completed lesson if not already complete
    const lessonObjectId = lesson._id as Types.ObjectId;
    const isAlreadyCompleted = progress.completedLessons.some(id => id.toString() === lessonObjectId.toString());
    if (!isAlreadyCompleted) {
      progress.completedLessons.push(lessonObjectId);
    }

    // Calculate total lessons in course
    let totalLessonsCount = 0;
    course.modules.forEach((mod: any) => {
      totalLessonsCount += mod.lessons.length;
    });

    // Recalculate completion percentage
    if (totalLessonsCount > 0) {
      progress.progressPercent = Math.round((progress.completedLessons.length / totalLessonsCount) * 100);
    } else {
      progress.progressPercent = 0;
    }

    progress.completed = progress.progressPercent === 100;
    return progress.save();
  }

  async getProgress(userId: string, courseId: string): Promise<Progress> {
    if (!Types.ObjectId.isValid(courseId)) {
      throw new BadRequestException('Invalid Course ID');
    }
    const progress = await this.progressModel.findOne({ userId, courseId }).exec();
    if (!progress) {
      return {
        userId,
        courseId: new Types.ObjectId(courseId),
        completedLessons: [],
        progressPercent: 0,
        completed: false,
      } as any;
    }
    return progress;
  }
}
