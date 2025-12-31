import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Phone, Video, Paperclip, MoreVertical, Search, MessageSquare, UserPlus, Check, X, File } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import io from 'socket.io-client';

const socket = io("http://localhost:5000");

export default function ChatPage() {
    const { user, token } = useAuth();
    const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' or 'requests'
    const [conversations, setConversations] = useState([]);
    const [requests, setRequests] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch initial data
    useEffect(() => {
        if (!token) return;
        fetchConversations();
        fetchRequests();
    }, [token, activeTab]);

    // Socket setup
    useEffect(() => {
        if (!user) return;
        socket.emit("join_room", user.id); // Join own room

        socket.on("receive_message", (data) => {
            if (selectedChat && (data.sender === selectedChat.partner._id || data.sender === user.id)) {
                setMessages((prev) => {
                    // Deduplicate
                    if (prev.some(m => m._id === data._id)) return prev;
                    if (prev.some(m => m.timestamp === data.timestamp && m.content === data.content && m.sender === data.sender)) return prev;
                    return [...prev, data];
                });
                scrollToBottom();
            }
        });

        return () => {
            socket.off("receive_message");
        };
    }, [user, selectedChat]);

    // Fetch messages when chat is selected
    useEffect(() => {
        if (selectedChat) {
            fetchMessages(selectedChat.partner._id);
            socket.emit("join_room", selectedChat.partner._id); // Maybe not needed if backend emits to user ID room
        }
    }, [selectedChat]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchConversations = async () => {
        try {
            const res = await axios.get('http://localhost:5000/chat/conversations', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConversations(res.data);
            setIsLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchRequests = async () => {
        try {
            const res = await axios.get('http://localhost:5000/chat/requests', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMessages = async (partnerId) => {
        try {
            const res = await axios.get(`http://localhost:5000/chat/${partnerId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(res.data);
            scrollToBottom();
        } catch (err) {
            console.error(err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChat) return;

        const messageData = {
            sender: user.id,
            recipient: selectedChat.partner._id,
            content: newMessage,
            timestamp: new Date()
        };

        // Optimistic update done by socket listener for sender too? 
        // Backend emits to sender, so we just wait for it? 
        // Or emit socket event first.
        socket.emit("send_message", messageData);
        setNewMessage("");
    };

    const handleAcceptRequest = async (requestId) => {
        try {
            await axios.post(`http://localhost:5000/chat/request/${requestId}/accept`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchRequests();
            fetchConversations(); // refresh conversations
        } catch (err) {
            console.error(err);
        }
    };

    const handleRejectRequest = async (requestId) => {
        try {
            await axios.post(`http://localhost:5000/chat/request/${requestId}/reject`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchRequests();
        } catch (err) {
            console.error(err);
        }
    };

    const handleGoogleMeet = () => {
        window.open('https://meet.google.com/new', '_blank');
    };

    const handleFileUpload = () => {
        // MVP: Just show an alert or trigger file input (dummy)
        alert("File sharing feature coming soon!");
    };

    return (
        <div className="flex h-[calc(100vh-80px)] mt-0 bg-black text-white relative top-0 left-0 w-full overflow-hidden">
            {/* Adjusted height/margin if Sidebar is present in Layout. Usually Layout provides padding. 
            If this page is inside Layout, it might need to fit. 
            Let's assume Layout renders children in a main area.
        */}

            {/* Chat Sidebar */}
            <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur">
                    <h2 className="text-xl font-bold mb-4">Messages</h2>
                    <div className="flex gap-2 p-1 bg-gray-800 rounded-lg">
                        <button
                            onClick={() => setActiveTab('inbox')}
                            className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${activeTab === 'inbox' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            Inbox
                        </button>
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${activeTab === 'requests' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            Requests {requests.length > 0 && <span className="ml-1 bg-blue-600 text-xs px-1.5 py-0.5 rounded-full">{requests.length}</span>}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'inbox' ? (
                        <div className="flex flex-col">
                            {conversations.map((chat) => (
                                <button
                                    key={chat.requestId}
                                    onClick={() => setSelectedChat(chat)}
                                    className={`p-4 flex items-center gap-3 border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors text-left ${selectedChat?.requestId === chat.requestId ? 'bg-gray-800 border-l-2 border-l-blue-500' : ''}`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center font-bold text-sm">
                                        {chat.partner.username?.[0].toUpperCase() || "U"}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <h3 className="font-medium truncate">{chat.partner.username || "User"}</h3>
                                        <p className="text-sm text-gray-500 truncate">Click to chat</p>
                                    </div>
                                </button>
                            ))}
                            {conversations.length === 0 && <div className="p-8 text-center text-gray-500">No conversations yet</div>}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4 p-4">
                            {requests.map((req) => (
                                <div key={req._id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-sm">
                                            {req.sender.username?.[0].toUpperCase() || "U"}
                                        </div>
                                        <div>
                                            <h3 className="font-medium">{req.sender.username || "User"}</h3>
                                            <p className="text-xs text-gray-400">Wants to connect</p>
                                        </div>
                                    </div>
                                    {req.note && <p className="text-sm text-gray-300 mb-3 bg-gray-900/50 p-2 rounded italic">"{req.note}"</p>}
                                    <div className="text-xs text-gray-400 mb-3">
                                        Scheduled: {new Date(req.scheduledTime).toLocaleString()}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAcceptRequest(req._id)}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Check size={14} /> Accept
                                        </button>
                                        <button
                                            onClick={() => handleRejectRequest(req._id)}
                                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                                        >
                                            <X size={14} /> Decline
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {requests.length === 0 && <div className="text-center text-gray-500 py-4">No pending requests</div>}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-black">
                {selectedChat ? (
                    <>
                        {/* Header */}
                        <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/30">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center font-bold">
                                    {selectedChat.partner.username?.[0].toUpperCase() || "U"}
                                </div>
                                <div>
                                    <h2 className="font-bold">{selectedChat.partner.username || "User"}</h2>
                                    <span className="flex items-center gap-1.5 text-xs text-green-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> Online
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleGoogleMeet}
                                    className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
                                    title="Start Video Call (Google Meet)"
                                >
                                    <Video size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((msg, idx) => {
                                const isMe = msg.sender === user.id;
                                return (
                                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] rounded-2xl p-4 ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-800 text-gray-200 rounded-tl-none'}`}>
                                            <p>{msg.content}</p>
                                            <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'} text-right`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800 bg-gray-900/30">
                            <div className="flex items-center gap-4 bg-gray-800/50 p-2 rounded-2xl border border-gray-700 focus-within:border-blue-500 transition-colors">
                                <button
                                    type="button"
                                    onClick={handleFileUpload}
                                    className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                                >
                                    <Paperclip size={20} />
                                </button>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-transparent border-none focus:outline-none text-white placeholder-gray-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="p-2 bg-blue-600 rounded-xl text-white hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
                        <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <MessageSquare size={40} className="text-gray-600" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Your Messages</h3>
                        <p className="max-w-md text-center">Select a conversation from the sidebar or accept a request to start chatting.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
