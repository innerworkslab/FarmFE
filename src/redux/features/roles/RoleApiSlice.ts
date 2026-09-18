import { appApi } from "@/redux/services/appApi";

export type Role = {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  permissions?: string[];
};

export type RolesResponse = {
  data: Role[];
};

const roleApiSlice = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query<RolesResponse, void>({
      query: () => "/roles",
      providesTags: ["roles"],
    }),
  }),
});

export const { useGetRolesQuery } = roleApiSlice;
