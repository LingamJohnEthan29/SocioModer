from fastapi import FastAPI
from pydantic import BaseModel
import pickle

app = FastAPI()

model = pickle.load(open("lr_model.pkl", "rb"))
vectorizer = pickle.load(open("vectorizer.pkl", "rb"))

class Message(BaseModel):
    user: str = "unknown"
    message: str
    timestamp: str = "0"

@app.post("/analyze")
def analyze(msg: Message):
    print("✅ RECEIVED:", msg)

    text = msg.message

    vec = vectorizer.transform([text])
    pred = model.predict(vec)[0]

    toxic = int(pred[0])
    spam = int(pred[1])

    risk = 0.5 * toxic + 0.5 * spam

    result = {
        "type": "normal",
        "toxic": toxic,
        "spam": spam,
        "risk": risk
    }

    if spam == 1:
        result["type"] = "spam"
    elif toxic == 1:
        result["type"] = "toxic"

    print("🔥 ML OUTPUT:", result)

    return result