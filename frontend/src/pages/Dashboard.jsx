import { useState, useEffect } from "react";
import { fetchMatches, fetchUser } from "../api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import RequestModal from "../components/RequestModal";
import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const searchParam = params.get("search");
        if (searchParam) {
            setQuery(searchParam);
            fetchMatches(searchParam).then(({ data }) => setResults(data.filter(u => u._id !== user.id))).catch(console.error);
        } else {
            // Fetch default recommendations (all users)
            fetchMatches("").then(({ data }) => setResults(data.filter(u => u._id !== user.id))).catch(console.error);
        }
    }, []);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        try {
            const { data } = await fetchMatches(query);
            // Filter out self
            setResults(data.filter(u => u._id !== user.id));
        } catch (error) {
            console.error("Search failed", error);
        }
        setLoading(false);
    };

    return (
        <div className="relative w-full min-h-screen bg-black text-white overflow-x-hidden">
            {/* 3D Background */}
            <div className="fixed inset-0 z-0">
                <Canvas>
                    <Stars radius={150} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />
                </Canvas>
            </div>

            {/* Navbar */}
            <nav className="relative z-10 flex justify-between items-center p-6 bg-gray-900 bg-opacity-80 backdrop-blur-md border-b border-gray-800">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    SkillBarter
                </h1>
                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="font-semibold">{user?.username}</span>
                        <span className="text-xs text-yellow-400">Credits: {user?.credits || 0}</span>
                    </div>
                    <button onClick={() => navigate("/chat")} className="text-sm hover:text-blue-400 transition">
                        Inbox
                    </button>
                    <button onClick={logout} className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition">
                        Logout
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <div className="relative z-10 container mx-auto p-6 flex flex-col items-center">
                {/* Search Section */}
                <div className="w-full max-w-2xl mt-10 text-center">
                    <h2 className="text-4xl font-bold mb-4">Find your personalized tutor.</h2>
                    <p className="text-gray-400 mb-8">
                        Use semantic search powered by Gemini. Type functionality (e.g., "I need help with Thermodynamics" or "Who can teach React?")
                    </p>
                    <div className="flex gap-2 relative">
                        <input
                            type="text"
                            placeholder="Describe what you need help with..."
                            className="w-full p-4 rounded-xl bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none text-lg"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        />
                        <button
                            onClick={handleSearch}
                            className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-bold transition"
                        >
                            {loading ? "Searching..." : "Search"}
                        </button>
                    </div>
                </div>

                {/* Results Grid */}
                <div className="w-full max-w-5xl mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.length > 0 ? (
                        results.map((profile) => (
                            <div key={profile._id} className="bg-gray-900 border border-gray-800 p-6 rounded-xl hover:border-blue-500 transition duration-300 group">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold">{profile.username}</h3>
                                    <span className="bg-gray-800 text-xs px-2 py-1 rounded border border-gray-700">
                                        Match Score: {Math.round(profile.score * 100)}%
                                    </span>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider">Teaches</p>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {profile.skills.filter(s => s.type === 'teach').map((s, i) => (
                                                <span key={i} className="text-sm bg-green-900 text-green-300 px-2 py-0.5 rounded">
                                                    {s.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider">Bio</p>
                                        <p className="text-sm text-gray-300 line-clamp-2">{profile.bio || "No bio available."}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setActiveChat(profile)}
                                    className="w-full bg-gray-800 hover:bg-blue-600 group-hover:bg-blue-600 text-white py-2 rounded transition font-semibold"
                                >
                                    Message / Request
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center text-gray-500 mt-10">
                            {query ? "No matches found. Try specific keywords." : "Search to see tutors here."}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Overlay */}
            {activeChat && (
                <RequestModal
                    isOpen={!!activeChat}
                    recipientId={activeChat._id}
                    onClose={() => setActiveChat(null)}
                    onSuccess={() => {
                        setActiveChat(null);
                        alert("Request sent successfully!"); // Simple feedback
                    }}
                />
            )}
        </div>
    );
}
