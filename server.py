from corex import app
import uvicorn
import webbrowser

if __name__ == "__main__":
    webbrowser.open("http://localhost:8080")
    uvicorn.run(app=app, host="0.0.0.0", port=8080)
