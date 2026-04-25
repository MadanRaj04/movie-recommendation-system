import { useNavigate } from "react-router-dom";
import { sendEvent } from "../services/eventTracker";

export default function MovieCard({ movie, userId }) {
  const navigate = useNavigate();

  const handleClick = () => {
    sendEvent(userId, movie.id, "click");
    navigate(`/player/${movie.id}`);
  };

  return (
    <div onClick={handleClick} style={{ cursor: "pointer", margin: 10 }}>
      <h3>{movie.title}</h3>
      <p>{movie.genres}</p>
    </div>
  );
}