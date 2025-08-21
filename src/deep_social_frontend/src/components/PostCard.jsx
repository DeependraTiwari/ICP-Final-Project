import React, { useState } from "react";
import { post_canister } from "../canisters";
import { useAuth } from "../AuthProvider";

const PostCard = ({ postDetail, refreshPosts }) => {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLike = async () => {
    try {
      await post_canister.like_post(postDetail.post.id);
      refreshPosts();
    } catch (err) {
      alert(err);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await post_canister.comment_post(
        postDetail.post.id,
        user.name,
        commentText
      );
      setCommentText("");
      refreshPosts();
    } catch (err) {
      alert(err);
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-4 shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <img
          src={postDetail.post.author_display === "User 1" ? "/profile1.png" :
               postDetail.post.author_display === "User 2" ? "/profile2.png" :
               postDetail.post.author_display === "User 3" ? "/profile3.png" : "/default_avatar.png"}
          className="w-10 h-10 rounded-full"
          alt="avatar"
        />
        <div className="font-semibold">{postDetail.post.author_display}</div>
      </div>
      {postDetail.post.content && <p className="mb-2">{postDetail.post.content}</p>}
      {postDetail.post.image_key && (
        <img
          src={`/${postDetail.post.image_key}`}
          alt="post"
          className="mb-2 max-h-96 w-full object-cover rounded"
        />
      )}
      <div className="flex gap-4 items-center mb-2">
        {user.user_principal !== postDetail.post.author && (
          <button
            className={`px-2 py-1 rounded ${
              postDetail.liked_by_caller ? "bg-gray-600" : "bg-yellow-400 text-gray-900"
            }`}
            onClick={handleLike}
          >
            Like ({postDetail.post.likes})
          </button>
        )}
      </div>
      <div className="mt-2">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add comment..."
          className="w-full p-2 rounded text-black"
        />
        <button
          disabled={submitting}
          onClick={handleComment}
          className="mt-1 bg-yellow-400 text-gray-900 px-3 py-1 rounded"
        >
          Comment
        </button>
        <div className="mt-2">
          {postDetail.comments.map((c) => (
            <div key={c.id} className="text-sm mb-1">
              <span className="font-semibold">{c.author_display}: </span>
              {c.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PostCard;
