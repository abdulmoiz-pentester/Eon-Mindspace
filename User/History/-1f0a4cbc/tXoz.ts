export async function sendToAgent(message: string) {
  const res = await fetch("http://localhost:3000/api/agent/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  // If backend returns non-2xx status, fetch **doesn’t throw**, but res.json() may fail
  const data = await res.json(); // <- can throw if backend returns empty / invalid JSON
  return data.answer; // <- will throw if data is undefined
}
