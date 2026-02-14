import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const savedAuth = JSON.parse(localStorage.getItem("authState")) || {};

const initialState = {
  user: savedAuth.user || null,
  accessToken: savedAuth.accessToken || null,
  refreshToken: savedAuth.refreshToken || null,
  isAuthenticated: !!savedAuth.accessToken,
  loading: false,
  error: null,
};

// ✅ 1. Login thunk
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_BASE_URL}/user/login`, credentials);
      if (res.data?.success) {
        return res.data;
      } else {
        return rejectWithValue(res.data.message || "Login failed");
      }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ✅ 2. Regenerate token thunk
export const regenerateToken = createAsyncThunk(
  "auth/regenerateToken",
  async (refreshToken, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_BASE_URL}/user/regeneratetoken`, {
        refreshToken,
      });
      if (res.data?.success) {
        return res.data;
      } else {
        return rejectWithValue(res.data.message || "Token regeneration failed");
      }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearState: (state) => {
      localStorage.removeItem("authState");
      return {
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // LOGIN HANDLER
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.data;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        localStorage.setItem(
          "authState",
          JSON.stringify({
            user: action.payload.data,
            accessToken: action.payload.accessToken,
            refreshToken: action.payload.refreshToken,
          })
        );
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // TOKEN REGENERATION HANDLER
      .addCase(regenerateToken.pending, (state) => {
        state.loading = true;
      })
      .addCase(regenerateToken.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        localStorage.setItem(
          "authState",
          JSON.stringify({
            user: state.user,
            accessToken: action.payload.accessToken,
            refreshToken: action.payload.refreshToken,
          })
        );
      })
      .addCase(regenerateToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearState } = authSlice.actions;
export const authReducer = authSlice.reducer;
