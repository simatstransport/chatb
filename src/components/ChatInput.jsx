import { useState, useRef } from 'react';
import { Send, Image as ImageIcon, X, Loader2 } from 'lucide-react';

export default function ChatInput({ onSendMessage }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      alert('Only images are allowed');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && !file) return;

    setUploading(true);
    try {
      await onSendMessage(text.trim(), file);
      setText('');
      clearFile();
    } catch (err) {
      alert('Failed to send message');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-gray-900 border-t border-gray-800 p-4">
      {previewUrl && (
        <div className="mb-4 relative inline-block">
          <div className="relative group rounded-lg overflow-hidden border border-gray-700">
            <img src={previewUrl} alt="Preview" className="h-32 object-contain bg-gray-950" />
            <button
              type="button"
              onClick={clearFile}
              className="absolute top-1 right-1 bg-gray-900/80 hover:bg-red-500 text-white p-1 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-3 text-gray-400 hover:text-primary-400 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
        >
          <ImageIcon className="w-6 h-6" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg, image/png, image/webp"
          className="hidden"
        />
        <div className="flex-1 bg-gray-800 rounded-lg border border-gray-700 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-colors overflow-hidden">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a secure message..."
            className="w-full bg-transparent text-white px-4 py-3 focus:outline-none"
            disabled={uploading}
          />
        </div>
        <button
          type="submit"
          disabled={(!text.trim() && !file) || uploading}
          className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 flex items-center justify-center"
        >
          {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
        </button>
      </form>
    </div>
  );
}
