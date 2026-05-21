import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { USER_SERVICE_URL } from "@/lib/config";
import { User } from "./authSlice";

interface UserState {
    users: User[];
    loading: boolean;
    error: string | null;
}

const initialState: UserState = {
    users: [],
    loading: false,
    error: null,
};

export const fetchAllUsers = createAsyncThunk(
    "user/fetchAllUsers",
    async (token: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${USER_SERVICE_URL}/user/all`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data; // array of User objects
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            return rejectWithValue(err.response?.data?.message || "Failed to fetch users");
        }
    }
);

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        clearUserError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
                state.loading = false;
                state.users = action.payload;
            })
            .addCase(fetchAllUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearUserError } = userSlice.actions;
export default userSlice.reducer;
