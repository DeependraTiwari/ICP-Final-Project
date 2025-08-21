import React, { useState } from "react";
import { post_canister } from "../canisters";
import { useAuth } from "../AuthProvider";

const CreatePost = () => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() && !image) return;
    setSubmitting(true);
    try {
      const imageKey = image ? image.name : null;
      await post_canister.create_post(user.name, content, imageKey ? imageKey : null);
      setContent("");
      setImage(null);
      alert("Post created!");
    } catch (err) {
      alert(err);
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-md mx-auto">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        className="w-full p-2 mb-2 rounded text-black"
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
        className="mb-2"
      />
      <button
        disabled={submitting}
        onClick={handleSubmit}
        className="w-full bg-yellow-400 text-gray-900 py-2 rounded font-semibold"
      >
        Post
      </button>
    </div>
  );
};

export default CreatePost;
