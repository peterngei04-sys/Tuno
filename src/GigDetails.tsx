
import "./GigDetails.css";

type GigInfo = {
  title: string;
  category: string;
  level: string;
  description: string;
  overview: string;
  tasks: string[];
  skills: string[];
  payment: string;
  platforms: string[];
  firstSteps: string[];
};

const gigInformation: Record<number, GigInfo> = {
  1: {
    title: "Freelance Writing",
    category: "Freelancing",
    level: "Beginner",
    description: "Create articles, blog posts and website content for clients.",
    overview:
      "Freelance writers create written content for individuals, businesses and online publications. Projects may include blog posts, product descriptions, website copy and articles.",
    tasks: [
      "Research topics and gather reliable information.",
      "Write articles and blog posts.",
      "Edit and proofread written content.",
      "Communicate with clients about project requirements."
    ],
    skills: ["Writing", "Grammar", "Research", "Communication"],
    payment: "Usually paid per word, article or completed project. Rates depend on the client, experience and agreement.",
    platforms: ["Upwork", "Fiverr", "Direct client opportunities"],
    firstSteps: [
      "Practise writing clear, original articles.",
      "Create a small portfolio of writing samples.",
      "Learn how to understand client instructions.",
      "Check each platform's age and country eligibility before registering."
    ]
  },
  2: {
    title: "Online Microtasks",
    category: "Microtasks",
    level: "Beginner",
    description: "Complete small digital tasks offered by online platforms.",
    overview:
      "Microtask platforms distribute small online activities that may involve categorising information, checking data or completing simple research tasks.",
    tasks: [
      "Categorise or label information.",
      "Review short pieces of content.",
      "Complete simple research activities.",
      "Follow task instructions accurately."
    ],
    skills: ["Attention to detail", "Reading", "Basic computer skills"],
    payment: "Usually paid per approved task. Task availability and payment rates vary.",
    platforms: ["Clickworker", "Toloka", "Other microtask services"],
    firstSteps: [
      "Understand the types of tasks available.",
      "Practise following detailed instructions.",
      "Check payment methods and country availability.",
      "Read platform eligibility rules before creating an account."
    ]
  },
  3: {
    title: "Virtual Assistance",
    category: "Remote Work",
    level: "Intermediate",
    description: "Help businesses manage emails, schedules and administration.",
    overview:
      "Virtual assistants provide administrative and organisational support remotely. Different clients require different combinations of skills.",
    tasks: [
      "Organise calendars and appointments.",
      "Prepare and organise documents.",
      "Assist with email management.",
      "Conduct online research."
    ],
    skills: ["Organisation", "Communication", "Time management", "Office software"],
    payment: "Often paid hourly or through agreed monthly or project arrangements.",
    platforms: ["Upwork", "Fiverr", "Remote job boards"],
    firstSteps: [
      "Learn document and spreadsheet tools.",
      "Practise professional communication.",
      "Prepare examples of administrative work.",
      "Check the age requirements of each platform and client."
    ]
  },
  4: {
    title: "Graphic Design",
    category: "Freelancing",
    level: "Intermediate",
    description: "Create logos, posters and visual content for clients.",
    overview:
      "Graphic designers communicate ideas visually. They create designs for businesses, events, social media and other purposes.",
    tasks: [
      "Design posters and promotional graphics.",
      "Create social media content.",
      "Develop visual concepts for clients.",
      "Revise designs based on feedback."
    ],
    skills: ["Creativity", "Layout", "Typography", "Design software"],
    payment: "Usually paid per design, project or agreed package.",
    platforms: ["Fiverr", "Upwork", "Direct client opportunities"],
    firstSteps: [
      "Learn the fundamentals of design.",
      "Practise using Canva or other design tools.",
      "Build a portfolio of original designs.",
      "Check platform eligibility before applying."
    ]
  },
  5: {
    title: "Content Creation",
    category: "Content Creation",
    level: "Beginner",
    description: "Explore opportunities through videos, blogs and social media.",
    overview:
      "Content creators develop useful, entertaining or educational material for an audience. Income models differ widely and usually take time to develop.",
    tasks: [
      "Plan content around a topic or audience.",
      "Create videos, articles or graphics.",
      "Publish content consistently.",
      "Understand audience feedback and analytics."
    ],
    skills: ["Creativity", "Communication", "Storytelling", "Consistency"],
    payment: "Possible income sources include advertising, sponsorships and eligible creator programmes. Earnings are not guaranteed.",
    platforms: ["YouTube", "Blogger", "Other creator platforms"],
    firstSteps: [
      "Choose a topic you understand.",
      "Identify the audience you want to reach.",
      "Create original and useful content.",
      "Review each platform's monetisation and age policies."
    ]
  },
  6: {
    title: "Data Entry",
    category: "Remote Work",
    level: "Beginner",
    description: "Organise, process and maintain digital information.",
    overview:
      "Data entry involves entering, updating and checking information in digital systems. Accuracy and confidentiality are important.",
    tasks: [
      "Enter information into spreadsheets.",
      "Update digital records.",
      "Check information for errors.",
      "Organise documents and files."
    ],
    skills: ["Typing", "Accuracy", "Spreadsheets", "Organisation"],
    payment: "May be paid hourly or per completed project, depending on the agreement.",
    platforms: ["Upwork", "Remote job boards", "Direct client opportunities"],
    firstSteps: [
      "Practise typing accurately.",
      "Learn spreadsheet basics.",
      "Create sample data-entry exercises.",
      "Verify clients and check eligibility requirements."
    ]
  },
  7: {
    title: "Affiliate Marketing",
    category: "Online Business",
    level: "Intermediate",
    description: "Promote products and earn commissions from qualifying sales.",
    overview:
      "Affiliate marketing involves sharing tracked product or service links. A commission may be earned when someone makes a qualifying purchase through a link.",
    tasks: [
      "Research products and services.",
      "Create helpful product-related content.",
      "Share affiliate links transparently.",
      "Understand clicks, referrals and conversions."
    ],
    skills: ["Marketing", "Writing", "Research", "Audience understanding"],
    payment: "Usually commission-based. Payments depend on qualifying actions and programme terms.",
    platforms: ["Amazon Associates", "Other affiliate networks"],
    firstSteps: [
      "Learn the basics of affiliate marketing.",
      "Choose a topic and audience.",
      "Create honest and useful recommendations.",
      "Check age, location and payment eligibility before joining a programme."
    ]
  },
  8: {
    title: "Online Tutoring",
    category: "Remote Work",
    level: "Intermediate",
    description: "Share your knowledge by teaching learners online.",
    overview:
      "Online tutoring involves helping learners understand subjects or develop skills through digital lessons and educational resources.",
    tasks: [
      "Prepare lesson materials.",
      "Explain concepts clearly.",
      "Develop practice exercises.",
      "Give constructive feedback to learners."
    ],
    skills: ["Subject knowledge", "Communication", "Patience", "Planning"],
    payment: "Often paid per lesson or hour, depending on the arrangement.",
    platforms: ["Tutoring platforms", "Independent educational services"],
    firstSteps: [
      "Identify subjects you understand well.",
      "Prepare sample lesson notes.",
      "Practise explaining difficult concepts simply.",
      "Check platform age and safeguarding requirements."
    ]
  }
};

