import React, { useContext, useEffect, useState } from 'react';
import dp from "../assets/dp.webp";
import moment from "moment";
import { FaRegCommentDots } from "react-icons/fa";
import { BiLike, BiSolidLike } from "react-icons/bi";
import { LuSendHorizontal } from "react-icons/lu";
import axios from 'axios';
import { authDataContext } from '../context/AuthContext';
import { userDataContext } from '../context/UserContext';
import { io } from "socket.io-client";
import ConnectionButton from './ConnectionButton';

// Socket origin (keep same as backend)
let socket = io("http://localhost:8000", { withCredentials: true });

function Post(props) {
  const {
    id, _id, author = {}, like = [], comment = [], description = "",
    image, createdAt,
  } = props;

  const postId = id || _id;

  const [more, setMore] = useState(false);
  const { serverUrl } = useContext(authDataContext);
  const { userData, handleGetProfile } = useContext(userDataContext);

  const [likes, setLikes] = useState(like || []);
  const [commentContent, setCommentContent] = useState("");
  const [comments, setComments] = useState(comment || []);
  const [showComment, setShowComment] = useState(false);

  useEffect(() => {
    setLikes(like || []);
    setComments(comment || []);
  }, [like, comment]);

  useEffect(() => {
    const onLike = ({ postId: changedId, likes }) => {
      if (changedId === postId) setLikes(likes || []);
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

  const handleLike = async () => {
    if (!postId) {
      console.warn("Missing postId — pass id={post._id}");
      return;
    }
    try {
      const res = await axios.get(`${serverUrl}/api/post/like/${postId}`, { withCredentials: true });
      setLikes(res.data?.like || []);
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

      {/* Likes & comments count */}
      <div className='flex justify-between items-center px-4 py-2 border-t border-b border-gray-200'>
        <div className='flex items-center gap-2 text-gray-600 text-sm'>
          <BiLike className='text-[#1ebbff] w-4 h-4' /><span>{likes?.length ?? 0}</span>
        </div>
        <div
          className='flex items-center gap-2 text-gray-600 text-sm cursor-pointer hover:text-[#0077b5]'
          onClick={() => setShowComment(prev => !prev)}
        >
          <span>{comments?.length ?? 0}</span>
          <span>Comments</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className='flex justify-around items-center text-gray-700 font-medium py-2'>
        {!likes?.includes(userData?._id) ? (
          <button
            className='flex items-center gap-2 cursor-pointer hover:text-[#0077b5]'
            onClick={handleLike}
            disabled={!postId}
            title={!postId ? "Missing postId" : "Like"}
          >
            <BiLike className='w-5 h-5' /><span>Like</span>
          </button>
        ) : (
          <button
            className='flex items-center gap-2 cursor-pointer text-[#07a4ff]'
            onClick={handleLike}
            disabled={!postId}
            title={!postId ? "Missing postId" : "Unlike"}
          >
            <BiSolidLike className='w-5 h-5' /><span className="font-semibold">Liked</span>
          </button>
        )}

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
