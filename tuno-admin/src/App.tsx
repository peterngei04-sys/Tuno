
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import {
  ShieldCheck,
  LayoutDashboard,
  Clock3,
  CheckCircle2,
  XCircle,
  LogOut,
  RefreshCw,
  ExternalLink,
  Search,
  Eye,
  LockKeyhole,
  BriefcaseBusiness,
  Globe,
  UserRound,
  CalendarDays,
  AlertCircle,
  Trash2,
  DollarSign,
  TrendingUp,
  EyeOff,
} from "lucide-react";
import { supabase } from "./lib/supabase";
import "./App.css";

type Status = "pending" | "approved" | "rejected";
type Tab = "all" | Status;

type Opportunity = {
  id: string;
  title: string;
  category: string;
  level: string;
  description: string;
  requirements: string[] | null;
  payment: string;
  location: string;
  application_url: string;
  provider_name: string;
  contributor_id: string;
  status: Status;
  created_at: string;
  end_date?: string | null;
};

type PaymentEstimate = {
  currency: string;
  amount: number;
};

function getPaymentEstimate(
  payment: string | null | undefined
): PaymentEstimate | null {
  if (!payment) return null;

  const text = payment.trim();
  if (!text) return null;

  const amountMatch = text.match(
    /(\d[\d,]*(?:\.\d+)?)\s*(?:(?:-|–|—|to)\s*(\d[\d,]*(?:\.\d+)?))?/i
  );

  if (!amountMatch) return null;

  const firstAmount = Number(amountMatch[1].replace(/,/g, ""));
  const secondAmount = amountMatch[2]
    ? Number(amountMatch[2].replace(/,/g, ""))
    : null;

  if (!Number.isFinite(firstAmount) || firstAmount < 0) return null;

  let amount = firstAmount;

  if (secondAmount !== null && Number.isFinite(secondAmount)) {
    amount = (firstAmount + secondAmount) / 2;
  }

  const upper = text.toUpperCase();

  let currency = "UNSPECIFIED";

  if (
    upper.includes("KSH") ||
    upper.includes("KES") ||
    upper.includes("KSHS") ||
    text.includes("KSh")
  ) {
    currency = "KES";
  } else if (upper.includes("USD") || text.includes("$")) {
    currency = "USD";
  } else if (upper.includes("EUR") || text.includes("€")) {
    currency = "EUR";
  } else if (upper.includes("GBP") || text.includes("£")) {
    currency = "GBP";
  } else if (upper.includes("NGN") || text.includes("₦")) {
    currency = "NGN";
  } else if (upper.includes("INR") || text.includes("₹")) {
    currency = "INR";
  } else if (upper.includes("CAD")) {
    currency = "CAD";
  } else if (upper.includes("AUD")) {
    currency = "AUD";
  }

  return { currency, amount };
}

