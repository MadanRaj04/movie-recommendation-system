import { useState } from "react";
import API from "../services/api";

export default function ChatBox() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);

  const sendQuery = async () => {
    const res = await API.post("/chat/", { query });

    setMessages([
      ...messages,
      { role: "user", text: query },
      { role: "bot", text: res.data.response }
    ]);

    setQuery("");
  };

  return (
    <div>
      <h2>Movie Chat</h2>

      {messages.map((m, i) => (
        <p key={i}><b>{m.role}:</b> {m.text}</p>
      ))}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button onClick={sendQuery}>Send</button>
    </div>
  );
}