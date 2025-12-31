import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, User, Network, MessageSquare, LogOut, Settings } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import clsx from "clsx";

const SidebarItem = ({ icon: Icon, label, path, isOpen }) => {
    const location = useLocation();
    const isActive = location.pathname === path;

    return (
        <Link to={path} className="flex items-center gap-4 w-full">
            <div
                className={clsx(
                    "flex items-center p-3 rounded-xl transition-all duration-300 w-full hover:bg-white/10",
                    isActive ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" : "text-gray-400"
                )}
            >
                <Icon size={24} />
                <AnimatePresence>
                    {isOpen && (
                        <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="ml-2 font-medium whitespace-nowrap overflow-hidden"
                        >
                            {label}
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>
        </Link>
    );
};

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const { logout } = useAuth();

    return (
        <motion.div
            className="h-screen bg-black/90 backdrop-blur-xl border-r border-white/10 flex flex-col p-4 fixed left-0 top-0 z-50 transition-all duration-300"
            initial={{ width: "80px" }}
            animate={{ width: isOpen ? "240px" : "80px" }}
            onHoverStart={() => setIsOpen(true)}
            onHoverEnd={() => setIsOpen(false)}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8 px-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shrink-0 flex items-center justify-center font-bold text-white text-xl">
                    SB
                </div>
                <AnimatePresence>
                    {isOpen && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent whitespace-nowrap"
                        >
                            SkillBarter
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            {/* Nav Items */}
            <div className="flex flex-col gap-2 flex-1">
                <SidebarItem icon={LayoutDashboard} label="Dashboard" path="/dashboard" isOpen={isOpen} />
                <SidebarItem icon={User} label="Profile" path="/profile" isOpen={isOpen} />
                <SidebarItem icon={MessageSquare} label="Chat" path="/chat" isOpen={isOpen} />
                {/* Add chat or other links here if they were separate pages */}
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col gap-2 border-t border-white/10 pt-4">
                <button
                    onClick={logout}
                    className="flex items-center p-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 w-full transition-all"
                >
                    <LogOut size={24} />
                    <AnimatePresence>
                        {isOpen && (
                            <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                className="ml-2 font-medium whitespace-nowrap overflow-hidden"
                            >
                                Logout
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>
        </motion.div>
    );
}
