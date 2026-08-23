import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import {
  IoBusinessOutline,
  IoCloudDownloadOutline,
  IoDocumentTextOutline,
  IoPeopleOutline,
  IoRibbonOutline,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";
import { useGlobleContext } from "../../context/GlobleContext";
import {
  downloadAdminReport,
  fetchAdminAuditLogs,
  fetchAdminCompanies,
  fetchAdminDashboard,
  fetchAdminInternships,
  fetchAdminMentorApplications,
  fetchAdminUsers,
  reviewAdminCompany,
  reviewAdminMentorApplication,
  updateAdminInternship,
  updateAdminUser,
} from "../../services/adminService";
import "./AdminPanel.css";

const { Text, Title } = Typography;
const roles = ["user", "student", "mentor", "recruiter", "admin"];
const internshipStatuses = ["open", "closed", "filled"];
const companyStatuses = ["pending", "verified", "rejected"];
const mentorStatuses = ["pending", "approved", "rejected"];

const pretty = (value = "") =>
  String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const dateTime = (value) => (value ? new Date(value).toLocaleString() : "—");

const statusColor = (value) =>
  ({
    active: "green",
    open: "green",
    approved: "green",
    verified: "green",
    pending: "gold",
    suspended: "red",
    rejected: "red",
    closed: "default",
    filled: "blue",
  })[value] || "blue";

const StatusTag = ({ value }) => (
  <Tag color={statusColor(value)}>{pretty(value)}</Tag>
);

const initialCollection = {
  items: [],
  pagination: { page: 1, limit: 10, total: 0 },
};

const AdminPanel = () => {
  const { user, isLoading } = useGlobleContext();
  const [messageApi, contextHolder] = message.useMessage();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState(initialCollection);
  const [mentors, setMentors] = useState({ ...initialCollection, stats: {} });
  const [companies, setCompanies] = useState(initialCollection);
  const [internships, setInternships] = useState(initialCollection);
  const [audit, setAudit] = useState(initialCollection);
  const [userFilters, setUserFilters] = useState({
    q: "",
    role: "",
    status: "",
    page: 1,
    limit: 10,
  });
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
  const [internshipFilters, setInternshipFilters] = useState({
    q: "",
    status: "",
    page: 1,
    limit: 10,
  });
  const [auditPage, setAuditPage] = useState(1);
  const [editingUser, setEditingUser] = useState(null);
  const [review, setReview] = useState(null);
  const [reviewReason, setReviewReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState("");
  const [userForm] = Form.useForm();

  const loadActiveTab = useCallback(async () => {
    if (user?.role !== "admin") return;
    setLoading(true);
    try {
      if (activeTab === "overview") {
        setDashboard(await fetchAdminDashboard());
      } else if (activeTab === "users") {
        const result = await fetchAdminUsers(userFilters);
        setUsers({ items: result.users, pagination: result.pagination });
      } else if (activeTab === "mentors") {
        const result = await fetchAdminMentorApplications(mentorFilters);
        setMentors({
          items: result.applications,
          pagination: result.pagination,
          stats: result.stats,
        });
      } else if (activeTab === "companies") {
        const result = await fetchAdminCompanies(companyFilters);
        setCompanies({
          items: result.companies,
          pagination: result.pagination,
        });
      } else if (activeTab === "internships") {
        const result = await fetchAdminInternships(internshipFilters);
        setInternships({
          items: result.internships,
          pagination: result.pagination,
        });
      } else if (activeTab === "audit") {
        const result = await fetchAdminAuditLogs({
          page: auditPage,
          limit: 15,
        });
        setAudit({ items: result.logs, pagination: result.pagination });
      }
    } catch (error) {
      messageApi.error(error.message || "Unable to load administration data.");
    } finally {
      setLoading(false);
    }
  }, [
    activeTab,
    auditPage,
    companyFilters,
    internshipFilters,
    mentorFilters,
    messageApi,
    user,
    userFilters,
  ]);

  useEffect(() => {
    Promise.resolve()
      .then(loadActiveTab)
      .catch(() => undefined);
  }, [loadActiveTab]);

  const openUserEditor = (record) => {
    setEditingUser(record);
    userForm.setFieldsValue({
      fullName: record.fullName,
      role: record.role,
      isVerified: record.isVerified,
      isActive: record.isActive,
      suspensionReason: record.suspensionReason || "",
    });
  };

  const saveUser = async () => {
    try {
      const values = await userForm.validateFields();
      setSaving(true);
      await updateAdminUser(editingUser.id, values);
      messageApi.success("User account updated.");
      setEditingUser(null);
      await loadActiveTab();
    } catch (error) {
      if (!error?.errorFields)
        messageApi.error(error.message || "Unable to update this user.");
    } finally {
      setSaving(false);
    }
  };

  const openReview = (kind, record, status) => {
    setReview({
      kind,
      id: record.id,
      status,
      name: record.name || record.title || record.professionalTitle,
    });
    setReviewReason("");
  };

  const submitReview = async () => {
    if (review.status === "rejected" && !reviewReason.trim()) {
      messageApi.warning("Please add a rejection reason.");
      return;
    }
    setSaving(true);
    try {
      if (review.kind === "mentor") {
        await reviewAdminMentorApplication(review.id, {
          status: review.status,
          reason: reviewReason,
        });
      } else {
        await reviewAdminCompany(review.id, {
          status: review.status,
          reason: reviewReason,
        });
      }
      messageApi.success(`${pretty(review.kind)} marked ${review.status}.`);
      setReview(null);
      await loadActiveTab();
    } catch (error) {
      messageApi.error(error.message || "Unable to save this review.");
    } finally {
      setSaving(false);
    }
  };

  const changeInternshipStatus = async (record, status) => {
    try {
      await updateAdminInternship(record.id, { status });
      messageApi.success(`${record.title} marked ${status}.`);
      await loadActiveTab();
    } catch (error) {
      messageApi.error(error.message || "Unable to update the internship.");
    }
  };

  const exportReport = async (report) => {
    setDownloading(report);
    try {
      await downloadAdminReport(report);
      messageApi.success(`${pretty(report)} report downloaded.`);
      if (activeTab === "audit") await loadActiveTab();
    } catch (error) {
      messageApi.error(error.message || "Unable to download this report.");
    } finally {
      setDownloading("");
    }
  };

  const pagination = (state, onPage) => ({
    current: state.page,
    pageSize: state.limit,
    total: state.total,
    showSizeChanger: false,
    showTotal: (total) => `${total} records`,
    onChange: onPage,
  });

  const userColumns = [
    {
      title: "User",
      key: "user",
      render: (_, record) => (
        <div className="admin-primary-cell">
          <strong>{record.fullName}</strong>
          <small>{record.email}</small>
        </div>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      render: (value) => <Tag>{pretty(value)}</Tag>,
    },
    {
      title: "Account",
      dataIndex: "isActive",
      render: (value) => <StatusTag value={value ? "active" : "suspended"} />,
    },
    {
      title: "Verified",
      dataIndex: "isVerified",
      render: (value) => (value ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>),
    },
    { title: "Last login", dataIndex: "lastLogin", render: dateTime },
    {
      title: "",
      key: "action",
      render: (_, record) => (
        <Button type="link" onClick={() => openUserEditor(record)}>
          Manage
        </Button>
      ),
    },
  ];

  const mentorColumns = [
    {
      title: "Applicant",
      key: "applicant",
      render: (_, record) => (
        <div className="admin-primary-cell">
          <strong>{record.name}</strong>
          <small>{record.email}</small>
        </div>
      ),
    },
    {
      title: "Experience",
      key: "experience",
      render: (_, record) => (
        <div className="admin-primary-cell">
          <strong>{record.professionalTitle}</strong>
          <small>
            {record.experienceYears} years · {record.company || "Independent"}
          </small>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (value) => <StatusTag value={value} />,
    },
    { title: "Applied", dataIndex: "createdAt", render: dateTime },
    {
      title: "Review",
      key: "review",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            type="primary"
            disabled={record.status === "approved"}
            onClick={() => openReview("mentor", record, "approved")}
          >
            Approve
          </Button>
          <Button
            size="small"
            danger
            disabled={record.status === "rejected"}
            onClick={() => openReview("mentor", record, "rejected")}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  const companyColumns = [
    {
      title: "Company",
      key: "company",
      render: (_, record) => (
        <div className="admin-primary-cell">
          <strong>{record.name}</strong>
          <small>
            {record.industry || "Industry not set"} ·{" "}
            {record.location || "Location not set"}
          </small>
        </div>
      ),
    },
    {
      title: "Owner",
      key: "owner",
      render: (_, record) => (
        <div className="admin-primary-cell">
          <strong>{record.ownerName}</strong>
          <small>{record.ownerEmail}</small>
        </div>
      ),
    },
    { title: "Postings", dataIndex: "internshipCount" },
    {
      title: "Status",
      dataIndex: "verificationStatus",
      render: (value) => <StatusTag value={value} />,
    },
    {
      title: "Review",
      key: "review",
      render: (_, record) => (
        <Space wrap>
          <Button
            size="small"
            type="primary"
            onClick={() => openReview("company", record, "verified")}
          >
            Verify
          </Button>
          <Button
            size="small"
            danger
            onClick={() => openReview("company", record, "rejected")}
          >
            Reject
          </Button>
          <Button
            size="small"
            onClick={() => openReview("company", record, "pending")}
          >
            Pending
          </Button>
        </Space>
      ),
    },
  ];

  const internshipColumns = [
    {
      title: "Internship",
      key: "internship",
      render: (_, record) => (
        <div className="admin-primary-cell">
          <strong>{record.title}</strong>
          <small>
            {record.company} · {record.location || "Remote/unspecified"}
          </small>
        </div>
      ),
    },
    { title: "Applications", dataIndex: "applicationCount" },
    {
      title: "Deadline",
      dataIndex: "applicationDeadline",
      render: (value) => (value ? new Date(value).toLocaleDateString() : "—"),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (value, record) => (
        <Select
          value={value}
          style={{ width: 112 }}
          options={internshipStatuses.map((status) => ({
            value: status,
            label: pretty(status),
          }))}
          onChange={(status) => changeInternshipStatus(record, status)}
        />
      ),
    },
  ];

  const auditColumns = [
    {
      title: "Administrator",
      key: "admin",
      render: (_, record) => (
        <div className="admin-primary-cell">
          <strong>{record.adminName}</strong>
          <small>{record.adminEmail}</small>
        </div>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (value) => <Tag color="blue">{pretty(value)}</Tag>,
    },
    {
      title: "Target",
      key: "target",
      render: (_, record) =>
        `${pretty(record.entityType || "system")} ${record.entityId || ""}`,
    },
    {
      title: "Details",
      dataIndex: "details",
      ellipsis: true,
      render: (value) => (value ? JSON.stringify(value) : "—"),
    },
    { title: "Time", dataIndex: "createdAt", render: dateTime },
  ];

  const overview = (
    <div className="admin-overview">
      <Row gutter={[16, 16]}>
        {[
          ["Users", dashboard?.summary?.users, <IoPeopleOutline key="users" />],
          [
            "Suspended users",
            dashboard?.summary?.suspendedUsers,
            <IoShieldCheckmarkOutline key="suspended" />,
          ],
          [
            "Pending mentors",
            dashboard?.summary?.pendingMentors,
            <IoRibbonOutline key="mentors" />,
          ],
          [
            "Pending companies",
            dashboard?.summary?.pendingCompanies,
            <IoBusinessOutline key="companies" />,
          ],
          [
            "Open internships",
            dashboard?.summary?.openInternships,
            <IoDocumentTextOutline key="internships" />,
          ],
          [
            "Applications",
            dashboard?.summary?.applications,
            <IoDocumentTextOutline key="applications" />,
          ],
        ].map(([title, value, icon]) => (
          <Col xs={24} sm={12} lg={8} key={title}>
            <Card>
              <Statistic title={title} value={value || 0} prefix={icon} />
            </Card>
          </Col>
        ))}
      </Row>
      <Card title="Recent administration activity">
        <Table
          rowKey="id"
          dataSource={dashboard?.recentActions || []}
          columns={auditColumns.filter((column) => column.key !== "admin")}
          pagination={false}
          scroll={{ x: 650 }}
        />
      </Card>
    </div>
  );

  const userManagement = (
    <Card>
      <div className="admin-toolbar">
        <Input.Search
          allowClear
          placeholder="Search name or email"
          defaultValue={userFilters.q}
          onSearch={(q) =>
            setUserFilters((current) => ({ ...current, q, page: 1 }))
          }
          style={{ maxWidth: 320 }}
        />
        <Select
          allowClear
          placeholder="All roles"
          value={userFilters.role || undefined}
          options={roles.map((role) => ({ value: role, label: pretty(role) }))}
          onChange={(role = "") =>
            setUserFilters((current) => ({ ...current, role, page: 1 }))
          }
          style={{ width: 150 }}
        />
        <Select
          allowClear
          placeholder="All accounts"
          value={userFilters.status || undefined}
          options={["active", "suspended"].map((status) => ({
            value: status,
            label: pretty(status),
          }))}
          onChange={(status = "") =>
            setUserFilters((current) => ({ ...current, status, page: 1 }))
          }
          style={{ width: 160 }}
        />
      </div>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={users.items}
        columns={userColumns}
        pagination={pagination(users.pagination, (page) =>
          setUserFilters((current) => ({ ...current, page })),
        )}
        scroll={{ x: 850 }}
      />
    </Card>
  );

  const mentorManagement = (
    <div className="admin-stack">
      <Row gutter={[14, 14]}>
        {mentorStatuses.map((status) => (
          <Col xs={24} sm={8} key={status}>
            <Card>
              <Statistic
                title={pretty(status)}
                value={mentors.stats?.[status] || 0}
              />
            </Card>
          </Col>
        ))}
      </Row>
      <Card>
        <div className="admin-toolbar">
          <Select
            allowClear
            placeholder="All application statuses"
            value={mentorFilters.status || undefined}
            options={mentorStatuses.map((status) => ({
              value: status,
              label: pretty(status),
            }))}
            onChange={(status = "") =>
              setMentorFilters({ status, page: 1, limit: 10 })
            }
            style={{ width: 220 }}
          />
        </div>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={mentors.items}
          columns={mentorColumns}
          expandable={{
            expandedRowRender: (record) => (
              <div className="admin-expanded">
                <p>
                  <strong>Expertise:</strong> {record.expertise}
                </p>
                <p>
                  <strong>Motivation:</strong> {record.motivation}
                </p>
                <p>
                  <strong>Availability:</strong>{" "}
                  {record.availability || "Not specified"}
                </p>
              </div>
            ),
          }}
          pagination={pagination(mentors.pagination, (page) =>
            setMentorFilters((current) => ({ ...current, page })),
          )}
          scroll={{ x: 900 }}
        />
      </Card>
    </div>
  );

  const companyManagement = (
    <Card>
      <div className="admin-toolbar">
        <Input.Search
          allowClear
          placeholder="Search companies or owners"
          defaultValue={companyFilters.q}
          onSearch={(q) =>
            setCompanyFilters((current) => ({ ...current, q, page: 1 }))
          }
          style={{ maxWidth: 320 }}
        />
        <Select
          allowClear
          placeholder="All verification states"
          value={companyFilters.status || undefined}
          options={companyStatuses.map((status) => ({
            value: status,
            label: pretty(status),
          }))}
          onChange={(status = "") =>
            setCompanyFilters((current) => ({ ...current, status, page: 1 }))
          }
          style={{ width: 210 }}
        />
      </div>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={companies.items}
        columns={companyColumns}
        pagination={pagination(companies.pagination, (page) =>
          setCompanyFilters((current) => ({ ...current, page })),
        )}
        scroll={{ x: 950 }}
      />
    </Card>
  );

  const internshipManagement = (
    <Card>
      <div className="admin-toolbar">
        <Input.Search
          allowClear
          placeholder="Search internships or companies"
          defaultValue={internshipFilters.q}
          onSearch={(q) =>
            setInternshipFilters((current) => ({ ...current, q, page: 1 }))
          }
          style={{ maxWidth: 320 }}
        />
        <Select
          allowClear
          placeholder="All posting statuses"
          value={internshipFilters.status || undefined}
          options={internshipStatuses.map((status) => ({
            value: status,
            label: pretty(status),
          }))}
          onChange={(status = "") =>
            setInternshipFilters((current) => ({ ...current, status, page: 1 }))
          }
          style={{ width: 190 }}
        />
      </div>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={internships.items}
        columns={internshipColumns}
        pagination={pagination(internships.pagination, (page) =>
          setInternshipFilters((current) => ({ ...current, page })),
        )}
        scroll={{ x: 760 }}
      />
    </Card>
  );

  const reports = (
    <div className="admin-report-grid">
      {[
        [
          "users",
          "User accounts",
          "Roles, verification, activity, and account state.",
        ],
        [
          "mentors",
          "Mentor applications",
          "Review outcomes and professional information.",
        ],
        [
          "internships",
          "Internship postings",
          "Posting details, deadlines, and current status.",
        ],
        [
          "applications",
          "Student applications",
          "Applicants, opportunities, and decisions.",
        ],
        [
          "companies",
          "Company profiles",
          "Owners and company verification results.",
        ],
        [
          "audit",
          "Administration audit",
          "A trace of protected administrative actions.",
        ],
      ].map(([key, title, description]) => (
        <Card key={key}>
          <IoCloudDownloadOutline className="admin-report-icon" />
          <Title level={4}>{title}</Title>
          <Text type="secondary">{description}</Text>
          <Button
            type="primary"
            block
            loading={downloading === key}
            onClick={() => exportReport(key)}
          >
            Download CSV
          </Button>
        </Card>
      ))}
    </div>
  );

  const auditLog = (
    <Card>
      <Alert
        type="info"
        showIcon
        message="Audit records"
        description="User management, approvals, status changes, and report exports are recorded here."
        className="admin-audit-alert"
      />
      <Table
        rowKey="id"
        loading={loading}
        dataSource={audit.items}
        columns={auditColumns}
        pagination={pagination(audit.pagination, setAuditPage)}
        scroll={{ x: 980 }}
      />
    </Card>
  );

  if (isLoading) {
    return (
      <main className="admin-access-state">Checking administrator access…</main>
    );
  }
  if (!user) {
    return (
      <main className="admin-access-state">
        <IoShieldCheckmarkOutline size={58} />
        <h1>Login to open administration</h1>
        <Link className="btn primary" to="/login">
          Login
        </Link>
      </main>
    );
  }
  if (user.role !== "admin") {
    return (
      <main className="admin-access-state">
        <IoShieldCheckmarkOutline size={58} />
        <h1>Administrator access required</h1>
        <p>This workspace can change user and platform records.</p>
        <Link className="btn outline" to="/dashboard">
          Back to dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="admin-page">
      {contextHolder}
      <section className="admin-hero">
        <div className="container admin-hero-inner">
          <div>
            <p className="eyebrow">Administration</p>
            <h1>Platform control center</h1>
            <p>
              Manage accounts, approvals, companies, internships, reports, and
              the administrative audit trail.
            </p>
          </div>
          <Link className="btn outline" to="/analytics">
            Open analytics
          </Link>
        </div>
      </section>
      <section className="section container admin-content">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: "overview", label: "Overview", children: overview },
            { key: "users", label: "Users", children: userManagement },
            { key: "mentors", label: "Mentors", children: mentorManagement },
            {
              key: "companies",
              label: "Companies",
              children: companyManagement,
            },
            {
              key: "internships",
              label: "Internships",
              children: internshipManagement,
            },
            { key: "reports", label: "Reports", children: reports },
            { key: "audit", label: "Audit log", children: auditLog },
          ]}
        />
      </section>

      <Modal
        title={`Manage ${editingUser?.fullName || "user"}`}
        open={Boolean(editingUser)}
        onCancel={() => setEditingUser(null)}
        onOk={saveUser}
        confirmLoading={saving}
        okText="Save account"
        destroyOnHidden
      >
        <Form form={userForm} layout="vertical">
          <Form.Item
            name="fullName"
            label="Full name"
            rules={[{ required: true, min: 2, max: 100 }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select
              options={roles.map((role) => ({
                value: role,
                label: pretty(role),
              }))}
            />
          </Form.Item>
          <div className="admin-switch-row">
            <Form.Item
              name="isVerified"
              label="Email verified"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              name="isActive"
              label="Account active"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </div>
          <Form.Item
            noStyle
            shouldUpdate={(previous, current) =>
              previous.isActive !== current.isActive
            }
          >
            {({ getFieldValue }) =>
              !getFieldValue("isActive") && (
                <Form.Item
                  name="suspensionReason"
                  label="Suspension reason"
                  rules={[
                    {
                      required: true,
                      message: "Explain why this account is suspended.",
                    },
                  ]}
                >
                  <Input.TextArea rows={3} maxLength={500} showCount />
                </Form.Item>
              )
            }
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${pretty(review?.status)} ${review?.kind || ""}`}
        open={Boolean(review)}
        onCancel={() => setReview(null)}
        onOk={submitReview}
        confirmLoading={saving}
        okButtonProps={{ danger: review?.status === "rejected" }}
        okText={pretty(review?.status || "Save")}
        destroyOnHidden
      >
        <p>
          Confirm <strong>{review?.status}</strong> for{" "}
          <strong>{review?.name}</strong>.
        </p>
        {review?.status === "rejected" && (
          <Input.TextArea
            value={reviewReason}
            onChange={(event) => setReviewReason(event.target.value)}
            placeholder="Required rejection reason"
            rows={4}
            maxLength={500}
            showCount
          />
        )}
      </Modal>
    </main>
  );
};

export default AdminPanel;
