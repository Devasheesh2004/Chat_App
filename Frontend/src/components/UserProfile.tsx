"use client";

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { updateProfileName, logout } from "@/store/authSlice";
import { disconnectSocket } from "@/lib/socket";
import { resetChatState } from "@/store/chatSlice";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { LogOut, Settings, Loader2 } from "lucide-react";

export default function UserProfile() {
    const dispatch = useDispatch<AppDispatch>();
    const { user, token } = useSelector((state: RootState) => state.auth);
    const [name, setName] = useState(user?.name || "");
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !token) return;
        setSaving(true);
        try {
            await dispatch(updateProfileName({ name, token })).unwrap();
            setOpen(false);
        } catch (err) {
            console.error("Update profile name failed:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        disconnectSocket();
        dispatch(resetChatState());
        dispatch(logout());
    };

    const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : "U";

    return (
        <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50 h-[66px] shrink-0">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-slate-200 bg-white">
                    <AvatarFallback className="font-bold bg-blue-500/10 text-blue-600">
                        {initials}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-800 line-clamp-1">{user?.name}</span>
                    <span className="text-xs text-slate-500 line-clamp-1">{user?.email}</span>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <Dialog open={open} onOpenChange={(val) => { setOpen(val); if(val) setName(user?.name || ""); }}>
                    <DialogTrigger className="h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer flex items-center justify-center">
                        <Settings className="h-4 w-4" />
                    </DialogTrigger>
                    <DialogContent className="bg-white border border-slate-200 text-slate-900 max-w-sm">
                        <DialogHeader>
                            <DialogTitle className="text-slate-900 font-bold">Edit Profile Settings</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSave} className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                                    Display Name
                                </label>
                                <Input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="bg-white border border-slate-200 text-slate-900 focus-visible:ring-blue-500/50 focus-visible:border-blue-500"
                                    required
                                />
                            </div>
                            <DialogFooter className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                    className="border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 cursor-pointer"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={saving || !name}
                                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer disabled:cursor-not-allowed"
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                                </Button>
                            </DialogFooter>
                         </form>
                     </DialogContent>
                 </Dialog>
 
                 <Button
                     variant="ghost"
                     size="icon"
                     onClick={handleLogout}
                     className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                    title="Log Out"
                >
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
