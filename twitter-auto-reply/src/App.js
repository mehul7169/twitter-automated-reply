import { useState } from "react";

function App() {
  const [tweetUrls, setTweetUrls] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("tweet_urls", tweetUrls);
      formData.append("reply_message", replyMessage);

      const response = await fetch("http://localhost:8000/reply", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800">Twitter Auto Reply</h1>
      </header>
      <main className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="tweetUrls"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Tweet URLs (one per line):
            </label>
            <textarea
              id="tweetUrls"
              value={tweetUrls}
              onChange={(e) => setTweetUrls(e.target.value)}
              placeholder="https://twitter.com/user/status/123456789..."
              rows="5"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="replyMessage"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Reply Message:
            </label>
            <textarea
              id="replyMessage"
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Enter your reply message..."
              rows="3"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors
              ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              }`}
          >
            {isLoading ? "Sending Replies..." : "Send Replies"}
          </button>
        </form>

        {results && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Results:
            </h2>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-md ${
                    result.status === "success"
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">URL:</span> {result.url}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Status:</span> {result.status}
                  </p>
                  {result.status === "error" && (
                    <p className="text-sm text-red-600">
                      <span className="font-medium">Error:</span>{" "}
                      {result.message}
                    </p>
                  )}
                  {result.status === "success" && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Reply Tweet ID:</span>{" "}
                      {result.reply_id}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
