use candid::{CandidType, Deserialize, Principal};
use ic_cdk::api;
use ic_cdk_macros::{init, query, update, pre_upgrade, post_upgrade};
use std::collections::{HashMap, HashSet};

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct Comment {
    pub id: u64,
    pub post_id: u64,
    pub author: Principal,
    pub author_display: String,
    pub text: String,
    pub timestamp_ns: u64,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct Post {
    pub id: u64,
    pub author: Principal,
    pub author_display: String,
    pub content: String,
    pub image_key: Option<String>, // e.g., "feed1.png"
    pub timestamp_ns: u64,
    pub likes: u64,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct PostDetail {
    pub post: Post,
    pub comments: Vec<Comment>,
    pub liked_by_caller: bool,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct SeedPost {
    pub author: Principal,
    pub author_display: String,
    pub content: String,
    pub image_key: Option<String>,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct InitArg {
    pub seed_posts: Vec<SeedPost>,
}

thread_local! {
    static POSTS: std::cell::RefCell<Vec<Post>> = std::cell::RefCell::new(Vec::new());
    static COMMENTS: std::cell::RefCell<Vec<Comment>> = std::cell::RefCell::new(Vec::new());
    static LIKES: std::cell::RefCell<HashMap<u64, HashSet<Principal>>> = std::cell::RefCell::new(HashMap::new());
}

#[init]
fn init(arg: Option<InitArg>) {
    if let Some(seed) = arg {
        let now = api::time();
        let mut id_counter = 0u64;
        POSTS.with(|p| {
            let mut v = p.borrow_mut();
            for s in seed.seed_posts {
                id_counter += 1;
                v.push(Post {
                    id: id_counter,
                    author: s.author,
                    author_display: s.author_display,
                    content: s.content,
                    image_key: s.image_key,
                    timestamp_ns: now,
                    likes: 0,
                });
            }
        });
    }
}

#[pre_upgrade]
fn pre_upgrade() {
    let posts = POSTS.with(|p| p.borrow().clone());
    let comments = COMMENTS.with(|c| c.borrow().clone());
    let likes = LIKES.with(|l| l.borrow().clone());
    ic_cdk::storage::stable_save((posts, comments, likes)).unwrap();
}

#[post_upgrade]
fn post_upgrade() {
    if let Ok((posts, comments, likes)) = ic_cdk::storage::stable_restore::<(Vec<Post>, Vec<Comment>, HashMap<u64, HashSet<Principal>>)>() {
        POSTS.with(|p| *p.borrow_mut() = posts);
        COMMENTS.with(|c| *c.borrow_mut() = comments);
        LIKES.with(|l| *l.borrow_mut() = likes);
    }
}

// ----- Helpers -----
fn can_like(caller: Principal, p: &Post) -> Result<(), String> {
    if caller == p.author { return Err("cannot like your own post".into()); }
    let already = LIKES.with(|l| l.borrow().get(&p.id).map(|s| s.contains(&caller)).unwrap_or(false));
    if already { return Err("already liked".into()); }
    Ok(())
}

// ----- API -----

#[update]
fn create_post(author_display: String, content: String, image_key: Option<String>) -> Result<Post, String> {
    if content.trim().is_empty() && image_key.is_none() {
        return Err("either content or image_key required".into());
    }
    let me = ic_cdk::caller();
    let now = api::time();
    let post = POSTS.with(|p| {
        let mut v = p.borrow_mut();
        let id = v.len() as u64 + 1;
        let post = Post {
            id,
            author: me,
            author_display,
            content,
            image_key,
            timestamp_ns: now,
            likes: 0,
        };
        v.push(post.clone());
        post
    });
    Ok(post)
}

#[update]
fn like_post(id: u64) -> Result<Post, String> {
    let me = ic_cdk::caller();
    POSTS.with(|p| {
        let mut v = p.borrow_mut();
        let post = v.iter_mut().find(|x| x.id == id).ok_or("not found")?;
        can_like(me, post)?;
        LIKES.with(|l| {
            let mut map = l.borrow_mut();
            map.entry(id).or_insert_with(HashSet::new).insert(me);
        });
        post.likes = post.likes.saturating_add(1);
        Ok(post.clone())
    })
}

#[update]
fn comment_post(id: u64, author_display: String, text: String) -> Result<Comment, String> {
    if text.trim().is_empty() { return Err("empty comment".into()); }
    let me = ic_cdk::caller();
    let now = api::time();
    POSTS.with(|p| {
        let v = p.borrow();
        if !v.iter().any(|x| x.id == id) { return Err::<(), String>("post not found".to_string()); }
        Ok(())
    })?;
    let comment = COMMENTS.with(|c| {
        let mut v = c.borrow_mut();
        let cid = v.len() as u64 + 1;
        let cm = Comment { id: cid, post_id: id, author: me, author_display, text, timestamp_ns: now };
        v.push(cm.clone());
        cm
    });
    Ok(comment)
}

#[query]
fn get_posts_paginated(offset: u64, limit: u64) -> Vec<PostDetail> {
    let caller = ic_cdk::caller();
    let mut list = POSTS.with(|p| p.borrow().clone());
    list.sort_by_key(|p| std::cmp::Reverse(p.timestamp_ns));
    let start = offset as usize;
    let chosen: Vec<Post> = list.into_iter().skip(start).take(limit as usize).collect();

    chosen.into_iter().map(|post| {
        let comments = COMMENTS.with(|c| c.borrow().iter().filter(|cm| cm.post_id == post.id).cloned().collect());
        let liked = LIKES.with(|l| l.borrow().get(&post.id).map(|s| s.contains(&caller)).unwrap_or(false));
        PostDetail { post, comments, liked_by_caller: liked }
    }).collect()
}

#[query]
fn get_posts_by_author(author: Principal, offset: u64, limit: u64) -> Vec<PostDetail> {
    let caller = ic_cdk::caller();
    let mut list: Vec<Post> = POSTS.with(|p| p.borrow().iter().filter(|x| x.author == author).cloned().collect());
    list.sort_by_key(|p| std::cmp::Reverse(p.timestamp_ns));
    let chosen: Vec<Post> = list.into_iter().skip(offset as usize).take(limit as usize).collect();

    chosen.into_iter().map(|post| {
        let comments = COMMENTS.with(|c| c.borrow().iter().filter(|cm| cm.post_id == post.id).cloned().collect());
        let liked = LIKES.with(|l| l.borrow().get(&post.id).map(|s| s.contains(&caller)).unwrap_or(false));
        PostDetail { post, comments, liked_by_caller: liked }
    }).collect()
}

ic_cdk::export_candid!();
