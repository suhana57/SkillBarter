import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Send } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function RequestModal({ isOpen, onClose, recipientId, onSuccess }) {
    const [note, setNote] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const scheduledTime = new Date(`${date}T${time}`);
            await axios.post('http://localhost:5000/chat/request',
                { recipientId, note, scheduledTime },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to send request", error);
            alert("Failed to send request");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Send Message Request</h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Preferred Date & Time</label>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        required
                                        className="bg-[#2a2a2a] border border-gray-700 rounded-xl p-3 text-white flex-1 focus:outline-none focus:border-blue-500 transition-colors"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                    />
                                    <input
                                        type="time"
                                        required
                                        className="bg-[#2a2a2a] border border-gray-700 rounded-xl p-3 text-white flex-1 focus:outline-none focus:border-blue-500 transition-colors"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Note</label>
                                <textarea
                                    required
                                    placeholder="Why do you want to connect?"
                                    className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl p-3 text-white h-32 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Sending...' : (
                                    <>
                                        <span>Send Request</span>
                                        <Send size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
