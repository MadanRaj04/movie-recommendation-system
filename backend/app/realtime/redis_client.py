import redis
import json

redis_client = redis.Redis(host="localhost", port=6379, decode_responses=True)

QUEUE_NAME = "event_queue"


def send_event_to_queue(event):
    redis_client.rpush(QUEUE_NAME, json.dumps(event))


def get_event():
    _, event = redis_client.blpop(QUEUE_NAME)
    return json.loads(event)