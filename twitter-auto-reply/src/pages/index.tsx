import { useState, ChangeEvent, FormEvent, ReactElement } from "react";
import type { JSX } from "react";
import PasswordModal from "../components/PasswordModal";
import FileUploadButton from "../components/FileUploadButton";
import AccountSelector from "../components/AccountSelectors";

interface Result {
  url: string;
  status: "success" | "error";
  reply_id?: string;
  message?: string;
}

interface PendingSubmission {
  validUrls: string[];
  replyMessage: string;
  selectedAccount: "mehul" | "yashraj";
}

export default function App() {
  const [tweetUrls, setTweetUrls] = useState<string>("");
  const [replyMessage, setReplyMessage] = useState<string>("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>("");
  const [pendingSubmission, setPendingSubmission] =
    useState<PendingSubmission | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<"mehul" | "yashraj">(
    "mehul"
  );

  const handleTweetUrlChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setTweetUrls(value);

    if (value && !value.endsWith("\n")) {
      const lines = value.split("\n");
      const lastLine = lines[lines.length - 1];
      const urlPattern =
        /^https?:\/\/(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/[0-9]+$/;

      if (urlPattern.test(lastLine.trim())) {
        setTweetUrls(value + "\n");
      }
    }
  };

  const getNumberedUrls = (): string[] => {
    if (!tweetUrls.trim()) return [];
    return tweetUrls
      .split("\n")
      .filter((url) => url.trim())
      .map((url) => url.trim());
  };

  const validateUrls = (
    urls: string
  ): { errors: string[]; validUrls: string[] } => {
    const errors: string[] = [];
    const seenUrls = new Set<string>();
    const urlPattern =
      /^https?:\/\/(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/[0-9]+$/;

    const validUrls = urls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => {
        if (!url) return false;
        if (!urlPattern.test(url)) {
          errors.push(`Invalid Twitter/X URL format: ${url}`);
          return false;
        }
        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          return true;
        }
        return false;
      });

    return { errors, validUrls };
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const { errors, validUrls } = validateUrls(tweetUrls);

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (validUrls.length === 0) {
      setValidationErrors(["Please enter at least one valid Twitter/X URL"]);
      return;
    }

    setPendingSubmission({ validUrls, replyMessage, selectedAccount });
    setIsModalOpen(true);
  };

  const handlePasswordSubmit = async (password: string) => {
    if (password === process.env.NEXT_PUBLIC_PASSWORD) {
      setIsModalOpen(false);
      setPasswordError("");
      await processSubmission();
    } else {
      setPasswordError("Incorrect password. Please try again.");
    }
  };

  const processSubmission = async () => {
    if (!pendingSubmission) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("tweet_urls", pendingSubmission.validUrls.join("\n"));
      formData.append("reply_message", pendingSubmission.replyMessage);
      formData.append("selected_account", pendingSubmission.selectedAccount);

      // Append media files
      selectedFiles.forEach((file) => {
        formData.append("media", file);
      });

      const response = await fetch("/api/reply", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error("Error:", error);
      setValidationErrors(["Failed to send replies. Please try again."]);
    } finally {
      setIsLoading(false);
      setPendingSubmission(null);
    }
  };

  const handleFileSelect = (files: FileList) => {
    setSelectedFiles(Array.from(files).slice(0, 4));
  };

  const handleAccountSelect = (account: "mehul" | "yashraj") => {
    setSelectedAccount(account);
  };

  // Rest of the JSX remains the same
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Twitter Auto Reply
          </h1>
          <p className="text-gray-600">
            Automatically reply to multiple Twitter/X posts at once
          </p>
        </header>

        <main className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="tweetUrls"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Tweet URLs (one per line):
              </label>
              <div className="relative">
                <textarea
                  id="tweetUrls"
                  value={tweetUrls}
                  onChange={handleTweetUrlChange}
                  placeholder="https://twitter.com/user/status/123456789..."
                  rows={5}
                  required
                  className="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                />
                {/* Numbered list overlay */}
                <div className="absolute top-3 left-4 pointer-events-none">
                  {getNumberedUrls().map((url, index) => (
                    <div key={index} className="text-gray-400 select-none">
                      {index + 1}.
                    </div>
                  ))}
                </div>
                <div className="absolute top-3 left-16 right-4 pointer-events-none">
                  {getNumberedUrls().map((url, index) => (
                    <div key={index} className="text-transparent">
                      {url}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="replyMessage"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Reply Message:
              </label>
              <div className="relative">
                <textarea
                  id="replyMessage"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Enter your reply message..."
                  rows={3}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                />
                <div className="absolute bottom-3 right-3">
                  <FileUploadButton onFileSelect={handleFileSelect} />
                </div>
              </div>
              {selectedFiles.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      {file.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-red-800 mb-2">
                  Please fix the following errors:
                </h3>
                <ul className="list-disc list-inside text-sm text-red-700">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <AccountSelector onAccountSelect={handleAccountSelect} />

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-md hover:shadow-lg"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "Send Replies"
              )}
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
                    className={`p-5 rounded-lg border ${
                      result.status === "success"
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <span
                        className={`w-2 h-2 rounded-full mr-2 ${
                          result.status === "success"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      ></span>
                      <p
                        className={`font-medium ${
                          result.status === "success"
                            ? "text-green-800"
                            : "text-red-800"
                        }`}
                      >
                        {result.status.charAt(0).toUpperCase() +
                          result.status.slice(1)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700 break-all">
                      <span className="font-medium">URL:</span> {result.url}
                    </p>
                    {result.status === "error" && (
                      <p className="text-sm text-red-600 mt-1">
                        <span className="font-medium">Error:</span>{" "}
                        {result.message}
                      </p>
                    )}
                    {result.status === "success" && (
                      <p className="text-sm text-green-700 mt-1">
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

      <PasswordModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPasswordError("");
          setPendingSubmission(null);
        }}
        onSubmit={handlePasswordSubmit}
        error={passwordError}
      />
    </div>
  );
}
