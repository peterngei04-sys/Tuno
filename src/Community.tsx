
import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";
import "./Community.css";

type CommunityOpportunity = {
  id: string;
  title: string;
  category: string;
  level: string;
  description: string;
  payment: string;
  location: string;
  provider: string;
  applicationUrl: string;
  endDate: string;
  createdAt: string;
};

const categories = [
  "All",
  "Freelancing",
  "Remote Work",
  "Microtasks",
  "Content Creation",
  "Online Business",
];

function formatDate(value: string) {
  if (!value) return "Not specified";

  const date = new Date(`${value.slice(0, 10)}T12:00:00`);

  if (Number.isNaN(date.getTime())) return "Not specified";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Community() {
  const [opportunities, setOpportunities] = useState<CommunityOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    let mounted = true;

    async function loadCommunityPosts() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("opportunities")
        .select(
          "id, title, category, level, description, payment, location, provider_name, application_url, end_date, created_at"
        )
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (error) {
        console.error("Community feed error:", error);
        setError("We couldn't load community contributions. Please try again.");
        setOpportunities([]);
      } else {
        const formatted = (data ?? []).map((item) => ({
          id: String(item.id),
          title: item.title || "Untitled opportunity",
          category: item.category || "Other",
          level: item.level || "Not specified",
          description: item.description || "No description provided.",
          payment: item.payment || "Not specified",
          location: item.location || "Worldwide",
          provider: item.provider_name || "TUNO community member",
          applicationUrl: item.application_url || "",
          endDate: item.end_date || "",
          createdAt: item.created_at || "",
        }));

        setOpportunities(formatted);
      }

      setLoading(false);
    }

    void loadCommunityPosts();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredPosts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return opportunities.filter((item) => {
      const matchesCategory =
        activeCategory === "All" ||
        item.category.toLowerCase() === activeCategory.toLowerCase();

      const searchable = [
        item.title,
        item.description,
        item.category,
        item.provider,
        item.location,
      ]
        .join(" ")
        .toLowerCase();

      return matchesCategory && (!term || searchable.includes(term));
    });
  }, [opportunities, search, activeCategory]);

  function openApplication(url: string) {
    try {
      const parsed = new URL(url);

      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        window.open(parsed.href, "_blank", "noopener,noreferrer");
      }
    } catch {
      // Invalid application links are not opened.
    }
  }

  return (
    <div className="community-page">
      <nav className="community-nav">
        <a href="/" className="community-logo">
          TUNO<span>.</span>
        </a>

        <div className="community-nav-links">
          <a href="/">Home</a>
          <a href="/explore">Explore</a>
          <a href="/community" className="active">Community</a>
        </div>

        <a href="/post" className="community-nav-button">
          + Share opportunity
        </a>
      </nav>

      <main className="community-layout">
        <header className="community-header">
          <div>
            <span className="community-eyebrow">TUNO COMMUNITY</span>
            <h1>Community Board<span>.</span></h1>
            <p>
              Discover what people are sharing, find useful opportunities
              and contribute something valuable.
            </p>
          </div>

          <div className="community-header-actions">
            <a href="/explore">Explore all opportunities ↗</a>
          </div>
        </header>

        <section className="community-stats">
          <div className="community-stat">
            <span>APPROVED CONTRIBUTIONS</span>
            <strong>{opportunities.length}</strong>
            <small>Shared with the TUNO community</small>
          </div>

          <div className="community-stat">
            <span>OPPORTUNITY CATEGORIES</span>
            <strong>
              {new Set(opportunities.map((item) => item.category)).size}
            </strong>
            <small>Different areas to explore</small>
          </div>

          <div className="community-stat">
            <span>COMMUNITY ACTIVITY</span>
            <strong>{loading ? "..." : "Live"}</strong>
            <small>Approved contributions from members</small>
          </div>
        </section>

        <div className="community-main-grid">
          <section className="community-feed">
            <div className="community-feed-heading">
              <div>
                <span className="community-eyebrow">FROM THE COMMUNITY</span>
                <h2>Shared opportunities</h2>
                <p>Useful discoveries contributed by TUNO members.</p>
              </div>

              <a href="/post" className="community-share-small">
                + Contribute
              </a>
            </div>

            <div className="community-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search contributions, skills or platforms..."
                aria-label="Search community contributions"
              />
            </div>

            <div className="community-filters">
              {categories.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={activeCategory === item ? "selected" : ""}
                  onClick={() => setActiveCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="community-feed-meta">
              <strong>Community contributions</strong>
              <span>{filteredPosts.length} results</span>
            </div>

            {loading ? (
              <div className="community-state">
                <div className="community-spinner" />
                <h3>Loading community activity</h3>
                <p>Finding the latest approved contributions.</p>
              </div>
            ) : error ? (
              <div className="community-state">
                <h3>Unable to load contributions</h3>
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                >
                  Try again
                </button>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="community-state">
                <div className="community-empty-icon">✦</div>
                <h3>No contributions found</h3>
                <p>
                  {search || activeCategory !== "All"
                    ? "Try a different search or category."
                    : "The community is waiting for its next contribution. Be one of the first to share something useful."}
                </p>
                <a href="/post">Share an opportunity ↗</a>
              </div>
            ) : (
              <div className="community-post-list">
                {filteredPosts.map((item) => (
                  <article className="community-post" key={item.id}>
                    <div className="community-post-top">
                      <span className="community-post-category">
                        {item.category}
                      </span>
                      <span className="community-post-date">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    <h3>{item.title}</h3>

                    <p className="community-post-description">
                      {item.description}
                    </p>

                    <div className="community-post-details">
                      <div>
                        <span>PAYMENT</span>
                        <strong>{item.payment}</strong>
                      </div>

                      <div>
                        <span>LOCATION</span>
                        <strong>{item.location}</strong>
                      </div>

                      <div>
                        <span>LEVEL</span>
                        <strong>{item.level}</strong>
                      </div>
                    </div>

                    <div className="community-post-footer">
                      <div className="community-contributor">
                        <span className="contributor-avatar">
                          {item.provider.charAt(0).toUpperCase()}
                        </span>
                        <span>
                          <small>Shared by</small>
                          <strong>{item.provider}</strong>
                        </span>
                      </div>

                      <div className="community-post-actions">
                        {item.endDate && (
                          <span className="community-deadline">
                            Closes {formatDate(item.endDate)}
                          </span>
                        )}

                        {item.applicationUrl ? (
                          <button
                            type="button"
                            onClick={() => openApplication(item.applicationUrl)}
                          >
                            View opportunity ↗
                          </button>
                        ) : (
                          <a href="/explore">View details ↗</a>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="community-sidebar">
            <section className="community-join-card">
              <span className="community-card-icon">✦</span>
              <span className="community-eyebrow">YOUR COMMUNITY</span>
              <h2>Have something useful to share?</h2>
              <p>
                Your discovery could help someone else find their next
                opportunity.
              </p>
              <a href="/post">Share an opportunity ↗</a>
            </section>

            <section className="community-side-card">
              <h3>How to contribute</h3>

              <div className="community-side-step">
                <span>01</span>
                <div>
                  <strong>Find something useful</strong>
                  <p>Discover a genuine online opportunity.</p>
                </div>
              </div>

              <div className="community-side-step">
                <span>02</span>
                <div>
                  <strong>Share the details</strong>
                  <p>Provide accurate information and the original link.</p>
                </div>
              </div>

              <div className="community-side-step">
                <span>03</span>
                <div>
                  <strong>Help others discover it</strong>
                  <p>Once approved, your contribution appears here.</p>
                </div>
              </div>
            </section>

            <section className="community-side-card community-rules">
              <h3>Community standards</h3>

              <p>
                <span>✓</span> Share accurate information.
              </p>
              <p>
                <span>✓</span> Use genuine application links.
              </p>
              <p>
                <span>✓</span> Respect other members.
              </p>
              <p>
                <span>✓</span> Never promise guaranteed earnings.
              </p>
            </section>

            <section className="community-help-card">
              <h3>Looking for opportunities?</h3>
              <p>Browse the full directory and discover more possibilities.</p>
              <a href="/explore">Visit Explore ↗</a>
            </section>
          </aside>
        </div>
      </main>

      <footer className="community-footer">
        <a href="/" className="community-logo">
          TUNO<span>.</span>
        </a>

        <p>Discover opportunities. Share knowledge. Grow together.</p>

        <div>
          <a href="/">Home</a>
          <a href="/explore">Explore</a>
          <a href="/community">Community</a>
        </div>

        <small>© {new Date().getFullYear()} TUNO. All rights reserved.</small>
      </footer>
    </div>
  );
}

export default Community;
