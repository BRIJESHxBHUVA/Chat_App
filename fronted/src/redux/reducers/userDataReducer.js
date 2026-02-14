import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { useSelector } from "react-redux";
import api from "../../Utils/api";

export const fetchAllUsers = createAsyncThunk(
    "userData/fetchAllUsers",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get("/user/list-with-last-chat");
            return response.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

const initialState = {
    data: [],
    error: null,
    loading: false,
}

const userDataSlice = createSlice({
    name: 'userData',
    initialState,
    reducers: {
        updateLastMessage: (state, action) => {
            const { message, loggedInUserId, isChatOpen } = action.payload;

            const otherUserId =
                message.sender_Id === loggedInUserId
                    ? message.reciever_Id
                    : message.sender_Id;

            const index = state.data.findIndex(
                (u) => u._id === otherUserId
            );

            if (index !== -1) {
                state.data[index].lastMessage =
                    message.message || "📷 Photo";
                state.data[index].lastMessageTime =
                    message.createdAt;

                // If message is incoming and chat is not open, increment unreadCount
                if (message.sender_Id !== loggedInUserId && !isChatOpen) {
                    state.data[index].unreadCount = (state.data[index].unreadCount || 0) + 1;
                }

                // Move user to top
                const user = state.data.splice(index, 1)[0];
                state.data.unshift(user);
            }
        },

        resetUnreadCount: (state, action) => {
            const userId = action.payload;
            const user = state.data.find(u => u._id === userId);
            if (user) {
                user.unreadCount = 0;
            }
        },

        setUserOnline: (state, action) => {
            const user = state.data.find(u => u._id === action.payload);
            if (user) user.is_online = true;
        },

        setUserOffline: (state, action) => {
            const user = state.data.find(u => u._id === action.payload);
            if (user) user.is_online = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(fetchAllUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
})

export const userDataReducer = userDataSlice.reducer;
export const userDataActions = userDataSlice.actions;

export const useAllUserData = () => {
    const data = useSelector((state) => state.userData.data);
    return data;
}