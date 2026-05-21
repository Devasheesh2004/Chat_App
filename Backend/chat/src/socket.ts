import { Server, Socket } from "socket.io";
import { Messages } from "./models/Messages.js";
import { Chat } from "./models/Chat.js";

let io: Server;
export const activeUsers = new Map<string, string>(); // userId -> socketId
export const userActiveChat = new Map<string, string>(); // userId -> chatId

export const initSocket = (server: any) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Adjust this to match frontend URL in production
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket: Socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Register user
        socket.on("register", (userId: string) => {
            if (userId) {
                activeUsers.set(userId, socket.id);
                console.log(`User ${userId} registered with socket ${socket.id}`);
                io.emit("user_status", { userId, status: "online" });
            }
        });

        // Join Chat Room
        socket.on("join_chat", async ({ chatId, userId }: { chatId: string, userId: string }) => {
            if (userId && chatId) {
                userActiveChat.set(userId, chatId);
                console.log(`User ${userId} active in chat ${chatId}`);

                try {
                    const chat = await Chat.findById(chatId);
                    if (chat) {
                        const otherUserId = chat.users.find((id) => id.toString() !== userId.toString());
                        if (otherUserId) {
                            // Mark all messages from the other user as seen
                            await Messages.updateMany({
                                chatId: chatId,
                                sender: otherUserId,
                                seen: false
                            }, {
                                seen: true,
                                seenAt: new Date()
                            });

                            const otherSocketId = activeUsers.get(otherUserId.toString());
                            if (otherSocketId) {
                                io.to(otherSocketId).emit("messages_seen", { chatId });
                            }
                        }
                    }
                } catch (err) {
                    console.error("Error in join_chat seen update:", err);
                }
            }
        });

        // Leave Chat Room
        socket.on("leave_chat", ({ userId }: { userId: string }) => {
            if (userId) {
                userActiveChat.delete(userId);
                console.log(`User ${userId} left chat`);
            }
        });

        // Handle Typing status
        socket.on("typing", ({ chatId, receiverId, isTyping }: { chatId: string, receiverId: string, isTyping: boolean }) => {
            const receiverSocketId = activeUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("typing", { chatId, isTyping });
            }
        });

        // Handle Mark Seen
        socket.on("mark_seen", async ({ chatId, senderId }: { chatId: string, senderId: string }) => {
            try {
                await Messages.updateMany({
                    chatId: chatId,
                    sender: senderId,
                    seen: false
                }, {
                    seen: true,
                    seenAt: new Date()
                });

                const senderSocketId = activeUsers.get(senderId);
                if (senderSocketId) {
                    io.to(senderSocketId).emit("messages_seen", { chatId });
                }
            } catch (err) {
                console.error("Error in socket mark_seen:", err);
            }
        });

        // Disconnect
        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`);
            for (const [userId, socketId] of activeUsers.entries()) {
                if (socketId === socket.id) {
                    activeUsers.delete(userId);
                    userActiveChat.delete(userId);
                    console.log(`User ${userId} unregistered`);
                    io.emit("user_status", { userId, status: "offline" });
                    break;
                }
            }
        });
    });

    return io;
};

export const getIo = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

export const sendToUser = (userId: string, event: string, data: any) => {
    if (io) {
        const socketId = activeUsers.get(userId);
        if (socketId) {
            io.to(socketId).emit(event, data);
            return true;
        }
    }
    return false;
};
