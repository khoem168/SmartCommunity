import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  IoBusinessOutline,
  IoCheckmarkOutline,
  IoCloseOutline,
  IoOpenOutline,
  IoRibbonOutline,
  IoSearchOutline,
} from "react-icons/io5";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Modal,
  Pagination,
  StatusBadge,
} from "../components/UI";
import {
  fetchCompanies,
  fetchMentors,
  reviewCompany,
  reviewMentor,
} from "../services/api";
import { dateTime, number, pretty } from "../utils/format";

const ReviewsPage = () => {
  const { notify, refreshKey } = useOutletContext();
  const [tab, setTab] = useState("mentors");
  const [mentors, setMentors] = useState(null);
  const [companies, setCompanies] = useState(null);
  const [mentorFilters, setMentorFilters] = useState({
    status: "",
    page: 1,
    limit: 10,
  });
  const [companyFilters, setCompanyFilters] = useState({
    q: "",
    status: "",
    page: 1,
    limit: 10,
  });
  const [companySearch, setCompanySearch] = useState("");
  const [review, setReview] = useState(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "mentors") {
        setMentors(await fetchMentors(mentorFilters));
      } else {
        setCompanies(await fetchCompanies(companyFilters));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [companyFilters, mentorFilters, tab]);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load, refreshKey]);

  const openReview = (kind, item, status) => {
    setReview({ kind, item, status });
    setReason("");
  };

  const submitReview = async () => {
    if (review.status === "rejected" && !reason.trim()) {
      notify("Add a reason before rejecting this application.", "error");
      return;
    }
    setSaving(true);
    try {
      if (review.kind === "mentor") {
        await reviewMentor(review.item.id, {
          status: review.status,
          reason: reason.trim(),
        });
      } else {
        await reviewCompany(review.item.id, {
          status: review.status,
          reason: reason.trim(),
        });
      }
      notify(`${pretty(review.kind)} marked ${review.status}.`);
      setReview(null);
      await load();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="admin-page">
      <section className="section-heading">
        <div>
          <p className="eyebrow">Trust & quality</p>
          <h2>Review people and organizations</h2>
          <p>
            Validate professional claims before mentors and recruiters receive
            trusted access across the community.
          </p>
        </div>
      </section>

      <div className="segmented-tabs" role="tablist">
        <button
          className={tab === "mentors" ? "active" : ""}
          type="button"
          onClick={() => setTab("mentors")}
        >
          <IoRibbonOutline /> Mentor applications
          {mentors?.stats?.pending > 0 && <span>{mentors.stats.pending}</span>}
        </button>
        <button
          className={tab === "companies" ? "active" : ""}
          type="button"
          onClick={() => setTab("companies")}
        >
          <IoBusinessOutline /> Company profiles
        </button>
      </div>

      {tab === "mentors" ? (
        <>
          <section className="mini-stats">
            {["total", "pending", "approved", "rejected"].map((key) => (
              <article key={key}>
                <span>{pretty(key)}</span>
                <strong>{number(mentors?.stats?.[key])}</strong>
              </article>
            ))}
          </section>
          <section className="panel table-panel">
            <div className="filter-bar">
              <select
                value={mentorFilters.status}
                onChange={(event) =>
                  setMentorFilters((current) => ({
                    ...current,
                    status: event.target.value,
                    page: 1,
                  }))
                }
              >
                <option value="">All application states</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            {loading && !mentors ? (
              <LoadingState label="Loading mentor applications…" />
            ) : error && !mentors ? (
              <ErrorState message={error} onRetry={load} />
            ) : mentors?.applications?.length ? (
              <>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Applicant</th>
                        <th>Professional profile</th>
                        <th>Expertise</th>
                        <th>Experience</th>
                        <th>Status</th>
                        <th>Submitted</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {mentors.applications.map((item) => {
                        const expertise = Array.isArray(item.expertise)
                          ? item.expertise
                          : (() => {
                              try {
                                return JSON.parse(item.expertise || "[]");
                              } catch {
                                return [];
                              }
                            })();
                        return (
                          <tr key={item.id}>
                            <td>
                              <div className="primary-cell">
                                <strong>{item.name}</strong>
                                <small>{item.email}</small>
                              </div>
                            </td>
                            <td>
                              <div className="primary-cell">
                                <strong>{item.professionalTitle}</strong>
                                <small>{item.company || "Independent"}</small>
                              </div>
                            </td>
                            <td>
                              <div className="chip-list">
                                {expertise.slice(0, 3).map((skill) => (
                                  <span key={skill}>{skill}</span>
                                ))}
                              </div>
                            </td>
                            <td>{number(item.experienceYears)} years</td>
                            <td>
                              <StatusBadge value={item.status} />
                            </td>
                            <td>{dateTime(item.createdAt)}</td>
                            <td className="table-actions">
                              {item.status === "pending" ? (
                                <div className="inline-actions">
                                  <button
                                    className="approve"
                                    type="button"
                                    onClick={() => openReview("mentor", item, "approved")}
                                  >
                                    <IoCheckmarkOutline /> Approve
                                  </button>
                                  <button
                                    className="reject"
                                    type="button"
                                    onClick={() => openReview("mentor", item, "rejected")}
                                  >
                                    <IoCloseOutline /> Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="muted-note">
                                  {item.reviewedBy || "Reviewed"}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  pagination={mentors.pagination}
                  onChange={(page) =>
                    setMentorFilters((current) => ({ ...current, page }))
                  }
                />
              </>
            ) : (
              <EmptyState
                title="No mentor applications found"
                message="There are no applications matching this status."
              />
            )}
          </section>
        </>
      ) : (
        <section className="panel table-panel">
          <form
            className="filter-bar"
            onSubmit={(event) => {
              event.preventDefault();
              setCompanyFilters((current) => ({
                ...current,
                q: companySearch.trim(),
                page: 1,
              }));
            }}
          >
            <label className="search-field">
              <IoSearchOutline />
              <input
                value={companySearch}
                onChange={(event) => setCompanySearch(event.target.value)}
                placeholder="Search company, owner, or email"
              />
            </label>
            <select
              value={companyFilters.status}
              onChange={(event) =>
                setCompanyFilters((current) => ({
                  ...current,
                  status: event.target.value,
                  page: 1,
                }))
              }
            >
              <option value="">All verification states</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
            <button className="button secondary" type="submit">
              Search
            </button>
          </form>
          {loading && !companies ? (
            <LoadingState label="Loading company profiles…" />
          ) : error && !companies ? (
            <ErrorState message={error} onRetry={load} />
          ) : companies?.companies?.length ? (
            <>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Owner</th>
                      <th>Industry</th>
                      <th>Location</th>
                      <th>Internships</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {companies.companies.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="primary-cell">
                            <strong>{item.name}</strong>
                            <small>{item.contactEmail}</small>
                          </div>
                        </td>
                        <td>
                          <div className="primary-cell">
                            <strong>{item.ownerName}</strong>
                            <small>{item.ownerEmail}</small>
                          </div>
                        </td>
                        <td>{item.industry || "—"}</td>
                        <td>{item.location || "—"}</td>
                        <td>{number(item.internshipCount)}</td>
                        <td>
                          <StatusBadge value={item.verificationStatus} />
                        </td>
                        <td className="table-actions">
                          <div className="inline-actions">
                            {item.website && (
                              <a href={item.website} target="_blank" rel="noreferrer">
                                <IoOpenOutline /> Website
                              </a>
                            )}
                            {item.verificationStatus !== "verified" && (
                              <button
                                className="approve"
                                type="button"
                                onClick={() => openReview("company", item, "verified")}
                              >
                                Verify
                              </button>
                            )}
                            {item.verificationStatus !== "rejected" && (
                              <button
                                className="reject"
                                type="button"
                                onClick={() => openReview("company", item, "rejected")}
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                pagination={companies.pagination}
                onChange={(page) =>
                  setCompanyFilters((current) => ({ ...current, page }))
                }
              />
            </>
          ) : (
            <EmptyState
              title="No company profiles yet"
              message="Recruiter company profiles will appear here for verification."
            />
          )}
        </section>
      )}

      {review && (
        <Modal
          title={`${pretty(review.status)} ${pretty(review.kind)}`}
          description={
            review.kind === "mentor"
              ? review.item.name
              : review.item.name
          }
          onClose={() => setReview(null)}
          footer={
            <>
              <button className="button ghost" type="button" onClick={() => setReview(null)}>
                Cancel
              </button>
              <button
                className={`button ${review.status === "rejected" ? "danger" : "primary"}`}
                type="button"
                onClick={submitReview}
                disabled={saving}
              >
                {saving ? <span className="spinner light" /> : `Confirm ${review.status}`}
              </button>
            </>
          }
        >
          {review.kind === "mentor" && (
            <div className="review-summary">
              <div>
                <span>Professional title</span>
                <strong>{review.item.professionalTitle}</strong>
              </div>
              <div>
                <span>Experience</span>
                <strong>{number(review.item.experienceYears)} years</strong>
              </div>
              <p>{review.item.motivation}</p>
            </div>
          )}
          <label className="field">
            <span>
              Review note {review.status === "rejected" ? "(required)" : "(optional)"}
            </span>
            <textarea
              rows="4"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={
                review.status === "rejected"
                  ? "Explain what must be corrected before applying again"
                  : "Add an internal review note"
              }
            />
          </label>
          <div className="decision-note">
            The applicant will receive a notification about this decision.
          </div>
        </Modal>
      )}
    </main>
  );
};

export default ReviewsPage;
