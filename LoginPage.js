import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { FcGoogle } from "react-icons/fc";

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  // --- ADDED ---: Strong password validation function
  const validateStrongPassword = (password) => {
    // Requires 8+ chars, uppercase, lowercase, number, and special character
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return pattern.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // --- ADDED ---: Check password strength ONLY when registering
    if (isRegistering && !validateStrongPassword(password)) {
      setError("Password must be 8+ chars and include uppercase, lowercase, number, & special character.");
      return; // Stop the submission if password is weak
    }

    setLoading(true);
    try {
      let userCredential;
      if (isRegistering) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      const token = await userCredential.user.getIdToken();
      localStorage.setItem("token", token);
      onLogin?.();
      navigate("/upload");
    } catch (err) {
      // Use Firebase's error messages for better feedback
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered.");
      } else if (err.code === 'auth/invalid-credential') {
        setError("Invalid email or password.");
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      localStorage.setItem("token", token);
      onLogin?.();
      navigate("/upload");
    } catch (err) {
      setError("Failed to sign in with Google.");
    }
  };

  // --- MODIFIED ---: The UI has been updated to the two-panel layout
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white font-sans">
      <div className="flex w-full max-w-4xl h-[550px] bg-slate-800/50 rounded-xl shadow-2xl overflow-hidden">
        
        {/* Left Panel: Welcome & Toggle */}
        <div className="w-1/2 bg-gradient-to-br from-slate-900 to-slate-800 p-12 flex flex-col justify-center items-center text-center">
          <h1 className="text-4xl font-bold mb-4">
            {isRegistering ? 'Welcome!' : 'Welcome Back!'}
          </h1>
          <p className="text-slate-300 mb-8 max-w-xs">
            {isRegistering 
              ? 'A few clicks away from creating your account.' 
              : 'Sign in to access your dashboard and continue your work.'}
          </p>
          <div className="text-sm">
            <p className="text-slate-400">
              {isRegistering ? 'Already have an account?' : "Don't have an account?"}
            </p>
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              className="font-bold text-red-500 hover:underline mt-1"
            >
              {isRegistering ? 'Login Now' : 'Create Account'}
            </button>
          </div>
        </div>

        {/* Right Panel: Form */}
        <div className="w-1/2 p-12 flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-2">
            {isRegistering ? 'Create Account' : 'Sign In'}
          </h2>
          <p className="text-slate-400 mb-6">
            Get started with your new account.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full p-3 bg-slate-700 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full p-3 bg-slate-700 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-md font-bold transition disabled:bg-red-800"
            >
              {loading ? 'Processing...' : (isRegistering ? 'Register' : 'Login')}
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-grow bg-slate-600 h-px"></div>
            <span className="mx-4 text-slate-400 text-sm">OR</span>
            <div className="flex-grow bg-slate-600 h-px"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full py-3 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 rounded-md font-bold transition border border-slate-600"
          >
            <FcGoogle size={22} />
            Sign in with Google
          </button>

          {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
