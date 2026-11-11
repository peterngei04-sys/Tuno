
import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "./lib/supabase";
import "./PostOpportunity.css";

function getLocalDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatPayment(payment: string) {
  const value = payment.trim();

  if (!value) return "Not specified";

  if (/^(negotiable|unpaid|volunteer|not specified)$/i.test(value)) {
    return value;
  }

  const hasOtherCurrency =
    /\b(KES|KSH|GBP|EUR|INR|NGN|ZAR|CAD|AUD|JPY)\b|KSh|£|€|₹/i.test(value);

  if (hasOtherCurrency) {
    return null;
  }

  if (/USD/i.test(value)) {
    return value.replace(/\bUSD\b/i, "USD");
  }

  if (value.includes("$")) {
    return `${value.replace(/\s+/g, " ").trim().replace(/\s*(per|\/)/i, " USD $1")}${/USD/i.test(value) ? "" : ""}`
      .replace(/\s+/g, " ")
      .replace(/\s+USD\s+(per|\/)/i, " USD $1")
      .replace(/\s+USD$/i, " USD");
  }

  if (/^\d+(\.\d+)?$/.test(value)) {
    return `$${value} USD`;
  }

  if (/^\d+(\.\d+)?\s+(per|\/)/i.test(value)) {
    return `$${value.replace(/^(\d+(?:\.\d+)?)\s+/, "$1 USD ")}`;
  }

  return value;
}

function PostOpportunity() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Freelancing");
  const [level, setLevel] = useState("Beginner");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [payment, setPayment] = useState("");
  const [location, setLocation] = useState("Worldwide");
  const [applicationUrl, setApplicationUrl] = useState("");
  const [providerName, setProviderName] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = getLocalDateString();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!endDate) {
      setError("Please select an application closing date.");
      return;
    }

    if (endDate < today) {
      setError("The closing date cannot be in the past.");
      return;
    }

    const formattedPayment = formatPayment(payment);

    if (formattedPayment === null) {
      setError(
        "Please enter payment in USD ($). Other currencies are not supported in this field."
      );
      return;
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      window.location.href = "/login";
      return;
    }

    const cleanUrl = applicationUrl.trim();

    if (!cleanUrl.startsWith("https://")) {
      setError("Please provide a valid HTTPS application link.");
      return;
    }

    setLoading(true);

    const requirementList = requirements
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const { error: insertError } = await supabase
      .from("opportunities")
      .insert({
        title: title.trim(),
        category,
        level,
        description: description.trim(),
        requirements: requirementList,
        payment: formattedPayment,
        location: location.trim() || "Worldwide",
        application_url: cleanUrl,
        provider_name: providerName.trim(),
        contributor_id: user.id,
        end_date: endDate,
        status: "pending",
      });

    setLoading(false);

    if (insertError) {
      console.error(insertError);
      setError(insertError.message);
      return;
    }

    alert("Your opportunity has been submitted for review.");
    window.location.href = "/explore";
  }

  return (
    <main className="post-page">
      <nav className="post-nav">
        <a href="/" className="post-logo">
          TUNO<span>.</span>
        </a>

        <a href="/explore" className="post-back">
          ← Back to Explore
        </a>
      </nav>

      <section className="post-container">
        <span className="post-eyebrow">GROW THE COMMUNITY</span>

        <h1>Share an opportunity.</h1>

        <p className="post-intro">
          Help someone discover a useful gig, remote job, or online
          opportunity. Submissions are reviewed before publication.
        </p>

        <form onSubmit={handleSubmit} className="post-form">
          <label>
            Opportunity title *
            <input
              required
              minLength={5}
              maxLength={150}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Remote freelance writing opportunity"
            />
          </label>

          <div className="post-form-row">
            <label>
              Category *
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option>Freelancing</option>
                <option>Remote Work</option>
                <option>Microtasks</option>
                <option>Content Creation</option>
                <option>Online Business</option>
                <option>Other</option>
              </select>
            </label>

            <label>
              Experience level *
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
                <option>All levels</option>
              </select>
            </label>
          </div>

          <label>
            Description *
            <textarea
              required
              minLength={20}
              maxLength={5000}
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what the opportunity involves..."
            />
          </label>

          <label>
            Requirements
            <textarea
              rows={4}
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Enter each requirement on a new line"
            />
          </label>

          <div className="post-form-row">
            <label>
              Payment amount (USD $)
              <input
                value={payment}
                onChange={(e) => setPayment(e.target.value)}
                placeholder="e.g. $10 per task"
              />
              <small className="post-note">
                Enter payment in US Dollars (USD). Examples: $10 USD per task,
                $500 USD per month, Negotiable or Unpaid.
              </small>
            </label>

            <label>
              Location
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Worldwide"
              />
            </label>
          </div>

          <label>
            Provider / company name *
            <input
              required
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              placeholder="Who is offering this opportunity?"
            />
          </label>

          <label>
            Application link *
            <input
              required
              type="url"
              value={applicationUrl}
              onChange={(e) => setApplicationUrl(e.target.value)}
              placeholder="https://example.com/apply"
            />
          </label>

          <label>
            Application closing date *
            <input
              required
              type="date"
              min={today}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>

          {endDate && (
            <p className="post-note">
              Applications for this opportunity will close on{" "}
              {new Date(`${endDate}T12:00:00`).toLocaleDateString(undefined, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              .
            </p>
          )}

          {error && <p className="post-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit opportunity →"}
          </button>

          <p className="post-note">
            Your submission will remain pending until it has been reviewed.
          </p>
        </form>
      </section>
    </main>
  );
}

export default PostOpportunity;
