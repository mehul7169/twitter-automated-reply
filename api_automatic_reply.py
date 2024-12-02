from fastapi import FastAPI, Form, Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
import tweepy
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()
templates = Jinja2Templates(directory="templates")

# Add after app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Twitter API credentials
client = tweepy.Client(
    bearer_token=os.getenv("BEARER_TOKEN"),
    consumer_key=os.getenv("API_KEY"),
    consumer_secret=os.getenv("API_SECRET"),
    access_token=os.getenv("ACCESS_TOKEN"),
    access_token_secret=os.getenv("ACCESS_TOKEN_SECRET")
)

def extract_tweet_id(url: str) -> str:
    """Extract tweet ID from Twitter URL"""
    return url.split('/')[-1].split('?')[0]

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/reply")
async def reply_to_tweets(tweet_urls: str = Form(...), reply_message: str = Form(...)):
    results = []
    urls = tweet_urls.split('\n')
    
    for url in urls:
        url = url.strip()
        if not url:
            continue
            
        try:
            tweet_id = extract_tweet_id(url)
            response = client.create_tweet(
                text=reply_message,
                in_reply_to_tweet_id=tweet_id
            )
            results.append({
                "url": url,
                "status": "success",
                "reply_id": response.data['id']
            })
        except Exception as e:
            results.append({
                "url": url,
                "status": "error",
                "message": str(e)
            })
    
    return {"results": results}