interface FileUploadButtonProps {
  onFileSelect: (files: FileList) => void;
}

export default function FileUploadButton({
  onFileSelect,
}: FileUploadButtonProps) {
  return (
    <div className="relative">
      <input
        type="file"
        onChange={(e) => e.target.files && onFileSelect(e.target.files)}
        accept="image/*,video/*"
        multiple
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className="cursor-pointer text-blue-500 hover:text-blue-600"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
          />
        </svg>
      </label>
    </div>
  );
}
