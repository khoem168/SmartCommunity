import { useState, useEffect } from "react";
import {
  IoCloseOutline,
  IoAddOutline,
  IoCloseCircleOutline,
  IoSparklesOutline,
  IoCheckmarkCircleOutline,
  IoBookOutline,
  IoSchoolOutline,
} from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import { useLanguage } from "../../context/LanguageContext";
import { ButtonLoader } from "../../components/ui/LoadingStates";

export default function PostOfferModal({ isOpen, onClose, onSuccess }) {
  const { user, updateUser, refreshUser } = useGlobleContext();
  const { language } = useLanguage();
  const isKm = language === "km";

  const [teachSkills, setTeachSkills] = useState([]);
  const [learnSkills, setLearnSkills] = useState([]);
  const [newTeachInput, setNewTeachInput] = useState("");
  const [newLearnInput, setNewLearnInput] = useState("");
  const [availability, setAvailability] = useState("Flexible schedule");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !isOpen) return;

    const teach = [
      ...(user.skills?.teach || []),
      ...(user.skills?.candidate || []),
    ];
    const learn = user.skills?.learn || [];

    setTeachSkills([...new Set(teach)]);
    setLearnSkills([...new Set(learn)]);
    setAvailability(user.skills?.availability || user.availability || "Flexible schedule");
    setBio(user.bio || "");
    setNewTeachInput("");
    setNewLearnInput("");
    setError("");
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleAddTeach = (e) => {
    e.preventDefault();
    const val = newTeachInput.trim();
    if (val && !teachSkills.includes(val)) {
      setTeachSkills([...teachSkills, val]);
      setNewTeachInput("");
    }
  };

  const handleRemoveTeach = (skillToRemove) => {
    setTeachSkills(teachSkills.filter((s) => s !== skillToRemove));
  };

  const handleAddLearn = (e) => {
    e.preventDefault();
    const val = newLearnInput.trim();
    if (val && !learnSkills.includes(val)) {
      setLearnSkills([...learnSkills, val]);
      setNewLearnInput("");
    }
  };

  const handleRemoveLearn = (skillToRemove) => {
    setLearnSkills(learnSkills.filter((s) => s !== skillToRemove));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (teachSkills.length === 0 && learnSkills.length === 0) {
      setError(
        isKm
          ? "សូមបន្ថែមយ៉ាងហោចណាស់មួយជំនាញដែលអ្នកអាចបង្រៀន ឬចង់រៀន។"
          : "Please add at least one skill to teach or learn.",
      );
      return;
    }

    setLoading(true);
    setError("");
    try {
      await updateUser({
        skillsToTeach: teachSkills,
        skillsToLearn: learnSkills,
        availability,
        bio: bio.trim(),
      });
      await refreshUser();

      if (onSuccess) {
        onSuccess(
          isKm
            ? "ការប្រកាសប្តូរជំនាញរបស់អ្នកត្រូវបានកែសម្រួលដោយជោគជ័យ! បញ្ជីដៃគូត្រូវបាន Update រួចរាល់។"
            : "Your skill offer has been posted! Matching partners have been updated.",
        );
      }
      onClose();
    } catch (err) {
      setError(
        err.message ||
          (isKm
            ? "មិនអាចរក្សាទុកបានទេ។ សូមព្យាយាមម្តងទៀត។"
            : "Failed to update your skill offer."),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hub-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="hub-modal-card hub-modal-large glass"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hub-modal-header">
          <div className="hub-modal-title-wrap">
            <span className="hub-modal-badge gold">
              <IoSparklesOutline />
              {isKm ? "ប្រកាស ឬកែសម្រួលជំនាញ" : "Post or Update Skill Offer"}
            </span>
            <h2>
              {isKm ? "ប្រកាសការផ្តល់ប្តូរជំនាញរបស់អ្នក" : "Publish Your Skill Swap Profile"}
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

        <p className="hub-modal-subtitle">
          {isKm
            ? "កំណត់ជំនាញដែលអ្នកចេះ និងជំនាញដែលអ្នកចង់រៀន ដើម្បីឱ្យប្រព័ន្ធ AI និងសិស្សដទៃទៀតអាចផ្គូផ្គង និងរកឃើញអ្នកបានកាន់តែលឿន។"
            : "Declare the skills you can share and the skills you want to learn so peers can match and initiate skill swaps with you."}
        </p>

        {error && <div className="hub-modal-error">{error}</div>}

        <form onSubmit={handleSave} className="hub-modal-form">
          {/* Section 1: Skills I Can Teach */}
          <div className="hub-tags-group">
            <div className="hub-tags-header">
              <label>
                <IoSchoolOutline />
                <strong>{isKm ? "ជំនាញដែលអ្នកអាចបង្រៀន (Skills I Can Teach)" : "Skills I Can Teach"}</strong>
              </label>
              <span className="hub-tags-counter">{teachSkills.length} {isKm ? "ជំនាញ" : "skills"}</span>
            </div>

            <div className="hub-tags-box">
              {teachSkills.map((skill) => (
                <span key={skill} className="hub-tag-pill teach">
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveTeach(skill)}
                    aria-label={`Remove ${skill}`}
                  >
                    <IoCloseCircleOutline />
                  </button>
                </span>
              ))}
              <div className="hub-tag-input-wrap">
                <input
                  type="text"
                  placeholder={isKm ? "+ បញ្ចូលជំនាញចេះ រួចចុច Add" : "+ Type skill (e.g. React) and press Add"}
                  value={newTeachInput}
                  onChange={(e) => setNewTeachInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTeach(e);
                    }
                  }}
                />
                <button
                  type="button"
                  className="hub-tag-add-btn"
                  onClick={handleAddTeach}
                  disabled={!newTeachInput.trim()}
                >
                  <IoAddOutline /> {isKm ? "ថែម" : "Add"}
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Skills I Want to Learn */}
          <div className="hub-tags-group">
            <div className="hub-tags-header">
              <label>
                <IoBookOutline />
                <strong>{isKm ? "ជំនាញដែលអ្នកចង់រៀន (Skills I Want to Learn)" : "Skills I Want to Learn"}</strong>
              </label>
              <span className="hub-tags-counter">{learnSkills.length} {isKm ? "ជំនាញ" : "skills"}</span>
            </div>

            <div className="hub-tags-box">
              {learnSkills.map((skill) => (
                <span key={skill} className="hub-tag-pill learn">
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveLearn(skill)}
                    aria-label={`Remove ${skill}`}
                  >
                    <IoCloseCircleOutline />
                  </button>
                </span>
              ))}
              <div className="hub-tag-input-wrap">
                <input
                  type="text"
                  placeholder={isKm ? "+ បញ្ចូលជំនាញចង់រៀន រួចចុច Add" : "+ Type skill (e.g. Figma) and press Add"}
                  value={newLearnInput}
                  onChange={(e) => setNewLearnInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddLearn(e);
                    }
                  }}
                />
                <button
                  type="button"
                  className="hub-tag-add-btn"
                  onClick={handleAddLearn}
                  disabled={!newLearnInput.trim()}
                >
                  <IoAddOutline /> {isKm ? "ថែម" : "Add"}
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Availability & Bio */}
          <div className="hub-form-row">
            <label className="hub-form-label">
              <span>{isKm ? "ពេលវេលាទំនេរ (Availability)" : "Availability"}</span>
              <select
                className="hub-select"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
              >
                <option value="Flexible schedule">{isKm ? "ពេលវេលាបត់បែន (Flexible Schedule)" : "Flexible schedule"}</option>
                <option value="Weekends only">{isKm ? "ចុងសប្តាហ៍ (Weekends Only)" : "Weekends only"}</option>
                <option value="Weekday evenings">{isKm ? "ពេលល្ងាចថ្ងៃធ្វើការ (Weekday Evenings)" : "Weekday evenings"}</option>
                <option value="Full-time learner">{isKm ? "ពេញម៉ោង (Full-time Learner)" : "Full-time learner"}</option>
              </select>
            </label>

            <label className="hub-form-label">
              <span>{isKm ? "ការពិពណ៌នាខ្លីៗពីខ្លួនអ្នក (Bio)" : "Brief Bio & Introduction"}</span>
              <input
                type="text"
                className="hub-input"
                placeholder={isKm ? "ឧ. និស្សិតឆ្នាំទី ៣ ផ្នែក IT ចង់ផ្លាស់ប្តូរជំនាញ..." : "e.g. Year 3 CS student eager to practice and exchange skills..."}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </label>
          </div>

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
                <ButtonLoader>{isKm ? "កំពុងរក្សាទុក..." : "Saving..."}</ButtonLoader>
              ) : (
                <>
                  <IoCheckmarkCircleOutline />
                  {isKm ? "ផ្សព្វផ្សាយការប្តូរជំនាញ" : "Publish Offer"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
