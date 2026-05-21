"use client";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { fetchChats, createChat, setActiveChat, fetchMessages } from "@/store/chatSlice";
import { fetchAllUsers } from "@/store/userSlice";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, MessageSquare, Loader2 } from "lucide-react";
import { User } from "@/store/authSlice";

export default function ChatSidebar() {
    const dispatch = useDispatch<AppDispatch>();
    const token = useSelector((state: RootState) => state.auth.token);
    const currentUser = useSelector((state: RootState) => state.auth.user);
    const { chats, activeChatId, loadingChats } = useSelector((state: RootState) => state.chat);
    const { users, loading: loadingUsers } = useSelector((state: RootState) => state.user);

    const [searchQuery, setSearchQuery] = useState("");
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        if (token) {
            dispatch(fetchChats(token));
        }
    }, [token, dispatch]);

    const handleOpenUserSearch = () => {
        if (token) {
            dispatch(fetchAllUsers(token));
        }
        setDialogOpen(true);
    };

    const handleCreateChat = async (otherUserId: string) => {
        if (!token) return;
        try {
            await dispatch(createChat({ otherUserId, token })).unwrap();
            setDialogOpen(false);
        } catch (err) {
            console.error("Failed to create chat:", err);
        }
    };

    const handleSelectChat = (chatId: string, user: User) => {
        dispatch(setActiveChat({ chatId, user }));
        if (token) {
            dispatch(fetchMessages({ chatId, token }));
        }
    };

    const filteredChats = chats.filter((c) =>
        c.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const existingChatUserIds = new Set(chats.map((c) => c.user?._id));
    const filteredUsers = users.filter((u) => 
        u._id !== currentUser?._id &&
        !existingChatUserIds.has(u._id) &&
        (u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
         u.email?.toLowerCase().includes(userSearchQuery.toLowerCase()))
    );

    return (
        <div className="flex flex-col flex-1 h-0 border-r border-slate-200 bg-slate-50 w-full shrink-0">
            <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                        Chats
                    </h1>
                    
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger
                            onClick={handleOpenUserSearch}
                            className="h-8 w-8 rounded-full border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-800 text-slate-500 cursor-pointer flex items-center justify-center"
                        >
                            <Plus className="h-4 w-4" />
                        </DialogTrigger>
                        <DialogContent className="bg-white border border-slate-200 text-slate-900 max-w-md p-4">
                            <DialogHeader>
                                <DialogTitle className="text-slate-900 font-bold">New Conversation</DialogTitle>
                            </DialogHeader>
                            <div className="relative my-2">
                                <Input
                                    placeholder="Search users by name or email..."
                                    value={userSearchQuery}
                                    onChange={(e) => setUserSearchQuery(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 hover:border-slate-300 focus-visible:bg-white text-slate-900 pl-9 h-10 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            </div>
                            <ScrollArea className="h-[300px] mt-2 pr-2">
                                {loadingUsers ? (
                                    <div className="flex items-center justify-center h-40">
                                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                                    </div>
                                ) : filteredUsers.length > 0 ? (
                                    <div className="space-y-1">
                                        {filteredUsers.map((u) => {
                                            const initials = u.name ? u.name.slice(0,2).toUpperCase() : "U";
                                            return (
                                                <button
                                                    key={u._id}
                                                    onClick={() => handleCreateChat(u._id)}
                                                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-100 transition-colors text-left group cursor-pointer"
                                                >
                                                    <Avatar className="h-9 w-9 bg-slate-50 border border-slate-200">
                                                        <AvatarFallback className="text-xs bg-blue-500/10 text-blue-600 font-bold">
                                                            {initials}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900 truncate">
                                                            {u.name}
                                                        </p>
                                                        <p className="text-xs text-slate-400 truncate">{u.email}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-sm text-slate-400 font-medium">
                                        No new users found
                                    </div>
                                )}
                            </ScrollArea>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="relative">
                    <Input
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-slate-100/80 border border-transparent hover:border-slate-200 focus-visible:bg-white text-slate-900 pl-9 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 h-9 rounded-xl transition-all"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
            </div>

            <ScrollArea className="flex-1 px-2 pb-2">
                {loadingChats ? (
                    <div className="flex flex-col items-center justify-center pt-20 gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                        <span className="text-xs text-slate-400 font-medium">Loading conversation history...</span>
                    </div>
                ) : filteredChats.length > 0 ? (
                    <div className="space-y-1">
                        {filteredChats.map((c) => {
                            const chatUser = c.user;
                            const chatData = c.chat;
                            const isSelected = activeChatId === chatData._id;
                            const initials = chatUser?.name ? chatUser.name.slice(0, 2).toUpperCase() : "U";
                            
                            return (
                                <button
                                    key={chatData._id}
                                    onClick={() => handleSelectChat(chatData._id, chatUser)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left relative group border ${
                                        isSelected 
                                            ? "bg-blue-600/10 border-blue-500/20" 
                                            : "bg-transparent border-transparent hover:bg-slate-100 hover:border-slate-200/40"
                                    } cursor-pointer`}
                                >
                                    <div className="relative">
                                        <Avatar className="h-11 w-11 bg-slate-100 border border-slate-200">
                                            <AvatarFallback className={`font-bold ${
                                                isSelected ? "bg-blue-500/20 text-blue-600" : "bg-slate-200 text-slate-600"
                                            }`}>
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        {c.online && (
                                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white animate-pulse" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm font-semibold truncate ${
                                                isSelected ? "text-blue-600" : "text-slate-800"
                                            }`}>
                                                {chatUser?.name || "Unknown User"}
                                            </span>
                                            {chatData.updatedAt && (
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    {new Date(chatData.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between gap-2 mt-0.5">
                                            <p className="text-xs text-slate-500 truncate flex-1 font-normal">
                                                {chatData.latestMessage?.text || "No messages yet"}
                                            </p>
                                            
                                            {chatData.unseenCount > 0 && (
                                                <span className="min-w-5 h-5 px-1.5 flex items-center justify-center text-[10px] font-bold bg-blue-600 text-white rounded-full scale-90">
                                                    {chatData.unseenCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 text-xs text-slate-400 font-medium space-y-2">
                        <p>No conversations yet</p>
                        <button 
                            onClick={handleOpenUserSearch}
                            className="text-blue-600 hover:text-blue-500 underline font-semibold cursor-pointer"
                        >
                            Find users to chat with
                        </button>
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
