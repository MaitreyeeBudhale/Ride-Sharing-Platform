import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import socket from "../sockets/socket";
import api from "../api/api";

export default function ActiveRideChat({ rideId, currentUser, recipientName }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Load message history & setup sockets
  useEffect(() => {
    if (!rideId || !isOpen) return;

    setLoading(true);

    // Fetch history
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/rides/${rideId}/messages`);
        if (res.data.success) {
          setMessages(res.data.messages || []);
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();

    // Join room
    socket.emit("join-ride-chat", { rideId });

    // Listen for new messages
    const handleMessage = (message) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === message.id || m._id === message._id)) {
          return prev;
        }
        return [...prev, message];
      });
    };

    socket.on("new-message", handleMessage);

    // Cleanup
    return () => {
      socket.emit("leave-ride-chat", { rideId });
      socket.off("new-message", handleMessage);
    };
  }, [rideId, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    socket.emit("send-message", {
      rideId,
      message: text.trim(),
    });

    setText("");
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-zinc-950 text-white p-4 rounded-full shadow-2xl hover:bg-zinc-800 transition-all transform hover:scale-105 flex items-center gap-2 z-[9999] border border-zinc-800"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-xs font-semibold pr-1">
          Chat with {recipientName || "partner"}
        </span>
        {messages.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
            {messages.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 md:w-96 h-[450px] bg-white rounded-3xl border border-zinc-200 shadow-2xl flex flex-col overflow-hidden z-[9999] transition-all duration-300 transform scale-100">
      {/* Chat Header */}
      <div className="bg-zinc-950 text-white px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <div>
            <h4 className="text-xs font-bold tracking-wide">
              {recipientName || "Partner"}
            </h4>
            <p className="text-[10px] text-zinc-400">Active Ride Chat</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-zinc-400 hover:text-white transition-all text-xs font-bold px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700"
        >
          Minimize
        </button>
      </div>

      {/* Message Area */}
      <div className="flex-1 p-4 overflow-y-auto bg-zinc-50 space-y-3.5">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            <span className="text-[11px] font-medium">
              Loading chat history...
            </span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-1.5 p-4 text-center">
            <div className="bg-zinc-100 p-3 rounded-full text-zinc-500">
              <MessageSquare className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-zinc-900 mt-2">
              No messages yet
            </p>
            <p className="text-[10px] text-zinc-500 leading-normal">
              Send a quick message to coordinate pickup or route details.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe =
              msg.senderId === currentUser?._id ||
              msg.senderId?._id === currentUser?._id;
            return (
              <div
                key={msg.id || msg._id || index}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs shadow-sm ${
                    isMe
                      ? "bg-zinc-900 text-white rounded-tr-none"
                      : "bg-white text-zinc-800 border border-zinc-100 rounded-tl-none"
                  }`}
                >
                  <p className="leading-relaxed break-words">{msg.message}</p>
                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      isMe ? "text-zinc-400" : "text-zinc-450"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-white border-t border-zinc-100 flex gap-2 items-center"
      >
        <input
          type="text"
          placeholder="Type your message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 px-4 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-full focus:outline-none focus:border-zinc-500 text-zinc-800 transition-colors"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="bg-zinc-950 text-white p-2 rounded-full hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-300 transition-all flex items-center justify-center shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
