import pickle
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

with open("severity_model.pkl", "rb") as f:
    model = pickle.load(f)

class IncidentText(BaseModel):
    description: str

@app.get("/")
def home():
    return {"message": "SafeCity ML Service is running"}

@app.post("/predict-severity")
def predict_severity(data: IncidentText):
    prediction = model.predict([data.description])[0]
    probabilities = model.predict_proba([data.description])[0]
    confidence = max(probabilities)

    return {
        "severity": prediction,
        "confidence": round(float(confidence), 2),
    }