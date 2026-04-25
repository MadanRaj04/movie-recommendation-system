import { useParams } from "react-router-dom";
import Player from "../components/Player";

export default function PlayerPage() {
  const { id } = useParams();
  const userId = 1;

  return (
    <div>
      <h1>Now Playing</h1>
      <Player movieId={parseInt(id)} userId={userId} />
    </div>
  );
}