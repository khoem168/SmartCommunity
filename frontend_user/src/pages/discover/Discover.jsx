import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CiGrid41 } from "react-icons/ci";
import { HiOutlineViewList } from "react-icons/hi";
import {
  IoCloseOutline,
  IoFilterOutline,
  IoSearchOutline,
  IoSparklesOutline,
  IoSwapHorizontalOutline,
} from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import { skillCategories } from "../../data/registerData";
import {
  createSkillExchangeRequest,
  fetchMembers,
  fetchSkillExchanges,
} from "../../services/platformService";
import "./Discover.css";

const initials = (name) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const findBestSkill = (sourceSkills = [], targetSkills = [], fallback = "") =>
  sourceSkills.find((skill) => targetSkills.includes(skill)) ||
  sourceSkills[0] ||
  targetSkills[0] ||
  fallback;

const getUserOfferSkills = (user) => {
  const skills = [
    ...(user?.skills?.teach || []),
    ...(user?.skills?.candidate || []),
  ];
  return [...new Set(skills)];
};

const normalizeMember = (member) => {
  const skills = member.skills || {};
  const teachSkills = skills.teach || skills.candidate || [];
  const learnSkills = skills.learn || [];

  return {
    ...member,
    role: member.role || "student",
    title: member.title || member.profession || "Community member",
    availability: skills.availability || "Flexible schedule",
    teachSkills,
    learnSkills,
    matchScore: Math.min(
      98,
      72 + teachSkills.length * 4 + learnSkills.length * 3,
    ),
  };
};

