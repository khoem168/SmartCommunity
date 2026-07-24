import { Link } from "react-router-dom";
import {
  IoArrowForward,
  IoBriefcaseOutline,
  IoChatbubblesOutline,
  IoCheckmarkCircle,
  IoFlashOutline,
  IoPeopleOutline,
  IoSchoolOutline,
  IoSparklesOutline,
  IoTrendingUpOutline,
} from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import "./Home.css";

const heroImage =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80";

const mentorImage =
  "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80";

const careerImage =
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80";

const features = [
  {
    icon: <IoPeopleOutline />,
    title: "Community learning",
    desc: "Learn with peers, ask questions, and build useful connections around shared goals.",
  },
  {
    icon: <IoChatbubblesOutline />,
    title: "Skill exchange",
    desc: "Offer what you know, request help where you need it, and grow through practical exchange.",
  },
  {
    icon: <IoSchoolOutline />,
    title: "Guided courses",
    desc: "Follow focused learning paths for technical, creative, and career-ready skills.",
  },
  {
    icon: <IoBriefcaseOutline />,
    title: "Career support",
    desc: "Find internships, job opportunities, and mentor advice aligned with your profile.",
  },
];

const stats = [
  { value: "12", label: "Connected modules" },
  { value: "Real-time", label: "Chat & notifications" },
  { value: "1:1", label: "Mentor guidance" },
  { value: "End-to-end", label: "Career journey" },
];

const categories = [
  "Frontend",
  "Backend",
  "UI/UX",
  "Marketing",
  "Cyber Security",
  "Data Skills",
];

const steps = [
  "Create your profile and highlight the skills you want to build.",
  "Join courses, exchange sessions, or mentorship that matches your goal.",
  "Apply your progress to internships, jobs, and community projects.",
];

const Home = () => {
  const { user } = useGlobleContext();

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">
              <IoSparklesOutline />
              One community. Every career step.
            </span>
            <h1>
              Build skills. Share knowledge.
              <span> Launch your career.</span>
            </h1>
            <p>
              A connected digital community where students learn practical
              skills, meet trusted mentors, exchange knowledge, and move from
              learning to real opportunities.
            </p>

            <div className="hero-actions">
              <Link to={user ? "/dashboard" : "/register"} className="home-btn primary">
                {user ? "Open my dashboard" : "Start learning free"}
                <IoArrowForward />
              </Link>
              <Link to="/jobs" className="home-btn secondary">
                Explore internships
              </Link>
            </div>

            <div className="hero-proof" aria-label="Platform highlights">
              <span>
                <IoCheckmarkCircle />
                Guided mentorship
              </span>
              <span>
                <IoCheckmarkCircle />
                Skill exchange
              </span>
              <span>
                <IoCheckmarkCircle />
                Verified opportunities
              </span>
            </div>
          </div>

          <div className="hero-visual">
            <img src={heroImage} alt="Students working together in a learning community" />
            <div className="hero-floating-label">
              <IoFlashOutline />
              <span><strong>12 modules</strong> working as one platform</span>
            </div>
            <div className="hero-panel">
              <IoTrendingUpOutline />
              <div>
                <strong>Live progress</strong>
                <span>Track skills, sessions, and applications</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-container section-heading">
          <span className="section-kicker">Platform tools</span>
          <h2>Everything learners need to move from skill-building to opportunity</h2>
        </div>

        <div className="home-container feature-grid">
          {features.map((feature, index) => (
            <article className="feature-card" key={feature.title}>
              <div className="feature-card-top">
                <div className="feature-icon">{feature.icon}</div>
                <span>0{index + 1}</span>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section spotlight-section">
        <div className="home-container spotlight-grid">
          <div className="spotlight-image">
            <img src={mentorImage} alt="Mentor guiding a learner during a session" />
          </div>
          <div className="spotlight-copy">
            <span className="section-kicker">Mentorship</span>
            <h2>Get guidance from people who understand the path</h2>
            <p>
              Book sessions, review mentor profiles, and turn broad career goals
              into clear next steps with support from experienced professionals.
            </p>
            <Link to="/mentorship" className="text-link">
              Meet mentors
              <IoArrowForward />
            </Link>
          </div>
        </div>
      </section>

      <section className="home-container stats-strip" aria-label="Platform stats">
        {stats.map((stat) => (
          <div className="stat" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </section>

      <section className="home-section">
        <div className="home-container split-panel">
          <div className="path-copy">
            <span className="section-kicker">How it works</span>
            <h2>A clean path from learning to career action</h2>
            <div className="step-list">
              {steps.map((step, index) => (
                <div className="step-item" key={step}>
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="career-card">
            <img src={careerImage} alt="Team discussing career project work" />
            <div>
              <h3>Popular categories</h3>
              <div className="category-list">
                {categories.map((category) => (
                  <Link to="/discover" className="category-chip" key={category}>
                    {category}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-container final-cta">
        <div>
          <span className="section-kicker">Your next step</span>
          <h2>Turn your learning goals into visible progress.</h2>
        </div>
        <Link to={user ? "/dashboard" : "/register"} className="home-btn primary">
          {user ? "Go to dashboard" : "Create free account"}
          <IoArrowForward />
        </Link>
      </section>
    </main>
  );
};

export default Home;
