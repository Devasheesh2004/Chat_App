"use client";

import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { initializeAuth } from "@/store/authSlice";

export default function ClientProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        store.dispatch(initializeAuth());
    }, []);

    return <Provider store={store}>{children}</Provider>;
}
