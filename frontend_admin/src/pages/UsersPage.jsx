import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  IoCreateOutline,
  IoPeopleOutline,
  IoSearchOutline,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Modal,
  Pagination,
  StatusBadge,
} from "../components/UI";
import { fetchUsers, updateUser } from "../services/api";
import { dateTime, initials, pretty } from "../utils/format";

const roles = ["user", "student", "mentor", "recruiter", "admin"];

const UsersPage = () => {
  const { admin, notify, refreshKey } = useOutletContext();
  const [collection, setCollection] = useState(null);
  const [filters, setFilters] = useState({
    q: "",
    role: "",
    status: "",
    page: 1,
    limit: 10,
  });
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCollection(await fetchUsers(filters));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load, refreshKey]);

  const openEditor = (user) => {
    setEditing(user);
    setForm({
      fullName: user.fullName,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
      suspensionReason: user.suspensionReason || "",
    });
  };

  const save = async () => {
    if (!form.fullName.trim()) return;
    setSaving(true);
    try {
      await updateUser(editing.id, form);
      notify("User account updated.");
      setEditing(null);
      await load();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const applySearch = (event) => {
    event.preventDefault();
    setFilters((current) => ({ ...current, q: search.trim(), page: 1 }));
  };

  return (
    <main className="admin-page">
      <section className="section-heading">
        <div>
          <p className="eyebrow">Access governance</p>
          <h2>Manage every community account</h2>
          <p>
            Verify identities, assign the right role, and suspend unsafe
            accounts without losing their history.
          </p>
        </div>
        <div className="heading-badge">
          <IoPeopleOutline />
          <span>
            <strong>{collection?.pagination?.total || 0}</strong>
            Total accounts
          </span>
        </div>
      </section>

      <section className="panel table-panel">
        <form className="filter-bar" onSubmit={applySearch}>
          <label className="search-field">
            <IoSearchOutline />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or email"
            />
          </label>
          <select
            value={filters.role}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                role: event.target.value,
                page: 1,
              }))
            }
          >
            <option value="">All roles</option>
            {roles.map((role) => (
              <option value={role} key={role}>
                {pretty(role)}
              </option>
            ))}
          </select>
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
            <option value="">All account states</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          <button className="button secondary" type="submit">
            Search
          </button>
        </form>

        {loading && !collection ? (
          <LoadingState label="Loading community accounts…" />
        ) : error && !collection ? (
          <ErrorState message={error} onRetry={load} />
        ) : collection?.users?.length ? (
          <>
            {error && <div className="inline-alert">{error}</div>}
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Verification</th>
                    <th>Account</th>
                    <th>Last login</th>
                    <th>Joined</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {collection.users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="person-cell">
                          <span className="avatar small">{initials(user.fullName)}</span>
                          <div>
                            <strong>{user.fullName}</strong>
                            <small>{user.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="role-chip">{pretty(user.role)}</span>
                      </td>
                      <td>
                        <StatusBadge value={user.isVerified ? "verified" : "unverified"} />
                      </td>
                      <td>
                        <StatusBadge value={user.isActive ? "active" : "suspended"} />
                      </td>
                      <td>{dateTime(user.lastLogin)}</td>
                      <td>{dateTime(user.createdAt)}</td>
                      <td className="table-actions">
                        <button type="button" onClick={() => openEditor(user)}>
                          <IoCreateOutline /> Manage
                        </button>
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
            title="No accounts match these filters"
            message="Try a broader search or clear one of the selected filters."
          />
        )}
      </section>

      {editing && form && (
        <Modal
          title="Manage user account"
          description={`${editing.email} · Account #${editing.id}`}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button className="button ghost" type="button" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="button primary" type="button" disabled={saving} onClick={save}>
                {saving ? <span className="spinner light" /> : "Save changes"}
              </button>
            </>
          }
        >
          <div className="form-grid">
            <label className="field full">
              <span>Full name</span>
              <input
                value={form.fullName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, fullName: event.target.value }))
                }
              />
            </label>
            <label className="field">
              <span>Account role</span>
              <select
                value={form.role}
                disabled={editing.id === admin.id}
                onChange={(event) =>
                  setForm((current) => ({ ...current, role: event.target.value }))
                }
              >
                {roles.map((role) => (
                  <option value={role} key={role}>
                    {pretty(role)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Email verification</span>
              <select
                value={String(form.isVerified)}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isVerified: event.target.value === "true",
                  }))
                }
              >
                <option value="true">Verified</option>
                <option value="false">Unverified</option>
              </select>
            </label>
          </div>
          <div className={`account-access-box ${form.isActive ? "" : "danger"}`}>
            <div>
              <IoShieldCheckmarkOutline />
              <span>
                <strong>Account access</strong>
                <p>
                  Suspended users are signed out on their next protected request.
                </p>
              </span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={form.isActive}
                disabled={editing.id === admin.id}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
              />
              <span />
            </label>
          </div>
          {!form.isActive && (
            <label className="field">
              <span>Suspension reason</span>
              <textarea
                rows="3"
                value={form.suspensionReason}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    suspensionReason: event.target.value,
                  }))
                }
                placeholder="Explain why access is being suspended"
              />
            </label>
          )}
        </Modal>
      )}
    </main>
  );
};

export default UsersPage;
