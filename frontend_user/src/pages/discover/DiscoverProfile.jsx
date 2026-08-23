import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  IoCalendarOutline,
  IoLocationOutline,
  IoSwapHorizontalOutline,
} from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import {
  createSkillExchangeRequest,
  fetchMembers,
  fetchSkillExchanges,
} from "../../services/platformService";
import { createConversation } from "../../services/messageService";
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

const normalizeMember = (member) => {
  const skills = member.skills || {};
  const teachSkills = skills.teach || skills.candidate || [];
  const learnSkills = skills.learn || [];

  return {
    ...member,
    availability: skills.availability || "Flexible schedule",
    teachSkills,
    learnSkills,
    matchScore: Math.min(
      98,
      72 + teachSkills.length * 4 + learnSkills.length * 3,
    ),
  };
};

const DiscoverProfile = () => {
  const { memberId } = useParams();
  const { user } = useGlobleContext();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const currentUserId = user?.id || "";
  const member = useMemo(
    () => members.find((item) => String(item.id) === String(memberId)),
    [memberId, members],
  );
  const existingRequest = requests.find(
    (request) =>
      request.requesterId === currentUserId &&
      request.providerId === member?.id,
  );

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const rows = await fetchMembers();
        setMembers(rows.map(normalizeMember));
      } catch (err) {
        setError(err.message || "Unable to load profile.");
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    const loadRequests = async () => {
      if (!user) {
        setRequests([]);
        return;
      }

      setRequests(await fetchSkillExchanges());
    };

    loadRequests().catch((err) =>
      setError(err.message || "Unable to load skill exchanges."),
    );
  }, [user]);

  const handleRequest = async () => {
    if (!user) {
      navigate("/register");
      return;
    }

    if (!member || existingRequest) return;

    await createSkillExchangeRequest({
      providerId: member.id,
      skillOffered: findBestSkill(
        [...(user.skills?.teach || []), ...(user.skills?.candidate || [])],
        member.learnSkills,
        "Skill support",
      ),
      skillRequested: findBestSkill(
        member.teachSkills,
        user.skills?.learn || [],
        "Learning session",
      ),
    });
    setRequests(await fetchSkillExchanges());
  };

  const handleMessage = async () => {
    if (!user) {
      navigate("/register");
      return;
    }

    const conversation = await createConversation(member.id);
    if (conversation?.conversationId) {
      navigate(`/messages/${conversation.conversationId}`);
    }
  };

  if (!member) {
    return (
      <main className="discover-page">
        <section className="discover-empty-state container">
          <h1>Profile not found</h1>
          <p>{error || "This discover profile does not exist."}</p>
          <Link className="btn primary small" to="/discover">
            Back to Discover
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="discover-page">
      <section className="discover-profile-hero">
        <div className="container discover-profile-layout">
          <aside className="discover-profile-card">
            <span className="discover-profile-avatar">
              {initials(member.name)}
            </span>
            <p className="eyebrow">{member.role}</p>
            <h1>{member.name}</h1>
            <p>{member.title}</p>
            <strong>{member.matchScore}% match</strong>
          </aside>

          <section className="discover-profile-details">
            <Link className="profile-back-link" to="/discover">
              Back to Discover
            </Link>
            <h2>{member.title}</h2>
            <p>{member.bio}</p>

            <div className="dynamic-profile-meta">
              <span>
                <IoLocationOutline aria-hidden="true" />
                {member.location}
              </span>
              <span>
                <IoCalendarOutline aria-hidden="true" />
                {member.availability}
              </span>
            </div>

            <div className="discover-profile-swap">
              <div>
                <h3>Can teach</h3>
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
                <h3>Wants to learn</h3>
                <div className="skill-list">
                  {member.learnSkills.map((skill) => (
                    <span className="skill-pill learn" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {existingRequest && (
              <div className="request-note">
                Request {existingRequest.status} with {member.name}.
              </div>
            )}

            <div className="discover-actions">
              <button
                type="button"
                className="btn primary small"
                onClick={handleRequest}
                disabled={Boolean(existingRequest)}
              >
                {existingRequest?.status || "Request skill exchange"}
              </button>
              <button
                type="button"
                className="btn outline small"
                onClick={handleMessage}
              >
                Message
              </button>
              <Link className="btn outline small" to="/discover">
                Browse more matches
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
};

export default DiscoverProfile;
