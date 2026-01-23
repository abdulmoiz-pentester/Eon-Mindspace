export async function sendToAgent(message: string) {
  try {
    const res = await fetch("http://localhost:5000/api/bedrock-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (!res.ok) throw new Error("Network response not ok");
    const data = await res.json();
    return data.answer || "No response from agent";
  } catch (err) {
    console.error("API call failed:", err);
    return "Failed to get response from agent.";
  }
}