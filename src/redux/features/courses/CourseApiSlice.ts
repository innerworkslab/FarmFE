import { appApi } from "@/redux/services/appApi";

export type Course = {
  id: number;
  title: string;
  category?: string;
  level?: string;
  status?: string;
  created_at?: string;
};

export type CoursesResponse = {
  data: Course[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

const courseApiSlice = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getCourses: builder.query<CoursesResponse, Record<string, unknown> | void>({
      query: (params) => ({ url: "/courses", params: params || undefined }),
      providesTags: ["courses"],
    }),
  }),
});

export const { useGetCoursesQuery } = courseApiSlice;
