# feed_api.py
from fastapi import APIRouter, HTTPException, Query
from typing import List
from pydantic import BaseModel
from html import unescape
import praw
import random
import os

router = APIRouter()

# Reddit credentials (use environment variables or defaults)
CLIENT_ID = os.getenv("REDDIT_CLIENT_ID", "rdfzsMrvduHRgGLNcaM4PQ")
CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET", "ToEDt-fgwDCbGIh_fztoMa30TuUdpQ")
USER_AGENT = os.getenv("REDDIT_USER_AGENT", "web:DeepfakeFeedApp:1.0")

reddit = praw.Reddit(
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    user_agent=USER_AGENT,
    check_for_async=False
)

# Media model
class MediaItem(BaseModel):
    title: str
    url: str
    media_type: str  # "image" or "video"

# Helpers
IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".gif")
GIFV_EXT = ".gifv"

def unescape_url(u: str) -> str:
    return unescape(u).replace("&amp;", "&").strip() if u else ""

def convert_imgur_gifv(url: str) -> str:
    return url.replace(".gifv", ".mp4") if GIFV_EXT in url else url

def convert_gfycat(url: str) -> str:
    name = url.rstrip("/").split("/")[-1]
    return f"https://giant.gfycat.com/{name}.mp4"

# Feed endpoint
@router.get("/feed", response_model=List[MediaItem])
def get_feed(
    subreddit: str = "pics",
    limit: int = Query(10, ge=1, le=50),
    sort: str = Query("hot", regex="^(hot|new|top)$")
):
    try:
        subreddit_obj = reddit.subreddit(subreddit)
        fetch_limit = max(limit * 3, 25)  # fetch extra for randomization

        if sort == "new":
            submissions = list(subreddit_obj.new(limit=fetch_limit))
        elif sort == "top":
            submissions = list(subreddit_obj.top(limit=fetch_limit))
        else:
            submissions = list(subreddit_obj.hot(limit=fetch_limit))

        posts = []

        for submission in submissions:
            title = submission.title
            url = submission.url
            lower = url.lower()

            # Reddit-hosted video
            if getattr(submission, "is_video", False):
                try:
                    video_url = submission.media["reddit_video"]["fallback_url"]
                    posts.append({"title": title, "url": video_url, "media_type": "video"})
                    continue
                except:
                    pass

            # Direct images
            if any(lower.endswith(ext) for ext in IMAGE_EXTS):
                posts.append({"title": title, "url": url, "media_type": "image"})
                continue

            # Imgur .gifv -> .mp4
            if ".gifv" in lower and "imgur.com" in lower:
                posts.append({"title": title, "url": convert_imgur_gifv(url), "media_type": "video"})
                continue

            # Gfycat -> mp4
            if "gfycat.com" in lower:
                posts.append({"title": title, "url": convert_gfycat(url), "media_type": "video"})
                continue

            # YouTube/Vimeo/Redgifs -> treat as video page
            if any(host in lower for host in ("youtube.com", "youtu.be", "vimeo.com", "redgifs.com")):
                posts.append({"title": title, "url": url, "media_type": "video"})
                continue

            # Reddit gallery / preview thumbnail
            try:
                if getattr(submission, "is_gallery", False):
                    meta = getattr(submission, "media_metadata", {}) or {}
                    for v in meta.values():
                        src = v.get("s") or v.get("p", [{}])[-1]
                        img_url = src.get("u") if src else None
                        if img_url:
                            posts.append({"title": title, "url": unescape_url(img_url), "media_type": "image"})
            except Exception:
                pass

        random.shuffle(posts)  # randomize feed
        return posts[:limit]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
