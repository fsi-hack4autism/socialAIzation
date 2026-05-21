from fastapi import FastAPI
from datetime import datetime
from .agent import AgentController
from pydantic import BaseModel

app = FastAPI()
controller = AgentController()

class StandardResponse(BaseModel):
    success: bool
    message: str

@app.get("/chat/{user_input}")
def chat(user_input: str) -> StandardResponse:
    try:
        response = controller.run_agent(user_input)
    except Exception as e:
        return StandardResponse(success=False, message=f"Agent run failed: {str(e)}")
    return StandardResponse(success=True, message=response)

@app.post("/setup-agent/{persona}")
def setup_agent(persona: str) -> StandardResponse:
    if not persona:
        return StandardResponse(success=False, message="WARNING: Agent setup unsuccessful. Persona cannot be empty.")
    controller.set_persona(persona)
    unique_id = round(datetime.now().timestamp())
    controller.set_thread_id(unique_id)
    controller.setup_agent()
    return StandardResponse(success=True, message="Agent setup successfully.")

@app.post("/refresh-memory/")
def refresh_memory() -> StandardResponse:
    try:
        unique_id = round(datetime.now().timestamp())
        controller.set_thread_id(unique_id)
        controller.setup_agent()
        return StandardResponse(success=True, message="Memory refreshed successfully.")
    except Exception as e:
        return StandardResponse(success=False, message=f"Memory refresh failed: {str(e)}")