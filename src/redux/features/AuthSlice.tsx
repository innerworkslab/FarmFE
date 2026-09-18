import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  token: string | null;
  name: string | null;
  email: string | null;
  id: string | null;
  role: string | null;
  permissions: string[];
  authType?: "admin" | "master" | "agent" | "professional";
}

const initialState: AuthState = {
  token: null,
  name: null,
  email: null,
  id: null,
  role: null,
  permissions: [],
  authType: "admin",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    clearToken: (state) => {
      state.token = null;
      state.name = null;
      state.email = null;
      state.id = null;
      state.role = null;
      state.permissions = [];
    },
    setUserName: (state, action: PayloadAction<string>) => {
      state.name = action.payload;
    },
    setUserData: (
      state,
      action: PayloadAction<{
        id: string;
        name: string;
        email: string;
        role?: string;
        permissions: string[];
        authType: "admin" | "master" | "agent" | "professional";
      }>
    ) => {
      state.id = action.payload.id;
      state.name = action.payload.name;
      state.email = action.payload.email;
      state.role = action.payload.role || null;
      state.permissions = action.payload.permissions || [];
      state.authType = action.payload.authType;
    },
    clearUserData: (state) => {
      state.id = null;
      state.name = null;
      state.email = null;
      state.role = null;
      state.permissions = [];
    },
  },
});

export const { setToken, clearToken, setUserData, clearUserData, setUserName } = authSlice.actions;

export default authSlice.reducer;
