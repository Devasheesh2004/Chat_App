"use client";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { sendOtp, verifyOtp, clearAuthError } from "@/store/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, ShieldCheck, Mail, Loader2 } from "lucide-react";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const dispatch = useDispatch<AppDispatch>();

    const { loading, otpSent, error } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        dispatch(clearAuthError());
    }, [email, otp, dispatch]);

    const handleSendOtp = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        dispatch(sendOtp(email));
    };

    const handleVerifyOtp = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !otp) return;
        dispatch(verifyOtp({ email, otp }));
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
            {/* Visual background decorations */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-sky-400/15 blur-[100px] pointer-events-none" />

            <Card className="w-full max-w-md bg-white border-slate-200/80 shadow-xl relative z-10">
                <CardHeader className="space-y-1 text-center pt-8">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 mb-2">
                        {otpSent ? <ShieldCheck className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
                        {otpSent ? "Verification Code" : "Welcome to CHAT APP"}
                    </CardTitle>
                    <CardDescription className="text-slate-500">
                        {otpSent 
                            ? `Enter the 6-digit OTP code sent to ${email}`
                            : "Enter your email address to sign in or register"
                        }
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {error && (
                        <div className="p-3 text-xs bg-red-50 border border-red-100 text-red-600 rounded-lg text-center font-medium">
                            {error}
                        </div>
                    )}

                    {!otpSent ? (
                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Input
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 pl-10"
                                    />
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                disabled={loading || !email}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-500/10 cursor-pointer disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending Code...
                                    </>
                                ) : (
                                    "Continue with OTP"
                                )}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                                    One-Time Password
                                </label>
                                <Input
                                    type="text"
                                    maxLength={6}
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                    required
                                    className="bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 tracking-[0.5em] text-center text-lg font-bold"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={loading || otp.length < 6}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-500/10 cursor-pointer disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    "Verify & Access Chats"
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>

                {otpSent && (
                    <CardFooter className="flex justify-center pb-6">
                        <button
                            onClick={() => {
                                setEmail("");
                                setOtp("");
                                dispatch(clearAuthError());
                            }}
                            className="text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium hover:underline cursor-pointer"
                        >
                            Change email address
                        </button>
                    </CardFooter>
                )}
            </Card>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-slate-400 font-medium tracking-wide">
                CHAT APP - by Devasheesh Upreti
            </div>
        </div>
    );
}
