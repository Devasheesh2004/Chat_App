"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { sendChatMessage, setActiveChat } from "@/store/chatSlice";
import { emitTyping, getSocket } from "@/lib/socket";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Image as ImageIcon, Send, X, Check, CheckCheck, Loader2, ArrowLeft } from "lucide-react";
import Image from "next/image";

export default function ChatArea() {
    const dispatch = useDispatch<AppDispatch>();
    const token = useSelector((state: RootState) => state.auth.token);
    const currentUser = useSelector((state: RootState) => state.auth.user);
    const { activeChatId, activeChatUser, messages, typingStatus, sendingMessage } = useSelector(
        (state: RootState) => state.chat
    );

    const [text, setText] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isTypingRef = useRef(false);

    const chatMessages = useMemo(() => {
        return activeChatId ? messages[activeChatId] || [] : [];
    }, [activeChatId, messages]);

    const isOtherUserTyping = activeChatId ? typingStatus[activeChatId] || false : false;

    // Scroll to bottom on new messages or typing status changes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages, isOtherUserTyping]);

    // Handle typing status emissions
    const handleTextChange = (val: string) => {
        setText(val);
        if (!activeChatId || !activeChatUser?._id) return;

        if (!isTypingRef.current) {
            isTypingRef.current = true;
            emitTyping(activeChatId, activeChatUser._id, true);
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            emitTyping(activeChatId, activeChatUser._id, false);
        }, 2000);
    };

    // Clean up typing indicators when switching chats or unmounting
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (activeChatId && activeChatUser?._id && isTypingRef.current) {
                emitTyping(activeChatId, activeChatUser._id, false);
                isTypingRef.current = false;
            }
        };
    }, [activeChatId, activeChatUser]);

    // Handle joining and leaving chat rooms for instant seen status updates
    useEffect(() => {
        const socket = getSocket();
        if (socket && activeChatId && currentUser?._id) {
            socket.emit("join_chat", { chatId: activeChatId, userId: currentUser._id });
        }
        return () => {
            const socket = getSocket();
            if (socket && currentUser?._id) {
                socket.emit("leave_chat", { userId: currentUser._id });
            }
        };
    }, [activeChatId, currentUser?._id]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleClearImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeChatId || !token) return;
        if (!text.trim() && !imageFile) return;

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        if (isTypingRef.current && activeChatUser?._id) {
            emitTyping(activeChatId, activeChatUser._id, false);
            isTypingRef.current = false;
        }

        const formData = new FormData();
        formData.append("chatId", activeChatId);
        if (text.trim()) {
            formData.append("text", text.trim());
        }
        if (imageFile) {
            formData.append("image", imageFile);
        }

        setText("");
        handleClearImage();

        try {
            await dispatch(sendChatMessage({ formData, token })).unwrap();
        } catch (err) {
            console.error("Send message failed:", err);
        }
    };

    if (!activeChatId) {
        return (
            <div className="flex-1 hidden sm:flex flex-col items-center justify-center p-8 bg-slate-50/50 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white border border-slate-200 text-blue-600 mb-4 shadow-sm">
                    <Send className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">CHAT APP</h2>
                <p className="text-sm text-slate-500 mt-1.5 max-w-sm">
                    Select a conversation from the sidebar, or start a new chat with another user to get started.
                </p>
                <div className="text-xs text-slate-400 mt-6 font-medium tracking-wide">
                    by Devasheesh Upreti
                </div>
            </div>
        );
    }

    const initials = activeChatUser?.name ? activeChatUser.name.slice(0, 2).toUpperCase() : "U";

    return (
        <div className="flex-1 flex flex-col h-full bg-white relative w-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-50/80 backdrop-blur-sm z-10 h-[66px] shrink-0">
                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-slate-800 cursor-pointer mr-1"
                        onClick={() => dispatch(setActiveChat(null))}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Avatar className="h-10 w-10 border border-slate-200 bg-slate-100">
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800">{activeChatUser?.name || "Chat User"}</span>
                        {activeChatUser?.email && <span className="text-xs text-slate-500">{activeChatUser.email}</span>}
                    </div>
                </div>
            </div>

            {/* Scroll Area of Messages */}
            <ScrollArea className="flex-1 h-0 px-6 py-4 bg-slate-50/30">
                <div className="space-y-4">
                    {chatMessages.map((m) => {
                        const isSelf = m.sender === currentUser?._id;
                        return (
                            <div key={m._id} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                                <div className={`flex flex-col max-w-[70%] space-y-1`}>
                                    <div
                                        className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all ${
                                            isSelf
                                                ? "bg-blue-600 text-white font-medium rounded-tr-none"
                                                : "bg-white text-slate-800 rounded-tl-none border border-slate-200"
                                        }`}
                                    >
                                        {m.image && (
                                            <div className="mb-2 max-w-full overflow-hidden rounded-lg border border-slate-200 relative">
                                                <Image
                                                    src={m.image.url}
                                                    alt="Attached file"
                                                    width={400}
                                                    height={240}
                                                    unoptimized
                                                    className="max-h-60 object-contain w-full bg-slate-50"
                                                />
                                            </div>
                                        )}
                                        {m.text && <p className="leading-relaxed wrap-break-words">{m.text}</p>}
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-1 ${isSelf ? "justify-end" : "justify-start"}`}>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isSelf && (
                                            <span>
                                                {m.seen ? (
                                                    <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                                                ) : (
                                                    <Check className="h-3.5 w-3.5 text-slate-400" />
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Typing status bubble */}
                    {isOtherUserTyping && (
                        <div className="flex justify-start">
                            <div className="flex flex-col space-y-1">
                                <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
                                    <span className="text-xs font-semibold">{activeChatUser?.name || "User"} is typing</span>
                                    <span className="flex gap-0.5 items-center justify-center pt-0.5">
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100" />
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200" />
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-300" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {/* Input Bar Section */}
            <div className="p-4 bg-white border-t border-slate-200">
                <form onSubmit={handleSendMessage} className="space-y-3">
                    {/* Image Preview Container */}
                    {imagePreview && (
                        <div className="relative inline-block bg-slate-50 border border-slate-200 rounded-xl p-2 max-w-[200px]">
                            <Image 
                                src={imagePreview} 
                                alt="Upload preview" 
                                width={180} 
                                height={96} 
                                unoptimized 
                                className="max-h-24 rounded-lg object-cover" 
                            />
                            <button
                                type="button"
                                onClick={handleClearImage}
                                className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 shadow-lg cursor-pointer"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        {/* File Upload Trigger */}
                        <div className="relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                                id="chat-file-input"
                            />
                            <label
                                htmlFor="chat-file-input"
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700 cursor-pointer transition-colors"
                            >
                                <ImageIcon className="h-4 w-4" />
                            </label>
                        </div>

                        {/* Message Input */}
                        <Input
                            placeholder="Type a message..."
                            value={text}
                            onChange={(e) => handleTextChange(e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-200 hover:border-slate-300 focus-visible:bg-white text-slate-900 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 h-10 rounded-xl transition-all"
                        />

                        {/* Send Button */}
                        <Button
                            type="submit"
                            disabled={sendingMessage || (!text.trim() && !imageFile)}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-10 w-10 p-0 rounded-xl shadow-md shadow-blue-500/10 cursor-pointer disabled:cursor-not-allowed"
                        >
                            {sendingMessage ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
