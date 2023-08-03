from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


@app.get("/")
def analyse_game():
    return {"message": "ok"}
