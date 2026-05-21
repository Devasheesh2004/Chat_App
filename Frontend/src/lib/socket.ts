import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "./config";
import { store } from "@/store/store";
import { receiveMessage, updateMessagesSeen, setTyping, updateUserOnlineStatus, Message } from "@/store/chatSlice";

let socket: Socket | null = null;

export const getSocket = () => socket;

export const connectSocket = (userId: string) => {
    if (socket) return socket;

    socket = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: true,
    });

    socket.on("connect", () => {
        console.log("Socket connected to server:", socket?.id);
        socket?.emit("register", userId);

        const state = store.getState();
        if (state.chat.activeChatId) {
            socket?.emit("join_chat", {
                chatId: state.chat.activeChatId,
                userId: userId,
            });
        }
    });

    socket.on("new_message", (message: Message) => {
        console.log("Socket received new message:", message);
        store.dispatch(receiveMessage(message));

        const state = store.getState();
        if (state.chat.activeChatId === message.chatId) {
            socket?.emit("mark_seen", {
                chatId: message.chatId,
                senderId: message.sender,
            });
        }
    });

    socket.on("messages_seen", ({ chatId }: { chatId: string }) => {
        console.log("Socket received messages_seen for chat:", chatId);
        store.dispatch(updateMessagesSeen({ chatId }));
    });

    socket.on("typing", ({ chatId, isTyping }: { chatId: string; isTyping: boolean }) => {
        console.log(`Socket typing: Chat ${chatId} isTyping: ${isTyping}`);
        store.dispatch(setTyping({ chatId, isTyping }));
    });

    socket.on("user_status", ({ userId, status }: { userId: string; status: "online" | "offline" }) => {
        console.log(`Socket user_status: User ${userId} is ${status}`);
        store.dispatch(updateUserOnlineStatus({ userId, status }));
    });

    socket.on("disconnect", () => {
        console.log("Socket disconnected");
    });

    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        console.log("Socket manually disconnected and cleared");
    }
};

export const emitTyping = (chatId: string, receiverId: string, isTyping: boolean) => {
    if (socket) {
        socket.emit("typing", { chatId, receiverId, isTyping });
    }
};
