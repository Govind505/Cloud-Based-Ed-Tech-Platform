import api from './api';

export interface Course {
  _id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  instructor: {
    _id: string;
    name: string;
    email: string;
  };
  modules: Module[];
  enrolledStudents: string[];
  createdAt: string;
}

export interface Module {
  _id: string;
  courseId: string;
  title: string;
  description?: string;
  lessons: Lesson[];
}

export interface Lesson {
  _id: string;
  moduleId: string;
  title: string;
  type: 'video' | 'text' | 'live';
  videoId?: string;
  content?: string;
  duration: number;
  meetingId?: string;
  startTime?: string;
  meetingStatus?: 'scheduled' | 'active' | 'completed';
}

export interface Quiz {
  _id: string;
  lessonId: string;
  questions: {
    question: string;
    options: string[];
  }[];
}

export interface Progress {
  completedLessons: string[];
  progressPercent: number;
  completed: boolean;
}

export const coursesService = {
  async listCourses(): Promise<Course[]> {
    const res = await api.get('/courses');
    return res.data;
  },

  async createCourse(title: string, description?: string, thumbnail?: string): Promise<Course> {
    const res = await api.post('/courses', { title, description, thumbnail });
    return res.data;
  },

  async getCourseDetail(courseId: string): Promise<Course> {
    const res = await api.get(`/courses/${courseId}`);
    return res.data;
  },

  async enrollStudent(courseId: string): Promise<Course> {
    const res = await api.post(`/courses/${courseId}/enroll`);
    return res.data;
  },

  async addModule(courseId: string, title: string, description?: string): Promise<Module> {
    const res = await api.post(`/courses/${courseId}/modules`, { title, description });
    return res.data;
  },

  async addLesson(moduleId: string, payload: { 
    title: string; 
    type: 'video' | 'text' | 'live'; 
    videoId?: string; 
    content?: string; 
    duration?: number;
    meetingId?: string;
    startTime?: string;
    meetingStatus?: 'scheduled' | 'active' | 'completed';
  }): Promise<Lesson> {
    const res = await api.post(`/courses/modules/${moduleId}/lessons`, payload);
    return res.data;
  },

  async updateLiveStatus(lessonId: string, status: 'scheduled' | 'active' | 'completed'): Promise<Lesson> {
    const res = await api.patch(`/courses/lessons/${lessonId}/live-status`, { status });
    return res.data;
  },

  async createQuiz(lessonId: string, questions: { question: string; options: string[]; correctAnswerIndex: number }[]): Promise<any> {
    const res = await api.post(`/assessments/lessons/${lessonId}/quiz`, { questions });
    return res.data;
  },

  async getQuiz(lessonId: string): Promise<Quiz> {
    const res = await api.get(`/assessments/lessons/${lessonId}/quiz`);
    return res.data;
  },

  async submitQuiz(quizId: string, answers: number[]): Promise<{ score: number; passed: boolean }> {
    const res = await api.post(`/assessments/quizzes/${quizId}/submit`, { answers });
    return res.data;
  },

  async completeLesson(lessonId: string): Promise<Progress> {
    const res = await api.post(`/assessments/lessons/${lessonId}/complete`);
    return res.data;
  },

  async getProgress(courseId: string): Promise<Progress> {
    const res = await api.get(`/assessments/courses/${courseId}/progress`);
    return res.data;
  }
};
