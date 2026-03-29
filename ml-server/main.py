from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Message(BaseModel):
    user: str
    message: str
    timestamp: str

@app.post("/analyze")
def analyze(msg: Message):
    text = msg.message.lower()

    # 🔥 SIMPLE DETECTION (MVP)
    if "free" in text or "crypto" in text:
        return {"type": "spam", "risk": 0.8}
    
    if "hate" in text or "kill" in text:
        return {"type": "toxic", "risk": 0.9}

    return {"type": "normal", "risk": 0.1}