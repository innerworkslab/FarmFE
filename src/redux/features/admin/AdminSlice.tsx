import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchContent, postContent } from "../ContentUtilSlice";

interface AdminContent {
  [key: string]: unknown;
}

interface AdminState {
  content: AdminContent | null, 
  loading: boolean,
  error: string | null,
}

const initialState: AdminState = {
  content: null,
  loading: false,
  error: null,
};

export const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    setContentStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    setContentSuccess: (state, action: PayloadAction<AdminContent>) => {
      state.loading = false;
      state.content = action.payload;
    },
    setContentFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const { setContentStart, setContentSuccess, setContentFailure } = adminSlice.actions;

export const fetchAdminContent = (uri: string) => fetchContent(uri, setContentStart, setContentSuccess, setContentFailure);

export const postAdminContent = (uri: string, formData: AdminContent) => {
  const fd = new FormData();
  Object.keys(formData).forEach(key => {
    const value = formData[key];
    if (typeof value === 'string') {
      fd.append(key, value);
    } else if (value instanceof Blob) {
      fd.append(key, value);
    }
  });
  return postContent(uri, fd, setContentStart, setContentSuccess, setContentFailure);
};

export default adminSlice.reducer;
