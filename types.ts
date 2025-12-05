export interface PostResponse {
  id: string;
}

export interface ApiError {
  response?: {
    data?: {
      error?: {
        message: string;
        type: string;
        code: number;
      };
    };
  };
  message: string;
}

export enum Status {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}