
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

      {/* Image */}
      {image && (
        <div className='w-full h-[300px] overflow-hidden flex justify-center rounded-lg'>
          <img src={image} alt="" className='h-full object-cover hover:scale-[1.02] transition-transform duration-300' />
        </div>
      )}


      {/* Reactions & comments count */}
      <div className='flex justify-between items-center px-4 py-2 border-t border-b border-gray-200'>
        <div className='flex items-center gap-2 text-gray-600 text-sm'>
          {REACTIONS.map(r =>
            reactionSummary[r.key]?.length > 0 ? (
              <span key={r.key} className="flex items-center gap-1 group relative">
                {React.createElement(r.icon, { className: 'w-4 h-4', style: { color: r.color } })}
                <span>{reactionSummary[r.key].length}</span>
                {/* Tooltip with users */}
                <span className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white text-gray-800 text-xs rounded px-2 py-1 shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none z-30 min-w-[80px] text-center">
                  {reactionSummary[r.key].map(rx => rx.user?.firstName ? rx.user.firstName : "User").join(", ")}
                </span>
              </span>
            ) : null
          )}
        </div>
        <div
          className='flex items-center gap-2 text-gray-600 text-sm cursor-pointer hover:text-[#0077b5]'
          onClick={() => setShowComment(prev => !prev)}
        >
          <span>{comments?.length ?? 0}</span>
          <span>Comments</span>
        </div>
      </div>


      {/* Action buttons with reactions */}
      <div className='flex justify-around items-center text-gray-700 font-medium py-2 relative'>
        <div
          className='flex items-center gap-2 cursor-pointer hover:text-[#0077b5] relative'
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          <button
            onClick={() => handleLike(myReaction || "like")}
            disabled={!postId}
            title={!postId ? "Missing postId" : "Like"}
            className='flex items-center gap-2'
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
        <div
          className='flex items-center gap-2 cursor-pointer hover:text-[#0077b5]'
          onClick={() => setShowComment(prev => !prev)}
        >
          <FaRegCommentDots className='w-5 h-5' /><span>Comment</span>
        </div>
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
