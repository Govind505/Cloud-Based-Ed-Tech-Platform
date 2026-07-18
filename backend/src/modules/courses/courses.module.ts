import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';
import { Course, CourseSchema } from './schemas/course.schema';
import { Module as CourseModule, ModuleSchema } from './schemas/module.schema';
import { Lesson, LessonSchema } from './schemas/lesson.schema';
import { Quiz, QuizSchema } from './schemas/quiz.schema';
import { Submission, SubmissionSchema } from './schemas/submission.schema';
import { Progress, ProgressSchema } from './schemas/progress.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: CourseModule.name, schema: ModuleSchema },
      { name: Lesson.name, schema: LessonSchema },
      { name: Quiz.name, schema: QuizSchema },
      { name: Submission.name, schema: SubmissionSchema },
      { name: Progress.name, schema: ProgressSchema },
    ]),
  ],
  controllers: [CoursesController, AssessmentsController],
  providers: [CoursesService, AssessmentsService],
  exports: [CoursesService, AssessmentsService],
})
export class CoursesModule {}
