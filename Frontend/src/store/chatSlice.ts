import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { CHAT_SERVICE_URL } from "@/lib/config";
import { User } from "./authSlice";

export interface Message {
    _id: string;
    chatId: string;
    sender: string;
    text: string;
    image?: {
        url: string;
        publicId: string;
    };
    messageType: "text" | "image";
    seen: boolean;
    seenAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ChatData {
    _id: string;
    users: string[];
    latestMessage?: {
        text: string;
        sender: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface ChatWithUser {
    chat: ChatData & { unseenCount: number; latestmessage?: Message | null };
    user: {
        _id: string;
        name: string;
        email: string;
    };
    online?: boolean;
}

interface ChatState {
    chats: ChatWithUser[];
    activeChatId: string | null;
    activeChatUser: { _id: string; name: string; email: string } | null;
    messages: { [chatId: string]: Message[] };
    typingStatus: { [chatId: string]: boolean };
    loadingChats: boolean;
    loadingMessages: boolean;
    sendingMessage: boolean;
    error: string | null;
}

const initialState: ChatState = {
    chats: [],
    activeChatId: null,
    activeChatUser: null,
    messages: {},
    typingStatus: {},
    loadingChats: false,
    loadingMessages: false,
    sendingMessage: false,
    error: null,
};

export const fetchChats = createAsyncThunk(
    "chat/fetchChats",
    async (token: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${CHAT_SERVICE_URL}/chat/all`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data.chats; // array of ChatWithUser
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            return rejectWithValue(err.response?.data?.message || "Failed to fetch chats");
        }
    }
);

export const createChat = createAsyncThunk(
    "chat/createChat",
    async ({ otherUserId, token }: { otherUserId: string; token: string }, { rejectWithValue, dispatch }) => {
        try {
            const response = await axios.post(
                `${CHAT_SERVICE_URL}/chat/new`,
                { otherUserId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // After creating a chat, re-fetch the chats list
            dispatch(fetchChats(token));
            return response.data; // { message, chatId }
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            return rejectWithValue(err.response?.data?.message || "Failed to create chat");
        }
    }
);

export const fetchMessages = createAsyncThunk(
    "chat/fetchMessages",
    async ({ chatId, token }: { chatId: string; token: string }, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${CHAT_SERVICE_URL}/message/${chatId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return { chatId, data: response.data }; // data: { messages, user }
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            return rejectWithValue(err.response?.data?.message || "Failed to fetch messages");
        }
    }
);

export const sendChatMessage = createAsyncThunk(
    "chat/sendChatMessage",
    async ({ formData, token }: { formData: FormData; token: string }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${CHAT_SERVICE_URL}/message`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });
            return response.data; // { message: savedMessage, sender: senderId }
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            return rejectWithValue(err.response?.data?.message || "Failed to send message");
        }
    }
);

