import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import * as faceapi from "face-api.js";
import { doctorAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

// const MODEL_URL = "/models";
const MODEL_URL = process.env.PUBLIC_URL + '/models';


const DoctorLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const [cameraStarted, setCameraStarted] = useState(false);
  const [faceCaptured, setFaceCaptured] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const descriptorRef = useRef(null);
  const faceImageRef = useRef(null);

  // LOAD MODELS -----------------------------------------
  useEffect(() => {
    let cancelled = false;

    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);


        if (!cancelled) {
          setModelsLoaded(true);
          console.log("Models loaded");
        }
      } catch (err) {
        console.error("Model Load Error:", err);
        toast.error("Failed to load face models.");
      }
    };

    loadModels();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, []);

  // CAMERA START -----------------------------------------
  const startCamera = async () => {
    if (!modelsLoaded) return toast.error("Models loading...");

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
      toast.error("Camera access denied.");
    }
  };

  // CAMERA STOP
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setCameraStarted(false);
  };

  // CAPTURE FACE ----------------------------------------
  const captureFace = async () => {
    if (!cameraStarted) return toast.error("Start camera first!");

    try {
      const detection = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) return toast.error("No face detected.");

      descriptorRef.current = Array.from(detection.descriptor);

      const canvas = document.createElement("canvas");
      canvas.width = 160;
      canvas.height = 160;
      canvas.getContext("2d").drawImage(videoRef.current, 0, 0, 160, 160);
      faceImageRef.current = canvas.toDataURL("image/png");

      setFaceCaptured(true);
      toast.success("Face captured!");
    } catch (err) {
      toast.error("Capture error.");
    }
  };

  // LOGIN SUBMIT ----------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password)
      return toast.error("Fill all fields.");

    if (!descriptorRef.current)
      return toast.error("Capture your face before login.");

    setLoading(true);

    try {
      const payload = {
        ...formData,
        faceDescriptor: descriptorRef.current,
      };

      const res = await doctorAPI.login(payload);

      login(res.data.data, res.data.token, "doctor");
      toast.success("Login successful!");

      stopCamera();

      setTimeout(() => navigate("/doctor/dashboard"), 500);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Login failed."
      );
    }

    setLoading(false);
  };

  // CHANGE INPUT ----------------------------------------
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // UI ----------------------------------------------------
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Doctor Login</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email *</label>
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* CAMERA */}
          <div style={{ marginTop: 15 }}>
            <video
              ref={videoRef}
              width={300}
              height={250}
              style={{ background: "#000", borderRadius: "6px" }}
              muted
            />

            <div style={{ marginTop: 10 }}>
              <button disabled={!modelsLoaded || cameraStarted} onClick={startCamera}>
                Start Camera
              </button>
              <button disabled={!cameraStarted} onClick={captureFace} style={{ marginLeft: 10 }}>
                Capture Face
              </button>
              <button disabled={!cameraStarted} onClick={stopCamera} style={{ marginLeft: 10 }}>
                Stop Camera
              </button>
            </div>

            <div style={{ marginTop: 10 }}>
              <strong>Status:</strong>
              <br />
              {modelsLoaded ? "Models loaded" : "Loading models..."} <br />
              {cameraStarted ? "Camera ON" : "Camera OFF"} <br />
              {faceCaptured ? "Face captured ✔" : "No face captured yet"}
            </div>
          </div>

          <button disabled={loading} className="btn btn-primary" style={{ marginTop: 20 }}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p style={{ marginTop: 10 }}>
          Don't have an account? <Link to="/doctor/register">Register</Link>
        </p>

        <p>
          <Link to="/">Back to Home</Link>
        </p>
      </div>
    </div>
  );
};

export default DoctorLogin;



// // ============================================
// // src/pages/DoctorLogin.js - SIMPLIFIED VERSION
// // ============================================
// // This version uses a dummy face descriptor for testing
// // Replace with face-api version once models are working

// import React, { useState } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { toast } from 'react-toastify';
// import { doctorAPI } from '../services/api';
// import { useAuth } from '../context/AuthContext';

// const DoctorLogin = () => {
//   const navigate = useNavigate();
//   const { login } = useAuth();

//   const [formData, setFormData] = useState({
//     email: '',
//     password: ''
//   });

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');

//     if (!formData.email || !formData.password) {
//       setError('Please fill all fields');
//       toast.error('Please fill all fields');
//       return;
//     }

//     setLoading(true);

//     try {
//       // Generate dummy face descriptor for testing (128 random numbers)
//       const dummyFaceDescriptor = Array.from({ length: 128 }, () => Math.random() * 2 - 1);

//       console.log('Attempting doctor login with:', { email: formData.email });

//       const response = await doctorAPI.login({
//         email: formData.email,
//         password: formData.password,
//         faceDescriptor: dummyFaceDescriptor
//       });

//       console.log('Doctor login successful:', response.data);

//       login(response.data.data, response.data.token, 'doctor');
//       toast.success('Login successful!');
      
//       setTimeout(() => {
//         navigate('/doctor/dashboard');
//       }, 500);
//     } catch (err) {
//       console.error('Doctor login error:', err);
      
//       let errorMessage = 'Login failed. Please try again.';
      
//       if (err.response) {
//         errorMessage = err.response.data?.message || err.response.data?.error || errorMessage;
//       } else if (err.request) {
//         errorMessage = 'Cannot connect to server. Please ensure backend is running on port 5000.';
//       } else {
//         errorMessage = err.message;
//       }
      
//       setError(errorMessage);
//       toast.error(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="auth-container">
//       <div className="auth-card">
//         <h2>Doctor Login</h2>
        
//         {error && <div className="error-message">{error}</div>}

//         <div style={{ 
//           background: '#fff3cd', 
//           padding: '15px', 
//           borderRadius: '8px', 
//           marginBottom: '20px',
//           border: '1px solid #ffc107'
//         }}>
//           <p style={{ margin: 0, fontSize: '14px', color: '#856404' }}>
//             ⚠️ <strong>Testing Mode:</strong> Face recognition temporarily disabled. Using dummy face data.
//           </p>
//         </div>

//         <form onSubmit={handleSubmit}>
//           <div className="form-group">
//             <label>Email Address *</label>
//             <input
//               type="email"
//               name="email"
//               value={formData.email}
//               onChange={handleChange}
//               placeholder="doctor@hospital.com"
//               required
//               autoComplete="email"
//             />
//           </div>

//           <div className="form-group">
//             <label>Password *</label>
//             <input
//               type="password"
//               name="password"
//               value={formData.password}
//               onChange={handleChange}
//               placeholder="Enter your password"
//               required
//               autoComplete="current-password"
//             />
//           </div>

//           <button 
//             type="submit" 
//             className="btn btn-primary"
//             disabled={loading}
//           >
//             {loading ? 'Logging in...' : 'Login'}
//           </button>
//         </form>

//         <div className="link-text">
//           Don't have an account? <Link to="/doctor/register">Register here</Link>
//         </div>
//         <div className="link-text">
//           <Link to="/">Back to Home</Link>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DoctorLogin;