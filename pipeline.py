import os
import cv2
import torch
import librosa
import numpy as np
import tensorflow as tf
import tensorflow_addons as tfa
from facenet_pytorch import MTCNN
from rawnet import RawNet
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set random seed
tf.random.set_seed(42)

# Load EfficientNet model
model_path = os.path.join(os.path.dirname(__file__), "models", "efficientnet-b0")
custom_objects = {"Addons>RectifiedAdam": tfa.optimizers.RectifiedAdam}
try:
    logger.info(f"Loading EfficientNet model from {model_path}")
    model = tf.keras.models.load_model(model_path, custom_objects=custom_objects)
except Exception as e:
    logger.error(f"Failed to load EfficientNet model: {str(e)}")
    raise RuntimeError(f"Failed to load EfficientNet model: {str(e)}")

# Detection Pipeline class
class DetectionPipeline:
    def __init__(self, n_frames=10, batch_size=60, resize=None, input_modality='video'):
        self.n_frames = n_frames
        self.batch_size = batch_size
        self.resize = resize
        self.input_modality = input_modality
        self.mtcnn = MTCNN(image_size=224, margin=0, device='cpu') if input_modality == 'video' else None

    def __call__(self, filename):
        if self.input_modality == 'video':
            logger.info(f"Processing video: {filename}")
            v_cap = cv2.VideoCapture(filename)
            if not v_cap.isOpened():
                logger.error(f"Failed to open video: {filename}")
                raise ValueError(f"Failed to open video: {filename}")
            v_len = int(v_cap.get(cv2.CAP_PROP_FRAME_COUNT))
            sample = np.arange(0, v_len) if self.n_frames is None else np.linspace(0, v_len - 1, self.n_frames).astype(int)

            faces = []
            for j in range(v_len):
                success = v_cap.grab()
                if j in sample:
                    success, frame = v_cap.retrieve()
                    if not success:
                        continue
                    frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    if self.resize:
                        frame = cv2.resize(frame, (int(frame.shape[1] * self.resize), int(frame.shape[0] * self.resize)))
                    if self.mtcnn:
                        boxes, _ = self.mtcnn.detect(frame)
                        if boxes is not None:
                            for box in boxes:
                                x1, y1, x2, y2 = [int(b) for b in box]
                                face = frame[y1:y2, x1:x2]
                                if face.size > 0:
                                    face = cv2.resize(face, (224, 224))
                                    faces.append(face)
            v_cap.release()
            if not faces:
                logger.error("No faces detected in video")
                raise ValueError("No faces detected in video")
            logger.info(f"Extracted {len(faces)} faces from video")
            return faces

        elif self.input_modality == 'image':
            logger.info(f"Processing image: {filename}")
            img = cv2.imread(filename)
            if img is None:
                logger.error(f"Failed to load image: {filename}")
                raise ValueError(f"Failed to load image: {filename}")
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            img = cv2.resize(img, (224, 224))
            return img

        elif self.input_modality == 'audio':
            logger.info(f"Processing audio: {filename}")
            try:
                y, sr = librosa.load(filename, sr=16000)
                target_length = 64600
                if len(y) < target_length:
                    y = np.pad(y, (0, target_length - len(y)), mode='constant')
                elif len(y) > target_length:
                    y = y[:target_length]
                tensor = torch.Tensor(y).unsqueeze(0)
                logger.info(f"Audio tensor shape: {tensor.shape}, min: {tensor.min()}, max: {tensor.max()}")
                return tensor
            except Exception as e:
                logger.error(f"Failed to process audio: {str(e)}")
                raise ValueError(f"Failed to process audio: {str(e)}")

        else:
            logger.error(f"Invalid input modality: {self.input_modality}")
            raise ValueError("Invalid input modality")


# Initialize pipelines
video_pipeline = DetectionPipeline(n_frames=5, batch_size=1, input_modality='video')
image_pipeline = DetectionPipeline(batch_size=1, input_modality='image')
audio_pipeline = DetectionPipeline(input_modality='audio')


# Video prediction
def deepfakes_video_predict(input_video):
    try:
        faces = video_pipeline(input_video)
        real_res, fake_res = [], []

        for face in faces:
            face_norm = np.array(face, dtype=np.float32) / 255.0
            pred = model.predict(np.expand_dims(face_norm, axis=0), verbose=0)[0]
            real_res.append(float(pred[0]))
            fake_res.append(float(pred[1]))

        real_mean = float(np.mean(real_res))
        fake_mean = float(np.mean(fake_res))
        result = "REAL" if real_mean >= 0.5 else "FAKE"
        confidence = round(real_mean * 100 if real_mean >= 0.5 else fake_mean * 100, 3)
        logger.info(f"Video prediction: {result} ({confidence}%)")
        return {"result": result, "confidence": confidence}
    except Exception as e:
        logger.error(f"Video prediction failed: {str(e)}")
        raise RuntimeError(f"Video prediction failed: {str(e)}")


# Image prediction
def deepfakes_image_predict(input_image):
    try:
        face = image_pipeline(input_image)
        face_norm = np.array(face, dtype=np.float32) / 255.0
        pred = model.predict(np.expand_dims(face_norm, axis=0), verbose=0)[0]
        real, fake = float(pred[0]), float(pred[1])
        result = "REAL" if real > 0.5 else "FAKE"
        confidence = round((100 - real * 100) if real > 0.5 else (fake * 100), 3)
        logger.info(f"Image prediction: {result} ({confidence}%)")
        return {"result": result, "confidence": confidence}
    except Exception as e:
        logger.error(f"Image prediction failed: {str(e)}")
        raise RuntimeError(f"Image prediction failed: {str(e)}")


# Load audio model
def load_audio_model():
    args = {
        "nb_samp": 64600,
        "first_conv": 1024,
        "in_channels": 1,
        "filts": [20, [20, 20], [20, 128], [128, 128]],
        "blocks": [2, 4],
        "nb_fc_node": 1024,
        "gru_node": 1024,
        "nb_gru_layer": 3,
        "nb_classes": 2
    }
    model = RawNet(d_args=args, device='cpu')
    ckpt_path = os.path.join(os.path.dirname(__file__), "models", "rawnet", "RawNet2.pth")
    try:
        logger.info(f"Loading RawNet model from {ckpt_path}")
        ckpt = torch.load(ckpt_path, map_location=torch.device('cpu'))
        model.load_state_dict(ckpt, strict=True)
        model.eval()
    except Exception as e:
        logger.error(f"Failed to load RawNet model: {str(e)}")
        raise RuntimeError(f"Failed to load RawNet model: {str(e)}")
    return model


audio_model = load_audio_model()
audio_label_map = {0: "Real audio", 1: "Fake audio"}


# Audio prediction
def deepfakes_audio_predict(input_audio):
    try:
        x_pt = audio_pipeline(input_audio)
        if x_pt.shape[1] != 64600:
            logger.error(f"Audio input length {x_pt.shape[1]} does not match expected 64600")
            raise ValueError(f"Audio input length {x_pt.shape[1]} does not match expected 64600")
        with torch.no_grad():
            logits = audio_model(x_pt)
        pred = int(torch.argmax(logits, dim=1).item())
        result = audio_label_map[pred]
        logger.info(f"Audio prediction: {result}")
        return {"result": result}
    except Exception as e:
        logger.error(f"Audio prediction failed: {str(e)}")
        raise RuntimeError(f"Audio prediction failed: {str(e)}")
