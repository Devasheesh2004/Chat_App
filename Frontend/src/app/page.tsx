"use client";

import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import LoginScreen from "@/components/LoginScreen";
import ChatDashboard from "@/components/ChatDashboard";

export default function Home() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  if (isAuthenticated) {
    return <ChatDashboard />;
  }

  return <LoginScreen />;
}