function formatMoney(amount: number, currency: string): string {
  if (currency === "UNSPECIFIED") {
    return `${amount.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })} (currency not stated)`;
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function formatDate(date: string | null | undefined): string {
  if (!date) return "No end date set";

  const parsed = new Date(`${date.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return "Invalid date";

  return parsed.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isExpired(date: string | null | undefined): boolean {
  if (!date) return false;

  const end = new Date(`${date.slice(0, 10)}T23:59:59`);

  return !Number.isNaN(end.getTime()) && end.getTime() < Date.now();
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Opportunity | null>(null);

  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const verifyAdmin = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setUser(null);
      setAuthorized(false);
      setChecking(false);
      return;
    }

    setUser(currentUser);

    const { data, error } = await supabase.rpc("is_tuno_admin");

    if (error || data !== true) {
      await supabase.auth.signOut();
      setUser(null);
      setAuthorized(false);
      setLoginError(
        "This account is not authorized to access TUNO Admin."
      );
      setChecking(false);
      return;
    }

    setAuthorized(true);
    setChecking(false);
    setLoginError("");
  }, []);

  useEffect(() => {
    let active = true;

    async function initialise() {
      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (error) {
        setChecking(false);
        return;
      }

      await verifyAdmin(data.session?.user ?? null);
    }

    void initialise();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) return;

        window.setTimeout(() => {
          if (active) {
            void verifyAdmin(session?.user ?? null);
          }
        }, 0);
      }
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [verifyAdmin]);

  const fetchOpportunities = useCallback(async () => {
    if (!authorized) return;

    setLoading(true);
    setNotice("");

    try {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setNotice(`Could not load opportunities: ${error.message}`);
      } else {
        setOpportunities((data ?? []) as Opportunity[]);
      }
    } catch {
      setNotice("An unexpected error occurred while loading opportunities.");
    } finally {
      setLoading(false);
    }
  }, [authorized]);

  // Delay the initial fetch so state updates do not run synchronously
  // inside the effect body.
  useEffect(() => {
    if (!authorized) return;

    const timer = window.setTimeout(() => {
      void fetchOpportunities();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [authorized, fetchOpportunities]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoginError("");
    setLoginLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoginError(error.message);
      setLoginLoading(false);
      return;
    }

    if (data.user) {
      await verifyAdmin(data.user);
    }

    setLoginLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();

    setUser(null);
    setAuthorized(false);
    setOpportunities([]);
    setSelected(null);
    setPassword("");
    setEmail("");
  }

  async function updateStatus(id: string, status: Status) {
    setActionId(id);
    setNotice("");

    const { error } = await supabase
      .from("opportunities")
      .update({ status })
      .eq("id", id);

    if (error) {
      setNotice(`Update failed: ${error.message}`);
      setActionId(null);
      return;
    }

    setOpportunities((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status } : item
      )
    );

    setSelected((current) =>
      current?.id === id ? { ...current, status } : current
    );

    setNotice(
      status === "approved"
        ? "Opportunity approved successfully."
        : "Opportunity rejected successfully."
    );

    setActionId(null);
  }

  async function deleteOpportunity(item: Opportunity) {
    const confirmed = window.confirm(
      `Permanently delete "${item.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(item.id);
    setNotice("");

    const { error } = await supabase
      .from("opportunities")
      .delete()
      .eq("id", item.id);

    if (error) {
      setNotice(`Delete failed: ${error.message}`);
      setDeletingId(null);
      return;
    }

    setOpportunities((current) =>
      current.filter((opportunity) => opportunity.id !== item.id)
    );

    setSelected((current) =>
      current?.id === item.id ? null : current
    );

    setNotice("Opportunity deleted successfully.");
    setDeletingId(null);
  }

  const counts = {
    all: opportunities.length,
    pending: opportunities.filter(
      (item) => item.status === "pending"
    ).length,
    approved: opportunities.filter(
      (item) => item.status === "approved"
    ).length,
    rejected: opportunities.filter(
      (item) => item.status === "rejected"
    ).length,
  };

  const approvedEstimates = useMemo(() => {
    return opportunities
      .filter((item) => item.status === "approved")
      .map((item) => getPaymentEstimate(item.payment))
      .filter((item): item is PaymentEstimate => item !== null);
  }, [opportunities]);

  const totalByCurrency = useMemo(() => {
    const totals = new Map<string, number>();

    approvedEstimates.forEach(({ currency, amount }) => {
      totals.set(
        currency,
        (totals.get(currency) ?? 0) + amount
      );
    });

    return Array.from(totals.entries()).sort((a, b) => {
      if (a[0] === "USD") return -1;
      if (b[0] === "USD") return 1;
      return a[0].localeCompare(b[0]);
    });
  }, [approvedEstimates]);

  const approvedCount = counts.approved;

  const unestimatedCount = Math.max(
    0,
    approvedCount - approvedEstimates.length
  );

  const filtered = opportunities.filter((item) => {
    const matchesTab =
      activeTab === "all" || item.status === activeTab;

    const term = search.toLowerCase().trim();

    const matchesSearch =
      !term ||
      item.title.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      (item.provider_name ?? "").toLowerCase().includes(term);

    return matchesTab && matchesSearch;
  });

  if (checking) {
    return (
      <div className="loading-screen">
        <div className="loading-mark">
          <ShieldCheck size={28} />
        </div>
        <p>Securing your admin session...</p>
      </div>
    );
  }

  if (!user || !authorized) {
    return (
      <main className="login-page">
        <div className="login-decoration login-decoration-one" />
        <div className="login-decoration login-decoration-two" />

        <section className="login-card">
          <div className="login-brand-row">
            <div className="brand-mark">
              <ShieldCheck size={29} />
            </div>

            <div>
              <strong className="login-brand-name">
                TUNO<span>.</span>
              </strong>
              <small>ADMINISTRATION</small>
            </div>
          </div>

          <p className="eyebrow">PRIVATE MANAGEMENT PORTAL</p>
          <h1>Welcome <span>back.</span></h1>

          <p className="login-description">
            Sign in with your authorized administrator account to review
            submissions and manage opportunities across TUNO.
          </p>

          <form onSubmit={handleLogin}>
            <label htmlFor="email">Admin email</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              required
            />

            <label htmlFor="password">Password</label>

            <div className="password-field">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
              />

              <button
                className="password-toggle"
                type="button"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>
            </div>

            {loginError && (
              <div className="error-message">
                <AlertCircle size={17} />
                <span>{loginError}</span>
              </div>
            )}

            <button
              className="login-button"
              type="submit"
              disabled={loginLoading}
            >
              <LockKeyhole size={17} />
              {loginLoading
                ? "Signing in..."
                : "Sign in to dashboard"}
            </button>
          </form>

          <div className="login-footnote">
            <LockKeyhole size={14} />
            <span>
              Protected access · Authorized administrators only
            </span>
          </div>
        </section>

        <p className="login-copyright">
          TUNO Admin · Private opportunity management
        </p>
      </main>
    );
  }

  return (
    <div className="admin-app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <ShieldCheck size={23} />
          </div>

          <div>
            <strong>TUNO<span>.</span></strong>
            <span>ADMIN PORTAL</span>
          </div>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <button
          className="side-link active"
          onClick={() => setActiveTab("all")}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </button>

        <div className="sidebar-label">OPPORTUNITIES</div>

        <button
          className={`side-link ${
            activeTab === "pending" ? "selected" : ""
          }`}
          onClick={() => setActiveTab("pending")}
        >
          <Clock3 size={18} />
          Pending
          <span className="side-count">{counts.pending}</span>
        </button>

        <button
          className={`side-link ${
            activeTab === "approved" ? "selected" : ""
          }`}
          onClick={() => setActiveTab("approved")}
        >
          <CheckCircle2 size={18} />
          Approved
        </button>

        <button
          className={`side-link ${
            activeTab === "rejected" ? "selected" : ""
          }`}
          onClick={() => setActiveTab("rejected")}
        >
          <XCircle size={18} />
          Rejected
        </button>

        <div className="sidebar-bottom">
          <div className="admin-profile">
            <div className="profile-avatar">
              <UserRound size={18} />
            </div>

            <div className="profile-info">
              <strong>Administrator</strong>
              <span>{user.email}</span>
            </div>
          </div>

          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="dashboard">
        <header className="topbar">
          <div>
            <p className="eyebrow">TUNO MANAGEMENT</p>
            <h1>Dashboard</h1>
            <p className="topbar-subtitle">
              Your overview of submitted opportunities.
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={() => void fetchOpportunities()}
            disabled={loading}
          >
            <RefreshCw
              size={16}
              className={loading ? "spinning" : ""}
            />
            {loading ? "Refreshing..." : "Refresh data"}
          </button>
        </header>

        <section className="welcome-banner">
          <div>
            <p>ADMINISTRATOR WORKSPACE</p>
            <h2>Manage opportunities. Build trust.</h2>
            <span>
              Review submissions before they appear on the public TUNO feed.
            </span>
          </div>

          <div className="banner-icon">
            <ShieldCheck size={43} />
          </div>
        </section>

        <section className="stats-grid">
          <StatCard
            label="Total submissions"
            value={counts.all.toString()}
            icon={<BriefcaseBusiness />}
            detail="All submitted opportunities"
          />

          <StatCard
            label="Awaiting review"
            value={counts.pending.toString()}
            icon={<Clock3 />}
            detail="Needs administrator action"
          />

          <StatCard
            label="Approved"
            value={counts.approved.toString()}
            icon={<CheckCircle2 />}
            detail="Published opportunities"
          />

          <StatCard
            label="Rejected"
            value={counts.rejected.toString()}
            icon={<XCircle />}
            detail="Not approved for publication"
          />
        </section>

        <section className="estimate-panel">
          <div className="estimate-heading">
            <div className="estimate-icon">
              <TrendingUp size={21} />
            </div>

            <div>
              <p className="eyebrow">APPROVED OPPORTUNITIES</p>
              <h2>Estimated opportunity value</h2>
              <p>
                Combined estimated pay from approved listings with readable
                payment amounts.
              </p>
            </div>
          </div>

          <div className="estimate-totals">
            {totalByCurrency.length > 0 ? (
              totalByCurrency.map(([currency, amount]) => (
                <div className="estimate-total" key={currency}>
                  <span>
                    {currency === "UNSPECIFIED"
                      ? "Currency not stated"
                      : currency}
                  </span>
                  <strong>{formatMoney(amount, currency)}</strong>
                </div>
              ))
            ) : (
              <div className="estimate-empty">
                No approved opportunities have readable payment estimates yet.
              </div>
            )}
          </div>

          <div className="estimate-footnote">
            <span>
              {approvedEstimates.length} of {approvedCount} approved listings
              included
            </span>

            {unestimatedCount > 0 && (
              <span>
                {unestimatedCount} without a usable payment estimate
              </span>
            )}
          </div>
        </section>

        <section className="opportunities-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">SUBMISSION MANAGEMENT</p>
              <h2>Opportunities</h2>
              <p>
                Review, approve, reject or remove community submissions.
              </p>
            </div>
          </div>

          <div className="toolbar">
            <div className="tabs">
              {(["all", "pending", "approved", "rejected"] as Tab[]).map(
                (tab) => (
                  <button
                    key={tab}
                    className={
                      activeTab === tab ? "tab active-tab" : "tab"
                    }
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === "all"
                      ? "All"
                      : tab[0].toUpperCase() + tab.slice(1)}

                    {tab === "pending" && (
                      <span>{counts.pending}</span>
                    )}
                  </button>
                )
              )}
            </div>

            <div className="search-box">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search opportunities..."
              />
            </div>
          </div>

          {notice && (
            <div className="notice-message">
              <span>{notice}</span>
            </div>
          )}

          {loading ? (
            <div className="empty-state">Loading opportunities...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <BriefcaseBusiness size={34} />
              <h3>No opportunities found</h3>
              <p>There are no submissions matching this view.</p>
            </div>
          ) : (
            <div className="opportunity-list">
              {filtered.map((item) => (
                <article className="opportunity-row" key={item.id}>
                  <div className="opportunity-icon">
                    <BriefcaseBusiness />
                  </div>

                  <div className="opportunity-main">
                    <div className="opportunity-title-line">
                      <h3>{item.title}</h3>
                      <StatusBadge status={item.status} />
                    </div>

                    <p>
                      {item.category} <span>•</span> {item.level}
                    </p>

                    <div className="row-meta">
                      <span>
                        <UserRound size={14} />
                        {item.provider_name || "Provider not specified"}
                      </span>

                      <span>
                        <CalendarDays size={14} />
                        Submitted: {formatDate(item.created_at)}
                      </span>

                      <span
                        className={
                          isExpired(item.end_date) ? "expired-meta" : ""
                        }
                      >
                        <Clock3 size={14} />
                        {item.end_date
                          ? `Ends: ${formatDate(item.end_date)}${
                              isExpired(item.end_date)
                                ? " · Expired"
                                : ""
                            }`
                          : "No end date"}
                      </span>
                    </div>

                    <div className="row-payment">
                      <DollarSign size={14} />
                      <span>
                        {item.payment || "Payment not specified"}
                      </span>
                    </div>
                  </div>

                  <button
                    className="view-button"
                    onClick={() => setSelected(item)}
                  >
                    <Eye size={16} />
                    Review
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="dashboard-footer">
          TUNO Admin · Private opportunity management
        </footer>
      </main>

      {selected && (
        <div
          className="modal-backdrop"
          onClick={() => setSelected(null)}
        >
          <section
            className="detail-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">OPPORTUNITY REVIEW</p>
                <h2>{selected.title}</h2>
              </div>

              <button
                className="close-button"
                onClick={() => setSelected(null)}
                aria-label="Close review"
              >
                ×
              </button>
            </div>

            <div className="modal-status">
              <StatusBadge status={selected.status} />
              <span>
                {selected.category} · {selected.level}
              </span>
            </div>

            <div className="detail-grid">
              <Detail
                label="Provider"
                value={selected.provider_name || "Not specified"}
              />

              <Detail
                label="Payment"
                value={selected.payment || "Not specified"}
              />

              <Detail
                label="Location"
                value={selected.location || "Not specified"}
              />

              <Detail
                label="Submitted"
                value={new Date(selected.created_at).toLocaleString()}
              />

              <Detail
                label="Application deadline"
                value={formatDate(selected.end_date)}
              />

              <Detail
                label="Estimated payment"
                value={
                  (() => {
                    const estimate = getPaymentEstimate(selected.payment);

                    return estimate
                      ? formatMoney(estimate.amount, estimate.currency)
                      : "No readable estimate";
                  })()
                }
              />
            </div>

            {isExpired(selected.end_date) && (
              <div className="expired-notice">
                <AlertCircle size={16} />
                This opportunity's application deadline has passed.
              </div>
            )}

            <div className="detail-block">
              <h3>Description</h3>
              <p>{selected.description}</p>
            </div>

            <div className="detail-block">
              <h3>Requirements</h3>

              {selected.requirements?.length ? (
                <ul>
                  {selected.requirements.map((requirement, index) => (
                    <li key={index}>{requirement}</li>
                  ))}
                </ul>
              ) : (
                <p>No requirements listed.</p>
              )}
            </div>

            {selected.application_url && (
              <a
                className="application-link"
                href={selected.application_url}
                target="_blank"
                rel="noreferrer"
              >
                <Globe size={17} />
                Visit application website
                <ExternalLink size={15} />
              </a>
            )}

            {selected.status === "pending" && (
              <div className="review-actions">
                <button
                  className="reject-button"
                  disabled={
                    actionId === selected.id ||
                    deletingId === selected.id
                  }
                  onClick={() =>
                    void updateStatus(selected.id, "rejected")
                  }
                >
                  <XCircle size={17} />
                  Reject
                </button>

                <button
                  className="approve-button"
                  disabled={
                    actionId === selected.id ||
                    deletingId === selected.id
                  }
                  onClick={() =>
                    void updateStatus(selected.id, "approved")
                  }
                >
                  <CheckCircle2 size={17} />
                  {actionId === selected.id
                    ? "Saving..."
                    : "Approve opportunity"}
                </button>
              </div>
            )}

            {selected.status !== "pending" && (
              <p className="already-reviewed">
                This opportunity has already been {selected.status}.
              </p>
            )}

            <div className="delete-area">
              <button
                className="delete-button"
                disabled={
                  deletingId === selected.id ||
                  actionId === selected.id
                }
                onClick={() => void deleteOpportunity(selected)}
              >
                <Trash2 size={16} />
                {deletingId === selected.id
                  ? "Deleting..."
                  : "Delete opportunity"}
              </button>

              <span>
                Deletion is permanent and cannot be undone.
              </span>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  detail,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  detail: string;
}) {
  return (
    <article className="stat-card">
      <div className="stat-icon">{icon}</div>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`status-badge ${status}`}>
      {status}
    </span>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default App;
