// Developer-only page that checks the frontend can reach the backend.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";
import Brand from "../components/ui/Brand";

export default function ConnectionCheckPage() {
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
    checking: "border-attention/40 bg-attention-subtle text-attention-ink",
    connected: "border-primary/25 bg-primary-subtle text-primary",
    error: "border-danger/30 bg-danger-subtle text-danger",
  };

  return (
    <main className="min-h-[100dvh] bg-canvas px-4 py-10 text-ink sm:px-6 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <Brand />

        <h1 className="mt-10 text-[25px] font-semibold leading-tight tracking-tight sm:text-[32px]">
          Frontend–Backend Connection
        </h1>

        <div
          className={`mt-6 rounded-panel border p-5 ${statusStyles[status]}`}
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

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/login" className="btn btn-primary">
            Sign in
          </Link>

          <Link to="/register" className="btn btn-secondary">
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
