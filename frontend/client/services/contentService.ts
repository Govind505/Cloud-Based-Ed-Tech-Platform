import api from './api';

export interface Video {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  uploadedBy: string;
  duration: number;
  thumbnail?: string;
  status: string;
  originalUrl: string;
  fileSize: number;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVideoData {
  title: string;
  description?: string;
  courseId: string;
  duration: number;
  thumbnail?: string;
  originalUrl: string;
  fileSize: number;
  resolution?: string;
}

export interface UploadVideoData {
  file: File;
  title: string;
  description?: string;
  courseId: string;
}

export const contentService = {
  async getVideos(params?: { skip?: number; limit?: number; courseId?: string; search?: string }): Promise<Video[]> {
    const response = await api.get<Video[]>('/content', { params });
    return response.data;
  },

  async getVideo(id: string): Promise<Video> {
    const response = await api.get<Video>(`/content/${id}`);
    return response.data;
  },

  async createVideo(data: CreateVideoData): Promise<Video> {
    const response = await api.post<Video>('/content', data);
    return response.data;
  },

  async uploadVideo(data: UploadVideoData): Promise<Video> {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('title', data.title);
    formData.append('courseId', data.courseId);

    if (data.description) {
      formData.append('description', data.description);
    }

    const response = await api.post<Video>('/content/upload', formData);
    return response.data;
  },

  async updateVideo(id: string, data: Partial<CreateVideoData>): Promise<Video> {
    const response = await api.put<Video>(`/content/${id}`, data);
    return response.data;
  },

  async deleteVideo(id: string): Promise<void> {
    await api.delete(`/content/${id}`);
  },

  async getTrending(limit = 10): Promise<Video[]> {
    const response = await api.get<Video[]>('/content/trending/list', { params: { limit } });
    return response.data;
  },

  async getUserVideos(userId: string, skip = 0, limit = 10): Promise<Video[]> {
    const response = await api.get<Video[]>(`/content/user/${userId}`, { params: { skip, limit } });
    return response.data;
  },
};
