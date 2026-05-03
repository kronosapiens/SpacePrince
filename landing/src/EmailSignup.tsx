import { useState, type FormEvent } from "react";

type Status = "idle" | "submitting" | "success" | "error";

const FORM_ID = import.meta.env.VITE_CONVERTKIT_FORM_ID as string | undefined;

export function EmailSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!FORM_ID) {
      setStatus("error");
      return;
    }
    setStatus("submitting");
    try {
      const res = await fetch(
        `https://app.kit.com/forms/${FORM_ID}/subscriptions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ email_address: email }),
        },
      );
      if (!res.ok) throw new Error(`status ${res.status}`);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return <div className="email-signup-message">Stay tuned.</div>;
  }

  return (
    <>
      <form className="email-signup" onSubmit={onSubmit} noValidate>
        <input
          className="email-signup-input"
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "submitting"}
          autoComplete="email"
          aria-label="Email address"
        />
        <button
          type="submit"
          className="email-signup-submit"
          disabled={status === "submitting" || email.length === 0}
        >
          {status === "submitting" ? "..." : "Get Updates"}
        </button>
      </form>
      {status === "error" && (
        <div className="email-signup-message is-error" role="alert">
          Something went wrong — try again.
        </div>
      )}
    </>
  );
}
