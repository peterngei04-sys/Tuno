import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "./lib/supabase";
import "./Auth.css";

type AuthProps = {
  mode: "login" | "register";
};

function Auth({ mode }: AuthProps) {
  const isRegister = mode === "register";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (isRegister && !fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must be at least 8 characters.");
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        const { data, error: signUpError } =
          await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                full_name: fullName.trim(),
              },
            },
          });

        if (signUpError) throw signUpError;

        if (data.session) {
          window.location.href = "/explore";
          return;
        }

        setSuccess(
          "Your account has been created. Please check your email for a confirmation link before logging in."
        );
      } else {
        const { error: signInError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (signInError) throw signInError;

        window.location.href = "/explore";
        return;
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-decoration auth-decoration-one" />
      <div className="auth-decoration auth-decoration-two" />

      <a href="/" className="auth-logo">
        TUNO<span>.</span>
      </a>

      <section className="auth-container">
        <a href="/" className="auth-back">
          ← Back to home
        </a>

        <div className="auth-heading">
          <span className="auth-eyebrow">
            {isRegister ? "JOIN THE COMMUNITY" : "WELCOME BACK"}
          </span>

          <h1>
            {isRegister ? "Create your account." : "Welcome back."}
          </h1>

          <p>
            {isRegister
              ? "Join TUNO and become part of a community discovering opportunities around the world."
              : "Sign in to continue exploring opportunities with TUNO."}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <div className="auth-field">
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={isRegister ? "new-password" : "current-password"}
              minLength={8}
              required
            />
          </div>

          {isRegister && (
            <div className="auth-field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Enter your password again"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
          )}

          {error && (
            <div className="auth-message auth-error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="auth-message auth-success" role="status">
              {success}
            </div>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isRegister
                ? "Create account"
                : "Log in"}
            {!loading && <span>↗</span>}
          </button>
        </form>

        <div className="auth-switch">
          {isRegister ? (
            <>
              Already have an account?{" "}
              <a href="/login">Log in</a>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <a href="/register">Join TUNO</a>
            </>
          )}
        </div>

        <p className="auth-terms">
          By using TUNO, you agree to use the platform responsibly and
          provide accurate information.
        </p>
      </section>

      <footer className="auth-footer">
        © {new Date().getFullYear()} TUNO. All rights reserved.
      </footer>
    </main>
  );
}

export default Auth;