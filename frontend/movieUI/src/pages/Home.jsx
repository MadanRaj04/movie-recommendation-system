import { useEffect, useState } from "react";
import API from "../services/api";
import MovieCard from "../components/MovieCard";

export default function Home() {
  const [movies, setMovies] = useState([]);
  const userId = 1; // temporary

  const fetchRecommendations = async () => {
    const res = await API.get(`/recommend/${userId}`);
    setMovies(res.data);
  };

  useEffect(() => {
    fetchRecommendations();

    // Auto refresh every 5 seconds (real-time feel)
    const interval = setInterval(fetchRecommendations, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h1>Recommended Movies</h1>
      {movies.map((m) => (
        <MovieCard key={m.id} movie={m} userId={userId} />
      ))}
    </div>
  );
}