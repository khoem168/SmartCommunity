import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Col,
  ConfigProvider,
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
import { useLanguage } from "../../context/LanguageContext";
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
import kmKH from "antd/es/locale/km_KH";
import enUS from "antd/es/locale/en_US";
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
  const { language } = useLanguage();
  const isKm = language === "km";
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
      title: isKm ? "អ្នកប្រើប្រាស់" : "User",
      key: "user",
      render: (_, record) => (
        <div className="admin-primary-cell">
          <strong>{record.fullName}</strong>
          <small>{record.email}</small>
        </div>
      ),
    },
    {
      title: isKm ? "តួនាទី" : "Role",
      dataIndex: "role",
      render: (value) => <Tag>{pretty(value)}</Tag>,
    },
    {
      title: isKm ? "គណនី" : "Account",
      dataIndex: "isActive",
      render: (value) => <StatusTag value={value ? "active" : "suspended"} />,
    },
    {
      title: isKm ? "ផ្ទៀងផ្ទាត់" : "Verified",
      dataIndex: "isVerified",
      render: (value) =>
        value ? (
          <Tag color="green">{isKm ? "បាទ/ចាស" : "Yes"}</Tag>
        ) : (
          <Tag>{isKm ? "ទេ" : "No"}</Tag>
        ),
    },
    { title: isKm ? "ចូលប្រើចុងក្រោយ" : "Last login", dataIndex: "lastLogin", render: dateTime },
    {
      title: "",
      key: "action",
      render: (_, record) => (
        <Button type="link" onClick={() => openUserEditor(record)}>
          {isKm ? "គ្រប់គ្រង" : "Manage"}
        </Button>
      ),
    },
  ];

  const mentorColumns = [
    {
      title: isKm ? "បេក្ខជន" : "Applicant",
      key: "applicant",
      render: (_, record) => (
        <div className="admin-primary-cell">
          <strong>{record.name}</strong>
          <small>{record.email}</small>
        </div>
      ),
    },
    {
      title: isKm ? "បទពិសោធន៍" : "Experience",
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
      title: isKm ? "ស្ថានភាព" : "Status",
      dataIndex: "status",
      render: (value) => <StatusTag value={value} />,
    },
    { title: isKm ? "ថ្ងៃដាក់ពាក្យ" : "Applied", dataIndex: "createdAt", render: dateTime },
    {
      title: isKm ? "ការពិនិត្យ" : "Review",
      key: "review",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            type="primary"
            disabled={record.status === "approved"}
            onClick={() => openReview("mentor", record, "approved")}
          >
            {isKm ? "អនុម័ត" : "Approve"}
          </Button>
          <Button
            size="small"
            danger
            disabled={record.status === "rejected"}
            onClick={() => openReview("mentor", record, "rejected")}
          >
            {isKm ? "បដិសេធ" : "Reject"}
          </Button>
        </Space>
      ),
    },
  ];

  const companyColumns = [
    {
      title: isKm ? "ក្រុមហ៊ុន" : "Company",
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
      title: isKm ? "ម្ចាស់គណនី" : "Owner",
      key: "owner",
      render: (_, record) => (
        <div className="admin-primary-cell">
          <strong>{record.ownerName}</strong>
          <small>{record.ownerEmail}</small>
        </div>
      ),
    },
    { title: isKm ? "ការងារប្រកាស" : "Postings", dataIndex: "internshipCount" },
    {
      title: isKm ? "ស្ថានភាព" : "Status",
      dataIndex: "verificationStatus",
      render: (value) => <StatusTag value={value} />,
    },
    {
      title: isKm ? "ការពិនិត្យ" : "Review",
      key: "review",
      render: (_, record) => (
        <Space wrap>
          <Button
            size="small"
            type="primary"
            onClick={() => openReview("company", record, "verified")}
          >
            {isKm ? "ផ្ទៀងផ្ទាត់" : "Verify"}
          </Button>
          <Button
            size="small"
            danger
            onClick={() => openReview("company", record, "rejected")}
          >
            {isKm ? "បដិសេធ" : "Reject"}
          </Button>
          <Button
            size="small"
            onClick={() => openReview("company", record, "pending")}
          >
            {isKm ? "រង់ចាំ" : "Pending"}
          </Button>
        </Space>
      ),
    },
  ];

  const internshipColumns = [
    {
      title: isKm ? "ឱកាសការងារ" : "Internship",
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
    { title: isKm ? "បេក្ខជន" : "Applications", dataIndex: "applicationCount" },
    {
      title: isKm ? "ផុតកំណត់" : "Deadline",
      dataIndex: "applicationDeadline",
      render: (value) => (value ? new Date(value).toLocaleDateString() : "—"),
    },
    {
      title: isKm ? "ស្ថានភាព" : "Status",
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
      title: isKm ? "អ្នកគ្រប់គ្រង" : "Administrator",
      key: "admin",
      render: (_, record) => (
        <div className="admin-primary-cell">
          <strong>{record.adminName}</strong>
          <small>{record.adminEmail}</small>
        </div>
      ),
    },
    {
      title: isKm ? "សកម្មភាព" : "Action",
      dataIndex: "action",
      render: (value) => {
        const key = String(value || "").toLowerCase();
        const label = isKm
          ? key.includes("mentor.approved")
            ? "អនុម័តអ្នកណែនាំ (Mentor)"
            : key.includes("mentor.rejected")
              ? "បដិសេធពាក្យអ្នកណែនាំ"
              : key.includes("company.verified")
                ? "ផ្ទៀងផ្ទាត់ក្រុមហ៊ុន"
                : key.includes("user")
                  ? "កែប្រែគណនីអ្នកប្រើប្រាស់"
                  : pretty(value)
          : pretty(value);
        return <Tag color="blue">{label}</Tag>;
      },
    },
    {
      title: isKm ? "គោលដៅ" : "Target",
      key: "target",
      render: (_, record) => {
        const entity = String(record.entityType || "system").toLowerCase();
        if (isKm && entity.includes("mentor_application")) {
          return `ពាក្យសុំអ្នកណែនាំ #${record.entityId || ""}`;
        }
        if (isKm && entity.includes("company")) {
          return `ក្រុមហ៊ុន #${record.entityId || ""}`;
        }
        if (isKm && entity.includes("user")) {
          return `អ្នកប្រើប្រាស់ #${record.entityId || ""}`;
        }
        return `${pretty(record.entityType || "system")} ${record.entityId || ""}`;
      },
    },
    {
      title: isKm ? "ព័ត៌មានលម្អិត" : "Details",
      dataIndex: "details",
      ellipsis: true,
      render: (value) => {
        if (!value) return "—";
        const obj =
          typeof value === "object"
            ? value
            : (() => {
                try {
                  return JSON.parse(value);
                } catch {
                  return null;
                }
              })();
        if (obj && typeof obj === "object") {
          const parts = [];
          if (obj.userId) {
            parts.push(isKm ? `គណនី #${obj.userId}` : `User #${obj.userId}`);
          }
          if (obj.status) {
            parts.push(isKm ? `ស្ថានភាព៖ ${pretty(obj.status)}` : `Status: ${pretty(obj.status)}`);
          }
          if (obj.reason) {
            parts.push(isKm ? `មូលហេតុ៖ ${obj.reason}` : `Reason: ${obj.reason}`);
          } else if (parts.length > 0) {
            parts.push(isKm ? "បានអនុម័តដោយជោគជ័យ" : "Completed");
          }
          if (parts.length > 0) return parts.join(" • ");
        }
        return typeof value === "string" ? value : JSON.stringify(value);
      },
    },
    { title: isKm ? "ពេលវេលា" : "Time", dataIndex: "createdAt", render: dateTime },
  ];

  const overview = (
    <div className="admin-overview">
      <Row gutter={[16, 16]}>
        {[
          [
            isKm ? "អ្នកប្រើប្រាស់សរុប" : "Users",
            dashboard?.summary?.users,
            <IoPeopleOutline key="users" />,
          ],
          [
            isKm ? "គណនីផ្អាកបណ្ដោះអាសន្ន" : "Suspended users",
            dashboard?.summary?.suspendedUsers,
            <IoShieldCheckmarkOutline key="suspended" />,
          ],
          [
            isKm ? "ពាក្យសុំអ្នកណែនាំរង់ចាំពិនិត្យ" : "Pending mentors",
            dashboard?.summary?.pendingMentors,
            <IoRibbonOutline key="mentors" />,
          ],
          [
            isKm ? "ក្រុមហ៊ុនរង់ចាំផ្ទៀងផ្ទាត់" : "Pending companies",
            dashboard?.summary?.pendingCompanies,
            <IoBusinessOutline key="companies" />,
          ],
          [
            isKm ? "ឱកាសការងារកំពុងបើក" : "Open internships",
            dashboard?.summary?.openInternships,
            <IoDocumentTextOutline key="internships" />,
          ],
          [
            isKm ? "ពាក្យស្នើសុំការងារសរុប" : "Applications",
            dashboard?.summary?.applications,
            <IoDocumentTextOutline key="applications" />,
          ],
        ].map(([title, value, icon]) => (
          <Col xs={12} sm={12} lg={8} key={title}>
            <Card className="admin-stat-card">
              <Statistic title={title} value={value || 0} prefix={icon} />
            </Card>
          </Col>
        ))}
      </Row>
      <Card
        title={
          isKm
            ? "សកម្មភាពគ្រប់គ្រងប្រព័ន្ធថ្មីៗ"
            : "Recent administration activity"
        }
      >
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
    // Ant Design's built-in text ("No data", pagination, confirm buttons)
    // follows the site language instead of always showing English.
    <ConfigProvider locale={isKm ? kmKH : enUS}>
    <main className="admin-page">
      {contextHolder}
      <section className="admin-hero">
        <div className="container admin-hero-inner">
          <div>
            <p className="eyebrow">
              {isKm ? "ផ្នែកគ្រប់គ្រងប្រព័ន្ធ" : "Administration"}
            </p>
            <h1>
              {isKm ? "មជ្ឈមណ្ឌលគ្រប់គ្រងប្រព័ន្ធ" : "Platform control center"}
            </h1>
            <p>
              {isKm
                ? "គ្រប់គ្រងគណនីអ្នកប្រើប្រាស់ ការអនុម័តអ្នកណែនាំ ក្រុមហ៊ុន ឱកាសការងារ របាយការណ៍ និងកំណត់ត្រាសវនកម្ម។"
                : "Manage accounts, approvals, companies, internships, reports, and the administrative audit trail."}
            </p>
          </div>
          <Link className="btn outline" to="/analytics">
            {isKm ? "បើកមើលទិន្នន័យវិភាគ" : "Open analytics"}
          </Link>
        </div>
      </section>
      <section className="section container admin-content">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "overview",
              label: isKm ? "ទិដ្ឋភាពទូទៅ" : "Overview",
              children: overview,
            },
            {
              key: "users",
              label: isKm ? "អ្នកប្រើប្រាស់" : "Users",
              children: userManagement,
            },
            {
              key: "mentors",
              label: isKm ? "អ្នកណែនាំ" : "Mentors",
              children: mentorManagement,
            },
            {
              key: "companies",
              label: isKm ? "ក្រុមហ៊ុន" : "Companies",
              children: companyManagement,
            },
            {
              key: "internships",
              label: isKm ? "ឱកាសការងារ" : "Internships",
              children: internshipManagement,
            },
            {
              key: "reports",
              label: isKm ? "របាយការណ៍" : "Reports",
              children: reports,
            },
            {
              key: "audit",
              label: isKm ? "កំណត់ត្រាសវនកម្ម" : "Audit log",
              children: auditLog,
            },
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
    </ConfigProvider>
  );
};

export default AdminPanel;
