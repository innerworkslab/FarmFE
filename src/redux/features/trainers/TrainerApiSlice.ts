import { appApi } from "@/redux/services/appApi";

export type Trainer = {
  id: number;
  name: string;
  email?: string;
  status?: string;
};

export type TrainersResponse = {
  data: Trainer[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

const trainerApiSlice = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getTrainers: builder.query<TrainersResponse, Record<string, unknown> | void>({
      query: (params) => ({ url: "/trainers", params: params || undefined }),
      providesTags: ["trainers"],
    }),
  }),
});

export const { useGetTrainersQuery } = trainerApiSlice;
