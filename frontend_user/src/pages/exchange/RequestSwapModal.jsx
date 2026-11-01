import { useState, useEffect } from "react";
import {
  IoCloseOutline,
  IoSwapHorizontalOutline,
  IoSparklesOutline,
  IoCheckmarkCircleOutline,
} from "react-icons/io5";
import UserAvatar from "../../components/ui/UserAvatar";
import { createSkillExchangeRequest } from "../../services/platformService";
import { ButtonLoader } from "../../components/ui/LoadingStates";
import { useLanguage } from "../../context/LanguageContext";

export default function RequestSwapModal({
  isOpen,
  onClose,
  targetMember,
  currentUser,
  onSuccess,
}) {
  const { language } = useLanguage();
  const isKm = language === "km";

  const [skillOffered, setSkillOffered] = useState("");
  const [skillRequested, setSkillRequested] = useState("");
  const [message, setMessage] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!targetMember || !isOpen) return;

    const userTeach = [
      ...(currentUser?.skills?.teach || []),
      ...(currentUser?.skills?.candidate || []),
    ];
    const userLearn = currentUser?.skills?.learn || [];

    const memberTeach = targetMember.teachSkills || [];
    const memberLearn = targetMember.learnSkills || [];

    // Find best candidate
    const bestRequest =
      targetMember.suggestedRequestedSkill ||
      memberTeach.find((s) => userLearn.includes(s)) ||
      memberTeach[0] ||
      "";
    const bestOffer =
      targetMember.suggestedOfferedSkill ||
      userTeach.find((s) => memberLearn.includes(s)) ||
      userTeach[0] ||
      "";

    setSkillRequested(bestRequest);
    setSkillOffered(bestOffer);
    setMessage(
      isKm
        ? `សួស្តី ${targetMember.name} ខ្ញុំចង់ផ្លាស់ប្តូរជំនាញជាមួយអ្នក។ ខ្ញុំអាចជួយលើ ${bestOffer || "ជំនាញរបស់ខ្ញុំ"} ហើយចង់រៀនបន្ថែមលើ ${bestRequest || "ជំនាញរបស់អ្នក"}!`
        : `Hi ${targetMember.name}, I would love to exchange skills with you! I can help with ${bestOffer || "my skills"} and would love to learn ${bestRequest || "your skills"}.`,
    );
    setScheduledDate("");
    setError("");
  }, [targetMember, isOpen, currentUser, isKm]);

  if (!isOpen || !targetMember) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!skillOffered.trim() || !skillRequested.trim()) {
      setError(
        isKm
          ? "សូមជ្រើសរើស ឬបញ្ចូលជំនាញដែលអ្នកចង់បង្រៀន និងចង់រៀន។"
          : "Please specify both the skill to offer and the skill to learn.",
      );
      return;
    }

    setLoading(true);
    setError("");
    try {
      await createSkillExchangeRequest({
        providerId: targetMember.id,
        skillOffered: skillOffered.trim(),
        skillRequested: skillRequested.trim(),
        message: message.trim(),
        scheduledDate: scheduledDate ? scheduledDate.replace("T", " ") : null,
      });

      if (onSuccess) {
        onSuccess(
          isKm
            ? `សំណើប្តូរជំនាញត្រូវបានផ្ញើទៅកាន់ ${targetMember.name} រួចរាល់!`
            : `Skill exchange request sent to ${targetMember.name}!`,
        );
      }
      onClose();
    } catch (err) {
      setError(
        err.message ||
          (isKm
            ? "មិនអាចផ្ញើសំណើបានទេ។ សូមព្យាយាមម្តងទៀត។"
            : "Failed to send skill exchange request."),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hub-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="hub-modal-card glass"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hub-modal-header">
          <div className="hub-modal-title-wrap">
            <span className="hub-modal-badge">
              <IoSwapHorizontalOutline />
              {isKm ? "សំណើដោះដូរជំនាញ" : "Skill Swap Request"}
            </span>
            <h2>
              {isKm ? `ប្តូរជំនាញជាមួយ ${targetMember.name}` : `Swap Skills with ${targetMember.name}`}
            </h2>
          </div>
          <button
            type="button"
            className="hub-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <IoCloseOutline />
          </button>
        </div>

        {/* Target Profile Snippet */}
        <div className="hub-target-preview">
          <UserAvatar user={targetMember} size={54} />
          <div className="hub-target-info">
            <h3>{targetMember.name}</h3>
            <p>{targetMember.profession || targetMember.role || (isKm ? "សមាជិកសហគមន៍" : "Community Member")}</p>
            {targetMember.matchScore && (
              <span className="hub-match-pill">
                <IoSparklesOutline />
                {targetMember.matchScore}% {isKm ? "ត្រូវគ្នានឹងអ្នក" : "Match"}
              </span>
            )}
          </div>
        </div>

        {error && <div className="hub-modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="hub-modal-form">
          <div className="hub-form-row">
            <label className="hub-form-label">
              <span>{isKm ? "ជំនាញដែលអ្នកអាចបង្រៀន (Offer)" : "Skill You Can Teach"} <strong className="req">*</strong></span>
              <input
                type="text"
                className="hub-input"
                placeholder={isKm ? "ឧ. React, Python, UI Design..." : "e.g. React, Python, UI Design"}
                value={skillOffered}
                onChange={(e) => setSkillOffered(e.target.value)}
                required
              />
              {targetMember.learnSkills?.length > 0 && (
                <div className="hub-skill-suggestions">
                  <small>{isKm ? "គេចង់រៀន៖" : "They want to learn:"}</small>
                  {targetMember.learnSkills.slice(0, 3).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`hub-suggestion-chip ${skillOffered === s ? "active" : ""}`}
                      onClick={() => setSkillOffered(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </label>

            <label className="hub-form-label">
              <span>{isKm ? "ជំនាញដែលអ្នកចង់រៀនពីគេ (Learn)" : "Skill You Want to Learn"} <strong className="req">*</strong></span>
              <input
                type="text"
                className="hub-input"
                placeholder={isKm ? "ឧ. Figma, Node.js, English..." : "e.g. Figma, Node.js, English"}
                value={skillRequested}
                onChange={(e) => setSkillRequested(e.target.value)}
                required
              />
              {targetMember.teachSkills?.length > 0 && (
                <div className="hub-skill-suggestions">
                  <small>{isKm ? "គេអាចបង្រៀន៖" : "They can teach:"}</small>
                  {targetMember.teachSkills.slice(0, 3).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`hub-suggestion-chip ${skillRequested === s ? "active" : ""}`}
                      onClick={() => setSkillRequested(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </label>
          </div>

          <label className="hub-form-label">
            <span>{isKm ? "សារណែនាំ ឬគោលបំណងរៀនសូត្រ" : "Personal Message & Goals"}</span>
            <textarea
              className="hub-textarea"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isKm ? "សរសេរសារខ្លីៗប្រាប់ពីអ្វីដែលអ្នកចង់រៀន និងពេលវេលាទំនេររបស់អ្នក..." : "Share what you'd like to work on and your preferred pace..."}
            />
          </label>

          <label className="hub-form-label">
            <span>{isKm ? "កាលបរិច្ឆេទណាត់ជួបដំបូង (ជម្រើសបន្ថែម)" : "Proposed Meeting Time (Optional)"}</span>
            <input
              type="datetime-local"
              className="hub-input"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </label>

          <div className="hub-modal-actions">
            <button
              type="button"
              className="btn outline"
              onClick={onClose}
              disabled={loading}
            >
              {isKm ? "បោះបង់" : "Cancel"}
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={loading}
            >
              {loading ? (
                <ButtonLoader>{isKm ? "កំពុងផ្ញើ..." : "Sending..."}</ButtonLoader>
              ) : (
                <>
                  <IoCheckmarkCircleOutline />
                  {isKm ? "ផ្ញើសំណើដោះដូរ" : "Send Swap Request"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
