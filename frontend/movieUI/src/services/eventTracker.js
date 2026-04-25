import API from "./api";

export const sendEvent = async (user_id, movie_id, event_type) => {
  try {
    await API.post("/events/", {
      user_id,
      movie_id,
      event_type
    });
  } catch (err) {
    console.error("Event error:", err);
  }
};