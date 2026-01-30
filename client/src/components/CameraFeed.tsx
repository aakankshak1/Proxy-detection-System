import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { useCreateAttendance } from "@/hooks/use-attendance";
import { Loader2, Camera, AlertTriangle } from "lucide-react";

interface CameraFeedProps {
  sessionId: number;
  isActive: boolean;
}

// Distance threshold for considering a face as "known" (0.6 is typical)
const MATCH_THRESHOLD = 0.5;

export function CameraFeed({ sessionId, isActive }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate: createAttendance } = useCreateAttendance();
  
  // Local state to track faces seen IN THIS SESSION to avoid API spam
  // We store the full descriptor to match against
  const knownFacesRef = useRef<{ descriptor: Float32Array; name: string }[]>([]);

  // 1. Load Models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Failed to load models", err);
        setError("Failed to load AI models. Check your connection.");
      }
    };
    loadModels();
  }, []);

  // 2. Start Video
  useEffect(() => {
    if (!modelsLoaded || !isActive) return;

    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError("Camera access denied or unavailable.");
      }
    };
    startVideo();

    return () => {
      // Cleanup stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [modelsLoaded, isActive]);

  // 3. Detection Loop
  useEffect(() => {
    if (!modelsLoaded || !isActive) return;

    let intervalId: NodeJS.Timeout;

    const runDetection = async () => {
      if (!videoRef.current || !canvasRef.current) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Ensure video is playing and has dimensions
      if (video.paused || video.ended || !video.videoWidth) return;

      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);

      // Detect faces
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      // Clear canvas
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Process each face
      for (const detection of resizedDetections) {
        const descriptor = detection.descriptor;
        let bestMatch = { label: "unknown", distance: 1.0 };

        // Simple linear search for best match in local memory
        // For production, use faceapi.FaceMatcher, but this is fine for small classes
        if (knownFacesRef.current.length > 0) {
          const matcher = new faceapi.FaceMatcher(
            knownFacesRef.current.map(f => new faceapi.LabeledFaceDescriptors(f.name, [f.descriptor])),
            MATCH_THRESHOLD
          );
          bestMatch = matcher.findBestMatch(descriptor);
        }

        if (bestMatch.label === "unknown") {
          // NEW FACE DETECTED!
          const newName = `Student ${knownFacesRef.current.length + 1}`;
          
          // 1. Add to local memory immediately to prevent duplicates
          knownFacesRef.current.push({ descriptor, name: newName });
          
          // 2. Capture snapshot
          const snapshotCanvas = document.createElement("canvas");
          snapshotCanvas.width = video.videoWidth;
          snapshotCanvas.height = video.videoHeight;
          snapshotCanvas.getContext("2d")?.drawImage(video, 0, 0);
          const snapshot = snapshotCanvas.toDataURL("image/jpeg", 0.8);

          // 3. Send to API
          createAttendance({
            sessionId,
            studentName: newName,
            confidence: Math.round(detection.detection.score * 100).toString(),
            snapshot,
            faceDescriptor: Array.from(descriptor), // Store for potential re-id on server if needed
            verified: true
          });

          // Draw box for new face
          const box = detection.detection.box;
          const drawBox = new faceapi.draw.DrawBox(box, { label: newName, boxColor: "#22c55e" }); // Green
          drawBox.draw(canvas);
        } else {
          // KNOWN FACE
          const box = detection.detection.box;
          const drawBox = new faceapi.draw.DrawBox(box, { label: bestMatch.label, boxColor: "#3b82f6" }); // Blue
          drawBox.draw(canvas);
        }
      }
    };

    // Run every 1000ms to balance performance
    intervalId = setInterval(runDetection, 1000);

    return () => clearInterval(intervalId);
  }, [modelsLoaded, isActive, sessionId, createAttendance]);


  if (error) {
    return (
      <div className="w-full aspect-video bg-muted rounded-2xl flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-destructive/20">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <p className="font-medium">{error}</p>
        <p className="text-sm mt-2">Please refresh or check camera permissions.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black/90 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 group">
      {!modelsLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-20 bg-black">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
          <p className="font-medium animate-pulse">Loading AI Models...</p>
        </div>
      )}
      
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onPlay={() => {}}
        className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-500 ${modelsLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none transform scale-x-[-1]"
      />

      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-mono text-white flex items-center gap-2 border border-white/10">
        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
        {isActive ? 'LIVE FEED' : 'OFFLINE'}
      </div>

      {!isActive && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center text-white p-6">
            <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <h3 className="font-display text-xl font-bold">Camera Paused</h3>
            <p className="text-white/60 text-sm mt-1">Session is complete or not active.</p>
          </div>
        </div>
      )}
    </div>
  );
}
