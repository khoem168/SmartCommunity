import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  IoCalendarOutline,
  IoLocationOutline,
  IoSwapHorizontalOutline,
} from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import {
  createSkillExchangeRequest,
  fetchMembers,
  fetchSkillExchanges,
} from "../../services/platformService";
import { createConversation } from "../../services/messageService";
import {
  FEATURED_MENTORS_ROSTER,
  localizePeerHeadline,
} from "../../utils/bilingualCatalog";
import MemberAvatar from "./MemberAvatar";
import { presentMember } from "./memberPresentation";
import "./Discover.css";

const findBestSkill = (sourceSkills = [], targetSkills = [], fallback = "") =>
  sourceSkills.find((skill) => targetSkills.includes(skill)) ||
  sourceSkills[0] ||
  targetSkills[0] ||
  fallback;

const normalizeMember = (member, isKm = false) => {
  const presentedMember = presentMember(member);
  const skills = presentedMember.skills || {};
  const teachSkills =
    member.teachSkills?.length > 0
      ? member.teachSkills
      : skills.teach?.length > 0
        ? skills.teach
        : skills.candidate?.length > 0
          ? skills.candidate
          : Array.isArray(member.skills) && member.skills.length > 0
            ? member.skills
            : ["React.js", "JavaScript", "HTML & CSS"];
  const rawLearnSkills =
    member.learnSkills?.length > 0
      ? member.learnSkills
      : skills.learn?.length > 0
        ? skills.learn
        : ["Node.js & API", "UI/UX Design"];
  const teachLowerSet = new Set(
    teachSkills.map((s) => String(s || "").trim().toLowerCase()),
  );
  const filteredLearn = rawLearnSkills.filter(
    (s) => !teachLowerSet.has(String(s || "").trim().toLowerCase()),
  );
  const learnSkills =
    filteredLearn.length > 0
      ? filteredLearn
      : ["System Design", "AWS Cloud", "UI/UX Design"].filter(
          (s) => !teachLowerSet.has(s.toLowerCase()),
        );

  const rawBio =
    presentedMember.bio ||
    member.bioKm ||
    member.bioEn ||
    "សមាជិកសហគមន៍ដែលផ្តោតលើការអនុវត្តគម្រោងគេហទំព័រជាក់ស្តែង និងការចែករំលែកចំណេះដឹងបច្ចេកវិទ្យា។";

  const bioText =
    isKm &&
    (String(rawBio).toLowerCase().includes("friendly community member") ||
      String(rawBio).toLowerCase().includes("building the smart community"))
      ? "ស្ថាបនិក និងអ្នកអភិវឌ្ឍន៍គម្រោង Full-Stack នៃវេទិកា Smart Community ដែលជួយភ្ជាប់និស្សិត ការដោះដូរជំនាញ និងឱកាសការងារបច្ចេកវិទ្យា។"
      : rawBio;

  return {
    ...presentedMember,
    title: localizePeerHeadline(
      presentedMember.title || member.profession || member.role,
      isKm,
    ),
    bio: bioText,
    location: isKm
      ? "ភ្នំពេញ, កម្ពុជា"
      : presentedMember.location || "Phnom Penh, Cambodia",
    availability: isKm
      ? "ម៉ោងសិក្សាបត់បែន (Flexible)"
      : skills.availability || "Flexible schedule",
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
  const { language } = useLanguage();
  const isKm = language === "km";
  const navigate = useNavigate();
  const [rawMembers, setRawMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const currentUserId = user?.id || "";

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      setLoading(true);
      try {
        const rows = await fetchMembers();
        if (active) {
          setRawMembers(rows || []);
        }
      } catch (err) {
        if (active) setError(err.message || "Unable to load profile.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  const member = useMemo(() => {
    const found =
      rawMembers.find((item) => String(item.id) === String(memberId)) ||
      FEATURED_MENTORS_ROSTER.find(
        (item) => String(item.id) === String(memberId),
      ) ||
      rawMembers[0];
    return found ? normalizeMember(found, isKm) : null;
  }, [isKm, memberId, rawMembers]);

  const existingRequest = requests.find(
    (request) =>
      request.requesterId === currentUserId &&
      request.providerId === member?.id,
  );

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

  if (loading) {
    return (
      <main className="discover-page">
        <section className="discover-empty-state container">
          <p>{isKm ? "កំពុងទាញយកព័ត៌មានសមាជិក..." : "Loading member profile..."}</p>
        </section>
      </main>
    );
  }

  if (!member) {
    return (
      <main className="discover-page">
        <section className="discover-empty-state container">
          <h1>{isKm ? "រកមិនឃើញគណនីសមាជិក" : "Profile not found"}</h1>
          <p>
            {error ||
              (isKm
                ? "គណនីសមាជិកដែលអ្នកស្វែងរកមិនមាននៅក្នុងប្រព័ន្ធទេ។"
                : "This discover profile does not exist.")}
          </p>
          <Link className="btn primary small" to="/skill-exchange">
            {isKm ? "ត្រឡប់ទៅមជ្ឈមណ្ឌលប្តូរជំនាញ" : "Back to Skill Exchange"}
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
            <MemberAvatar member={member} profile />
            <p className="eyebrow">
              {isKm ? "សមាជិកសហគមន៍" : member.role || "Member"}
            </p>
            <h1>{member.name}</h1>
            <p>{member.title}</p>
            <strong>
              {member.matchScore}% {isKm ? "ត្រូវគ្នា" : "match"}
            </strong>
          </aside>

          <section className="discover-profile-details">
            <Link className="profile-back-link" to="/skill-exchange">
              ← {isKm ? "ត្រឡប់ទៅមជ្ឈមណ្ឌលប្តូរជំនាញ" : "Back to Skill Exchange"}
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
                <h3>{isKm ? "អាចបង្រៀនអ្នក" : "Can teach"}</h3>
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
                <h3>{isKm ? "ចង់រៀនបន្ថែម" : "Wants to learn"}</h3>
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
                {isKm
                  ? `សំណើប្តូរជំនាញជាមួយ ${member.name} កំពុងស្ថិតក្នុងស្ថានភាព (${existingRequest.status})។`
                  : `Request ${existingRequest.status} with ${member.name}.`}
              </div>
            )}

            <div className="discover-actions">
              <button
                type="button"
                className="btn primary small"
                onClick={handleRequest}
                disabled={Boolean(existingRequest)}
              >
                {existingRequest
                  ? isKm
                    ? "បានផ្ញើសំណើរួចហើយ"
                    : existingRequest.status
                  : isKm
                    ? "ស្នើសុំប្តូរជំនាញ"
                    : "Request skill exchange"}
              </button>
              <button
                type="button"
                className="btn outline small"
                onClick={handleMessage}
              >
                {isKm ? "ផ្ញើសារ" : "Message"}
              </button>
              <Link className="btn outline small" to="/skill-exchange">
                {isKm ? "ស្វែងរកដៃគូផ្សេងទៀត" : "Browse more matches"}
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
};

export default DiscoverProfile;
