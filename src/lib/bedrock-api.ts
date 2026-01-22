export async function sendToAgent(message: string) {
  try {
    console.log("📡 Sending message to agent:", message);
    
    const res = await fetch("http://localhost:5000/api/bedrock-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      console.error("❌ Backend error:", data);
      throw new Error(data.error || "Network response not ok");
    }
    
    if (!data.success) {
      throw new Error(data.error || "Backend processing failed");
    }
    
    console.log("✅ Received response from agent:", data.answer?.substring(0, 100) || data.response?.substring(0, 100));
    return data.answer || data.response || "No response from agent";
    
  } catch (err) {
    console.error("🚨 API call failed:", err);
    throw err; // Re-throw to be handled by caller
  }
}