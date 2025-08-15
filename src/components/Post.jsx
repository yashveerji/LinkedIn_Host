
import React, { useContext, useEffect, useState } from 'react';
import dp from "../assets/dp.webp";
import moment from "moment";
import { FaRegCommentDots } from "react-icons/fa";
import { BiLike, BiSolidLike } from "react-icons/bi";
import { REACTIONS } from "./Reactions";
import { LuSendHorizontal } from "react-icons/lu";
import axios from 'axios';
import { authDataContext } from '../context/AuthContext';
import { userDataContext } from '../context/UserContext';
import { io } from "socket.io-client";
import ConnectionButton from './ConnectionButton';

// Socket origin (keep same as backend)
let socket = io("http://localhost:8000", { withCredentials: true });

// ...existing code...

function Post(props) {
  // Delete post
  const handleDeletePost = async () => {
    if (!postId) return;
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await axios.delete(`${serverUrl}/api/post/delete/${postId}`, { withCredentials: true });
      // Optionally, you can add a callback or state update here to remove the post from the UI
      window.location.reload(); // fallback: reload page to reflect deletion
    } catch (error) {
      alert("Failed to delete post");
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!postId || !commentId) return;
    if (!window.confirm("Delete this comment?")) return;
    try {
      await axios.delete(`${serverUrl}/api/post/comment/${postId}/${commentId}`, { withCredentials: true });
      setComments(comments.filter(c => c._id !== commentId));
    } catch (error) {
      alert("Failed to delete comment");
    }
  };
  const {
    id, _id, author = {}, like = [], comment = [], description = "",
    image, createdAt,
  } = props;

  const postId = id || _id;

  const [more, setMore] = useState(false);
  const { serverUrl } = useContext(authDataContext);
  const { userData, handleGetProfile } = useContext(userDataContext);

  const [reactions, setReactions] = useState(props.reactions || []);
  const [showReactions, setShowReactions] = useState(false);
  const [myReaction, setMyReaction] = useState(null);
  // Reaction summary: { like: [user, ...], love: [user, ...], ... }
  const reactionSummary = REACTIONS.reduce((acc, r) => {
    acc[r.key] = reactions.filter(rx => rx.type === r.key);
    return acc;
  }, {});
  const [commentContent, setCommentContent] = useState("");
  const [comments, setComments] = useState(comment || []);
  const [showComment, setShowComment] = useState(false);

  useEffect(() => {
    setReactions(props.reactions || []);
    setComments(comment || []);
    // Set my reaction
    if (props.reactions && userData?._id) {
      const mine = props.reactions.find(r => r.user && (r.user._id === userData._id || r.user === userData._id));
      setMyReaction(mine ? mine.type : null);
    }
  }, [props.reactions, comment, userData]);

  useEffect(() => {
    const onLike = ({ postId: changedId, reactions }) => {
      if (changedId === postId) setReactions(reactions || []);
    };
    const onComment = ({ postId: changedId, comm }) => {
      if (changedId === postId) setComments(comm || []);
    };
    socket.on("likeUpdated", onLike);
    socket.on("commentAdded", onComment);
    return () => {
      socket.off("likeUpdated", onLike);
      socket.off("commentAdded", onComment);
    };
  }, [postId]);

  const handleLike = async (reaction = "like") => {
    if (!postId) {
      console.warn("Missing postId — pass id={post._id}");
      return;
    }
    setMyReaction(reaction);
    setShowReactions(false);
    try {
      const res = await axios.post(
        `${serverUrl}/api/post/like/${postId}`,
        { type: reaction },
        { withCredentials: true }
      );
      setReactions(res.data?.reactions || []);
    } catch (error) {
      console.log("Like error:", error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!postId) {
      console.warn("Missing postId — pass id={post._id}");
      return;
    }
    const content = commentContent.trim();
    if (!content) return;
    try {
      const res = await axios.post(
        `${serverUrl}/api/post/comment/${postId}`,
        { content },
        { withCredentials: true }
      );
      setComments(res.data?.comment || []);
      setCommentContent("");
    } catch (error) {
      console.log("Comment error:", error);
    }
  };


  // Handler for reposting a post
  const handleRepost = async () => {
    if (!postId) return;
    try {
      await axios.post(`${serverUrl}/api/post/repost/${postId}`, {}, { withCredentials: true });
      alert("Reposted successfully!");
    } catch (error) {
      alert("Failed to repost");
    }
  };

  // Handler for sending post to chat
  const handleSendToChat = async () => {
    if (!postId) return;
    try {
      alert("Send to Chat: " + (description || "[No description]") + (image ? " [Image attached]" : ""));
    } catch (error) {
      alert("Failed to send to chat");
    }
  };

  return (
    <div className="w-full min-h-[200px] flex flex-col gap-4 bg-white rounded-xl shadow-md p-5 transition-all hover:shadow-lg">

      {/* Header */}
      <div className='flex justify-between items-center'>
        <div
          className='flex gap-3 items-start cursor-pointer'
          onClick={() => author?.userName && handleGetProfile(author.userName)}
        >
          <div className='w-[60px] h-[60px] rounded-full overflow-hidden flex items-center justify-center border border-gray-200 shadow-sm'>
            <img src={author?.profileImage || dp} alt="" className='h-full w-full object-cover' />
          </div>
          <div>
            <div className='text-lg font-semibold hover:text-[#0077b5] transition-colors'>
              {`${author?.firstName ?? ""} ${author?.lastName ?? ""}`}
            </div>
            <div className='text-sm text-gray-600'>{author?.headline}</div>
            <div className='text-xs text-gray-500'>{createdAt ? moment(createdAt).fromNow() : ""}</div>
          </div>
        </div>

        {/* Show delete post button for post owner */}
        {userData?._id && author?._id && userData._id === author._id && (
          <button
            className="text-red-500 hover:underline text-sm ml-2"
            onClick={handleDeletePost}
            title="Delete Post"
          >
            Delete
          </button>
        )}
        {userData?._id && author?._id && userData._id !== author._id && (
          <ConnectionButton userId={author._id} />
        )}
      </div>


      {/* Post image */}
      {image && (
        <div className="w-full flex justify-center items-center my-2">
          <img src={image} alt="Post" className="max-h-96 rounded-lg object-contain" />
        </div>
      )}

      {/* Post description */}
      <div className={`w-full ${!more ? "max-h-[100px] overflow-hidden" : ""} pl-[60px] text-gray-800`}>
        {description}
      </div>
      {description?.length > 120 && (
        <div
          className="pl-[60px] text-sm font-medium text-[#0077b5] cursor-pointer hover:underline"
          onClick={() => setMore(prev => !prev)}
        >
          {more ? "Read less..." : "Read more..."}
        </div>
      )}




      {/* Action buttons with reactions, repost, and send to chat */}
      <div className='flex flex-wrap justify-around items-center text-gray-700 font-medium py-2 relative gap-2'>
        {/* Like/Reaction */}
        <div className='relative inline-block'>
          <div
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
          >
            <button
              onClick={() => handleLike(myReaction || "like")}
              disabled={!postId}
              title={!postId ? "Missing postId" : "Like"}
              className='flex items-center gap-2 hover:text-[#0077b5]'
            >
              {myReaction ? (
                <span style={{ color: REACTIONS.find(r => r.key === myReaction)?.color }}>
                  {React.createElement(REACTIONS.find(r => r.key === myReaction)?.icon, { className: 'w-5 h-5' })}
                </span>
              ) : (
                <BiLike className='w-5 h-5' />
              )}
              <span>{myReaction ? REACTIONS.find(r => r.key === myReaction)?.label : "Like"}</span>
            </button>
            {/* Reaction Picker */}
            {showReactions && (
              <div className="absolute bottom-8 left-0 bg-white shadow-lg rounded-full flex gap-2 px-3 py-2 z-20 border border-gray-200">
                {REACTIONS.map(r => (
                  <button
                    key={r.key}
                    title={r.label}
                    onClick={() => handleLike(r.key)}
                    style={{ color: r.color }}
                    className="hover:scale-125 transition-transform"
                  >
                    {React.createElement(r.icon, { className: 'w-6 h-6' })}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Comment */}
        <button
          className='flex items-center gap-2 hover:text-[#0077b5]'
          onClick={() => setShowComment(prev => !prev)}
        >
          <span className='flex items-center gap-1'>
            <FaRegCommentDots className='w-5 h-5' />
            <span>Comment</span>
          </span>
        </button>
        {/* Repost */}
        <button
          className='flex items-center gap-2 hover:text-green-600'
          onClick={handleRepost}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75v-1.5A6.75 6.75 0 0111.25 4.5h1.5M19.5 11.25v1.5A6.75 6.75 0 0112.75 19.5h-1.5M8.25 15.75L4.5 12m0 0l3.75-3.75M15.75 8.25L19.5 12m0 0l-3.75 3.75" />
          </svg>
          <span>Repost</span>
        </button>
        {/* Send to Chat */}
        <button
          className='flex items-center gap-2 hover:text-purple-600'
          onClick={handleSendToChat}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 2.25l-9.193 9.193m0 0l-3.182 8.182a.563.563 0 00.728.728l8.182-3.182m-5.728-5.728l8.182-8.182a.563.563 0 01.728.728l-8.182 8.182z" />
          </svg>
          <span>Send to Chat</span>
        </button>
      </div>
      {/* Comments section */}
      {showComment && (
        <div className='mt-2'>
          <form
            className="flex justify-between items-center border border-gray-200 rounded-full px-4 py-1 bg-white"
            onSubmit={handleComment}
          >
            <input
              type="text"
              placeholder="Leave a comment..."
              className='flex-1 outline-none border-none text-sm text-black placeholder-gray-500'
              style={{ color: "#000", backgroundColor: "#fff" }}
              autoComplete="off"
              spellCheck={false}
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
            />
            <button type="submit" disabled={!postId} title={!postId ? "Missing postId" : "Send"}>
              <LuSendHorizontal className="text-[#07a4ff] w-5 h-5" />
            </button>
          </form>

          {/* Comment list */}
          <div className='mt-3 flex flex-col gap-3'>
            {comments?.map((com) => (
              <div key={com._id} className='flex flex-col gap-1 border-b border-gray-200 pb-2'>
                <div className="flex items-center gap-2">
                  <div className='w-[35px] h-[35px] rounded-full overflow-hidden'>
                    <img src={com.user?.profileImage || dp} alt="" className='h-full w-full object-cover' />
                  </div>
                  <div className='text-sm font-semibold'>{`${com.user?.firstName ?? ""} ${com.user?.lastName ?? ""}`}</div>
                  {/* Delete comment button for comment owner */}
                  {userData?._id && com.user?._id && userData._id === com.user._id && (
                    <button
                      className="text-xs text-red-500 hover:underline ml-2"
                      onClick={() => handleDeleteComment(com._id)}
                      title="Delete Comment"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <div className='pl-[45px] text-sm text-gray-700'>{com.content}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Post;
