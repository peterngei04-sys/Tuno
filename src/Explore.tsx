import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "./lib/supabase";
import "./Explore.css";

export type Opportunity = {
  id: string;
  title: string;
  category: string;
  level: string;
  description: string;
  requirements: string[];
  payment: string;
  location: string;
  link: string;
  contributor: string;
  created_at?: string;
  end_date?: string;
};

type CurrentMember = {
  id: string;
  name: string;
};

const categories = [
  "All opportunities",
  "Freelancing",
  "Remote Work",
  "Microtasks",
  "Content Creation",
  "Online Business",
];

function getText(
  row: Record<string, unknown>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return "";
}

function getRequirements(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getApplicationUrl(value: string): string {
  if (!value.trim()) return "";

  try {
    const url = new URL(value.trim());

    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.href;
    }

    return "";
  } catch {
    return "";
  }
}

function formatPaymentDisplay(value: string): string {
  const payment = value.trim();

  if (!payment) return "Not specified";

  if (
    /^(negotiable|unpaid|volunteer|not specified|free)$/i.test(payment)
  ) {
    return payment;
  }

  // Preserve payments explicitly stated in another currency.
  if (
    /\b(KES|KSH|GBP|EUR|INR|NGN|ZAR|CAD|AUD|JPY)\b|KSh|£|€|₹/i.test(
      payment
    )
  ) {
    return payment;
  }

  // Keep values already identified as USD.
  if (/\bUSD\b/i.test(payment)) {
    return payment;
  }

  // Format numeric payments and ranges using the TUNO USD standard.
  const match = payment.match(
    /^(\$?\s*\d[\d,]*(?:\.\d+)?)(?:\s*(?:-|to)\s*(\$?\s*\d[\d,]*(?:\.\d+)?))?(?:\s*(per\s+.+|\/\s*.+))?$/i
  );

  if (match) {
    const firstAmount = match[1].replace(/[$\s]/g, "");
    const secondAmount = match[2]
      ? match[2].replace(/[$\s]/g, "")
      : "";

    const frequency = match[3] ? ` ${match[3].trim()}` : "";

    if (secondAmount) {
      return `$${firstAmount} - $${secondAmount} USD${frequency}`;
    }

    return `$${firstAmount} USD${frequency}`;
  }

  // Add USD to values already written with a dollar sign.
  if (payment.startsWith("$")) {
    return `${payment} USD`;
  }

  return payment;
}

