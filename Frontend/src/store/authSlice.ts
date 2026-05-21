import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { USER_SERVICE_URL } from "@/lib/config";

export interface User {
    _id: string;
    name: string;
    email: string;
    createdAt?: string;
    updatedAt?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    otpSent: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    otpSent: false,
    error: null,
};

export const sendOtp = createAsyncThunk(
    "auth/sendOtp",
    async (email: string, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${USER_SERVICE_URL}/login`, { email });
            return response.data;
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            return rejectWithValue(err.response?.data?.message || "Failed to send OTP");
        }
    }
);

export const verifyOtp = createAsyncThunk(
    "auth/verifyOtp",
    async ({ email, otp }: { email: string; otp: string }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${USER_SERVICE_URL}/verify`, { email, otp });
            if (typeof window !== "undefined") {
                localStorage.setItem("token", response.data.token);
                localStorage.setItem("user", JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            return rejectWithValue(err.response?.data?.message || "Failed to verify OTP");
        }
    }
);

export const fetchProfile = createAsyncThunk(
    "auth/fetchProfile",
    async (token: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${USER_SERVICE_URL}/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            return rejectWithValue(err.response?.data?.message || "Failed to fetch profile");
        }
    }
);

export const updateProfileName = createAsyncThunk(
    "auth/updateProfileName",
    async ({ name, token }: { name: string; token: string }, { rejectWithValue }) => {
        try {
            const response = await axios.post(
                `${USER_SERVICE_URL}/update/user`,
                { name },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (typeof window !== "undefined") {
                localStorage.setItem("token", response.data.token);
                localStorage.setItem("user", JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            return rejectWithValue(err.response?.data?.message || "Failed to update profile name");
        }
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        initializeAuth: (state) => {
            if (typeof window !== "undefined") {
                const token = localStorage.getItem("token");
                const userStr = localStorage.getItem("user");
                if (token && userStr) {
                    state.token = token;
                    state.user = JSON.parse(userStr);
                    state.isAuthenticated = true;
                }
            }
        },
        logout: (state) => {
            if (typeof window !== "undefined") {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
            }
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.otpSent = false;
            state.error = null;
        },
        clearAuthError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(sendOtp.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(sendOtp.fulfilled, (state) => {
                state.loading = false;
                state.otpSent = true;
            })
            .addCase(sendOtp.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(verifyOtp.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(verifyOtp.fulfilled, (state, action) => {
                state.loading = false;
                state.token = action.payload.token;
                state.user = action.payload.user;
                state.isAuthenticated = true;
                state.otpSent = false;
            })
            .addCase(verifyOtp.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchProfile.fulfilled, (state, action) => {
                state.user = action.payload;
                state.isAuthenticated = true;
            })
            .addCase(fetchProfile.rejected, (state) => {
                state.token = null;
                state.user = null;
                state.isAuthenticated = false;
            })
            .addCase(updateProfileName.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateProfileName.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
            })
            .addCase(updateProfileName.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { initializeAuth, logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
