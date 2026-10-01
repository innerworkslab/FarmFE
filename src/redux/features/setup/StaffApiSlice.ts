import { farmApi } from "@/redux/services/farmApi";

export interface StaffRecord {
  id: number;
  staff_code: string;
  name: string;
  phone_number?: string | null;
  branch_id: number | string;
  branch?: { id: number; code: string; name: string } | null;
  employment_status: "employed" | "terminated" | string;
  status: "active" | "inactive" | string | null;
  eligible_for_advance?: boolean;
  version?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface StaffPayload {
  staff_code: string;
  name: string;
  phone_number?: string | null;
  branch_id: number;
  employment_status: "employed" | "terminated";
}

interface StaffListResponse {
  data: StaffRecord[];
  links?: Record<string, unknown>;
  meta?: { current_page?: number; last_page?: number; per_page?: number; total?: number };
}

interface StaffSingleResponse {
  data: StaffRecord;
  message?: string;
}

export const staffApiSlice = farmApi.injectEndpoints({
  endpoints: (builder) => ({
    getStaff: builder.query<
      StaffListResponse,
      {
        per_page?: number;
        page?: number;
        search?: string;
        status?: "active" | "inactive";
        employment_status?: "employed" | "terminated";
      } | void
    >({
      query: (params) => {
        const query = new URLSearchParams();
        if (params?.per_page) query.set("per_page", String(params.per_page));
        if (params?.page) query.set("page", String(params.page));
        if (params?.search) query.set("search", params.search);
        if (params?.status) query.set("status", params.status);
        if (params?.employment_status) query.set("employment_status", params.employment_status);
        return `setup/staff${query.size ? `?${query}` : ""}`;
      },
      providesTags: ["staff"],
    }),
    getStaffMember: builder.query<StaffSingleResponse, number | string>({
      query: (id) => `setup/staff/${id}`,
      providesTags: ["staff"],
    }),
    createStaff: builder.mutation<StaffSingleResponse, StaffPayload>({
      query: (body) => ({ url: "setup/staff", method: "POST", body }),
      invalidatesTags: ["staff"],
    }),
    updateStaff: builder.mutation<StaffSingleResponse, { id: number | string; body: StaffPayload }>(
      {
        query: ({ id, body }) => ({ url: `setup/staff/${id}`, method: "POST", body }),
        invalidatesTags: ["staff"],
      }
    ),
    toggleStaffStatus: builder.mutation<StaffSingleResponse, number | string>({
      query: (id) => ({ url: `setup/staff/${id}/toggle-status`, method: "POST" }),
      invalidatesTags: ["staff"],
    }),
  }),
});

export const {
  useGetStaffQuery,
  useLazyGetStaffMemberQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useToggleStaffStatusMutation,
} = staffApiSlice;
