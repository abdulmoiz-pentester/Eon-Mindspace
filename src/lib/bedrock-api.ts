export async function sendToAgent(message: string) {
  try {
    console.log("📡 Sending message to agent:", message);
    console.log("🍪 Checking cookies:", document.cookie);
    
    const res = await fetch("http://localhost:5000/api/bedrock-agent", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        // Optional: Add Authorization header if needed
        // "Authorization": `Bearer ${getJWTFromCookie()}`
      },
      body: JSON.stringify({ message }),
      credentials: "include", // ← CRITICAL: Include cookies with request
    });

    console.log("📊 Response status:", res.status);
    
    // Handle 401 Unauthorized specially
    if (res.status === 401) {
      console.error("❌ Unauthorized - JWT missing or invalid");
      // You could redirect to login here if needed
      // window.location.href = '/login';
      throw new Error("Unauthorized. Please login again.");
    }
    
    // Handle other error statuses
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("❌ Backend error:", errorData);
      throw new Error(errorData.error || `HTTP error ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    
    if (!data.success && data.success !== undefined) {
      throw new Error(data.error || "Backend processing failed");
    }
    
    console.log("✅ Received response from agent:", data.answer?.substring(0, 100) || data.response?.substring(0, 100));
    return data.answer || data.response || "No response from agent";
    
  } catch (err) {
    console.error("🚨 API call failed:", err);
    
    // If it's an auth error, you might want to trigger logout
    if (err.message.includes("Unauthorized") || err.message.includes("401")) {
      // Optional: Clear local storage
      localStorage.removeItem("eon_chat_history");
      // Optional: Redirect to login
      // window.location.href = '/login';
    }
    
    throw err; // Re-throw to be handled by caller
  }
}

// Helper function to get JWT from cookie (optional)
function getJWTFromCookie() {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'jwt') {
      return value;
    }
  }
  return null;
}