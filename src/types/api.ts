export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedApiSuccess<T> = ApiSuccess<T[]> & {
  pagination: Pagination;
};

export type ApiError = {
  success: false;
  message: string;
  code: string;
};