const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
        setActiveChat: (state, action: PayloadAction<{ chatId: string; user: User } | null>) => {
            if (action.payload) {
                state.activeChatId = action.payload.chatId;
                state.activeChatUser = action.payload.user;
                // Clear unseen count locally
                const chatIndex = state.chats.findIndex((c) => c.chat._id === action.payload?.chatId);
                if (chatIndex !== -1) {
                    state.chats[chatIndex].chat.unseenCount = 0;
                }
            } else {
                state.activeChatId = null;
                state.activeChatUser = null;
            }
        },
        receiveMessage: (state, action: PayloadAction<Message>) => {
            const message = action.payload;
            const { chatId } = message;
            
            // Append to messages list if cached
            if (!state.messages[chatId]) {
                state.messages[chatId] = [];
            }
            // Avoid duplicate additions
            if (!state.messages[chatId].some((m) => m._id === message._id)) {
                state.messages[chatId].push(message);
            }

            // Update latest message in chats list
            const chatIndex = state.chats.findIndex((c) => c.chat._id === chatId);
            if (chatIndex !== -1) {
                state.chats[chatIndex].chat.latestMessage = {
                    text: message.messageType === "image" ? "📷 Image" : message.text,
                    sender: message.sender,
                };
                
                // If this is NOT the active chat, increment unseen count
                if (state.activeChatId !== chatId) {
                    state.chats[chatIndex].chat.unseenCount += 1;
                }
                
                // Move chat to top of the list
                const chat = state.chats[chatIndex];
                state.chats.splice(chatIndex, 1);
                state.chats.unshift(chat);
            }
        },
        updateMessagesSeen: (state, action: PayloadAction<{ chatId: string }>) => {
            const { chatId } = action.payload;
            if (state.messages[chatId]) {
                state.messages[chatId] = state.messages[chatId].map((m) => ({
                    ...m,
                    seen: true,
                    seenAt: m.seenAt || new Date().toISOString(),
                }));
            }
        },
        setTyping: (state, action: PayloadAction<{ chatId: string; isTyping: boolean }>) => {
            const { chatId, isTyping } = action.payload;
            state.typingStatus[chatId] = isTyping;
        },
        updateUserOnlineStatus: (state, action: PayloadAction<{ userId: string; status: "online" | "offline" }>) => {
            const { userId, status } = action.payload;
            state.chats = state.chats.map((c) => {
                if (c.user._id === userId) {
                    return { ...c, online: status === "online" };
                }
                return c;
            });
        },
        clearChatError: (state) => {
            state.error = null;
        },
        resetChatState: (state) => {
            state.chats = [];
            state.activeChatId = null;
            state.activeChatUser = null;
            state.messages = {};
            state.typingStatus = {};
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Chats
            .addCase(fetchChats.pending, (state) => {
                state.loadingChats = true;
                state.error = null;
            })
            .addCase(fetchChats.fulfilled, (state, action: PayloadAction<ChatWithUser[]>) => {
                state.loadingChats = false;
                state.chats = action.payload;
            })
            .addCase(fetchChats.rejected, (state, action) => {
                state.loadingChats = false;
                state.error = action.payload as string;
            })
            // Fetch Messages
            .addCase(fetchMessages.pending, (state) => {
                state.loadingMessages = true;
                state.error = null;
            })
            .addCase(fetchMessages.fulfilled, (state, action: PayloadAction<{ chatId: string; data: { messages: Message[]; user: User } }>) => {
                state.loadingMessages = false;
                const { chatId, data } = action.payload;
                state.messages[chatId] = data.messages;
                state.activeChatUser = data.user;
            })
            .addCase(fetchMessages.rejected, (state, action) => {
                state.loadingMessages = false;
                state.error = action.payload as string;
            })
            // Send Message
            .addCase(sendChatMessage.pending, (state) => {
                state.sendingMessage = true;
                state.error = null;
            })
            .addCase(sendChatMessage.fulfilled, (state, action: PayloadAction<{ message: Message; sender: string }>) => {
                state.sendingMessage = false;
                const { message } = action.payload;
                const { chatId } = message;
                
                if (!state.messages[chatId]) {
                    state.messages[chatId] = [];
                }
                state.messages[chatId].push(message);

                // Update latest message in chats list
                const chatIndex = state.chats.findIndex((c) => c.chat._id === chatId);
                if (chatIndex !== -1) {
                    state.chats[chatIndex].chat.latestMessage = {
                        text: message.messageType === "image" ? "📷 Image" : message.text,
                        sender: message.sender,
                    };
                    // Move to top
                    const chat = state.chats[chatIndex];
                    state.chats.splice(chatIndex, 1);
                    state.chats.unshift(chat);
                }
            })
            .addCase(sendChatMessage.rejected, (state, action) => {
                state.sendingMessage = false;
                state.error = action.payload as string;
            });
    },
});

export const {
    setActiveChat,
    receiveMessage,
    updateMessagesSeen,
    setTyping,
    updateUserOnlineStatus,
    clearChatError,
    resetChatState
} = chatSlice.actions;

export default chatSlice.reducer;
