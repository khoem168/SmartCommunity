import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useGlobleContext } from "../../context/GlobleContext";
import "./Settings.css";

const settingsOptions = [
  { key: "darkMode", label: "Dark mode" },
  { key: "emailNotifications", label: "Email notifications" },
  { key: "newMatches", label: "New mentorship matches" },
];

const Settings = () => {
  const { user, updateUser } = useGlobleContext();
  const [formState, setFormState] = useState({
    fullName: "",
    bio: "",
    availability: "Flexible schedule",
    darkMode: false,
    emailNotifications: true,
    newMatches: true,
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.resolve().then(() =>
      setFormState({
        fullName: user.fullName || "",
        bio: user.bio || "",
        availability: user.availability || "Flexible schedule",
        darkMode: user.darkMode ?? false,
        emailNotifications: user.emailNotifications ?? true,
        newMatches: user.newMatches ?? true,
      }),
    );
  }, [user]);

  if (!user) {
    return (
      <main className="settings-page container">
        <section className="settings-empty">
          <h1>Login to manage account settings</h1>
          <p>
            Access your profile settings, notifications, and preferences from
            one place.
          </p>
          <Link to="/login" className="btn primary">
            Sign in
          </Link>
        </section>
      </main>
    );
  }

  const handleChange = (key, value) => {
    setFormState((current) => ({ ...current, [key]: value }));
  };

  const handleSave = (event) => {
    event.preventDefault();
    updateUser(formState);
    setMessage("Your settings have been saved.");
    window.setTimeout(() => setMessage(""), 3000);
  };

  return (
    <main className="settings-page container">
      <section className="settings-header">
        <h1>Account settings</h1>
        <p>Update your profile details and notification preferences here.</p>
      </section>

      <form className="settings-card" onSubmit={handleSave}>
        <fieldset>
          <legend>Profile information</legend>

          <label>
            Full name
            <input
              type="text"
              value={formState.fullName}
              onChange={(event) => handleChange("fullName", event.target.value)}
              placeholder="What should people call you?"
            />
          </label>

          <label>
            Email address
            <input type="email" value={user.email || ""} disabled />
          </label>

          <label>
            Bio
            <textarea
              value={formState.bio}
              onChange={(event) => handleChange("bio", event.target.value)}
              placeholder="Write a short description about yourself"
            />
          </label>

          <label>
            Availability
            <select
              value={formState.availability}
              onChange={(event) =>
                handleChange("availability", event.target.value)
              }
            >
              <option>Flexible schedule</option>
              <option>Part time</option>
              <option>Full time</option>
              <option>Open to project work</option>
            </select>
          </label>
        </fieldset>

        <fieldset>
          <legend>Notifications</legend>
          <div className="settings-toggle-grid">
            {settingsOptions.map((option) => (
              <label className="settings-toggle" key={option.key}>
                <span>{option.label}</span>
                <div className="settings-toggle-control">
                  <input
                    type="checkbox"
                    checked={Boolean(formState[option.key])}
                    onChange={(event) =>
                      handleChange(option.key, event.target.checked)
                    }
                  />
                  <span className="settings-toggle-switch" />
                </div>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="settings-actions">
          <button type="submit" className="btn primary">
            Save settings
          </button>
          {message ? <span className="settings-message">{message}</span> : null}
        </div>
      </form>
    </main>
  );
};

export default Settings;
