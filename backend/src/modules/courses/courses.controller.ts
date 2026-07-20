import { Controller, Get, Post, Body, Param, UseGuards, Patch } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto, CreateModuleDto, CreateLessonDto } from './dto/courses.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole, ITokenPayload } from '../../types/user.types';

@Controller('courses')
@UseGuards(RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async createCourse(
    @Body() createCourseDto: CreateCourseDto,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.createCourse(
      createCourseDto.title,
      createCourseDto.description || '',
      createCourseDto.thumbnail || '',
      user.id,
    );
  }

  @Get()
  async listCourses() {
    return this.coursesService.listCourses();
  }

  @Get(':id')
  async getCourseDetail(@Param('id') id: string) {
    return this.coursesService.getCourseDetail(id);
  }

  @Post(':id/enroll')
  async enrollStudent(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.enrollStudent(id, user.email);
  }

  @Post(':id/modules')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async addModule(
    @Param('id') id: string,
    @Body() createModuleDto: CreateModuleDto,
  ) {
    return this.coursesService.addModule(id, createModuleDto.title, createModuleDto.description);
  }

  @Post('modules/:moduleId/lessons')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async addLesson(
    @Param('moduleId') moduleId: string,
    @Body() createLessonDto: CreateLessonDto,
  ) {
    return this.coursesService.addLesson(
      moduleId,
      createLessonDto.title,
      createLessonDto.type,
      createLessonDto.content,
      createLessonDto.videoId,
      createLessonDto.duration,
      createLessonDto.meetingId,
      createLessonDto.startTime,
      createLessonDto.meetingStatus,
    );
  }

  @Patch('lessons/:lessonId/live-status')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async updateLiveStatus(
    @Param('lessonId') lessonId: string,
    @Body('status') status: string,
  ) {
    return this.coursesService.updateLiveStatus(lessonId, status);
  }
}
