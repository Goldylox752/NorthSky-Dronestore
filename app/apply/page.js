"use client";

import { useState } from "react";

export default function Apply() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValidEmail = (v) => /\S+@\S+\.\S+/.test(v);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !company) {
      return setError("All fields are required.");
    }

    if (!isValidEmail(email)) {
      return setError("Enter a valid email.");
    }

    setLoading(true);

    try {
      const res = await fetch("/api/checkout/drone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          company,
          product: "skymaster_x1_v2",
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Checkout failed");

      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Apply for Skymaster X1 v2</h1>

        <p style={styles.sub}>
          Contractor-only access. Limited production batch.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            style={styles.input}
            placeholder="Company Name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />

          <input
            style={styles.input}
            placeholder="Business Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Processing..." : "Continue to Secure Checkout"}
          </button>

          {error && <p style={styles.error}>{error}</p>}
        </form>

        <p style={styles.small}>
          ✔ Includes inspection drone access  
          ✔ Stripe secure checkout  
          ✔ Limited contractor batches only
        </p>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b1220",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Inter, sans-serif",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 520,
    background: "#121a2b",
    border: "1px solid #24314d",
    borderRadius: 16,
    padding: 28,
    color: "#fff",
  },

  title: {
    fontSize: 28,
    fontWeight: 800,
    marginBottom: 6,
  },

  sub: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 20,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  input: {
    padding: 12,
    borderRadius: 10,
    border: "1px solid #2b3a5a",
    background: "#0f172a",
    color: "#fff",
    outline: "none",
  },

  button: {
    padding: 14,
    borderRadius: 10,
    background: "linear-gradient(105deg,#22c55e,#16a34a)",
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 6,
  },

  error: {
    color: "#f87171",
    fontSize: 13,
  },

  small: {
    marginTop: 16,
    fontSize: 12,
    opacity: 0.6,
    lineHeight: 1.5,
  },
};