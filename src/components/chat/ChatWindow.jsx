// ChatBox.jsx

import React, { useEffect, useState, useContext } from "react";
import { userDataContext } from "../../context/UserContext";
import { io } from "socket.io-client";
import { useConnections } from "../../hooks/useConnections";
import dp from "../../assets/dp.webp";

const socket = io("http://localhost:8000", {
  withCredentials: true,
});


function ChatBox() {
  const { userData } = useContext(userDataContext);
  const [receiverId, setReceiverId] = useState("");
  const [receiverObj, setReceiverObj] = useState(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const connections = useConnections();

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
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#1A1F71] to-[#2C2C2C]">
      <div className="bg-white mt-[100px] w-96 h-[600px] rounded-lg shadow-md flex flex-col p-4">
        {/* Chat Header */}
        <div className="flex items-center gap-3 mb-4 justify-center">
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
          <div className="mb-3">
            <div className="text-sm text-gray-700 mb-1">Start chat with:</div>
            <div className="flex flex-wrap gap-2">
              {connections.map(conn => (
                <button
                  key={conn._id}
                  className={`flex items-center gap-2 px-2 py-1 rounded-full border ${receiverId === conn._id ? "bg-blue-100 border-blue-400" : "bg-gray-100 border-gray-300"}`}
                  onClick={() => {
                    setReceiverId(conn._id);
                    setReceiverObj(conn);
                  }}
                >
                  <img src={conn.profileImage || dp} alt="" className="w-6 h-6 rounded-full" />
                  <span className="text-xs text-gray-800">{conn.firstName} {conn.lastName}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Show selected receiver */}
        {receiverObj && (
          <div className="flex items-center gap-2 mb-2">
            <img src={receiverObj.profileImage || dp} alt="" className="w-7 h-7 rounded-full" />
            <span className="text-sm text-gray-700 font-semibold">Chatting with {receiverObj.firstName} {receiverObj.lastName}</span>
          </div>
        )}
        {/* Chat Messages */}
        <div
          className="flex-1 overflow-y-auto border border-gray-300 rounded p-2 mb-3 h-56 bg-gray-50 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
          {chat.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.incoming ? "justify-start" : "justify-end"} mb-2`}
            >
              <span
                className={`px-3 py-2 rounded-lg text-sm ${msg.incoming ? "bg-gray-300 text-black" : "bg-blue-500 text-white"}`}
              >
                {msg.text}
              </span>
            </div>
          ))}
        </div>
        {/* Message Input */}
        <div className="flex">
          <input
            type="text"
            placeholder="Type message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded-r transition duration-200"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatBox;
