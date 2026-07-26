import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  IoBriefcaseOutline,
  IoBusinessOutline,
  IoCloudDownloadOutline,
  IoDocumentTextOutline,
  IoPeopleOutline,
  IoRibbonOutline,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Pagination,
  StatusBadge,
} from "../components/UI";
import { downloadReport, fetchAuditLogs } from "../services/api";
import { dateTime, pretty } from "../utils/format";

const reports = [
  ["users", "User directory", "Account roles, verification, and access status", IoPeopleOutline],
  ["mentors", "Mentor applications", "Verification decisions and professional profiles", IoRibbonOutline],
  ["companies", "Company profiles", "Recruiter ownership and trust status", IoBusinessOutline],
  ["internships", "Internship listings", "Opportunity status and publishing details", IoBriefcaseOutline],
  ["applications", "Applications", "Student application pipeline and outcomes", IoDocumentTextOutline],
  ["audit", "Audit history", "Administrator actions and governance evidence", IoShieldCheckmarkOutline],
];

const AuditPage = () => {
  const { notify, refreshKey } = useOutletContext();
  const [collection, setCollection] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCollection(await fetchAuditLogs({ page, limit: 15 }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load, refreshKey]);

  const download = async (report) => {
    setDownloading(report);
    try {
      await downloadReport(report);
      notify(`${pretty(report)} report downloaded.`);
      await load();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setDownloading("");
    }
  };

  return (
    <main className="admin-page">
      <section className="section-heading">
        <div>
          <p className="eyebrow">Accountability</p>
          <h2>Audit trail and export center</h2>
          <p>
            Keep a transparent record of administrator decisions and download
            clean CSV data for final reports.
          </p>
        </div>
      </section>

      <section className="report-grid">
        {reports.map(([key, title, description, Icon]) => (
          <article className="report-card" key={key}>
            <span>
              <Icon />
            </span>
            <div>
              <strong>{title}</strong>
              <p>{description}</p>
            </div>
            <button
              type="button"
              onClick={() => download(key)}
              disabled={Boolean(downloading)}
            >
              {downloading === key ? (
                <span className="spinner" />
              ) : (
                <IoCloudDownloadOutline />
              )}
              CSV
            </button>
          </article>
        ))}
      </section>

      <section className="panel table-panel">
        <header className="panel-header audit-header">
          <div>
            <span className="panel-kicker">
              <IoShieldCheckmarkOutline /> Immutable history
            </span>
            <h3>Administrator activity log</h3>
            <p>Actions are recorded with actor, entity, IP address, and time.</p>
          </div>
        </header>
        {loading && !collection ? (
          <LoadingState label="Loading audit history…" />
        ) : error && !collection ? (
          <ErrorState message={error} onRetry={load} />
        ) : collection?.logs?.length ? (
          <>
            <div className="table-wrap">
              <table className="data-table audit-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Administrator</th>
                    <th>Entity</th>
                    <th>Details</th>
                    <th>IP address</th>
                    <th>Recorded</th>
                  </tr>
                </thead>
                <tbody>
                  {collection.logs.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="primary-cell">
                          <strong>{pretty(item.action)}</strong>
                          <small>Event #{item.id}</small>
                        </div>
                      </td>
                      <td>
                        <div className="primary-cell">
                          <strong>{item.adminName}</strong>
                          <small>{item.adminEmail}</small>
                        </div>
                      </td>
                      <td>
                        <StatusBadge value={item.entityType || "system"} />
                        {item.entityId ? ` #${item.entityId}` : ""}
                      </td>
                      <td>
                        <code className="audit-details">
                          {item.details
                            ? JSON.stringify(item.details).slice(0, 120)
                            : "—"}
                        </code>
                      </td>
                      <td>{item.ipAddress || "—"}</td>
                      <td>{dateTime(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagination={collection.pagination} onChange={setPage} />
          </>
        ) : (
          <EmptyState
            title="No administrator actions recorded"
            message="Management decisions and report exports will appear here."
          />
        )}
      </section>
    </main>
  );
};

export default AuditPage;
