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
import { useLanguage } from "../../context/LanguageContext";
import { skillCategories } from "../../data/registerData";
import {
  createSkillExchangeRequest,
  fetchMembers,
  fetchSkillExchanges,
} from "../../services/platformService";
import MemberAvatar from "./MemberAvatar";
import { presentMember } from "./memberPresentation";
import "./Discover.css";

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

const CompactSkillList = ({ skills, tone }) => {
  const visibleSkills = skills.slice(0, 4);
  const remaining = skills.length - visibleSkills.length;

  return (
    <div className="skill-list compact">
      {visibleSkills.map((skill) => (
        <span className={`skill-pill ${tone}`} key={skill}>
          {skill}
        </span>
      ))}
      {remaining > 0 && (
        <span
          className="skill-pill more"
          aria-label={`${remaining} additional skills`}
        >
          +{remaining}
        </span>
      )}
    </div>
  );
};

const normalizeMember = (member) => {
  const presentedMember = presentMember(member);
  const skills = presentedMember.skills || {};
  const teachSkills = skills.teach || skills.candidate || [];
  const learnSkills = skills.learn || [];

  return {
    ...presentedMember,
    role: presentedMember.role || "student",
    title:
      presentedMember.title ||
      presentedMember.profession ||
      "Community member",
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
  const { t } = useLanguage();
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
            .filter(
              (member) => !["admin", "recruiter"].includes(member.role),
            )
            .map(normalizeMember)
            .filter((member) => member.id !== currentUserId),
        );
      } catch (err) {
        setError(err.message || t("discoverPage.loadError"));
      }
    };

    loadMembers();
  }, [currentUserId, t]);

  useEffect(() => {
    const loadExchanges = async () => {
      if (!user) {
        setExchangeRequests([]);
        return;
      }

      try {
        setExchangeRequests(await fetchSkillExchanges());
      } catch (err) {
        setError(err.message || t("discoverPage.requestsError"));
      }
    };

    loadExchanges();
  }, [t, user]);

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
          message: t("discoverPage.accountRequired"),
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
      message: t("discoverPage.defaultMessage", { name: member.name }),
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
      setError(err.message || t("discoverPage.sendError"));
    }
  };

  return (
    <main className="discover-page">
      <section className="discover-hero">
        <div className="container discover-hero-inner">
          <div>
            <p className="eyebrow">
              <IoSparklesOutline aria-hidden="true" />
              {t("discoverPage.eyebrow")}
            </p>
            <h1>{t("discoverPage.title")}</h1>
            <p>{t("discoverPage.description")}</p>
          </div>
          {!user && (
            <Link className="btn primary" to="/register">
              {t("discoverPage.createAccount")}
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
              placeholder={t("discoverPage.searchPlaceholder")}
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
              <option value="">{t("discoverPage.allCategories")}</option>
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
              {activeCategory
                ? activeCategory.name
                : t("discoverPage.selectCategory")}
            </span>
            {(query || selectedCategory || selectedSkill) && (
              <button type="button" onClick={clearFilters}>
                <IoCloseOutline aria-hidden="true" />
                {t("discoverPage.clear")}
              </button>
            )}
          </div>

          {activeCategory ? (
            <div
              className="discover-filters"
              aria-label={t("discoverPage.skillFilters")}
            >
              <button
                type="button"
                className={
                  !selectedSkill ? "filter-chip active" : "filter-chip"
                }
                onClick={() => setSelectedSkill("")}
              >
                {t("discoverPage.allInCategory", {
                  category: activeCategory.name,
                })}
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
              {t("discoverPage.categoryHint")}
            </p>
          )}
        </div>
      </section>

      <section className="section container">
        <div className="section-header mg-t50">
          <div>
            <h2>{t("discoverPage.matchesTitle")}</h2>
            <p>
              {t("discoverPage.matchesCount", {
                count: filteredMembers.length,
              })}
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
                    <MemberAvatar member={member} />
                    <div>
                      <h3>{member.name}</h3>
                      <p>{member.title}</p>
                    </div>
                    <strong>{member.matchScore}%</strong>
                  </div>

                  <div className="discover-swap">
                    <div>
                      <span>{t("discoverPage.canTeach")}</span>
                      <CompactSkillList
                        skills={member.teachSkills}
                        tone="teach"
                      />
                    </div>

                    <IoSwapHorizontalOutline aria-hidden="true" />

                    <div>
                      <span>{t("discoverPage.wantsLearn")}</span>
                      <CompactSkillList
                        skills={member.learnSkills}
                        tone="learn"
                      />
                    </div>
                  </div>

                  <div className="discover-actions">
                    <button
                      type="button"
                      className="btn primary small"
                      onClick={() => openRequestForm(member)}
                      disabled={wasRequested}
                    >
                      {wasRequested
                        ? t(`discoverPage.status.${existingRequest.status}`)
                        : t("discoverPage.request")}
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
                      {t("discoverPage.viewProfile")}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="discover-empty-state">
            <h3>{t("discoverPage.noMatches")}</h3>
            <p>{t("discoverPage.noMatchesDescription")}</p>
            <button
              type="button"
              className="btn primary small"
              onClick={clearFilters}
            >
              {t("discoverPage.resetFilters")}
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
                <h4>{t("discoverPage.requestTitle")}</h4>
                <p>{activeRequestMember.name}</p>
              </div>
              <button
                type="button"
                onClick={closeRequestForm}
                aria-label={t("discoverPage.closeRequest")}
              >
                <IoCloseOutline aria-hidden="true" />
              </button>
            </div>

            <label>
              {t("discoverPage.learnFrom", {
                name: activeRequestMember.name,
              })}
              <select
                value={requestForm.skillRequested}
                onChange={(event) =>
                  setRequestForm((current) => ({
                    ...current,
                    skillRequested: event.target.value,
                  }))
                }
              >
                <option value="">{t("discoverPage.selectSkill")}</option>
                {activeRequestMember.teachSkills.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {t("discoverPage.offerBack")}
              <select
                value={requestForm.skillOffered}
                onChange={(event) =>
                  setRequestForm((current) => ({
                    ...current,
                    skillOffered: event.target.value,
                  }))
                }
              >
                <option value="">{t("discoverPage.selectYourSkill")}</option>
                {getUserOfferSkills(user).length ? (
                  getUserOfferSkills(user).map((skill) => (
                    <option key={skill} value={skill}>
                      {skill}
                    </option>
                  ))
                ) : (
                  <option value="General support">
                    {t("discoverPage.generalSupport")}
                  </option>
                )}
              </select>
            </label>

            <label>
              {t("discoverPage.message")}
              <textarea
                value={requestForm.message}
                onChange={(event) =>
                  setRequestForm((current) => ({
                    ...current,
                    message: event.target.value,
                  }))
                }
                placeholder={t("discoverPage.messagePlaceholder")}
              />
            </label>

            <div className="request-form-actions">
              <button
                type="button"
                className="btn outline small"
                onClick={closeRequestForm}
              >
                {t("discoverPage.cancel")}
              </button>
              <button
                type="submit"
                className="btn primary small"
                disabled={
                  !requestForm.skillRequested || !requestForm.skillOffered
                }
              >
                {t("discoverPage.sendRequest")}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};

export default Discover;
