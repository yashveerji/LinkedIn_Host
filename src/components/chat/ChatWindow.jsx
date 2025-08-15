// ChatBox.jsx

import React, { useEffect, useState, useContext } from "react";
import { userDataContext } from "../../context/UserContext";
import { authDataContext } from "../../context/AuthContext";
import { io } from "socket.io-client";
import { useConnections } from "../../hooks/useConnections";
import dp from "../../assets/dp.webp";
import axios from "axios";

const socket = io("http://localhost:8000", {
  withCredentials: true,
});



function ChatBox() {
  const { userData } = useContext(userDataContext);
  const { serverUrl } = useContext(authDataContext);
  const [receiverId, setReceiverId] = useState("");
  const [receiverObj, setReceiverObj] = useState(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const connections = useConnections();

  // Fetch chat history when receiverId changes
  useEffect(() => {
    if (!userData?._id) return;
    socket.emit("register", userData._id);
    socket.on("receive_message", (data) => {
      setChat((prev) => [...prev, { ...data, incoming: true }]);
    });
    return () => {
      socket.off("receive_message");
    };
  }, [userData]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!userData?._id || !receiverId) return;
      try {
        const res = await axios.get(`${serverUrl}/api/chat/history/${receiverId}`, {
          withCredentials: true,
        });
        // Mark messages as incoming or outgoing
        const items = (res.data.items || []).map(msg => ({
          ...msg,
          incoming: msg.from !== userData._id,
        }));
        setChat(items);
      } catch (err) {
        setChat([]);
      }
    };
    fetchHistory();
  }, [receiverId, userData, serverUrl]);

  const sendMessage = () => {
    if (!receiverId || !message.trim() || !userData?._id) return;
    setChat((prev) => [
      ...prev,
      { senderId: userData._id, text: message, incoming: false },
    ]);
    socket.emit("send_message", {
      senderId: userData._id,
      receiverId,
      text: message,
    });
    setMessage("");
  };

  // No registration step needed, always show chat UI if logged in
  if (!userData?._id) {
    return (
      <div className="w-full flex items-center justify-center h-screen bg-gradient-to-br from-[#1A1F71] to-[#2C2C2C]">
        <div className="bg-white p-6 rounded-lg shadow-md w-96 text-center text-gray-700 font-semibold">
          Please log in to use chat.
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#1A1F71] to-[#2C2C2C] px-2 py-4">
      <div className="bg-white w-full max-w-md h-[80vh] max-h-[700px] rounded-lg shadow-md flex flex-col p-2 sm:p-4 mt-4 sm:mt-[100px]">
        {/* Chat Header */}
  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 justify-center">
          {receiverObj ? (
            <>
              <img src={receiverObj.profileImage || dp} alt="" className="w-9 h-9 rounded-full border" />
              <span className="text-lg font-semibold text-gray-800">{receiverObj.firstName} {receiverObj.lastName}</span>
            </>
          ) : (
            <span className="text-lg font-semibold text-gray-800">Real-Time Chat</span>
          )}
        </div>
        {/* Connection Suggestions */}
        {connections.length > 0 && (
          <div className="mb-2 sm:mb-3">
            <div className="text-xs sm:text-sm text-gray-700 mb-1">Start chat with:</div>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {connections.map(conn => (
                <button
                  key={conn._id}
                  className={`flex items-center gap-1 sm:gap-2 px-2 py-1 rounded-full border text-xs sm:text-sm ${receiverId === conn._id ? "bg-blue-100 border-blue-400" : "bg-gray-100 border-gray-300"}`}
                  onClick={() => {
                    setReceiverId(conn._id);
                    setReceiverObj(conn);
                  }}
                >
                  <img src={conn.profileImage || dp} alt="" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full" />
                  <span className="text-xs text-gray-800">{conn.firstName} {conn.lastName}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Show selected receiver */}
        {receiverObj && (
          <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
            <img src={receiverObj.profileImage || dp} alt="" className="w-6 h-6 sm:w-7 sm:h-7 rounded-full" />
            <span className="text-xs sm:text-sm text-gray-700 font-semibold">Chatting with {receiverObj.firstName} {receiverObj.lastName}</span>
          </div>
        )}
        {/* Chat Messages */}
        <div
          className="flex-1 overflow-y-auto border border-gray-300 rounded p-1 sm:p-2 mb-2 sm:mb-3 bg-gray-50 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
          {chat.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.incoming ? "justify-start" : "justify-end"} mb-1 sm:mb-2`}
            >
              <span
                className={`px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm ${msg.incoming ? "bg-gray-300 text-black" : "bg-blue-500 text-white"}`}
              >
                {msg.text}
              </span>
            </div>
          ))}
        </div>
        {/* Message Input */}
        <div className="flex mt-auto">
          <input
            type="text"
            placeholder="Type message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="flex-1 p-2 sm:p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-400 text-black text-xs sm:text-base"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 rounded-r transition duration-200 text-xs sm:text-base"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatBox;
