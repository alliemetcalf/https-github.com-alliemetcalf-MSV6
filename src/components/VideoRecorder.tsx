import React, { useRef, useState, useEffect } from 'react';
import { Camera, StopCircle, RefreshCw, X, Video, Settings, AlertCircle, Lock, Info } from 'lucide-react';
import toast from 'react-hot-toast';

interface VideoRecorderProps {
  onVideoRecorded: (file: File) => void;
  maxDuration?: number;
  onClose?: () => void;
}

function VideoRecorder({ onVideoRecorded, maxDuration = 30, onClose }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [duration, setDuration] = useState(0);
  const [selectedQuality, setSelectedQuality] = useState<'720p' | '1080p'>('1080p');
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanupStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const initializeCamera = async () => {
    try {
      setError(null);
      const constraints = {
        video: {
          width: selectedQuality === '1080p' ? 1920 : 1280,
          height: selectedQuality === '1080p' ? 1080 : 720,
          facingMode: 'user'
        },
        audio: true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
      setPermissionDenied(false);
    } catch (err: any) {
      console.error('Camera initialization error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
      } else if (err.name === 'NotFoundError') {
        setError('No camera or microphone found on your device');
      } else if (err.name === 'NotReadableError') {
        setError('Your camera or microphone is already in use');
      } else {
        setError(`Unable to access camera: ${err.message}`);
      }
    }
  };

  useEffect(() => {
    initializeCamera();
    return () => {
      cleanupStream();
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [selectedQuality]);

  const startRecording = async () => {
    try {
      if (!streamRef.current) {
        await initializeCamera();
      }

      const mediaRecorder = new MediaRecorder(streamRef.current!, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setRecordedChunks(chunks);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setDuration(0);

      durationTimerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      timerRef.current = setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          stopRecording();
          toast.success('Maximum recording duration reached');
        }
      }, maxDuration * 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    }
  };

  const handleSave = () => {
    if (recordedChunks.length === 0) return;

    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'video/webm' });
    onVideoRecorded(file);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderPermissionDeniedHelp = () => {
    const getBrowserName = () => {
      if (navigator.userAgent.indexOf("Chrome") !== -1) return "Chrome";
      if (navigator.userAgent.indexOf("Firefox") !== -1) return "Firefox";
      if (navigator.userAgent.indexOf("Safari") !== -1) return "Safari";
      return "your browser";
    };

    const browserName = getBrowserName();
    
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Camera Access Required
          </h3>
          <p className="text-gray-600 mb-6">
            Please allow camera and microphone access to record your introduction video
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-3">How to enable camera access:</h4>
          
          {browserName === "Chrome" && (
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>Click the camera icon <span className="inline-block px-2 py-1 bg-gray-100 rounded">🔒</span> in your address bar</li>
              <li>Select "Allow" for both camera and microphone</li>
              <li>Refresh this page</li>
            </ol>
          )}

          {browserName === "Firefox" && (
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>Click the camera icon in your address bar</li>
              <li>Click "Allow" to enable camera and microphone</li>
              <li>Refresh this page</li>
            </ol>
          )}

          {browserName === "Safari" && (
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>Click Safari &rarr; Preferences &rarr; Websites</li>
              <li>Find Camera and Microphone in the left sidebar</li>
              <li>Allow access for this website</li>
              <li>Refresh this page</li>
            </ol>
          )}
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Refresh Page
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Record Introduction Video</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 border-b border-blue-100">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Recording Tips:</h4>
              <ul className="text-sm text-blue-800 space-y-1.5">
                <li>• Find a well-lit, quiet space</li>
                <li>• Position yourself in the center of the frame</li>
                <li>• Speak clearly and naturally</li>
                <li>• Keep your introduction between 15-30 seconds</li>
                <li>• Mention your name, occupation, and what you're looking for</li>
              </ul>
            </div>
          </div>
        </div>

        {permissionDenied ? (
          renderPermissionDeniedHelp()
        ) : (
          <div className="p-6 space-y-6">
            {error ? (
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-700 mb-4">{error}</p>
                <button
                  onClick={initializeCamera}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                {/* Video Preview */}
                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  {!previewUrl ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={previewUrl}
                      controls
                      className="w-full h-full object-contain"
                    />
                  )}
                  
                  {/* Recording Indicator */}
                  {isRecording && (
                    <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black bg-opacity-50 px-3 py-1.5 rounded-full">
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-white text-sm font-medium">
                        {formatDuration(duration)} / {formatDuration(maxDuration)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  {/* Quality Selector */}
                  <div className="flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-gray-500" />
                    <select
                      value={selectedQuality}
                      onChange={(e) => setSelectedQuality(e.target.value as '720p' | '1080p')}
                      className="text-sm border-gray-300 rounded-md focus:border-blue-500 focus:ring focus:ring-blue-200"
                      disabled={isRecording}
                    >
                      <option value="720p">720p HD</option>
                      <option value="1080p">1080p Full HD</option>
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-4">
                    {!isRecording && !previewUrl && (
                      <button
                        onClick={startRecording}
                        disabled={!cameraReady}
                        className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Camera className="w-5 h-5" />
                        <span>Start Recording</span>
                      </button>
                    )}

                    {isRecording && (
                      <button
                        onClick={stopRecording}
                        className="flex items-center space-x-2 px-6 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                      >
                        <StopCircle className="w-5 h-5" />
                        <span>Stop Recording</span>
                      </button>
                    )}

                    {previewUrl && (
                      <>
                        <button
                          onClick={() => {
                            setPreviewUrl(null);
                            setRecordedChunks([]);
                            initializeCamera();
                          }}
                          className="flex items-center space-x-2 px-6 py-2.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
                        >
                          <RefreshCw className="w-5 h-5" />
                          <span>Retake</span>
                        </button>
                        <button
                          onClick={handleSave}
                          className="flex items-center space-x-2 px-6 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                        >
                          <Video className="w-5 h-5" />
                          <span>Save Video</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default VideoRecorder;
