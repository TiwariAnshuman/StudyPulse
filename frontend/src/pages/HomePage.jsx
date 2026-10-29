import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

export default function HomePage() {
  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("Checking backend connection...");

  useEffect(() => {
    let cancelled = false;

    async function checkBackend() {
      try {
        const result = await apiRequest("/health");

        if (!cancelled) {
          setStatus("connected");
          setMessage(
            result.message || "Backend responded successfully."
          );
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setMessage(error.message);
        }
      }
    }

    checkBackend();

    return () => {
      cancelled = true;
    };
  }, []);

  const statusStyles = {
    checking: "bg-amber-50 text-amber-800",
    connected: "bg-emerald-50 text-emerald-800",
    error: "bg-red-50 text-red-800",
  };

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-16 text-stone-900">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold tracking-widest text-emerald-800">
          STUDYPULSE
        </p>

        <h1 className="mt-4 text-3xl font-semibold">
          Frontend–Backend Connection
        </h1>

        <div
          className={`mt-8 rounded-xl p-5 ${statusStyles[status]}`}
          role="status"
          aria-live="polite"
        >
          <p className="font-semibold">
            {status === "checking" && "Checking connection"}
            {status === "connected" && "Backend connected"}
            {status === "error" && "Connection failed"}
          </p>

          <p className="mt-2 text-sm">{message}</p>
        </div>
      </div>
    </main>
  );
}