function formatDate(value?: string): string {
  if (!value) return "";

  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = dateOnly
    ? new Date(`${value}T12:00:00`)
    : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

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

function Explore() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("recent");

  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null);

  const detailRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (selectedOpportunity) {
      detailRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedOpportunity]);

  const [currentUser, setCurrentUser] =
    useState<CurrentMember | null>(null);

  const [authLoading, setAuthLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // Identify the authenticated member.
  useEffect(() => {
    let isMounted = true;

    function updateMember(user: User | null) {
      if (!isMounted) return;

      if (!user) {
        setCurrentUser(null);
        return;
      }

      setCurrentUser({
        id: user.id,
        name: getMemberName(user),
      });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      updateMember(session?.user ?? null);
      setAuthLoading(false);
    });

    async function loadCurrentUser() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (!isMounted) return;

        if (error) {
          console.error("Unable to identify member:", error);
          setCurrentUser(null);
        } else {
          updateMember(data.user);
        }
      } catch (err) {
        if (!isMounted) return;

        console.error("Unable to load member:", err);
        setCurrentUser(null);
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    }

    void loadCurrentUser();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Load approved opportunities from Supabase.
  useEffect(() => {
    let isMounted = true;

    async function loadOpportunities() {
      setLoading(true);
      setError("");

      try {
        const { data, error: supabaseError } = await supabase
          .from("opportunities")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false });

        if (!isMounted) return;

        if (supabaseError) {
          console.error("Supabase opportunities error:", supabaseError);
          setError(supabaseError.message);
          setOpportunities([]);
          setLoading(false);
          return;
        }

        const formatted: Opportunity[] = (data ?? [])
          .map((item: Record<string, unknown>) => {
            const id = getText(item, "id");
            const title = getText(item, "title");

            return {
              id,
              title,
              category: getText(item, "category") || "Other",
              level: getText(item, "level") || "Not specified",
              description:
                getText(item, "description") ||
                "No description has been provided.",
              requirements: getRequirements(item.requirements),
              payment: formatPaymentDisplay(
                getText(item, "payment") || "Not specified"
              ),
              location: getText(item, "location") || "Worldwide",
              link: getApplicationUrl(
                getText(item, "application_url", "link")
              ),
              contributor:
                getText(item, "provider_name", "contributor") ||
                "TUNO community",
              created_at: getText(item, "created_at"),
              end_date: getText(item, "end_date"),
            };
          })
          .filter((item) => item.id && item.title);

        setOpportunities(formatted);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;

        console.error("Unable to load opportunities:", err);

        setError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred."
        );

        setOpportunities([]);
        setLoading(false);
      }
    }

    void loadOpportunities();

    return () => {
      isMounted = false;
    };
  }, [retryCount]);

  // Search, filter and sort opportunities.
  const filteredOpportunities = useMemo(() => {
    const term = search.trim().toLowerCase();

    return opportunities
      .filter((opportunity) => {
        const searchableText = [
          opportunity.title,
          opportunity.category,
          opportunity.description,
          opportunity.contributor,
          opportunity.location,
          opportunity.payment,
          opportunity.level,
          ...opportunity.requirements,
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !term || searchableText.includes(term);

        const matchesCategory =
          !category ||
          opportunity.category.toLowerCase() === category.toLowerCase();

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sort === "alphabetical") {
          return a.title.localeCompare(b.title);
        }

        return (
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
        );
      });
  }, [opportunities, search, category, sort]);

  function clearFilters() {
    setSearch("");
    setCategory("");
    setSelectedOpportunity(null);
  }

  function chooseCategory(item: string) {
    setCategory(item === "All opportunities" ? "" : item);
    setSelectedOpportunity(null);
  }

  function openOpportunity(opportunity: Opportunity) {
    setSelectedOpportunity(opportunity);
  }

  function retryLoading() {
    setRetryCount((count) => count + 1);
  }

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Logout error:", error);
        alert(error.message);
        setLoggingOut(false);
        return;
      }

      setCurrentUser(null);
      window.location.href = "/explore";
    } catch (err) {
      console.error("Logout error:", err);
      alert("Unable to log out. Please try again.");
      setLoggingOut(false);
    }
  }

  function handleShareOpportunity() {
    if (!currentUser) {
      window.location.href = "/login";
      return;
    }

    window.location.href = "/post";
  }

  const selectedLink = selectedOpportunity
    ? getApplicationUrl(selectedOpportunity.link)
    : "";

  return (
    <div className="explore-page">
      <nav className="explore-nav">
        <a href="/" className="explore-logo">
          TUNO<span>.</span>
        </a>

        <div className="explore-nav-links">
          <a href="/">Home</a>
          <a href="/explore" className="active">
            Explore
          </a>
          <a href="/#how-it-works">How it works</a>
          <a href="/community">Community</a>
        </div>

        {!authLoading && (
          currentUser ? (
            <div className="explore-member">
              <span className="member-greeting">
                Welcome, <strong>{currentUser.name}</strong>
              </span>

              <button
                type="button"
                className="member-logout"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          ) : (
            <button
              className="explore-join"
              type="button"
              onClick={() => {
                window.location.href = "/register";
              }}
            >
              Join TUNO <span>↗</span>
            </button>
          )
        )}
      </nav>

      <main>
        {/* HERO AND SEARCH */}
        <section className="explore-hero">
          <span className="explore-eyebrow">
            THE TUNO OPPORTUNITY HUB
          </span>

          <h1>
            Explore opportunities.
            <span>Discover what's possible.</span>
          </h1>

          <p>
            Discover opportunities shared by people and providers
            around the world. Find something that matches your skills
            and interests.
          </p>

          <div className="explore-search">
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>

            <input
              type="search"
              placeholder="Search gigs, skills, platforms..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setSelectedOpportunity(null);
              }}
              aria-label="Search opportunities"
            />

            {search && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearch("")}
              >
                Clear
              </button>
            )}
          </div>

          <div className="explore-search-note">
            Search by gig, skill, provider or category.
          </div>
        </section>

        {/* OPPORTUNITY FEED */}
        <section className="explore-directory">
          <div className="explore-categories">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                className={
                  (item === "All opportunities" && !category) ||
                  category === item
                    ? "category-chip selected"
                    : "category-chip"
                }
                onClick={() => chooseCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>

          {selectedOpportunity ? (
            <section
              className="opportunity-detail"
              ref={detailRef}
              tabIndex={-1}
            >
              <button
                className="detail-back"
                type="button"
                onClick={() => setSelectedOpportunity(null)}
              >
                ← Back to opportunities
              </button>

              <div className="detail-heading">
                <div className="opportunity-card-meta">
                  <span>{selectedOpportunity.category}</span>
                  <span>{selectedOpportunity.level}</span>
                </div>

                <h2>{selectedOpportunity.title}</h2>
                <p>{selectedOpportunity.description}</p>
              </div>

              <div className="detail-information">
                <div className="detail-main">
                  <section className="detail-section">
                    <h3>About this opportunity</h3>
                    <p>{selectedOpportunity.description}</p>
                  </section>

                  <section className="detail-section">
                    <h3>Requirements and skills</h3>

                    {selectedOpportunity.requirements.length > 0 ? (
                      <ul>
                        {selectedOpportunity.requirements.map(
                          (item, index) => (
                            <li key={`${item}-${index}`}>{item}</li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p>
                        Check the original provider's requirements.
                      </p>
                    )}
                  </section>
                </div>

                <aside className="detail-sidebar">
                  <h3>Opportunity information</h3>

                  <div className="detail-fact payment-detail">
                    <span>PAYMENT</span>
                    <strong>{selectedOpportunity.payment}</strong>
                  </div>

                  <div className="detail-fact">
                    <span>Location</span>
                    <strong>{selectedOpportunity.location}</strong>
                  </div>

                  <div className="detail-fact">
                    <span>Provider / contributor</span>
                    <strong>{selectedOpportunity.contributor}</strong>
                  </div>

                  {selectedOpportunity.created_at && (
                    <div className="detail-fact">
                      <span>Published</span>
                      <strong>
                        {formatDate(selectedOpportunity.created_at)}
                      </strong>
                    </div>
                  )}

                  <div className="detail-fact">
                    <span>Application deadline</span>
                    <strong>
                      {selectedOpportunity.end_date
                        ? formatDate(selectedOpportunity.end_date)
                        : "Not provided"}
                    </strong>
                  </div>

                  {selectedLink ? (
                    <a
                      className="take-me-button"
                      href={selectedLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Take me to opportunity ↗
                    </a>
                  ) : (
                    <button
                      className="take-me-button unavailable"
                      type="button"
                      disabled
                    >
                      Application link unavailable
                    </button>
                  )}

                  <p className="detail-disclaimer">
                    Check the original provider's eligibility,
                    payment terms and requirements before applying.
                    TUNO does not guarantee employment or earnings.
                  </p>
                </aside>
              </div>
            </section>
          ) : (
            <section className="search-results">
              <div className="results-heading">
                <div>
                  <span className="explore-eyebrow">DISCOVER</span>

                  <h2>
                    {search || category
                      ? "Matching opportunities"
                      : "Opportunities for you"}
                  </h2>

                  <p>
                    {loading
                      ? "Loading published opportunities..."
                      : `${filteredOpportunities.length} opportunities found`}
                  </p>
                </div>

                <select
                  className="feed-sort"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  aria-label="Sort opportunities"
                >
                  <option value="recent">Most recent</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>

              {loading ? (
                <div className="explore-empty">
                  <div className="loading-spinner" />
                  <h3>Finding opportunities...</h3>
                  <p>Loading the latest published listings.</p>
                </div>
              ) : error ? (
                <div className="explore-empty">
                  <h3>Unable to load opportunities</h3>
                  <p>{error}</p>

                  <button
                    type="button"
                    className="clear-results"
                    onClick={retryLoading}
                  >
                    Try again
                  </button>
                </div>
              ) : filteredOpportunities.length > 0 ? (
                <div className="opportunity-feed">
                  {filteredOpportunities.map((opportunity) => (
                    <article
                      className="feed-item"
                      key={opportunity.id}
                    >
                      <button
                        type="button"
                        className="feed-item-button"
                        onClick={() => openOpportunity(opportunity)}
                        aria-label={`View ${opportunity.title}`}
                      >
                        <div className="feed-item-top">
                          <span className="feed-category">
                            {opportunity.category}
                          </span>

                          <span className="feed-level">
                            {opportunity.level}
                          </span>

                          <span className="feed-provider">
                            Shared by {opportunity.contributor}
                          </span>
                        </div>

                        <h3>{opportunity.title}</h3>

                        <p className="feed-description">
                          {opportunity.description}
                        </p>

                        <div className="feed-item-bottom">
                          <span className="feed-payment">
                            {opportunity.payment}
                          </span>

                          <span>{opportunity.location}</span>

                          {opportunity.created_at && (
                            <span>
                              Published: {formatDate(opportunity.created_at)}
                            </span>
                          )}

                          <span className="feed-deadline">
                            Deadline:{" "}
                            {opportunity.end_date
                              ? formatDate(opportunity.end_date)
                              : "Not provided"}
                          </span>

                          <span className="feed-view">
                            View details ↗
                          </span>
                        </div>
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="explore-empty">
                  <div className="empty-search-icon">
                    <svg
                      viewBox="0 0 48 48"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      aria-hidden="true"
                    >
                      <circle cx="21" cy="21" r="13" />
                      <path d="m31 31 10 10M15 21h12M21 15v12" />
                    </svg>
                  </div>

                  <h3>
                    {search || category
                      ? "No matching opportunities yet"
                      : "New opportunities are on their way"}
                  </h3>

                  <p>
                    {search || category
                      ? "Try another search term or choose a different category."
                      : "Published opportunities shared by the TUNO community will appear here."}
                  </p>

                  {(search || category) && (
                    <button
                      type="button"
                      className="clear-results"
                      onClick={clearFilters}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </section>
          )}
        </section>

        {/* CONTRIBUTION BANNER */}
        <section className="contribute-banner">
          <div>
            <span className="explore-eyebrow">
              GROW THE COMMUNITY
            </span>

            <h2>Found an opportunity worth sharing?</h2>

            <p>
              Help someone else discover it. Share useful opportunities
              with the TUNO community.
            </p>
          </div>

          <button
            type="button"
            onClick={handleShareOpportunity}
          >
            Share an opportunity ↗
          </button>
        </section>
      </main>

      <footer className="explore-footer">
        <a href="/" className="explore-logo">
          TUNO<span>.</span>
        </a>

        <p>Discover. Share. Grow together.</p>

        <div className="explore-footer-links">
          <a href="/">Home</a>
          <a href="/explore">Explore</a>
          <a href="/community">Community</a>
        </div>

        <span>
          © {new Date().getFullYear()} TUNO. All rights reserved.
        </span>
      </footer>
    </div>
  );
}

export default Explore;