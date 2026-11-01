import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { authApi } from "../services/endpoints";

// status: "idle" -> "loading" -> "authenticated" | "unauthenticated" | "error"
// Route guards render nothing protected until the status is resolved, which
// is what prevents the blank screen / premature redirect on refresh.
const initialState = { status: "idle", user: null, notice: null, error: null };

export const restoreSession = createAsyncThunk("auth/restore", async (_, { rejectWithValue }) => {
  try {
    return { user: (await authApi.me()).data.user, notice: null };
  } catch (err) {
    // "Not signed in" is not an error. If an existing session was ended
    // (expired, revoked, blocked), keep the reason for the login page.
    if (err.status === 401 || err.code === "ACCOUNT_BLOCKED") {
      const notice = err.code === "AUTH_REQUIRED" ? null : { code: err.code, message: err.message };
      return { user: null, notice };
    }
    return rejectWithValue({ message: err.message, code: err.code, status: err.status });
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    signedIn: (state, action) => {
      state.user = action.payload;
      state.status = "authenticated";
      state.notice = null;
      state.error = null;
    },
    userUpdated: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    signedOut: (state, action) => {
      state.user = null;
      state.status = "unauthenticated";
      state.notice = action.payload?.notice || null;
    },
    noticeCleared: (state) => {
      state.notice = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.status = action.payload.user ? "authenticated" : "unauthenticated";
        state.notice = action.payload.notice;
      })
      .addCase(restoreSession.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload || { message: "Unable to restore your session." };
      });
  },
});

export const { signedIn, signedOut, userUpdated, noticeCleared } = authSlice.actions;
export default authSlice.reducer;

export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAdmin = (state) => state.auth.user?.role === "admin";
