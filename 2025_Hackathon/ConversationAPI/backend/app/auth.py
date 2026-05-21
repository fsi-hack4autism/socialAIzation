import os

# These 2 should be set in the env variables only
# endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "https://aoai-eus-uc6.openai.azure.com/")  
# subscription_key = os.environ["AZURE_OPENAI_API_KEY"]
DEPLOYMENT = os.getenv("DEPLOYMENT_NAME", "gpt-4o-uc6")
API_VERSION = os.getenv("API_VERSION", "2024-05-01-preview")