import React, { useState } from 'react';
import { useAuth } from '../App';
import { post_canister } from '../canisters/post_canister';

const CreatePost = () => {
  const { profile } = useAuth();
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState('');

  const handlePost = async () => {
    try {
      const imageKey = image ? image.name : null;
      await post_canister.create_post(profile.name, content, imageKey);
      setMessage('Post created!');
      setContent('');
      setImage(null);
    } catch (err) {
      setMessage(err.toString());
    }
  };

  return (
    <div>
      <h2>Create Post</h2>
      <textarea placeholder="What's on your mind?" value={content} onChange={e => setContent(e.target.value)} />
      <input type="file" onChange={e => setImage(e.target.files[0])} />
      <button onClick={handlePost}>Post</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default CreatePost;
