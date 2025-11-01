import os
import logging
import re
import tempfile
import random
from datetime import datetime, timedelta
from typing import Optional, List
from html import unescape

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Query, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
import praw

from pipeline import deepfakes_video_predict, deepfakes_image_predict, deepfakes_audio_predict

# ==========================
# LOGGING
# ==========================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("predictions.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ==========================
# FASTAPI APP
# ==========================
app = FastAPI(title="Deepfake Guard API")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================
# FIREBASE AUTH SETUP
# ==========================
cred = credentials.Certificate("serviceAccountKey.json")  # put your Firebase key here
firebase_admin.initialize_app(cred)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def validate_strong_password(password: str) -> bool:
    """
    Password must be at least 8 characters, include:
    - one uppercase letter
    - one lowercase letter
    - one number
    - one special character
    """
    pattern = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'
    return bool(re.match(pattern, password))

# ==========================
# REGISTRATION ENDPOINT
# ==========================
@app.post("/register")
async def register_user(email: str = Form(...), password: str = Form(...)):
    if not validate_strong_password(password):
        raise HTTPException(
            status_code=400,
            detail="Password too weak. Must be 8+ chars, include uppercase, lowercase, number, special char."
        )
    try:
        user = firebase_auth.create_user(email=email, password=password)
        return {"message": "User registered successfully", "uid": user.uid}
    except firebase_admin._auth_utils.EmailAlreadyExistsError:
        raise HTTPException(status_code=400, detail="Email already registered")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Firebase registration error: {str(e)}")

# ==========================
# CURRENT USER FROM FIREBASE TOKEN
# ==========================
async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        return {"uid": decoded_token["uid"], "email": decoded_token.get("email")}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Firebase token")

# ==========================
# FILE VALIDATION
# ==========================
VALID_VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv"}
VALID_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
VALID_AUDIO_EXTENSIONS = {".flac", ".wav", ".mp3", ".m4a"}

def validate_file_extension(filename: str, valid_extensions: set) -> bool:
    ext = os.path.splitext(filename)[1].lower()
    return ext in valid_extensions

def save_upload_file_temp(upload_file: UploadFile) -> str:
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(upload_file.filename)[1]) as temp_file:
            upload_file.file.seek(0)
            temp_file.write(upload_file.file.read())
            logger.info(f"Saved temporary file: {temp_file.name}")
            return temp_file.name
    except Exception as e:
        logger.error(f"Error saving file {upload_file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")

# ==========================
# PREDICTION ENDPOINTS
# ==========================
@app.post("/predict/video")
async def predict_video(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not validate_file_extension(file.filename, VALID_VIDEO_EXTENSIONS):
        raise HTTPException(status_code=400, detail="Invalid file format. Only .mp4, .avi, .mov, .mkv are supported.")
    file_path = save_upload_file_temp(file)
    try:
        result = deepfakes_video_predict(file_path)
        return {"isDeepfake": "FAKE" in result, "label": result, "confidence": None}
    finally:
        os.unlink(file_path)

@app.post("/predict/image")
async def predict_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not validate_file_extension(file.filename, VALID_IMAGE_EXTENSIONS):
        raise HTTPException(status_code=400, detail="Invalid file format. Only .jpg, .jpeg, .png are supported.")
    file_path = save_upload_file_temp(file)
    try:
        result = deepfakes_image_predict(file_path)
        return {"isDeepfake": "FAKE" in result, "label": result, "confidence": None}
    finally:
        os.unlink(file_path)

# --- THIS IS THE NEW, CORRECTED CODE ---
@app.post("/predict/audio")
async def predict_audio(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not validate_file_extension(file.filename, VALID_AUDIO_EXTENSIONS):
        raise HTTPException(status_code=400, detail="Invalid file format. Only .flac, .wav, .mp3, .m4a are supported.")
    
    file_path = save_upload_file_temp(file)
    
    try:
        # Assume the function returns a dict like {'label': 'Fake audio', 'confidence': 0.98}
        prediction = deepfakes_audio_predict(file_path)

        # Get the label string from the dictionary (using .get() is safer)
        label_string = prediction.get("label", "") 
        
        # Get the confidence score
        confidence_score = prediction.get("confidence")

        # Now perform the check on the string
        is_fake = label_string.lower().startswith("fake")
        
        # Return the full, consistent response
        return {
            "isDeepfake": is_fake, 
            "label": "FAKE" if is_fake else "REAL", 
            "confidence": round(confidence_score, 2) if confidence_score is not None else "N/A"
        }
    finally:
        os.unlink(file_path)

# ==========================
# ROOT
# ==========================
@app.get("/")
def read_root():
    return {"message": "Welcome to Deepfake Guard API. Use /predict/video, /predict/image, or /predict/audio endpoints."}

# ==========================
# REDDIT FEED API
# ==========================
class MediaItem(BaseModel):
    title: str
    url: str
    media_type: str  # "image" or "video"

IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".gif")
GIFV_EXT = ".gifv"

reddit = praw.Reddit(
    client_id="rdfzsMrvduHRgGLNcaM4PQ",
    client_secret="ToEDt-fgwDCbGIh_fztoMa30TuUdpQ",
    user_agent="DeepfakeFeedApp/0.1 by DeepfakeGuard"
)

def convert_imgur_gifv(url: str) -> str:
    return url.replace(".gifv", ".mp4") if GIFV_EXT in url else url

def convert_gfycat(url: str) -> str:
    name = url.rstrip("/").split("/")[-1]
    return f"https://giant.gfycat.com/{name}.mp4"

def unescape_url(u: str) -> str:
    return unescape(u).replace("&amp;", "&").strip() if u else ""

@app.get("/feed", response_model=List[MediaItem])
def get_feed(subreddit: str = "pics", limit: int = 10, sort: str = Query("hot", regex="^(hot|new|top)$")):
    try:
        subreddit_obj = reddit.subreddit(subreddit)
        fetch_limit = max(limit * 3, 25)
        if sort == "new":
            submissions = list(subreddit_obj.new(limit=fetch_limit))
        elif sort == "top":
            submissions = list(subreddit_obj.top(limit=fetch_limit))
        else:
            submissions = list(subreddit_obj.hot(limit=fetch_limit))

        posts = []
        for submission in submissions:
            title, url, lower = submission.title, submission.url, submission.url.lower()
            if getattr(submission, "is_video", False):
                try:
                    video_url = submission.media["reddit_video"]["fallback_url"]
                    posts.append({"title": title, "url": video_url, "media_type": "video"})
                    continue
                except:
                    pass
            if any(lower.endswith(ext) for ext in IMAGE_EXTS):
                posts.append({"title": title, "url": url, "media_type": "image"})
                continue
            if ".gifv" in lower and "imgur.com" in lower:
                posts.append({"title": title, "url": convert_imgur_gifv(url), "media_type": "video"})
                continue
            if "gfycat.com" in lower:
                posts.append({"title": title, "url": convert_gfycat(url), "media_type": "video"})
                continue
            if any(host in lower for host in ("youtube.com", "youtu.be", "vimeo.com", "redgifs.com")):
                posts.append({"title": title, "url": url, "media_type": "video"})
                continue
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

        random.shuffle(posts)
        return posts[:limit]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
