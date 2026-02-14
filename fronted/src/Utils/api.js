import axios from "axios";
import { regenerateToken, clearState } from "../redux/reducers/authReducer";

let store;

export const injectStore = (_store) => {
  store = _store;
};

const api = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const state = store?.getState();
    const token = state?.auth?.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = store?.getState()?.auth?.refreshToken;

      if (!refreshToken) {
        store?.dispatch(clearState());
        return Promise.reject(error);
      }

      try {
        const result = await store.dispatch(regenerateToken(refreshToken));

        if (result.meta.requestStatus === "fulfilled") {
          const newAccessToken = result.payload.accessToken;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } else {
          store?.dispatch(clearState());
        }
      } catch (err) {
        store?.dispatch(clearState());
      }
    }

    return Promise.reject(error);
  }
);

export default api;
