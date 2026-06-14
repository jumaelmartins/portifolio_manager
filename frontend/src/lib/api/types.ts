export type ApiError = {
  status: number;
  code?: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
};
