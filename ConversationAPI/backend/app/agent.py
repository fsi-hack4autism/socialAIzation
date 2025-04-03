from langchain_openai import AzureChatOpenAI
from langgraph.graph import MessagesState
from langgraph.graph import StateGraph, START, END
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.checkpoint.memory import MemorySaver
from .personas import PERSONAS
from .auth import DEPLOYMENT, API_VERSION
from datetime import datetime
 

LLM = AzureChatOpenAI(
    azure_deployment=DEPLOYMENT,
    api_version=API_VERSION,
    temperature=0.5,
    max_tokens=None,
    timeout=None,
    max_retries=2
)

class ConversationalAgent:
    def __init__(self, persona: str, thread_id: str):
        self.persona = persona
        self.thread_id = thread_id
        self.config = {
            "configurable": {
                "thread_id": thread_id,
            },
        }
        self.system_message = [SystemMessage(
            content=PERSONAS[persona],
        )]
        self.graph = self._build_graph()

    def _chatbot(self, state: MessagesState):
        response = LLM.invoke(self.system_message + state["messages"])
        return {"messages": [response]}
    
    def _build_graph(self):
        memory = MemorySaver()
        graph_builder = StateGraph(MessagesState)
        # Nodes update the state
        graph_builder.add_node("chatbot", self._chatbot)
        graph_builder.add_edge(START, "chatbot")
        graph_builder.add_edge("chatbot", END)
        graph = graph_builder.compile(checkpointer=memory)
        return graph
    
    def run(self, user_input: str=''):
        response = self.graph.invoke({
            "messages": [HumanMessage(content=user_input)],
            },
            config=self.config
        )
        return response["messages"][-1].content


class AgentController:
    def __init__(self):
        self.thread_id = round(datetime.now().timestamp())
        self.persona = "helpful"
        self.setup_agent()
    
    def set_thread_id(self, thread_id):
        self.thread_id = thread_id
    
    def set_persona(self, persona):
        self.persona = persona

    def setup_agent(self):
        self.agent = ConversationalAgent(persona=self.persona, thread_id=self.thread_id)

    def run_agent(self, user_input=''):
        if self.agent is None:
            raise ValueError("Agent not set up. Please call set-up agent first.")
        response = self.agent.run(user_input)
        return response


if __name__ == "__main__":
    agent = ConversationalAgent(persona="helpful", thread_id="12345")
    i=0
    while i <= 10:
        print(i)
        user_input = input("User: ")
        if user_input == "q":
            break
        response = agent.run()
        print(f"Agent: {response}")
        i += 1