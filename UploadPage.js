import React, { useState, useRef } from 'react';
import axios from 'axios';

// --- SVG Icon components for a cleaner UI ---
const UploadIcon = () => (
  <svg className="w-24 h-24 mx-auto text-[#a3bffa]" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const VideoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-24 h-24 mx-auto text-[#a3bffa]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 7h8a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z" />
    </svg>
);

const AudioIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-24 h-24 mx-auto text-[#a3bffa]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    {/* Mic body */}
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 14a3 3 0 003-3V7a3 3 0 10-6 0v4a3 3 0 003 3z"
    />
    {/* Mic stand */}
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 11a7 7 0 01-14 0M12 19v4m-4 0h8"
    />
  </svg>
);

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [modality, setModality] = useState('video');
  const [result, setResult] = useState(null); // store JSON instead of string
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Constants for file validation
  const VALID_EXTENSIONS = {
    video: ['mp4', 'avi', 'mov', 'mkv'],
    image: ['jpg', 'jpeg', 'png'],
    audio: ['flac', 'wav', 'mp3'],
  };
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  const handleFileValidation = (selectedFile) => {
    if (!selectedFile) return;

    const fileExt = selectedFile.name.split('.').pop().toLowerCase();
    
    if (!VALID_EXTENSIONS[modality].includes(fileExt)) {
      setError(`Invalid file format. Please upload ${VALID_EXTENSIONS[modality].map(ext => `.${ext}`).join(', ')} files.`);
      return false;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File size exceeds 50MB limit.');
      return false;
    }

    return true;
  };

  const processFile = (selectedFile) => {
    if (!handleFileValidation(selectedFile)) {
        setFile(null);
        setPreview(null);
        return;
    }
    
    setFile(selectedFile);
    setError('');
    setResult(null);

    if (modality === 'image') {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
    } else if (modality === 'video') {
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
    } else {
      setPreview(null); // No preview for audio
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    processFile(selectedFile);
  };
  
  const handleModalityChange = (event) => {
    setModality(event.target.value);
    handleClear();
  };

  const handleClear = () => {
    setFile(null);
    setResult(null);
    setError('');
    setPreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  // --- Drag and Drop Handlers ---
  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const droppedFile = event.dataTransfer.files[0];
    processFile(droppedFile);
  };
  
  const triggerFileSelect = () => {
      fileInputRef.current.click();
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    if (!handleFileValidation(file)) return;

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token'); 
      const response = await axios.post(`http://localhost:8000/predict/${modality}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });

      // expect JSON: { isDeepfake: true/false, confidence: number, label: "FAKE"/"REAL" }
      setResult(response.data);

    } catch (err) {
      let errorMessage = 'Error processing file. Please try again.';
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map((e) => e.msg || 'Unknown error').join(', ');
        } else if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const getAcceptedFileTypes = () => {
      return VALID_EXTENSIONS[modality].map(ext => `.${ext}`).join(',');
  }

  return (
    <div className="bg-[#1a1a2e] min-h-screen flex flex-col items-center justify-center font-sans p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-3xl mx-auto">
        <div className="text-center mb-8">
            <h2 
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#e94560]" 
                style={{ textShadow: '0 0 15px rgba(233, 69, 96, 0.8)' }}
            >
                Media Analysis Engine
            </h2>
            <p className="text-md sm:text-lg text-[#a3bffa] mt-2">
                Upload your media to detect and analyze its contents.
            </p>
        </div>

        <div className="bg-[#16213e] p-6 sm:p-8 rounded-2xl shadow-2xl border border-[#2e2e4d]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Modality Selector */}
            <div>
              <label htmlFor="modality" className="block text-lg font-medium text-[#a3bffa] mb-2">
                1. Select Media Type
              </label>
              <select 
                id="modality" 
                value={modality} 
                onChange={handleModalityChange}
                className="w-full p-3 bg-[#252a44] border border-[#2e2e4d] rounded-lg text-white focus:ring-2 focus:ring-[#e94560] focus:border-[#e94560] transition duration-300"
              >
                <option value="video">Video</option>
                <option value="image">Image</option>
                <option value="audio">Audio</option>
              </select>
            </div>

            {/* Drop Zone */}
            <div>
                <label className="block text-lg font-medium text-[#a3bffa] mb-2">
                    2. Upload Your File
                </label>
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={triggerFileSelect}
                    className={`relative flex flex-col items-center justify-center w-full h-64 px-4 transition bg-[#252a44] border-2 border-dashed rounded-lg cursor-pointer
                    ${isDragging ? 'border-[#e94560] ring-2 ring-[#e94560]' : 'border-gray-600 hover:border-gray-500'}`}
                >
                    <input
                        ref={fileInputRef}
                        id="file-upload"
                        type="file"
                        accept={getAcceptedFileTypes()}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    
                    {preview && modality === 'image' && (
                        <img src={preview} alt="Preview" className="object-contain w-full h-full rounded-lg" />
                    )}
                    {preview && modality === 'video' && (
                        <video src={preview} controls className="object-contain w-full h-full rounded-lg" />
                    )}
                    {!preview && (
                        <div className="text-center">
                            {modality === 'video' && <VideoIcon />}
                            {modality === 'image' && <UploadIcon />}
                            {modality === 'audio' && <AudioIcon />}
                            <p className="mt-2 text-lg font-semibold text-gray-300">
                                Drag & drop a file or <span className="font-bold text-[#e94560]">click to browse</span>
                            </p>
                            <p className="mt-1 text-sm text-gray-400">
                                {`Supported: ${VALID_EXTENSIONS[modality].join(', ')} (Max 50MB)`}
                            </p>
                        </div>
                    )}
                </div>
            </div>
            
            {file && (
                <div className="text-center text-sm text-[#a3bffa] bg-[#252a44] p-3 rounded-lg">
                    Selected file: <span className="font-bold text-white">{file.name}</span>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row-reverse gap-4 pt-4">
              <button 
                type="submit" 
                disabled={loading || !file}
                className="w-full sm:w-auto px-8 py-3 text-base font-bold text-white bg-[#e94560] rounded-lg shadow-lg hover:bg-[#ff6b81] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#16213e] focus:ring-[#ff6b81] transition-all duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Analyze File'
                )}
              </button>
              <button 
                type="button" 
                onClick={handleClear} 
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3 text-base font-bold text-[#a3bffa] bg-transparent border-2 border-[#2e2e4d] rounded-lg hover:bg-[#252a44] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#16213e] focus:ring-[#a3bffa] transition-all duration-300 disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Result & Error Messages */}
        <div className="mt-8 space-y-4">
            {error && (
                <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            
          {result && (
              <div
                  className={`px-4 py-3 rounded-lg ${
                      result.isDeepfake
                          ? 'bg-red-900/50 border border-red-500 text-red-300'
                          : 'bg-green-900/50 border border-green-500 text-green-300'
                  }`}
                  role="alert"
              >
                  <strong className="font-bold">Prediction: </strong>
                  <span className="block sm:inline">
                      {/* Check if result.label is an object. If yes, use its nested properties.
                        If no, use the top-level properties. This handles all API responses.
                      */}
                      {typeof result.label === 'object' && result.label !== null
                          ? `${result.label.result} (${result.label.confidence.toFixed(2)}% confidence)`
                          : `${result.label}`
                      }
                  </span>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
  