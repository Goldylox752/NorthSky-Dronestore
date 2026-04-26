"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

export default function Apply() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [experience, setExperience] = useState("beginner");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValidEmail = (v) => /\S+@\S+\.\S+/.test(v);
  const normalizePhone = (v) => v.replace(/\D/g, "");
  const cleanPhone = useMemo(() => normalizePhone(phone), [phone]);

  // simple qualification score (keeps low-quality users out)
  const score = useMemo(() => {
    let s = 0;
    if (isValidEmail(email)) s += 40;
    if (cleanPhone.length === 10) s += 30;
    if (company.length > 2) s += 20;
    if (experience === "pro") s += 10;
    return s;
  }, [email, cleanPhone, company, experience]);

  const qualified = score >= 60;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isValidEmail(email)) return setError("Enter a valid email.");
    if (cleanPhone.length !== 10) return setError("Enter a valid phone number.");
    if (!company) return setError("Company name required.");

    setLoading(true);

    try {
      const payload = {
        email,
        phone: cleanPhone,
        company,
        experience,
        score,
        source: "skymaster_apply",
      };

      // optional: store lead
      await fetch("/api/leads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // send to Stripe checkout
      const res = await fetch("/api/checkout-drone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Checkout failed");

      if (data.url) {
        router.push(data.url);
      }

    } catch (err) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>

      <div style={styles.card}>

        <h1 style={styles.title}>
          Apply for Skymaster X1 v2 Access
        </h1>

        <p style={styles.sub}>
          Contractor-only drone inspection system. Limited units per region.
        </p>

        {/* SCORE */}
        <div style={styles.score}>
          Qualification Score: <b>{score}/100</b>{" "}
          <span style={{ color: qualified ? "#22c55e" : "#fbbf24" }}>
            {qualified ? "Pre-Qualified" : "Review Required"}
          </span>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>

          <input
            style={styles.input}
            placeholder="Business Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            style={styles.input}
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <input
            style={styles.input}
            placeholder="Company Name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />

          <select
            style={styles.input}
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
          >
            <option value="beginner">Beginner (New to drones)</option>
            <option value="intermediate">Intermediate</option>
            <option value="pro">Professional Inspector</option>
          </select>

          {error && <p style={styles.error}>{error}</p>}

          <button disabled={loading} style={styles.button}>
            {loading ? "Processing..." : "Continue to Checkout"}
          </button>

        </form>

        <p style={styles.note}>
          By continuing, you are requesting access to contractor-grade inspection equipment.
        </p>

      </div>

    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0b1220",
    color: "white",
    fontFamily: "Arial",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 520,
    background: "#111827",
    padding: 30,
    borderRadius: 16,
    border: "1px solid #1f2937",
  },

  title: {
    fontSize: 24,
    fontWeight: 800,
  },

  sub: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 8,
  },

  score: {
    marginTop: 15,
    fontSize: 13,
    opacity: 0.9,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginTop: 20,
  },

  input: {
    padding: 12,
    borderRadius: 10,
    border: "1px solid #374151",
    background: "#0b1220",
    color: "white",
  },

  button: {
    padding: 14,
    borderRadius: 10,
    border: "none",
    background: "#22c55e",
    fontWeight: 700,
    cursor: "pointer",
  },

  error: {
    color: "#f87171",
    fontSize: 13,
  },

  note: {
    marginTop: 15,
    fontSize: 11,
    opacity: 0.6,
  },
};