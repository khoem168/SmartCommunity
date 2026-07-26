import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  IoBriefcaseOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoSearchOutline,
} from "react-icons/io5";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Pagination,
  StatusBadge,
} from "../components/UI";
import { fetchInternships, updateInternship } from "../services/api";
import { dateTime, number, pretty } from "../utils/format";

const InternshipsPage = () => {
  const { notify, refreshKey } = useOutletContext();
  const [collection, setCollection] = useState(null);
  const [filters, setFilters] = useState({
    q: "",
    status: "",
    page: 1,
    limit: 10,
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCollection(await fetchInternships(filters));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load, refreshKey]);

  const updateStatus = async (item, status) => {
    setUpdating(item.id);
    try {
      await updateInternship(item.id, { status });
      notify(`${item.title} marked ${status}.`);
      await load();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <main className="admin-page">
      <section className="section-heading">
        <div>
          <p className="eyebrow">Opportunity quality</p>
          <h2>Moderate internship listings</h2>
          <p>
            Keep deadlines, availability, and posting status accurate for every
            learner exploring career opportunities.
          </p>
        </div>
        <div className="heading-badge">
          <IoBriefcaseOutline />
          <span>
            <strong>{collection?.pagination?.total || 0}</strong>
            Total listings
          </span>
        </div>
      </section>

      <section className="panel table-panel">
        <form
          className="filter-bar"
          onSubmit={(event) => {
            event.preventDefault();
            setFilters((current) => ({ ...current, q: search.trim(), page: 1 }));
          }}
        >
          <label className="search-field">
            <IoSearchOutline />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title or company"
            />
          </label>
          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: event.target.value,
                page: 1,
              }))
            }
          >
            <option value="">All listing states</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="filled">Filled</option>
          </select>
          <button className="button secondary" type="submit">
            Search
          </button>
        </form>

        {loading && !collection ? (
          <LoadingState label="Loading internship listings…" />
        ) : error && !collection ? (
          <ErrorState message={error} onRetry={load} />
        ) : collection?.internships?.length ? (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Opportunity</th>
                    <th>Location</th>
                    <th>Type</th>
                    <th>Applications</th>
                    <th>Deadline</th>
                    <th>Status</th>
                    <th>Moderate</th>
                  </tr>
                </thead>
                <tbody>
                  {collection.internships.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="primary-cell">
                          <strong>{item.title}</strong>
                          <small>
                            {item.company} · Posted by {item.postedBy || "Unknown"}
                          </small>
                        </div>
                      </td>
                      <td>
                        <span className="icon-text">
                          <IoLocationOutline /> {item.location || "Flexible"}
                        </span>
                      </td>
                      <td>{pretty(item.internshipType || item.category)}</td>
                      <td>
                        <strong>{number(item.applicationCount)}</strong> /{" "}
                        {number(item.openings)} openings
                      </td>
                      <td>
                        <span className="icon-text">
                          <IoCalendarOutline /> {dateTime(item.applicationDeadline)}
                        </span>
                      </td>
                      <td>
                        <StatusBadge value={item.status} />
                      </td>
                      <td>
                        <select
                          className="compact-select"
                          value={item.status}
                          disabled={updating === item.id}
                          onChange={(event) => updateStatus(item, event.target.value)}
                        >
                          <option value="open">Open</option>
                          <option value="closed">Closed</option>
                          <option value="filled">Filled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              pagination={collection.pagination}
              onChange={(page) => setFilters((current) => ({ ...current, page }))}
            />
          </>
        ) : (
          <EmptyState
            title="No internship listings found"
            message="Change the filters or wait for recruiters to publish an opportunity."
          />
        )}
      </section>
    </main>
  );
};

export default InternshipsPage;
