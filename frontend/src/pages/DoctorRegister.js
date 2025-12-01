import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import * as faceapi from "face-api.js";
import { doctorAPI } from "../services/api";

const MODEL_URL = process.env.PUBLIC_URL + "/models";

const DoctorRegister = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    doctorId: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [faceCaptured, setFaceCaptured] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const descriptorRef = useRef(null);
  const faceImageRef = useRef(null);

  // ======================================================
  // LOAD MODELS
  // ======================================================
  useEffect(() => {
    let cancelled = false;

    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        if (!cancelled) {
          setModelsLoaded(true);
          console.log("Face models loaded successfully");
        }
      } catch (err) {
        console.error("Model loading error:", err);
        toast.error("Failed to load face models. Check /models folder.");
      }
    };

    loadModels();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, []);

  // ======================================================
  // START CAMERA
  // ======================================================
  const startCamera = async () => {
    if (!modelsLoaded) {
      toast.error("Models still loading. Wait a moment.");
      return;
    }

    if (cameraStarted) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      await videoRef.current.play();
      setCameraStarted(true);
      descriptorRef.current = null;
      faceImageRef.current = null;
      setFaceCaptured(false);
    } catch (err) {
      console.error(err);
      toast.error("Camera access denied. Enable camera permissions.");
    }
  };

  // ======================================================
  // STOP CAMERA
  // ======================================================
  const stopCamera = () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
      setCameraStarted(false);
    } catch (err) {}
  };

  // ======================================================
  // CAPTURE FACE
  // ======================================================
  const captureFace = async () => {
    if (!cameraStarted) {
      toast.error("Start the camera first.");
      return;
    }

    try {
      const detection = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        toast.error("No face detected. Please try again.");
        return;
      }

      descriptorRef.current = Array.from(detection.descriptor);

      // Thumbnail base64
      const canvas = document.createElement("canvas");
      canvas.width = 160;
      canvas.height = 160;
      canvas.getContext("2d").drawImage(videoRef.current, 0, 0, 160, 160);
      faceImageRef.current = canvas.toDataURL("image/png");

      setFaceCaptured(true);
      toast.success("Face captured successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Error capturing face.");
    }
  };

  // ======================================================
  // HANDLE INPUT CHANGE + DOCTOR ID VALIDATION
  // ======================================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Prevent special characters in Doctor ID
    if (name === "doctorId") {
      const valid = /^[A-Za-z0-9]*$/.test(value); // allow only letters + numbers
      if (!valid) {
        toast.error("Doctor ID must contain only letters and numbers (no special characters).");
        return; // do not update
      }
    }

    setFormData({ ...formData, [name]: value });
  };

  // ======================================================
  // FORM SUBMIT
  // ======================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { name, doctorId, email, password, confirmPassword } = formData;

    // Required fields
    if (!name || !doctorId || !email || !password) {
      return toast.error("Fill all fields.");
    }

    // Doctor ID validation (strong check)
    if (!/^[A-Za-z0-9]+$/.test(doctorId)) {
      return toast.error("Doctor ID must contain only letters and numbers.");
    }

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match.");
    }

    if (!descriptorRef.current) {
      return toast.error("Please capture your face.");
    }

    setLoading(true);

    try {
      const payload = {
        name,
        doctorId,
        email,
        password,
        faceDescriptor: descriptorRef.current,
        faceImage: faceImageRef.current,
      };

      const res = await doctorAPI.register(payload);

      toast.success(res.data.message || "Registration successful!");

      stopCamera();

      setTimeout(() => navigate("/doctor/login"), 1500);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Registration failed."
      );
    }

    setLoading(false);
  };

  // ======================================================
  // UI
  // ======================================================
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Doctor Registration</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group">
            <label>Full Name *</label>
            <input name="name" onChange={handleChange} value={formData.name} />
          </div>

          {/* Doctor ID */}
          <div className="form-group">
            <label>Doctor ID *</label>
            <input
              name="doctorId"
              onChange={handleChange}
              value={formData.doctorId}
              placeholder="e.g., DOC001"
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Email *</label>
            <input name="email" onChange={handleChange} value={formData.email} />
          </div>

          {/* Password */}
          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              onChange={handleChange}
              value={formData.password}
            />
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label>Confirm Password *</label>
            <input
              type="password"
              name="confirmPassword"
              onChange={handleChange}
              value={formData.confirmPassword}
            />
          </div>

          {/* CAMERA */}
          <div style={{ marginTop: 20 }}>
            <video
              ref={videoRef}
              width={300}
              height={250}
              style={{ background: "#000", borderRadius: "6px" }}
              muted
              playsInline
            />

            <div style={{ marginTop: 10 }}>
              <button type="button" disabled={!modelsLoaded || cameraStarted} onClick={startCamera}>
                Start Camera
              </button>

              <button type="button" disabled={!cameraStarted} onClick={captureFace} style={{ marginLeft: 10 }}>
                Capture Face
              </button>

              <button type="button" disabled={!cameraStarted} onClick={stopCamera} style={{ marginLeft: 10 }}>
                Stop Camera
              </button>
            </div>

            <p style={{ marginTop: 10 }}>
              <strong>Status:</strong>
              <br />
              {modelsLoaded ? "Models loaded" : "Loading models..."} <br />
              {cameraStarted ? "Camera ON" : "Camera OFF"} <br />
              {faceCaptured ? "Face captured ✔" : "No face captured yet"}
            </p>

            {faceCaptured && (
              <img
                src={faceImageRef.current}
                alt="face"
                width={120}
                height={120}
                style={{ border: "1px solid #ddd", borderRadius: "8px" }}
              />
            )}
          </div>

          <button disabled={loading} className="btn btn-primary" style={{ marginTop: 20 }}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p style={{ marginTop: 15 }}>
          Already have an account? <Link to="/doctor/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default DoctorRegister;