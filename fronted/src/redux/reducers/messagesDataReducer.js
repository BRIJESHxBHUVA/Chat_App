import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { useSelector } from "react-redux";
import api from "../../Utils/api";

export const fetchMessages = createAsyncThunk(
    "messagesData/fetchMessages",
    async ({ senderId, receiverId }, { rejectWithValue }) => {
        try {
            const response = await api.get(`/chat/getmessage?senderId=${senderId}&receiverId=${receiverId}`);
            return response.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);


const initialState = {
    messages: [],
    loading: false,
    error: null,
}

const messagesDataSlice = createSlice({
    name: 'messagesData',
    initialState,
    reducers: {
        addMessage: (state, action) => {
            state.messages.push(action.payload);
        },

        clearMessagesData: (state) => {
            state.messages = [];
            state.loading = false;
            state.error = null;
        },

        updateMessageStatus: (state, action) => {
            const { messageId, messageIds, status } = action.payload;

            if (messageId) {
                const msg = state.messages.find(m => m._id === messageId);
                if (msg) msg.status = status;
            }

            if (messageIds && messageIds.length > 0) {
                state.messages.forEach(msg => {
                    if (messageIds.includes(msg._id)) {
                        msg.status = status;
                    }
                });
            }
        },

        updateOptimisticMessage: (state, action) => {
            const realMessage = action.payload;
            const index = state.messages.findIndex(m =>
                m.message === realMessage.message &&
                m.sender_Id === realMessage.sender_Id &&
                typeof m._id === 'number'
            );

            if (index !== -1) {
                state.messages[index] = realMessage;
            } else {
                // Avoid duplicates if real message already exists
                const exists = state.messages.find(m => m._id === realMessage._id);
                if (!exists) state.messages.push(realMessage);
            }
        },

        removeMessages: (state, action) => {
            const { messageIds } = action.payload;
            state.messages = state.messages.filter(m => !messageIds.includes(m._id));
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMessages.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMessages.fulfilled, (state, action) => {
                state.loading = false;
                state.messages = action.payload;
            })
            .addCase(fetchMessages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
})

export const messagesDataReducer = messagesDataSlice.reducer;
export const messagesDataActions = messagesDataSlice.actions;

export const useAllMessagesData = () => {
    const data = useSelector((state) => state.messagesData.messages);
    return data;
}