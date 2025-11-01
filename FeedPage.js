import React, { useEffect, useState, useCallback } from "react";

// --- SVG Icon Components ---
const HeartIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>);
const CommentIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>);
const ShareIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>);
const AlertTriangleIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-red-400"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
const ShieldCheckIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>);
const ShieldOffIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.16 1.18"/><path d="M4.73 4.73 4 5v7c0 6 8 10 8 10a20.29 20.29 0 0 0 5.62-4.38"/><line x1="1" y1="1" x2="23" y2="23"/></svg>);
const EyeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>);
const EyeOffIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>);
const RefreshCwIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>);

const App = () => {
  const [posts, setPosts] = useState([]);
  const [isDetectionActive, setIsDetectionActive] = useState(true);
  const [showHidden, setShowHidden] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFeed = useCallback(async () => {
    setIsLoading(true);
    try {
      const [picsRes, videosRes] = await Promise.all([
        fetch(`http://localhost:8000/feed?subreddit=pics&limit=10`),
        fetch(`http://localhost:8000/feed?subreddit=videos&limit=10`)
      ]);

      if (!picsRes.ok || !videosRes.ok) throw new Error("Network response was not ok");

      const pics = await picsRes.json();
      const videos = await videosRes.json();

      const combined = [...pics, ...videos].map((item, idx) => ({
        id: item.url + idx + Math.random(),
        author: `User_${Math.floor(Math.random() * 1000)}`,
        avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random()*70)}`,
        content: item.title,
        image: item.media_type === "image" ? item.url : undefined,
        video: item.media_type === "video" ? item.url : undefined,
        url: item.url,
        likes: Math.floor(Math.random() * 5000),
        comments: Math.floor(Math.random() * 500),
        shares: Math.floor(Math.random() * 1000),
        timestamp: `${Math.floor(Math.random() * 24)} hours ago`,
        isDeepfake: false,
        confidence: 0,
        isHidden: false
      }));

      // --- DETECTION VIA BACKEND API ---
      for (let post of combined) {
        const formData = new FormData();
        try {
          if (post.image) {
            const imgBlob = await fetch(post.image).then(res => res.blob());
            formData.append("file", new File([imgBlob], "image.jpg"));
            const res = await fetch("http://localhost:8000/predict/image", {
              method: "POST",
              body: formData,
              headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
            });
            const result = await res.json();
            post.isDeepfake = result.isDeepfake;
            post.confidence = result.confidence || 0;
          } else if (post.video) {
            const videoBlob = await fetch(post.video).then(res => res.blob());
            formData.append("file", new File([videoBlob], "video.mp4"));
            const res = await fetch("http://localhost:8000/predict/video", {
              method: "POST",
              body: formData,
              headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` }
            });
            const result = await res.json();
            post.isDeepfake = result.isDeepfake;
            post.confidence = result.confidence || 0;
          }
        } catch (err) {
          console.error("Error detecting deepfake for post:", post.url, err);
          post.isDeepfake = false;
          post.confidence = 0;
        }
      }

      setPosts(combined.sort(() => 0.5 - Math.random()).slice(0, 10));
    } catch (err) {
      console.error("Error fetching feed:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const hidePost = (postId) => setPosts(prev => prev.map(p => p.id === postId ? { ...p, isHidden: true } : p));
  const unhidePost = (postId) => setPosts(prev => prev.map(p => p.id === postId ? { ...p, isHidden: false } : p));

  const filteredPosts = posts.filter(p => !p.isHidden || showHidden);

  const summary = {
    detected: posts.filter(p => p.isDeepfake).length,
    removed: posts.filter(p => p.isHidden).length,
    safe: posts.filter(p => !p.isDeepfake).length
  };

  return (
    <div className="bg-slate-900 text-slate-300 min-h-screen font-sans">
      <main className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="text-center mb-8">
          <h1 
            className="text-5xl md:text-6xl font-black text-[#e94560] pb-2"
            style={{ textShadow: '0 0 15px rgba(233, 69, 96, 0.8)' }}
          >
             Live Feed Protection
          </h1>
          <p className="text-lg text-[#a3bffa] max-w-2xl mx-auto">
            Real-time content monitoring with simulated AI deepfake detection.
          </p>
        </header>

        <div className="sticky top-4 z-10 bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-4 mb-8 flex flex-wrap items-center justify-center gap-4">
          <button 
            onClick={() => setIsDetectionActive(!isDetectionActive)}
            className={`px-5 py-2 font-bold rounded-full transition-all duration-300 flex items-center gap-2 text-sm sm:text-base ${isDetectionActive ? 'bg-[#e94560] text-white shadow-lg shadow-pink-500/30' : 'bg-transparent border-2 border-[#a3bffa] text-[#a3bffa]'}`}
          >
            {isDetectionActive ? <ShieldCheckIcon /> : <ShieldOffIcon />}
            <span>Protection: {isDetectionActive ? 'ON' : 'OFF'}</span>
          </button>
          <button 
            onClick={() => setShowHidden(!showHidden)}
            className="px-5 py-2 font-bold rounded-full transition-all duration-300 flex items-center gap-2 bg-transparent border-2 border-[#a3bffa] text-[#a3bffa] text-sm sm:text-base"
          >
            {showHidden ? <EyeOffIcon /> : <EyeIcon />} 
            <span>{showHidden ? 'Hide Removed' : 'Show Removed'}</span>
          </button>
          <button 
            onClick={fetchFeed} 
            disabled={isLoading}
            className="px-5 py-2 font-bold rounded-full bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-all flex items-center gap-2 disabled:bg-slate-500 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            <RefreshCwIcon className={isLoading ? "animate-spin" : ""}/>
            <span>{isLoading ? 'Refreshing...' : 'Refresh Feed'}</span>
          </button>
        </div>
        
        <div className="space-y-6">
            {isLoading ? (
                Array.from({length: 5}).map((_, index) => (
                    <div key={index} className="bg-slate-800 rounded-xl p-6 animate-pulse border border-gray-700">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-full bg-slate-700"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-1/4 rounded bg-slate-700"></div>
                                <div className="h-3 w-1/6 rounded bg-slate-700"></div>
                            </div>
                        </div>
                        <div className="h-5 w-3/4 rounded bg-slate-700 mb-4"></div>
                        <div className="h-48 w-full rounded-lg bg-slate-700"></div>
                    </div>
                ))
            ) : filteredPosts.map(post => (
            <div key={post.id} className={`bg-slate-800 rounded-lg shadow-lg transition-all duration-500 overflow-hidden border border-gray-700 ${post.isHidden ? 'opacity-60' : ''}`}>
              
              {isDetectionActive && post.isDeepfake && !post.isHidden && (
                <div className="bg-red-900/20 border-b border-red-500/30 px-6 py-3 flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-center gap-3">
                    <AlertTriangleIcon />
                    <div>
                      <p className="font-bold text-red-400">Deepfake Content Detected</p>
                      <p className="text-sm text-red-400/80">{post.confidence}% confidence - This content may be manipulated.</p>
                    </div>
                  </div>
                  <button onClick={() => hidePost(post.id)} className="px-4 py-1 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition-colors text-sm">Remove</button>
                </div>
              )}

              {post.isHidden && (
                <div className="bg-gray-700/20 border-b border-gray-500/30 px-6 py-3 flex justify-between items-center">
                  <p className="font-bold text-slate-300">Content hidden for your protection.</p>
                  <button onClick={() => unhidePost(post.id)} className="px-4 py-1 bg-slate-600 text-white rounded-md font-semibold hover:bg-slate-500 transition-colors text-sm">Restore</button>
                </div>
              )}

              <div className={`p-6 ${post.isHidden ? 'filter grayscale pointer-events-none' : ''}`}>
                <div className="flex items-center gap-4 mb-4">
                  <img src={post.avatar} alt={post.author} className="h-12 w-12 rounded-full object-cover" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">@{post.author}</p>
                      {isDetectionActive && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${post.isDeepfake ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                          {post.isDeepfake ? "Flagged" : "Verified"}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">{post.timestamp}</p>
                  </div>
                </div>

                <p className="mb-4 text-slate-300 leading-relaxed">{post.content}</p>

                {post.image && (
                  <div className="mb-4 rounded-lg overflow-hidden border border-slate-700">
                    <img src={post.image} alt={post.content} className="w-full h-auto object-cover" />
                  </div>
                )}
                {post.video && (
                  <div className="mb-4 rounded-lg overflow-hidden border border-slate-700">
                    <video src={post.video} className="w-full h-auto bg-black" autoPlay loop muted controls />
                  </div>
                )}
                
                {post.url && (
                    <p className="text-sm text-blue-400 hover:text-blue-500 underline mb-4 break-all">
                        <a href={post.url} target="_blank" rel="noopener noreferrer">
                            Link: {post.url}
                        </a>
                    </p>
                )}

                <div className="flex items-center justify-around pt-4 border-t border-slate-700/50 text-slate-400">
                  <button className="flex items-center gap-2 hover:text-red-400 transition-colors py-2 px-3 rounded-lg hover:bg-slate-700/50"><HeartIcon /> <span className="font-medium">{post.likes}</span></button>
                  <button className="flex items-center gap-2 hover:text-blue-400 transition-colors py-2 px-3 rounded-lg hover:bg-slate-700/50"><CommentIcon /> <span className="font-medium">{post.comments}</span></button>
                  <button className="flex items-center gap-2 hover:text-green-400 transition-colors py-2 px-3 rounded-lg hover:bg-slate-700/50"><ShareIcon /> <span className="font-medium">{post.shares}</span></button>
                </div>
              </div>
            </div>
          ))}
          {!isLoading && filteredPosts.length === 0 && (
              <div className="text-center bg-slate-800 rounded-xl p-10">
                  <h3 className="text-xl font-bold text-white">All Clear!</h3>
                  <p className="text-slate-400">No posts to show right now, or all detected threats have been hidden.</p>
              </div>
          )}
        </div>

        <footer className="mt-12 bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-2xl font-bold text-white mb-4">Protection Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div>
                    <p className="text-sm text-red-400 font-bold uppercase">Threats Detected</p>
                    <p className="text-4xl font-black text-red-400">{summary.detected}</p>
                </div>
                <div>
                    <p className="text-sm text-[#a3bffa] font-bold uppercase">Content Removed</p>
                    <p className="text-4xl font-black text-[#a3bffa]">{summary.removed}</p>
                </div>
                <div>
                    <p className="text-sm text-green-400 font-bold uppercase">Safe Content</p>
                    <p className="text-4xl font-black text-green-400">{summary.safe}</p>
                </div>
            </div>
        </footer>

      </main>
    </div>
  );
};

export default App;
