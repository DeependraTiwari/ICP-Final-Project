import React, { useEffect, useState } from 'react';
import { post_canister } from '../canisters/post_canister';
import { useAuth } from '../App';

const MyPosts = () => {
  const { profile } = useAuth();
  const [posts, setPosts] = useState([]);

  const loadPosts = async () => {
    const data = await post_canister.get_posts_by_author(profile.user_principal, 0, 50);
    setPosts(data);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <div>
      <h2>My Posts</h2>
      {posts.map(p => (
        <div key={p.post.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
          <div><strong>{p.post.author_display}</strong></div>
          {p.post.image_key && <img src={`/assets/${p.post.image_key}`} alt="" style={{ width: '200px' }} />}
          <p>{p.post.content}</p>
          <div>Likes: {p.post.likes}</div>
          <div>Comments: {p.comments.length}</div>
        </div>
      ))}
    </div>
  );
};

export default MyPosts;
