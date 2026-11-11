
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import Auth from "./Auth";
import Explore from "./Explore";
import PostOpportunity from "./PostOpportunity";
import Community from "./Community";
import { supabase } from "./lib/supabase";
import "./App.css";

type Member = {
  id: string;
  name: string;
};

function getMemberName(user: User): string {
  const metadata = user.user_metadata ?? {};

  const fullName =
    typeof metadata.full_name === "string"
      ? metadata.full_name.trim()
      : "";

  const name =
    typeof metadata.name === "string"
      ? metadata.name.trim()
      : "";

  return (
    fullName ||
    name ||
    user.email?.split("@")[0] ||
    "Member"
  );
}

function App() {
  // Read both the URL path and hash.
  // This supports /community and /#community.
  const path =
    window.location.pathname.replace(/\/+$/, "") || "/";

  const hash = window.location.hash.toLowerCase();

  const isCommunityPage =
    path === "/community" || hash === "#community";

  const [member, setMember] = useState<Member | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    function updateMember(user: User | null) {
      if (!mounted) return;

      setMember(
        user
          ? {
              id: user.id,
              name: getMemberName(user),
            }
          : null
      );
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      updateMember(session?.user ?? null);
      setAuthLoading(false);
    });

    async function loadMember() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (!mounted) return;

        if (error) {
          console.error("Authentication error:", error);
          setMember(null);
        } else {
          updateMember(data.user);
        }
      } catch (error) {
        if (!mounted) return;

        console.error("Unable to load member:", error);
        setMember(null);
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }

    void loadMember();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        alert(error.message);
        setLoggingOut(false);
        return;
      }

      setMember(null);
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Unable to log out. Please try again.");
      setLoggingOut(false);
    }
  }

  function goToPost() {
    if (member) {
      window.location.href = "/post";
    } else {
      window.location.href = "/register";
    }
  }

  // AUTHENTICATION PAGES
  if (path === "/login") {
    return <Auth mode="login" />;
  }

  if (path === "/register") {
    return <Auth mode="register" />;
  }

  // EXPLORE PAGE
  if (path === "/explore") {
    return <Explore />;
  }

  // DEDICATED COMMUNITY PAGE
  // Supports both /community and /#community
  if (isCommunityPage) {
    return <Community />;
  }

  // POSTING PAGE
  if (path === "/post") {
    if (authLoading) {
      return (
        <div className="app-loading">
          <p>Checking your account...</p>
        </div>
      );
    }

    if (!member) {
      window.location.replace("/login");
      return null;
    }

    return <PostOpportunity />;
  }

  // HOMEPAGE
  return (
    <div className="app">
      <nav className="navbar">
        <a href="/" className="logo">
          TUNO<span>.</span>
        </a>

        <div className="nav-links">
          <a href="/#home">Home</a>
          <a href="/explore">Explore</a>
          <a href="/#how-it-works">How it works</a>
          <a href="/community">Community</a>
        </div>

        <div className="nav-actions">
          {!authLoading && (
            member ? (
              <div className="nav-member">
                <span className="nav-welcome">
                  Welcome, <strong>{member.name}</strong>
                </span>

                <button
                  className="login-btn"
                  type="button"
                  onClick={goToPost}
                >
                  Share opportunity
                </button>

                <button
                  className="join-btn"
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  {loggingOut ? "Logging out..." : "Log out"}
                </button>
              </div>
            ) : (
              <>
                <button
                  className="login-btn"
                  type="button"
                  onClick={() => {
                    window.location.href = "/login";
                  }}
                >
                  Log in
                </button>

                <button
                  className="join-btn"
                  type="button"
                  onClick={() => {
                    window.location.href = "/register";
                  }}
                >
                  Join TUNO
                </button>
              </>
            )
          )}
        </div>
      </nav>

      <main>
        {/* HERO SECTION */}
        <section className="hero" id="home">
          <div className="hero-content">
            <span className="eyebrow">
              YOUR NEXT OPPORTUNITY STARTS HERE
            </span>

            <h1>
              The internet is full of opportunities.
              <span> Find yours.</span>
            </h1>

            <p>
              Discover online earning opportunities, learn new skills,
              connect with a global community, and find legitimate ways
              to make the internet work for you.
            </p>

            <div className="hero-buttons">
              <button
                className="primary-btn"
                type="button"
                onClick={() => {
                  window.location.href = "/explore";
                }}
              >
                Explore opportunities <span>↗</span>
              </button>

              {member ? (
                <button
                  className="secondary-btn"
                  type="button"
                  onClick={goToPost}
                >
                  Share an opportunity
                </button>
              ) : (
                <a href="#how-it-works" className="secondary-btn">
                  How TUNO works
                </a>
              )}
            </div>

            <div className="hero-note">
              <span className="trust-mark" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
                </svg>
              </span>

              Opportunities and knowledge from around the world
            </div>
          </div>

          {/* OPPORTUNITY PREVIEW */}
          <div className="hero-visual">
            <div className="floating-card card-one">
              <span className="card-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19.5V4.5h16v15H4Z" />
                  <path d="m7 15 3-3 2 2 5-5" />
                  <path d="M14 9h3v3" />
                </svg>
              </span>

              <div>
                <strong>Freelance Writing</strong>
                <small>Work from anywhere</small>
              </div>

              <span className="card-arrow">↗</span>
            </div>

            <div className="visual-center">
              <span className="visual-globe" aria-hidden="true">
                <svg
                  viewBox="0 0 64 64"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <circle cx="32" cy="32" r="23" />
                  <path d="M9 32h46M32 9c8 8 12 15 12 23S40 47 32 55M32 9c-8 8-12 15-12 23s4 15 12 23M14 19h36M14 45h36" />
                </svg>
              </span>

              <h3>Explore. Learn. Earn.</h3>
              <p>Your opportunities are closer than you think.</p>
            </div>

            <div className="floating-card card-two">
              <span className="card-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="13" rx="2" />
                  <path d="M8 21h8M12 17v4M7 8h10M7 12h6" />
                </svg>
              </span>

              <div>
                <strong>Remote Opportunities</strong>
                <small>Discover new possibilities</small>
              </div>

              <span className="card-arrow">↗</span>
            </div>

            <div className="floating-card card-three">
              <span className="card-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3 14.5 9.5 21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" />
                  <path d="m19 3 .7 2.3L22 6l-2.3.7L19 9l-.7-2.3L16 6l2.3-.7L19 3Z" />
                </svg>
              </span>

              <div>
                <strong>Start Something New</strong>
                <small>Take your first step</small>
              </div>
            </div>
          </div>
        </section>

        {/* STATISTICS */}
        <section className="stats-section">
          <div className="stat">
            <h2>01</h2>
            <p>Discover opportunities</p>
          </div>

          <div className="stat">
            <h2>02</h2>
            <p>Learn how to get started</p>
          </div>

          <div className="stat">
            <h2>03</h2>
            <p>Share your experiences</p>
          </div>

          <div className="stat">
            <h2>04</h2>
            <p>Grow with the community</p>
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="categories-section" id="explore">
          <div className="section-heading">
            <span className="eyebrow">FIND YOUR DIRECTION</span>

            <h2>What are you interested in?</h2>

            <p>
              Explore different ways people are building skills and
              finding opportunities online.
            </p>
          </div>

          <div className="category-grid">
            <div className="category-card">
              <span className="category-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="7" width="18" height="14" rx="2" />
                  <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" />
                </svg>
              </span>

              <h3>Freelancing</h3>
              <p>
                Discover platforms where you can offer your skills
                and services.
              </p>
              <a href="/explore">Explore category ↗</a>
            </div>

            <div className="category-card">
              <span className="category-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m13 2-9 12h7l-1 8 10-13h-7l0-7Z" />
                </svg>
              </span>

              <h3>Microtasks</h3>
              <p>
                Learn about smaller online tasks and how these
                opportunities work.
              </p>
              <a href="/explore">Explore category ↗</a>
            </div>

            <div className="category-card">
              <span className="category-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="5" width="18" height="14" rx="3" />
                  <path d="m10 9 5 3-5 3V9Z" />
                </svg>
              </span>

              <h3>Content Creation</h3>
              <p>
                Explore ways to create, publish, and grow digital
                content.
              </p>
              <a href="/explore">Explore category ↗</a>
            </div>

            <div className="category-card">
              <span className="category-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
                </svg>
              </span>

              <h3>Remote Work</h3>
              <p>
                Discover remote work opportunities from different
                parts of the world.
              </p>
              <a href="/explore">Explore category ↗</a>
            </div>
          </div>

          <div className="explore-more">
            <button
              className="primary-btn"
              type="button"
              onClick={() => {
                window.location.href = "/explore";
              }}
            >
              View all opportunities <span>↗</span>
            </button>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="how-section" id="how-it-works">
          <div className="section-heading">
            <span className="eyebrow">SIMPLE STEPS</span>

            <h2>How TUNO works</h2>

            <p>
              A simple way to discover opportunities and learn from
              people around the world.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <span>01</span>
              <h3>Discover</h3>
              <p>
                Browse opportunities shared by the TUNO community.
              </p>
            </div>

            <div className="step-card">
              <span>02</span>
              <h3>Learn</h3>
              <p>
                Understand how platforms work and what you need to
                get started.
              </p>
            </div>

            <div className="step-card">
              <span>03</span>
              <h3>Connect</h3>
              <p>
                Share experiences, ask questions, and learn from
                other members.
              </p>
            </div>

            <div className="step-card">
              <span>04</span>
              <h3>Grow</h3>
              <p>
                Take action, develop your skills, and keep discovering.
              </p>
            </div>
          </div>
        </section>

        {/* HOMEPAGE COMMUNITY PROMOTION */}
        <section className="community-section" id="community">
          <div className="community-content">
            <span className="eyebrow">BETTER TOGETHER</span>

            <h2>
              The internet has opportunities.
              <span> Let's find them together.</span>
            </h2>

            <p>
              Join a community built around discovering opportunities,
              sharing knowledge, and helping people make informed
              decisions about earning online.
            </p>

            <button
              className="community-btn"
              type="button"
              onClick={() => {
                window.location.href = "/community";
              }}
            >
              Visit the community ↗
            </button>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <a href="/" className="logo">
          TUNO<span>.</span>
        </a>

        <p>
          Discover opportunities. Share knowledge. Grow together.
        </p>

        <div className="footer-links">
          <a href="/">Home</a>
          <a href="/explore">Explore</a>
          <a href="/#how-it-works">How it works</a>
          <a href="/community">Community</a>
        </div>

        <small>
          © {new Date().getFullYear()} TUNO. All rights reserved.
        </small>
      </footer>
    </div>
  );
}

export default App;
