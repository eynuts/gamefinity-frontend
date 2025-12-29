import { auth, provider } from "../firebase";
import { signInWithPopup } from "firebase/auth";

export default function LoginButton() {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);

      // THE IMPORTANT PART:
      const user = result.user;
      console.log("Logged in:", user);

      // Save user in localStorage (optional)
      localStorage.setItem("user", JSON.stringify(user));

      // Redirect to home page
      window.location.href = "/";

    } catch (err) {
      console.error("Login error:", err);
    }
  };

  return (
    <button 
      onClick={handleLogin}
      style={{ 
        padding: "8px 14px",
        background: "#4285F4",
        color: "white",
        borderRadius: "6px",
        border: "none",
        cursor: "pointer"
      }}
    >
      Login with Google
    </button>
  );
}