function GigDetails() {
  const id = Number(window.location.pathname.split("/")[2]);
  const gig = gigInformation[id];

  if (!gig) {
    return (
      <div className="gig-not-found">
        <h1>Opportunity not found</h1>
        <p>This opportunity may not exist or may have been moved.</p>
        <a href="/explore">Return to Explore</a>
      </div>
    );
  }

  return (
    <div className="gig-details-page">
      <nav className="gig-details-nav">
        <a href="/" className="logo">
          TUNO<span>.</span>
        </a>

        <div>
          <a href="/">Home</a>
          <a href="/explore">Explore</a>
        </div>

        <a href="/explore" className="gig-nav-button">
          Browse opportunities
        </a>
      </nav>

      <main className="gig-details-content">
        <a href="/explore" className="gig-back-link">
          ← Back to opportunities
        </a>

        <section className="gig-details-hero">
          <span className="gig-details-eyebrow">
            {gig.category}
          </span>

          <h1>{gig.title}</h1>

          <p>{gig.description}</p>

          <div className="gig-meta">
            <span>{gig.level}</span>
            <span>{gig.payment}</span>
          </div>
        </section>

        <div className="gig-details-layout">
          <div className="gig-main-column">
            <section className="gig-info-section">
              <span className="gig-section-label">OVERVIEW</span>
              <h2>About this opportunity</h2>
              <p>{gig.overview}</p>
            </section>

            <section className="gig-info-section">
              <span className="gig-section-label">RESPONSIBILITIES</span>
              <h2>What you may do</h2>

              <ul>
                {gig.tasks.map((task) => (
                  <li key={task}>{task}</li>
                ))}
              </ul>
            </section>

            <section className="gig-info-section">
              <span className="gig-section-label">GET PREPARED</span>
              <h2>Skills to develop</h2>

              <div className="gig-skill-list">
                {gig.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </section>

            <section className="gig-info-section">
              <span className="gig-section-label">GETTING STARTED</span>
              <h2>Your first steps</h2>

              <ol>
                {gig.firstSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
          </div>

          <aside className="gig-sidebar">
            <div className="gig-sidebar-card">
              <span className="gig-section-label">PAYMENT INFORMATION</span>
              <h3>How payment works</h3>
              <p>{gig.payment}</p>

              <div className="gig-sidebar-divider" />

              <span className="gig-section-label">WHERE TO EXPLORE</span>
              <h3>Possible platforms</h3>

              <ul>
                {gig.platforms.map((platform) => (
                  <li key={platform}>{platform}</li>
                ))}
              </ul>

              <p className="gig-sidebar-note">
                These are examples to research, not endorsements or
                guarantees of available work.
              </p>
            </div>

            <div className="gig-safety-card">
              <h3>Stay informed and safe</h3>
              <p>
                Never assume an opportunity guarantees income. Be cautious
                of requests for upfront fees, passwords or sensitive
                personal information.
              </p>
              <p>
                Check age requirements, country availability and payment
                rules. Never misrepresent your age to join a platform.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <footer className="gig-details-footer">
        <a href="/" className="logo">
          TUNO<span>.</span>
        </a>
        <p>Discover. Share. Grow together.</p>
        <span>© {new Date().getFullYear()} TUNO. All rights reserved.</span>
      </footer>
    </div>
  );
}

export default GigDetails;
