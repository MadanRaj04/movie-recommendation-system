import { useEffect, useState } from "react";
import API from "../services/api";
import MovieCard from "../components/MovieCard";
import ChatBox from "../components/ChatBot";

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [explanation, setExplanation] = useState("");
  const userId = 1; // temporary

  const fetchRecommendations = async () => {
    const res = await API.get(`/recommend/${userId}`);

    setMovies(res.data.recommendations);
    setExplanation(res.data.explanation);
  };

  useEffect(() => {
    fetchRecommendations();

    // Auto refresh every 5 seconds (real-time feel)
    const interval = setInterval(fetchRecommendations, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
        {explanation && (
        <div style={{
            background: "#111",
            color: "#fff",
            padding: "10px",
            marginBottom: "20px",
            borderRadius: "8px"
        }}>
            <h3>Why these recommendations?</h3>
            <p>{explanation}</p>
        </div>
        )}
      <h1>Recommended Movies</h1>
      {movies.map((m) => (
        <MovieCard key={m.id} movie={m} userId={userId} />
      ))}
      <ChatBox />
    </div>
  );
}