import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole, ITokenPayload } from '../../types/user.types';

@Controller('assessments')
@UseGuards(RolesGuard)
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Post('lessons/:lessonId/quiz')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async createQuiz(
    @Param('lessonId') lessonId: string,
    @Body('questions') questions: any[],
  ) {
    return this.assessmentsService.createQuiz(lessonId, questions);
  }

  @Get('lessons/:lessonId/quiz')
  async getQuiz(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: ITokenPayload,
  ) {
    const isTeacher = user.role === UserRole.INSTRUCTOR || user.role === UserRole.ADMIN;
    return this.assessmentsService.getQuiz(lessonId, isTeacher);
  }

  @Post('quizzes/:quizId/submit')
  async submitQuiz(
    @Param('quizId') quizId: string,
    @Body('answers') answers: number[],
    @CurrentUser() user: ITokenPayload,
  ) {
    return this.assessmentsService.submitQuiz(user.email, quizId, answers);
  }

  @Post('lessons/:lessonId/complete')
  async completeLesson(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: ITokenPayload,
  ) {
    return this.assessmentsService.completeLesson(user.email, lessonId);
  }

  @Get('courses/:courseId/progress')
  async getProgress(
    @Param('courseId') courseId: string,
    @CurrentUser() user: ITokenPayload,
  ) {
    return this.assessmentsService.getProgress(user.email, courseId);
  }
}