const Discover = () => {
  const { user } = useGlobleContext();
  const navigate = useNavigate();
  const [grid, setGrid] = useState("grid");
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");
  const [members, setMembers] = useState([]);
  const [exchangeRequests, setExchangeRequests] = useState([]);
  const [activeRequestId, setActiveRequestId] = useState("");
  const [requestForm, setRequestForm] = useState({
    skillRequested: "",
    skillOffered: "",
    message: "",
  });
  const showGrid = (e) => {
    setGrid(e);
  };

  const [error, setError] = useState("");
  const currentUserId = user?.id || "";

  useEffect(() => {
    const loadMembers = async () => {
      try {
        setError("");
        const rows = await fetchMembers();
        setMembers(
          rows
            .filter((member) => member.role !== "recruiter")
            .map(normalizeMember)
            .filter((member) => member.id !== currentUserId),
        );
      } catch (err) {
        setError(err.message || "Unable to load community members.");
      }
    };

    loadMembers();
  }, [currentUserId]);

  useEffect(() => {
    const loadExchanges = async () => {
      if (!user) {
        setExchangeRequests([]);
        return;
      }

      try {
        setExchangeRequests(await fetchSkillExchanges());
      } catch (err) {
        setError(err.message || "Unable to load skill exchange requests.");
      }
    };

    loadExchanges();
  }, [user]);

  useState;

  useMemo;

  const activeCategory = useMemo(
    () =>
      skillCategories.find((category) => category.name === selectedCategory) ||
      null,
    [selectedCategory],
  );

  const availableSkills = activeCategory ? activeCategory.skills : [];
  const activeRequestMember = members.find(
    (member) => member.id === activeRequestId,
  );

  const filteredMembers = useMemo(() => {
    const search = query.trim().toLowerCase();
    const categorySkills = activeCategory?.skills || [];

    return members.filter((member) => {
      const skills = [...member.teachSkills, ...member.learnSkills];
      const matchesCategory =
        !activeCategory ||
        skills.some((skill) => categorySkills.includes(skill));
      const matchesSkill = !selectedSkill || skills.includes(selectedSkill);
      const matchesSearch =
        !search ||
        member.name.toLowerCase().includes(search) ||
        member.title.toLowerCase().includes(search) ||
        skills.some((skill) => skill.toLowerCase().includes(search));

      return matchesCategory && matchesSkill && matchesSearch;
    });
  }, [activeCategory, members, query, selectedSkill]);

  const clearFilters = () => {
    setQuery("");
    setSelectedCategory("");
    setSelectedSkill("");
  };

  const outgoingRequests = exchangeRequests.filter(
    (request) => request.requesterId === currentUserId,
  );

  const requestByMemberId = (memberId) =>
    outgoingRequests.find(
      (request) =>
        request.providerId === memberId &&
        ["pending", "accepted"].includes(request.status),
    );

  const openRequestForm = (member) => {
    if (!user) {
      navigate("/register", {
        state: {
          message: "Create an account to request a skill exchange.",
        },
      });
      return;
    }

    const existingRequest = requestByMemberId(member.id);
    if (existingRequest) return;

    const userTeachSkills = getUserOfferSkills(user);
    const userLearnSkills = user.skills?.learn || [];

    setActiveRequestId(member.id);
    setRequestForm({
      skillRequested: findBestSkill(member.teachSkills, userLearnSkills, ""),
      skillOffered: userTeachSkills.length
        ? findBestSkill(userTeachSkills, member.learnSkills, "")
        : "General support",
      message: `Hi ${member.name}, I would like to exchange skills with you.`,
    });
  };

  const closeRequestForm = () => {
    setActiveRequestId("");
    setRequestForm({
      skillRequested: "",
      skillOffered: "",
      message: "",
    });
  };

  const submitRequest = async (member) => {
    if (!requestForm.skillRequested || !requestForm.skillOffered) return;

    try {
      const response = await createSkillExchangeRequest({
        providerId: member.id,
        skillOffered: requestForm.skillOffered,
        skillRequested: requestForm.skillRequested,
        message: requestForm.message.trim(),
      });
      setExchangeRequests((current) => [response.exchange, ...current]);
      setExchangeRequests(await fetchSkillExchanges());
      closeRequestForm();
    } catch (err) {
      setError(err.message || "Unable to send skill exchange request.");
    }
  };

  return (
    <main className="discover-page">
      <section className="discover-hero">
        <div className="container discover-hero-inner">
          <div>
            <p className="eyebrow">
              <IoSparklesOutline aria-hidden="true" />
              Discover
            </p>
            <h1>Find the right skill exchange match.</h1>
            <p>
              Choose a category, narrow by skill, and connect with people who
              can teach what you want to learn.
            </p>
          </div>
          {!user && (
            <Link className="btn primary" to="/register">
              Create account
            </Link>
          )}
        </div>
      </section>

      <section className="section container discover-tools">
        <div className="discover-search-panel">
          <label className="discover-search">
            <IoSearchOutline aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, skill, or role"
            />
          </label>

          <label className="discover-category-select">
            <select
              value={selectedCategory}
              onChange={(event) => {
                setSelectedCategory(event.target.value);
                setSelectedSkill("");
              }}
            >
              <option value="">All categories</option>
              {skillCategories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="category-picker">
          <div className="category-picker-header">
            <span>
              <IoFilterOutline aria-hidden="true" />
              {activeCategory ? activeCategory.name : "Select a category"}
            </span>
            {(query || selectedCategory || selectedSkill) && (
              <button type="button" onClick={clearFilters}>
                <IoCloseOutline aria-hidden="true" />
                Clear
              </button>
            )}
          </div>

          {activeCategory ? (
            <div className="discover-filters" aria-label="Skill filters">
              <button
                type="button"
                className={
                  !selectedSkill ? "filter-chip active" : "filter-chip"
                }
                onClick={() => setSelectedSkill("")}
              >
                All {activeCategory.name}
              </button>
              {availableSkills.map((skill) => (
                <button
                  type="button"
                  key={skill}
                  className={
                    selectedSkill === skill
                      ? "filter-chip active"
                      : "filter-chip"
                  }
                  onClick={() => setSelectedSkill(skill)}
                >
                  {skill}
                </button>
              ))}
            </div>
          ) : (
            <p className="category-empty">
              Pick a category to show related skill chips, just like the
              registration flow.
            </p>
          )}
        </div>
      </section>

      <section className="section container">
        <div className="section-header mg-t50">
          <div>
            <h2>Skill exchange matches</h2>
            <p>
              Showing {filteredMembers.length}{" "}
              {filteredMembers.length === 1 ? "match" : "matches"} based on your
              current filters.
            </p>
          </div>
          <div className="icon-wrap flex gap-10">
            <CiGrid41
              className={grid == "grid" && "active"}
              size={24}
              onClick={() => showGrid("grid")}
            />
            <HiOutlineViewList
              className={grid == "noGrid" && "active"}
              size={24}
              onClick={() => showGrid("noGrid")}
            />
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {filteredMembers.length ? (
          <div
            className={`discover-grid ${grid == "noGrid" && "active"} mg-t50`}
          >
            {filteredMembers.map((member) => {
              const existingRequest = requestByMemberId(member.id);
              const wasRequested = Boolean(existingRequest);

              return (
                <article className="discover-card" key={member.id}>
                  <div className="discover-card-header">
                    <span className="discover-avatar">
                      {initials(member.name)}
                    </span>
                    <div>
                      <h3>{member.name}</h3>
                      <p>{member.title}</p>
                    </div>
                    <strong style={{ color: "#f59e0b" }}>
                      {member.matchScore}%
                    </strong>
                  </div>

                  <div className="discover-swap">
                    <div>
                      <span>Can teach</span>
                      <div className="skill-list">
                        {member.teachSkills.map((skill) => (
                          <span className="skill-pill teach" key={skill}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <IoSwapHorizontalOutline aria-hidden="true" />

                    <div>
                      <span>Wants to learn</span>
                      <div className="skill-list">
                        {member.learnSkills.map((skill) => (
                          <span className="skill-pill learn" key={skill}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="discover-actions">
                    <button
                      type="button"
                      className="btn primary small"
                      onClick={() => openRequestForm(member)}
                      disabled={wasRequested}
                    >
                      {wasRequested ? existingRequest.status : "Request"}
                    </button>
                    {/* <button
                      type="button"
                      className="btn outline small"
                      onClick={() => openConversation(member)}
                    >
                      Message
                    </button> */}
                    <Link
                      className="btn outline small"
                      to={`/discover/${member.id}`}
                    >
                      View profile
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="discover-empty-state">
            <h3>No matches found</h3>
            <p>Try another category, skill, or search keyword.</p>
            <button
              type="button"
              className="btn primary small"
              onClick={clearFilters}
            >
              Reset filters
            </button>
          </div>
        )}
      </section>

      {activeRequestMember && (
        <div className="request-modal-backdrop" role="presentation">
          <form
            className="request-form request-modal"
            onSubmit={(event) => {
              event.preventDefault();
              submitRequest(activeRequestMember);
            }}
          >
            <div className="request-form-header">
              <div>
                <h4>Request skill exchange</h4>
                <p>{activeRequestMember.name}</p>
              </div>
              <button
                type="button"
                onClick={closeRequestForm}
                aria-label="Close request form"
              >
                <IoCloseOutline aria-hidden="true" />
              </button>
            </div>

            <label>
              Skill you want to learn from {activeRequestMember.name}
              <select
                value={requestForm.skillRequested}
                onChange={(event) =>
                  setRequestForm((current) => ({
                    ...current,
                    skillRequested: event.target.value,
                  }))
                }
              >
                <option value="">Select skill</option>
                {activeRequestMember.teachSkills.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Skill you offer back
              <select
                value={requestForm.skillOffered}
                onChange={(event) =>
                  setRequestForm((current) => ({
                    ...current,
                    skillOffered: event.target.value,
                  }))
                }
              >
                <option value="">Select your skill</option>
                {getUserOfferSkills(user).length ? (
                  getUserOfferSkills(user).map((skill) => (
                    <option key={skill} value={skill}>
                      {skill}
                    </option>
                  ))
                ) : (
                  <option value="General support">General support</option>
                )}
              </select>
            </label>

            <label>
              Message
              <textarea
                value={requestForm.message}
                onChange={(event) =>
                  setRequestForm((current) => ({
                    ...current,
                    message: event.target.value,
                  }))
                }
                placeholder="Write a short message"
              />
            </label>

            <div className="request-form-actions">
              <button
                type="button"
                className="btn outline small"
                onClick={closeRequestForm}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn primary small"
                disabled={
                  !requestForm.skillRequested || !requestForm.skillOffered
                }
              >
                Send request
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};

export default Discover;
