import { useEffect } from "react";
import { sendEvent } from "../services/eventTracker";

export default function Player({ movieId, userId }) {

  useEffect(() => {
    sendEvent(userId, movieId, "play");
  }, []);

  const handleWatch = () => {
    sendEvent(userId, movieId, "watch");
  };

  return (
    <div>
      <video width="600" controls onEnded={handleWatch}>
        <source src="/sample.mp4" type="video/mp4" />
      </video>
    </div>
  );
}