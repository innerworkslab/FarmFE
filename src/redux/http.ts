import axios, { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { store } from "../redux/store";
import { clearToken, setToken, setUserData } from "./features/AuthSlice";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setCookie, removeCookie } from "@/utils/cookie";
import { farmApi } from "./services/farmApi";
import { appApi } from "./services/appApi";

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

const http = axios.create({
  baseURL: `${apiBaseUrl}/api/v1`,
});

http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const token = state.auth.token;
    if (token) {
      if (config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    if (config.headers && config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    }
    return config;
  },
  (error) => Promise.reject(error)
);

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 422) {
      return error.response;
    }
    return Promise.reject(error);
  }
);

export type AdminLoginPayload = {
  login: string;
  password: string;
  device_name?: string;
  fcm_token?: string;
};

export type AdminLoginResponse = {
  token_type: string;
  access_token: string;
  user: {
    id: number;
    name: string;
    username: string;
    email: string;
    account_status: string;
    two_factor_enabled?: boolean;
    roles?: string[];
    permissions?: string[];
  };
};

export const adminLogin = async (payload: AdminLoginPayload) => {
  try {
    const response: AxiosResponse<AdminLoginResponse> = await http.post("/auth/login", {
      login: payload.login,
      password: payload.password,
      device_name: payload.device_name || "web-admin",
    }, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (response.status === 422) {
      return response;
    }

    if (response.status === 200 && response.data?.access_token) {
      const token = response.data.access_token;
      const user = response.data.user;

      const apiFormData = new FormData();
      apiFormData.append("token", token);
      apiFormData.append("id", user.id.toString());
      apiFormData.append("name", user.name);
      apiFormData.append("email", user.email);
      apiFormData.append("role", user.username);
      apiFormData.append("authType", "admin");
      await setCookie("userInfo", apiFormData);

      store.dispatch(setToken(token));
      store.dispatch(
        setUserData({
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.roles?.[0] || "admin",
          permissions: user.permissions || [],
          authType: "admin",
        })
      );
    }

    return response;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 422) {
      return error.response;
    }
    throw error;
  }
};

const ensureToken = async () => {
  const token = store.getState().auth.token;
  if (!token) {
    throw new Error("Token not available");
  }
  return { token };
};

export const fetchDataWithToken = async (uri: string) => {
  try {
    const { token } = await ensureToken();
    const response = await http.get(uri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data;
    }
    throw error;
  }
};

export const postDataWithToken = async (uri: string, data: FormData) => {
  try {
    const { token } = await ensureToken();
    const response = await http.post(uri, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.status === 422) {
      return response;
    }
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error;
    }
    throw error;
  }
};

export const useLogout = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const logout = async () => {
    try {
      await http.post("/auth/logout");
    } catch {
      // ignore
    } finally {
      dispatch(clearToken());
      dispatch(farmApi.util.resetApiState());
      dispatch(appApi.util.resetApiState());
      await removeCookie("userInfo");
      router.push("/login");
    }
  };

  return logout;
};

const api = {
  http,
  adminLogin,
  fetchDataWithToken,
  postDataWithToken,
};

export default api;
