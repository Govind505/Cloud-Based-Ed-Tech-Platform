import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AssessmentsService } from './assessments.service';
import { Quiz } from './schemas/quiz.schema';
import { Submission } from './schemas/submission.schema';
import { Progress } from './schemas/progress.schema';
import { Lesson } from './schemas/lesson.schema';
import { Module } from './schemas/module.schema';
import { Course } from './schemas/course.schema';

describe('AssessmentsService', () => {
  let service: AssessmentsService;

  const mockQuizModel = {
    findById: jest.fn(),
    findOne: jest.fn(),
  };

  const mockSubmissionModel = jest.fn().mockImplementation((dto) => ({
    ...dto,
    save: jest.fn().mockResolvedValue({ _id: 'submission123', ...dto }),
  }));

  const mockProgressModel = {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  const mockLessonModel = {
    findById: jest.fn(),
  };

  const mockModuleModel = {
    findById: jest.fn(),
  };

  const mockCourseModel = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentsService,
        { provide: getModelToken(Quiz.name), useValue: mockQuizModel },
        { provide: getModelToken(Submission.name), useValue: mockSubmissionModel },
        { provide: getModelToken(Progress.name), useValue: mockProgressModel },
        { provide: getModelToken(Lesson.name), useValue: mockLessonModel },
        { provide: getModelToken(Module.name), useValue: mockModuleModel },
        { provide: getModelToken(Course.name), useValue: mockCourseModel },
      ],
    }).compile();

    service = module.get<AssessmentsService>(AssessmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitQuiz', () => {
    it('should calculate quiz score and set passed status correctly (Pass case)', async () => {
      const mockQuiz = {
        _id: '507f1f77bcf86cd799439011',
        questions: [
          { correctAnswerIndex: 0 },
          { correctAnswerIndex: 1 },
          { correctAnswerIndex: 2 },
          { correctAnswerIndex: 3 },
        ],
      };

      mockQuizModel.findById = jest.fn().mockResolvedValue(mockQuiz);

      const answers = [0, 1, 2, 3]; // 100% score
      const result = await service.submitQuiz('student@cloudedtech.com', '507f1f77bcf86cd799439011', answers);

      expect(result.score).toBe(100);
      expect(result.passed).toBe(true);
    });

    it('should calculate quiz score and set passed status correctly (Fail case)', async () => {
      const mockQuiz = {
        _id: '507f1f77bcf86cd799439011',
        questions: [
          { correctAnswerIndex: 0 },
          { correctAnswerIndex: 1 },
          { correctAnswerIndex: 2 },
          { correctAnswerIndex: 3 },
        ],
      };

      mockQuizModel.findById = jest.fn().mockResolvedValue(mockQuiz);

      const answers = [0, 0, 0, 0]; // 1 out of 4 correct (25%)
      const result = await service.submitQuiz('student@cloudedtech.com', '507f1f77bcf86cd799439011', answers);

      expect(result.score).toBe(25);
      expect(result.passed).toBe(false);
    });
  });
});
