import React, { useState, useRef, useEffect } from "react";
import "./video-recorder.css"; 

const VideoRecorder = () => {
    const [recording, setRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const [recordingTime, setRecordingTime] = useState(5);
    const [timeLeft, setTimeLeft] = useState(recordingTime);
    const [showPreview, setShowPreview] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [showPopup, setShowPopup] = useState(false);
    const [showThumbnail, setShowThumbnail] = useState(true);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const streamRef = useRef(null);
    const previewRef = useRef(null);
    const recordedRef = useRef(null);

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            previewRef.current.srcObject = stream;
            setRecording(true);
            setShowPreview(false); 
            setShowThumbnail(false);
            recordedChunksRef.current = [];
            setTimeLeft(recordingTime); // Use recordingTime state here

            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = event => recordedChunksRef.current.push(event.data);
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
                setRecordedBlob(blob);
                setShowPreview(true);
            };

            mediaRecorderRef.current.start();
            startCountdown();
        } catch (error) {
            showPopupMessage("Error accessing camera and microphone.");
        }
    };

    const startCountdown = () => {
        let counter = recordingTime; // Use recordingTime to set the countdown duration
        const interval = setInterval(() => {
            counter--;
            setTimeLeft(counter > 0 ? counter : "Recording Completed");
            if (counter <= 0) {
                clearInterval(interval);
                stopRecording();
            }
        }, 1000);
    };

    const stopRecording = () => {
        mediaRecorderRef.current.stop();
        streamRef.current.getTracks().forEach(track => track.stop());
        setRecording(false);
        setShowThumbnail(false); // Hide thumbnail once recording is stopped
        setShowPreview(true); // Show recorded video preview after recording
    };

    const handleUpload = async () => {
        if (!recordedBlob) return;
        const formData = new FormData();
        formData.append("video", recordedBlob, "video.webm");
        try {
            const response = await fetch("http://localhost:3000/upload", { method: "POST", body: formData });
            if (response.ok) showPopupMessage("Video uploaded successfully!");
            else showPopupMessage("Upload failed. Please try again.");
        } catch (error) {
            showPopupMessage("An error occurred during upload.");
        }
    };

    const showPopupMessage = (message) => {
        setPopupMessage(message);
        setShowPopup(true);
    };

    const closePopup = () => {
        setShowPopup(false);
    };

    return (
        <div className="video-recorder-container">
            <h2>Record a {recordingTime}-Second Video</h2>
            <div className="time-left">{timeLeft}</div>

            {/* Camera Container with Thumbnail */}
            <div id="camera-container" className={showPreview ? "hidden" : ""}>
                {showThumbnail && (
                    <img 
                        src="/thumbnail.jpg" 
                        alt="Thumbnail"
                        className="thumbnail" 
                    />
                )}
                <video 
                    ref={previewRef} 
                    autoPlay 
                    className={`video-preview ${showPreview ? "hidden" : ""}`} // Hide the camera preview after recording
                />
            </div>

            {/* Video Preview */}
            <div id="preview-container" className={showPreview ? "visible" : "hidden"}>
                <video ref={recordedRef} controls src={recordedBlob ? URL.createObjectURL(recordedBlob) : ""} className="video-recorded"></video>
            </div>

            {/* Buttons */}
            <div>
                {!recording && !showPreview && <button onClick={startRecording} className="btn-primary">Start Recording</button>}
                {showPreview && <button onClick={handleUpload} className="btn-primary">Upload</button>}
                {showPreview && <button onClick={() => { setShowPreview(false); setShowThumbnail(true); }} className="btn-secondary">Re-record</button>}
            </div>

            {/* Popup Messages */}
            {showPopup && (
                <div className="popup">
                    <p>{popupMessage}</p>
                    <button onClick={closePopup} className="btn-primary">OK</button>
                </div>
            )}
        </div>
    );
};

export default VideoRecorder;