import { useEffect, useState } from "react";
import { AlertCircle, X } from "lucide-react";

export default function Toast({ message, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) { setVisible(false); return; }
    setVisible(true);
    const t = setTimeout(() => { setVisible(false); setTimeout(onClose, 300); }, 3700);
    return () => clearTimeout(t);
  }, [message]);

  if (!message) return null;

  return (
    <div
      className={`fixed top-4 left-1/2 z-[9999] transition-all duration-300
        ${visible ? "opacity-100 -translate-x-1/2 translate-y-0" : "opacity-0 -translate-x-1/2 -translate-y-4"}`}
      style={{ maxWidth: "90vw", width: "360px" }}
    >
      <div className="bg-red-600 text-white rounded-xl shadow-lg px-4 py-3 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p className="flex-1 text-sm font-medium leading-snug">{message}</p>
        <button
          onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
          className="flex-shrink-0 p-0 bg-transparent border-0 text-white opacity-70 hover:opacity-100 active:scale-95 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
