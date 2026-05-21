"use client";

import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import ChatSidebar from "./ChatSidebar";
import ChatArea from "./ChatArea";
import UserProfile from "./UserProfile";

export default function ChatDashboard() {
    const user = useSelector((state: RootState) => state.auth.user);
    const activeChatId = useSelector((state: RootState) => state.chat.activeChatId);

    useEffect(() => {
        if (user?._id) {
            connectSocket(user._id);
        }
        return () => {
            disconnectSocket();
        };
    }, [user?._id]);

    return (
        <div className="flex-1 flex h-screen overflow-hidden bg-slate-50">
            <div className={`flex flex-col h-full shrink-0 w-full sm:w-[320px] lg:w-[380px] ${activeChatId ? "hidden sm:flex" : "flex"}`}>
                <UserProfile />
                <ChatSidebar />
            </div>
            <ChatArea />
        </div>
    );
}
