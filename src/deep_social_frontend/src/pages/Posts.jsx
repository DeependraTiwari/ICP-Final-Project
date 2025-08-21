import React, { useEffect, useState } from 'react';
import { post_canister } from '../canisters/post_canister';
import { useAuth } from '../App';

const Posts = () => {
  const { profile } = useAuth();
  const [posts, setPosts] = useState([]);

  const loadPosts = async () => {
    const data = await post_canister.get_posts_paginated(0, 50);
    setPosts(data);
  };

  const like = async (id) => {
    await post_canister.like_post(id);
    loadPosts();
  };

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <div>
      <h2>All Posts</h2>
      {posts.map(p => (
        <div key={p.post.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
          <div><strong>{p.post.author_display}</strong></div>
          {p.post.image_key && <img src={`/assets/${p.post.image_key}`} alt="" style={{ width: '200px' }} />}
          <p>{p.post.content}</p>
          <div>Likes: {p.post.likes}</div>
          {p.post.author !== profile.user_principal && <button onClick={() => like(p.post.id)}>Like</button>}
        </div>
      ))}
    </div>
  );
};

export default Posts;
