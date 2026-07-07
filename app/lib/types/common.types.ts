// Standard shape for server action responses.
export type ActionResponse<T = Record<string, unknown>> = {
  success?: boolean;
  message?: string;
  errors?: {
    [K in keyof T]?: string[];
  };
};
