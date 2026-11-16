const db = require("../config/db");

const hasColumn = async (table, column) => {
  const [rows] = await db.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
  return rows.length > 0;
};

const addColumn = async (table, column, definition) => {
  if (!(await hasColumn(table, column))) {
    await db.query(`ALTER TABLE \`${table}\` ADD COLUMN ${definition}`);
  }
};

const run = async () => {
  await db.query(`
    ALTER TABLE users
    MODIFY role enum('user','student','mentor','recruiter','admin') DEFAULT 'student'
  `);

  await addColumn(
    "users",
    "auth_provider",
    "auth_provider enum('local','google') NOT NULL DEFAULT 'local' AFTER is_active",
  );
  await addColumn(
    "users",
    "google_id",
    "google_id varchar(255) DEFAULT NULL AFTER auth_provider",
  );
  await addColumn(
    "users",
    "email_verified_at",
    "email_verified_at datetime DEFAULT NULL AFTER google_id",
  );
  await addColumn(
    "users",
    "github_url",
    "github_url varchar(500) DEFAULT NULL AFTER location",
  );
  await addColumn(
    "users",
    "linkedin_url",
    "linkedin_url varchar(500) DEFAULT NULL AFTER github_url",
  );
  await addColumn(
    "users",
    "career_goal",
    "career_goal text DEFAULT NULL AFTER linkedin_url",
  );
  await addColumn(
    "users",
    "interested_skills",
    "interested_skills text DEFAULT NULL AFTER career_goal",
  );
  await addColumn(
    "users",
    "suspension_reason",
    "suspension_reason varchar(500) DEFAULT NULL AFTER interested_skills",
  );
  await addColumn(
    "users",
    "suspended_at",
    "suspended_at datetime DEFAULT NULL AFTER suspension_reason",
  );
  await addColumn(
    "users",
    "suspended_by",
    "suspended_by int(11) DEFAULT NULL AFTER suspended_at",
  );

  const [googleIndexes] = await db.query(`
    SHOW INDEX FROM users WHERE Key_name = 'uq_users_google_id'
  `);
  if (!googleIndexes.length) {
    await db.query("ALTER TABLE users ADD UNIQUE INDEX uq_users_google_id (google_id)");
  }

  await db.query(`
    UPDATE users
    SET email_verified_at = COALESCE(email_verified_at, created_at)
    WHERE is_verified = 1
  `);

  await addColumn(
    "conversations",
    "type",
    "type enum('direct','group') NOT NULL DEFAULT 'direct' AFTER id",
  );
  await addColumn(
    "conversations",
    "name",
    "name varchar(160) DEFAULT NULL AFTER participant2_id",
  );
  await addColumn(
    "conversations",
    "description",
    "description varchar(500) DEFAULT NULL AFTER name",
  );
  await addColumn(
    "conversations",
    "created_by",
    "created_by int(11) DEFAULT NULL AFTER description",
  );
  await addColumn(
    "conversations",
    "category",
    "category varchar(50) DEFAULT 'general' AFTER created_by",
  );
  await addColumn(
    "conversations",
    "context_id",
    "context_id int(11) DEFAULT NULL AFTER category",
  );
  await addColumn(
    "conversations",
    "context_data",
    "context_data text DEFAULT NULL AFTER context_id",
  );
  await db.query(`
    ALTER TABLE conversations
    MODIFY participant1_id int(11) DEFAULT NULL,
    MODIFY participant2_id int(11) DEFAULT NULL
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS conversation_members (
      id int(11) NOT NULL AUTO_INCREMENT,
      conversation_id int(11) NOT NULL,
      user_id int(11) NOT NULL,
      role enum('owner','admin','member') NOT NULL DEFAULT 'member',
      last_read_at datetime DEFAULT NULL,
      joined_at timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (id),
      UNIQUE KEY uq_conversation_member (conversation_id, user_id),
      KEY idx_conversation_members_user (user_id, conversation_id),
      CONSTRAINT fk_conversation_members_conversation FOREIGN KEY (conversation_id)
        REFERENCES conversations (id) ON DELETE CASCADE,
      CONSTRAINT fk_conversation_members_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await db.query(`
    INSERT IGNORE INTO conversation_members (conversation_id, user_id, role)
    SELECT id, participant1_id, 'member'
    FROM conversations
    WHERE participant1_id IS NOT NULL
  `);
  await db.query(`
    INSERT IGNORE INTO conversation_members (conversation_id, user_id, role)
    SELECT id, participant2_id, 'member'
    FROM conversations
    WHERE participant2_id IS NOT NULL
  `);
  await db.query(`
    UPDATE conversation_members cm
    SET cm.last_read_at = (
      SELECT MAX(m.created_at)
      FROM messages m
      WHERE m.conversation_id = cm.conversation_id
        AND m.receiver_id = cm.user_id
        AND m.is_read = 1
    )
    WHERE cm.last_read_at IS NULL
      AND EXISTS (
        SELECT 1
        FROM messages m
        WHERE m.conversation_id = cm.conversation_id
          AND m.receiver_id = cm.user_id
          AND m.is_read = 1
      )
  `);

  await db.query(`
    ALTER TABLE messages
    MODIFY receiver_id int(11) DEFAULT NULL
  `);
  await addColumn(
    "messages",
    "message_type",
    "message_type enum('text','image','document') NOT NULL DEFAULT 'text' AFTER message",
  );
  await addColumn(
    "messages",
    "attachment_name",
    "attachment_name varchar(255) DEFAULT NULL AFTER attachment_url",
  );
  await addColumn(
    "messages",
    "attachment_mime",
    "attachment_mime varchar(120) DEFAULT NULL AFTER attachment_name",
  );
  await addColumn(
    "messages",
    "attachment_size",
    "attachment_size int unsigned DEFAULT NULL AFTER attachment_mime",
  );

  await addColumn(
    "learning_sessions",
    "category",
    "category varchar(100) DEFAULT 'General' AFTER description",
  );
  await addColumn(
    "learning_sessions",
    "level",
    "level enum('beginner','intermediate','advanced','all') NOT NULL DEFAULT 'all' AFTER category",
  );
  await addColumn(
    "learning_sessions",
    "registration_deadline",
    "registration_deadline datetime DEFAULT NULL AFTER scheduled_time",
  );
  await addColumn(
    "learning_sessions",
    "meeting_provider",
    "meeting_provider enum('jitsi','google_meet','zoom') NOT NULL DEFAULT 'jitsi' AFTER max_participants",
  );
  await addColumn(
    "learning_sessions",
    "visibility",
    "visibility enum('public','private') NOT NULL DEFAULT 'public' AFTER meeting_provider",
  );
  await addColumn(
    "learning_sessions",
    "cancel_reason",
    "cancel_reason varchar(500) DEFAULT NULL AFTER status",
  );

  await addColumn(
    "session_participants",
    "attendance_status",
    "attendance_status enum('registered','attended','absent','cancelled') NOT NULL DEFAULT 'registered' AFTER joined_at",
  );
  await addColumn(
    "session_participants",
    "actual_joined_at",
    "actual_joined_at datetime DEFAULT NULL AFTER attendance_status",
  );
  await addColumn(
    "session_participants",
    "left_at",
    "left_at datetime DEFAULT NULL AFTER actual_joined_at",
  );
  await addColumn(
    "session_participants",
    "attendance_minutes",
    "attendance_minutes int unsigned NOT NULL DEFAULT 0 AFTER left_at",
  );

  await addColumn(
    "notifications",
    "metadata",
    "metadata longtext DEFAULT NULL AFTER link",
  );
  await addColumn(
    "notifications",
    "push_status",
    "push_status enum('not_configured','pending','sent','failed') NOT NULL DEFAULT 'not_configured' AFTER metadata",
  );
  await addColumn(
    "notifications",
    "read_at",
    "read_at datetime DEFAULT NULL AFTER is_read",
  );
  await db.query(`
    UPDATE notifications
    SET read_at = COALESCE(read_at, created_at)
    WHERE is_read = 1
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      user_id int(11) NOT NULL,
      mentorship_enabled tinyint(1) NOT NULL DEFAULT 1,
      session_enabled tinyint(1) NOT NULL DEFAULT 1,
      internship_enabled tinyint(1) NOT NULL DEFAULT 1,
      message_enabled tinyint(1) NOT NULL DEFAULT 1,
      skill_exchange_enabled tinyint(1) NOT NULL DEFAULT 1,
      forum_enabled tinyint(1) NOT NULL DEFAULT 1,
      system_enabled tinyint(1) NOT NULL DEFAULT 1,
      push_enabled tinyint(1) NOT NULL DEFAULT 0,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (user_id),
      CONSTRAINT fk_notification_preferences_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS notification_push_tokens (
      id bigint unsigned NOT NULL AUTO_INCREMENT,
      user_id int(11) NOT NULL,
      token varchar(512) NOT NULL,
      provider enum('firebase') NOT NULL DEFAULT 'firebase',
      platform varchar(40) NOT NULL DEFAULT 'web',
      is_active tinyint(1) NOT NULL DEFAULT 1,
      last_used_at datetime DEFAULT NULL,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (id),
      UNIQUE KEY uq_notification_push_token (token),
      KEY idx_notification_push_tokens_user (user_id, is_active),
      CONSTRAINT fk_notification_push_tokens_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS user_auth_tokens (
      id bigint unsigned NOT NULL AUTO_INCREMENT,
      user_id int(11) NOT NULL,
      type enum('email_verification','password_reset') NOT NULL,
      token_hash char(64) NOT NULL,
      expires_at datetime NOT NULL,
      used_at datetime DEFAULT NULL,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (id),
      UNIQUE KEY uq_user_auth_token_hash (token_hash),
      KEY idx_user_auth_tokens_lookup (user_id, type, expires_at),
      CONSTRAINT fk_user_auth_tokens_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS profile_education (
      id int(11) NOT NULL AUTO_INCREMENT,
      user_id int(11) NOT NULL,
      institution varchar(200) NOT NULL,
      degree varchar(150) DEFAULT NULL,
      field_of_study varchar(150) DEFAULT NULL,
      start_date date DEFAULT NULL,
      end_date date DEFAULT NULL,
      description text DEFAULT NULL,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (id),
      KEY idx_profile_education_user (user_id),
      CONSTRAINT fk_profile_education_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS profile_experiences (
      id int(11) NOT NULL AUTO_INCREMENT,
      user_id int(11) NOT NULL,
      company varchar(200) NOT NULL,
      title varchar(150) NOT NULL,
      employment_type varchar(80) DEFAULT NULL,
      start_date date DEFAULT NULL,
      end_date date DEFAULT NULL,
      is_current tinyint(1) NOT NULL DEFAULT 0,
      description text DEFAULT NULL,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (id),
      KEY idx_profile_experiences_user (user_id),
      CONSTRAINT fk_profile_experiences_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS profile_certificates (
      id int(11) NOT NULL AUTO_INCREMENT,
      user_id int(11) NOT NULL,
      name varchar(200) NOT NULL,
      issuer varchar(200) DEFAULT NULL,
      issue_date date DEFAULT NULL,
      credential_url varchar(500) DEFAULT NULL,
      certificate_url varchar(500) DEFAULT NULL,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (id),
      KEY idx_profile_certificates_user (user_id),
      CONSTRAINT fk_profile_certificates_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS portfolio_projects (
      id int(11) NOT NULL AUTO_INCREMENT,
      user_id int(11) NOT NULL,
      title varchar(200) NOT NULL,
      description text DEFAULT NULL,
      project_url varchar(500) DEFAULT NULL,
      github_url varchar(500) DEFAULT NULL,
      image_url varchar(500) DEFAULT NULL,
      technologies text DEFAULT NULL,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (id),
      KEY idx_portfolio_projects_user (user_id),
      CONSTRAINT fk_portfolio_projects_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await db.query(`
    ALTER TABLE skill_exchanges
    MODIFY scheduled_date DATETIME DEFAULT NULL
  `);

  if (!(await hasColumn("skill_exchanges", "rejection_reason"))) {
    await db.query(`
      ALTER TABLE skill_exchanges
      ADD COLUMN rejection_reason TEXT DEFAULT NULL AFTER message
    `);
  }

  await addColumn(
    "skill_exchanges",
    "progress_percent",
    "progress_percent tinyint unsigned NOT NULL DEFAULT 0 AFTER scheduled_date",
  );
  await addColumn(
    "skill_exchanges",
    "requester_completed_at",
    "requester_completed_at datetime DEFAULT NULL AFTER progress_percent",
  );
  await addColumn(
    "skill_exchanges",
    "provider_completed_at",
    "provider_completed_at datetime DEFAULT NULL AFTER requester_completed_at",
  );
  await addColumn(
    "skill_exchanges",
    "completed_at",
    "completed_at datetime DEFAULT NULL AFTER provider_completed_at",
  );

  await db.query(`
    CREATE TABLE IF NOT EXISTS skill_exchange_updates (
      id int(11) NOT NULL AUTO_INCREMENT,
      exchange_id int(11) NOT NULL,
      user_id int(11) NOT NULL,
      progress_percent tinyint unsigned NOT NULL,
      note varchar(500) DEFAULT NULL,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (id),
      KEY idx_skill_exchange_updates_exchange (exchange_id, created_at),
      KEY idx_skill_exchange_updates_user (user_id),
      CONSTRAINT fk_skill_exchange_updates_exchange FOREIGN KEY (exchange_id)
        REFERENCES skill_exchanges (id) ON DELETE CASCADE,
      CONSTRAINT fk_skill_exchange_updates_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await addColumn(
    "mentorships",
    "requested_time",
    "requested_time datetime DEFAULT NULL AFTER description",
  );
  await addColumn(
    "mentorships",
    "duration_minutes",
    "duration_minutes smallint unsigned NOT NULL DEFAULT 60 AFTER requested_time",
  );
  await addColumn(
    "mentorships",
    "rejection_reason",
    "rejection_reason varchar(500) DEFAULT NULL AFTER meeting_frequency",
  );
  await addColumn(
    "mentorships",
    "completed_at",
    "completed_at datetime DEFAULT NULL AFTER rejection_reason",
  );

  await db.query(`
    CREATE TABLE IF NOT EXISTS mentor_applications (
      id int(11) NOT NULL AUTO_INCREMENT,
      user_id int(11) NOT NULL,
      professional_title varchar(150) NOT NULL,
      company varchar(150) DEFAULT NULL,
      expertise text NOT NULL,
      experience_years smallint unsigned NOT NULL DEFAULT 0,
      motivation text NOT NULL,
      linkedin_url varchar(500) DEFAULT NULL,
      availability varchar(150) DEFAULT NULL,
      status enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
      rejection_reason varchar(500) DEFAULT NULL,
      reviewed_by int(11) DEFAULT NULL,
      reviewed_at datetime DEFAULT NULL,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (id),
      UNIQUE KEY uq_mentor_applications_user (user_id),
      KEY idx_mentor_applications_status (status, created_at),
      KEY idx_mentor_applications_reviewer (reviewed_by),
      CONSTRAINT fk_mentor_applications_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
      CONSTRAINT fk_mentor_applications_reviewer FOREIGN KEY (reviewed_by)
        REFERENCES users (id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await db.query(`
    INSERT IGNORE INTO mentor_applications
      (user_id, professional_title, company, expertise, experience_years,
       motivation, availability, status, reviewed_at)
    SELECT id, COALESCE(profession, 'Community Mentor'), company,
           COALESCE(skills, '[]'), GREATEST(COALESCE(experience_years, 0), 0),
           COALESCE(bio, 'Existing verified mentor'), 'Flexible schedule',
           'approved', NOW()
    FROM users WHERE role = 'mentor'
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS mentor_reviews (
      id int(11) NOT NULL AUTO_INCREMENT,
      mentorship_id int(11) NOT NULL,
      mentor_id int(11) NOT NULL,
      student_id int(11) NOT NULL,
      rating tinyint unsigned NOT NULL,
      review varchar(1000) NOT NULL,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (id),
      UNIQUE KEY uq_mentor_reviews_mentorship (mentorship_id),
      KEY idx_mentor_reviews_mentor (mentor_id, created_at),
      KEY idx_mentor_reviews_student (student_id),
      CONSTRAINT fk_mentor_reviews_mentorship FOREIGN KEY (mentorship_id)
        REFERENCES mentorships (id) ON DELETE CASCADE,
      CONSTRAINT fk_mentor_reviews_mentor FOREIGN KEY (mentor_id)
        REFERENCES users (id) ON DELETE CASCADE,
      CONSTRAINT fk_mentor_reviews_student FOREIGN KEY (student_id)
        REFERENCES users (id) ON DELETE CASCADE,
      CONSTRAINT chk_mentor_reviews_rating CHECK (rating BETWEEN 1 AND 5)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS company_profiles (
      id int(11) NOT NULL AUTO_INCREMENT,
      owner_id int(11) NOT NULL,
      name varchar(150) NOT NULL,
      description text DEFAULT NULL,
      industry varchar(120) DEFAULT NULL,
      website varchar(500) DEFAULT NULL,
      contact_email varchar(255) DEFAULT NULL,
      phone varchar(50) DEFAULT NULL,
      location varchar(200) DEFAULT NULL,
      company_size varchar(80) DEFAULT NULL,
      logo_url varchar(500) DEFAULT NULL,
      is_verified tinyint(1) NOT NULL DEFAULT 0,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (id),
      UNIQUE KEY uq_company_profiles_owner (owner_id),
      KEY idx_company_profiles_name (name),
      CONSTRAINT fk_company_profiles_owner FOREIGN KEY (owner_id)
        REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
  await addColumn(
    "company_profiles",
    "verification_status",
    "verification_status enum('pending','verified','rejected') NOT NULL DEFAULT 'pending' AFTER is_verified",
  );
  await addColumn(
    "company_profiles",
    "rejection_reason",
    "rejection_reason varchar(500) DEFAULT NULL AFTER verification_status",
  );
  await addColumn(
    "company_profiles",
    "reviewed_by",
    "reviewed_by int(11) DEFAULT NULL AFTER rejection_reason",
  );
  await addColumn(
    "company_profiles",
    "reviewed_at",
    "reviewed_at datetime DEFAULT NULL AFTER reviewed_by",
  );
  await db.query(`
    UPDATE company_profiles
    SET verification_status = 'verified'
    WHERE is_verified = 1 AND verification_status = 'pending'
  `);

  await addColumn(
    "user_activity_logs",
    "details",
    "details longtext DEFAULT NULL AFTER user_agent",
  );

  await addColumn(
    "internships",
    "company_profile_id",
    "company_profile_id int(11) DEFAULT NULL AFTER id",
  );
  await addColumn(
    "internships",
    "category",
    "category varchar(100) DEFAULT NULL AFTER title",
  );
  await addColumn(
    "internships",
    "contact_email",
    "contact_email varchar(255) DEFAULT NULL AFTER company_logo",
  );
  await addColumn(
    "internship_applications",
    "resume_original_name",
    "resume_original_name varchar(255) DEFAULT NULL AFTER resume_url",
  );
  await addColumn(
    "internship_applications",
    "status_updated_by",
    "status_updated_by int(11) DEFAULT NULL AFTER admin_notes",
  );
  await addColumn(
    "internship_applications",
    "status_updated_at",
    "status_updated_at datetime DEFAULT NULL AFTER status_updated_by",
  );
  // Interview scheduling is read by the calendar, inbox and recruiter views.
  await addColumn(
    "internship_applications",
    "interview_scheduled_at",
    "interview_scheduled_at datetime DEFAULT NULL AFTER status_updated_at",
  );
  await addColumn(
    "internship_applications",
    "interview_meeting_link",
    "interview_meeting_link varchar(500) DEFAULT NULL AFTER interview_scheduled_at",
  );
  await addColumn(
    "internship_applications",
    "interview_note",
    "interview_note text DEFAULT NULL AFTER interview_meeting_link",
  );

  await db.query(`
    ALTER TABLE internship_applications
    MODIFY status enum('pending','reviewed','shortlisted','approved','accepted','rejected')
      DEFAULT 'pending'
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS career_paths (
      id int(11) NOT NULL AUTO_INCREMENT,
      slug varchar(100) NOT NULL,
      title varchar(150) NOT NULL,
      description text NOT NULL,
      target_role varchar(150) NOT NULL,
      level enum('beginner','intermediate','advanced') NOT NULL DEFAULT 'beginner',
      duration_weeks smallint unsigned NOT NULL DEFAULT 24,
      skills text NOT NULL,
      is_active tinyint(1) NOT NULL DEFAULT 1,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (id),
      UNIQUE KEY uq_career_paths_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS career_path_steps (
      id int(11) NOT NULL AUTO_INCREMENT,
      path_id int(11) NOT NULL,
      position smallint unsigned NOT NULL,
      title varchar(180) NOT NULL,
      description text DEFAULT NULL,
      skill varchar(120) DEFAULT NULL,
      estimated_hours smallint unsigned NOT NULL DEFAULT 10,
      resources text DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uq_career_path_steps_position (path_id, position),
      CONSTRAINT fk_career_path_steps_path FOREIGN KEY (path_id)
        REFERENCES career_paths (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS user_career_roadmaps (
      id int(11) NOT NULL AUTO_INCREMENT,
      user_id int(11) NOT NULL,
      path_id int(11) NOT NULL,
      is_current tinyint(1) NOT NULL DEFAULT 1,
      started_at timestamp NOT NULL DEFAULT current_timestamp(),
      completed_at datetime DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uq_user_career_roadmaps_path (user_id, path_id),
      KEY idx_user_career_roadmaps_current (user_id, is_current),
      CONSTRAINT fk_user_career_roadmaps_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
      CONSTRAINT fk_user_career_roadmaps_path FOREIGN KEY (path_id)
        REFERENCES career_paths (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS user_roadmap_steps (
      id int(11) NOT NULL AUTO_INCREMENT,
      roadmap_id int(11) NOT NULL,
      step_id int(11) NOT NULL,
      completed_at timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (id),
      UNIQUE KEY uq_user_roadmap_steps (roadmap_id, step_id),
      CONSTRAINT fk_user_roadmap_steps_roadmap FOREIGN KEY (roadmap_id)
        REFERENCES user_career_roadmaps (id) ON DELETE CASCADE,
      CONSTRAINT fk_user_roadmap_steps_step FOREIGN KEY (step_id)
        REFERENCES career_path_steps (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS career_articles (
      id int(11) NOT NULL AUTO_INCREMENT,
      slug varchar(120) NOT NULL,
      title varchar(200) NOT NULL,
      excerpt varchar(500) NOT NULL,
      content text NOT NULL,
      category varchar(100) NOT NULL,
      reading_minutes smallint unsigned NOT NULL DEFAULT 5,
      is_published tinyint(1) NOT NULL DEFAULT 1,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (id),
      UNIQUE KEY uq_career_articles_slug (slug),
      KEY idx_career_articles_category (category, is_published)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS career_assessments (
      id int(11) NOT NULL AUTO_INCREMENT,
      slug varchar(100) NOT NULL,
      title varchar(180) NOT NULL,
      description text NOT NULL,
      is_active tinyint(1) NOT NULL DEFAULT 1,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (id),
      UNIQUE KEY uq_career_assessments_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS career_assessment_questions (
      id int(11) NOT NULL AUTO_INCREMENT,
      assessment_id int(11) NOT NULL,
      position smallint unsigned NOT NULL,
      competency varchar(100) NOT NULL,
      question varchar(500) NOT NULL,
      options text NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uq_career_assessment_questions_position (assessment_id, position),
      CONSTRAINT fk_career_assessment_questions_assessment FOREIGN KEY (assessment_id)
        REFERENCES career_assessments (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS career_assessment_attempts (
      id int(11) NOT NULL AUTO_INCREMENT,
      user_id int(11) NOT NULL,
      assessment_id int(11) NOT NULL,
      score_percent tinyint unsigned NOT NULL,
      answers text NOT NULL,
      competency_scores text NOT NULL,
      recommendations text NOT NULL,
      completed_at timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (id),
      KEY idx_career_assessment_attempts_user (user_id, completed_at),
      CONSTRAINT fk_career_assessment_attempts_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
      CONSTRAINT fk_career_assessment_attempts_assessment FOREIGN KEY (assessment_id)
        REFERENCES career_assessments (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await db.query(`
    INSERT IGNORE INTO career_paths
      (slug, title, description, target_role, level, duration_weeks, skills)
    VALUES
      ('frontend-developer', 'Frontend Developer',
       'Build accessible, responsive web interfaces and production React applications.',
       'Frontend Developer', 'beginner', 24,
       '["HTML","CSS","JavaScript","React","Testing","Portfolio"]'),
      ('backend-developer', 'Backend Developer',
       'Design APIs, databases, authentication, testing, and deployable server applications.',
       'Backend Developer', 'beginner', 26,
       '["JavaScript","Node.js","Express","SQL","Security","Deployment"]'),
      ('data-analyst', 'Data Analyst',
       'Turn raw data into clear business insights through analysis and visualization.',
       'Data Analyst', 'beginner', 22,
       '["Spreadsheets","SQL","Python","Statistics","Visualization","Portfolio"]')
  `);

  await db.query(`
    INSERT IGNORE INTO career_path_steps
      (path_id, position, title, description, skill, estimated_hours, resources)
    SELECT id, 1, 'Build semantic pages', 'Learn document structure, forms, and accessibility.', 'HTML', 18, '["MDN HTML guide","Build a personal page"]' FROM career_paths WHERE slug = 'frontend-developer'
    UNION ALL SELECT id, 2, 'Create responsive layouts', 'Practice CSS layouts, responsive design, and reusable styling.', 'CSS', 28, '["Flexbox","Grid","Responsive project"]' FROM career_paths WHERE slug = 'frontend-developer'
    UNION ALL SELECT id, 3, 'Master programming foundations', 'Use modern JavaScript, asynchronous code, and browser APIs.', 'JavaScript', 48, '["ES modules","DOM project","Async APIs"]' FROM career_paths WHERE slug = 'frontend-developer'
    UNION ALL SELECT id, 4, 'Build React applications', 'Create components, routing, forms, state, and API integrations.', 'React', 55, '["React documentation","Dashboard project"]' FROM career_paths WHERE slug = 'frontend-developer'
    UNION ALL SELECT id, 5, 'Test and publish a portfolio', 'Add automated tests, performance checks, and deploy real projects.', 'Portfolio', 36, '["Component tests","Deployment","Case study"]' FROM career_paths WHERE slug = 'frontend-developer'
    UNION ALL SELECT id, 1, 'Strengthen JavaScript', 'Practice data structures, asynchronous flows, and clean modules.', 'JavaScript', 35, '["JavaScript exercises","CLI project"]' FROM career_paths WHERE slug = 'backend-developer'
    UNION ALL SELECT id, 2, 'Create Node.js services', 'Learn the runtime, package management, logging, and configuration.', 'Node.js', 32, '["Node.js documentation","Service project"]' FROM career_paths WHERE slug = 'backend-developer'
    UNION ALL SELECT id, 3, 'Design Express APIs', 'Build REST endpoints, validation, errors, and authentication.', 'Express', 44, '["REST API","JWT authentication"]' FROM career_paths WHERE slug = 'backend-developer'
    UNION ALL SELECT id, 4, 'Model relational data', 'Design schemas, joins, indexes, transactions, and migrations.', 'SQL', 42, '["SQL practice","Database project"]' FROM career_paths WHERE slug = 'backend-developer'
    UNION ALL SELECT id, 5, 'Secure, test, and deploy', 'Add integration tests, security controls, containers, and monitoring.', 'Deployment', 46, '["API tests","Docker","Production checklist"]' FROM career_paths WHERE slug = 'backend-developer'
    UNION ALL SELECT id, 1, 'Analyze with spreadsheets', 'Clean tabular data and communicate core metrics.', 'Spreadsheets', 20, '["Pivot tables","Business report"]' FROM career_paths WHERE slug = 'data-analyst'
    UNION ALL SELECT id, 2, 'Query data with SQL', 'Filter, aggregate, join, and validate relational datasets.', 'SQL', 40, '["SQL exercises","Analysis queries"]' FROM career_paths WHERE slug = 'data-analyst'
    UNION ALL SELECT id, 3, 'Use Python for analysis', 'Work with notebooks, pandas, and repeatable data cleaning.', 'Python', 45, '["pandas","Notebook project"]' FROM career_paths WHERE slug = 'data-analyst'
    UNION ALL SELECT id, 4, 'Apply statistics', 'Understand distributions, sampling, correlation, and experiments.', 'Statistics', 34, '["Statistics foundations","Experiment review"]' FROM career_paths WHERE slug = 'data-analyst'
    UNION ALL SELECT id, 5, 'Present a data portfolio', 'Create charts, dashboards, recommendations, and case studies.', 'Visualization', 38, '["Dashboard","Data story","Portfolio case study"]' FROM career_paths WHERE slug = 'data-analyst'
  `);

  await db.query(`
    INSERT IGNORE INTO career_articles
      (slug, title, excerpt, content, category, reading_minutes)
    VALUES
      ('choose-a-career-path', 'How to choose a career path without guessing',
       'Use evidence from projects, energy, and feedback to choose your next direction.',
       'Start with small experiments instead of a permanent decision. Build one short project in each field you are considering. Track which tasks keep your attention, where you improve quickly, and what feedback you receive. Compare the daily work of each role—not only the job title. Choose one direction for the next twelve weeks, define a measurable outcome, and review the evidence after you finish.',
       'Career Planning', 5),
      ('portfolio-that-proves-skills', 'Build a portfolio that proves your skills',
       'A strong portfolio explains decisions, constraints, results, and what you learned.',
       'Select two or three focused projects rather than many unfinished examples. For each project, explain the problem, your role, important decisions, technical tradeoffs, and measurable result. Include a live demonstration when possible, a clear repository, and screenshots. Finish with a short reflection describing what you would improve next.',
       'Portfolio', 6),
      ('prepare-for-technical-interviews', 'Prepare for technical interviews with a feedback loop',
       'Turn interview practice into a repeatable weekly system.',
       'Divide preparation into fundamentals, practical exercises, communication, and mock interviews. Record the mistakes you make, classify them, and revisit weak categories each week. Practice explaining your approach before writing a solution. After every mock interview, choose one behavior and one technical topic to improve before the next session.',
       'Interview', 7),
      ('first-internship-success', 'Make your first internship count',
       'Set expectations, document progress, and turn internship work into career evidence.',
       'During the first week, clarify responsibilities, communication channels, and what success looks like. Keep a weekly record of tasks, decisions, feedback, and outcomes. Ask focused questions after trying a solution yourself. Before the internship ends, request feedback, update your portfolio, and describe your contribution without exposing company-confidential information.',
       'Internship', 5)
  `);

  await db.query(`
    INSERT IGNORE INTO career_assessments (slug, title, description)
    VALUES ('career-readiness', 'Career Readiness Self-Assessment',
            'Evaluate your foundations, problem solving, project evidence, and career preparation.')
  `);

  await db.query(`
    INSERT IGNORE INTO career_assessment_questions
      (assessment_id, position, competency, question, options)
    SELECT id, 1, 'Technical Foundations', 'I can explain the core concepts used in my target role.', '["Just starting","Learning the basics","Usually","Confidently"]' FROM career_assessments WHERE slug = 'career-readiness'
    UNION ALL SELECT id, 2, 'Technical Foundations', 'I can complete a small task without copying a full solution.', '["Not yet","With substantial help","With occasional help","Independently"]' FROM career_assessments WHERE slug = 'career-readiness'
    UNION ALL SELECT id, 3, 'Problem Solving', 'When I get stuck, I can break the problem into smaller testable parts.', '["Rarely","Sometimes","Usually","Consistently"]' FROM career_assessments WHERE slug = 'career-readiness'
    UNION ALL SELECT id, 4, 'Problem Solving', 'I verify my work and learn from errors instead of only seeking the answer.', '["Rarely","Sometimes","Usually","Consistently"]' FROM career_assessments WHERE slug = 'career-readiness'
    UNION ALL SELECT id, 5, 'Project Evidence', 'I have completed projects that demonstrate skills for my target role.', '["No project yet","One guided project","Independent projects","Strong published portfolio"]' FROM career_assessments WHERE slug = 'career-readiness'
    UNION ALL SELECT id, 6, 'Project Evidence', 'I can explain the decisions, tradeoffs, and results from my projects.', '["Not yet","With prompts","Clearly","Clearly with evidence"]' FROM career_assessments WHERE slug = 'career-readiness'
    UNION ALL SELECT id, 7, 'Career Readiness', 'My CV, profile, and portfolio are tailored to my target role.', '["Not started","Early draft","Mostly ready","Ready and reviewed"]' FROM career_assessments WHERE slug = 'career-readiness'
    UNION ALL SELECT id, 8, 'Career Readiness', 'I regularly practice interviews, networking, or applications.', '["Not yet","Occasionally","Weekly","With a tracked system"]' FROM career_assessments WHERE slug = 'career-readiness'
  `);

  await db.query(`
    ALTER TABLE notifications
    MODIFY type enum('mentorship','session','internship','message','skill_exchange','forum','system')
      DEFAULT 'system'
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS forum_categories (
      id int(11) NOT NULL AUTO_INCREMENT,
      slug varchar(80) NOT NULL,
      name varchar(100) NOT NULL,
      description varchar(500) DEFAULT NULL,
      color varchar(20) DEFAULT '#2563eb',
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (id),
      UNIQUE KEY uq_forum_categories_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS forum_posts (
      id int(11) NOT NULL AUTO_INCREMENT,
      author_id int(11) NOT NULL,
      category_id int(11) NOT NULL,
      title varchar(250) NOT NULL,
      body text NOT NULL,
      post_type enum('question','discussion') NOT NULL DEFAULT 'question',
      status enum('published','closed','hidden') NOT NULL DEFAULT 'published',
      views_count int unsigned NOT NULL DEFAULT 0,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (id),
      KEY idx_forum_posts_category (category_id, status, created_at),
      KEY idx_forum_posts_author (author_id),
      FULLTEXT KEY ft_forum_posts_search (title, body),
      CONSTRAINT fk_forum_posts_author FOREIGN KEY (author_id)
        REFERENCES users (id) ON DELETE CASCADE,
      CONSTRAINT fk_forum_posts_category FOREIGN KEY (category_id)
        REFERENCES forum_categories (id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS forum_answers (
      id int(11) NOT NULL AUTO_INCREMENT,
      post_id int(11) NOT NULL,
      author_id int(11) NOT NULL,
      body text NOT NULL,
      is_accepted tinyint(1) NOT NULL DEFAULT 0,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (id),
      KEY idx_forum_answers_post (post_id, is_accepted, created_at),
      KEY idx_forum_answers_author (author_id),
      CONSTRAINT fk_forum_answers_post FOREIGN KEY (post_id)
        REFERENCES forum_posts (id) ON DELETE CASCADE,
      CONSTRAINT fk_forum_answers_author FOREIGN KEY (author_id)
        REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS forum_comments (
      id int(11) NOT NULL AUTO_INCREMENT,
      post_id int(11) NOT NULL,
      author_id int(11) NOT NULL,
      body varchar(1500) NOT NULL,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (id),
      KEY idx_forum_comments_post (post_id, created_at),
      KEY idx_forum_comments_author (author_id),
      CONSTRAINT fk_forum_comments_post FOREIGN KEY (post_id)
        REFERENCES forum_posts (id) ON DELETE CASCADE,
      CONSTRAINT fk_forum_comments_author FOREIGN KEY (author_id)
        REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS forum_post_likes (
      post_id int(11) NOT NULL,
      user_id int(11) NOT NULL,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (post_id, user_id),
      KEY idx_forum_post_likes_user (user_id),
      CONSTRAINT fk_forum_post_likes_post FOREIGN KEY (post_id)
        REFERENCES forum_posts (id) ON DELETE CASCADE,
      CONSTRAINT fk_forum_post_likes_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS forum_answer_likes (
      answer_id int(11) NOT NULL,
      user_id int(11) NOT NULL,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (answer_id, user_id),
      KEY idx_forum_answer_likes_user (user_id),
      CONSTRAINT fk_forum_answer_likes_answer FOREIGN KEY (answer_id)
        REFERENCES forum_answers (id) ON DELETE CASCADE,
      CONSTRAINT fk_forum_answer_likes_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await db.query(`
    INSERT IGNORE INTO forum_categories (slug, name, description, color)
    VALUES
      ('programming', 'Programming', 'Code, debugging, frameworks, databases, and software projects.', '#2563eb'),
      ('design', 'Design', 'UI/UX, graphic design, research, accessibility, and creative work.', '#7c3aed'),
      ('career', 'Career', 'Career planning, portfolios, interviews, mentorship, and professional growth.', '#16a34a'),
      ('internship', 'Internship', 'Applications, CVs, workplace learning, and internship experience.', '#ea580c')
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS courses (
      id int(11) NOT NULL AUTO_INCREMENT,
      slug varchar(160) NOT NULL,
      title varchar(220) NOT NULL,
      description text NOT NULL,
      category varchar(100) NOT NULL DEFAULT 'General',
      level enum('beginner','intermediate','advanced','all') NOT NULL DEFAULT 'all',
      instructor_name varchar(160) NOT NULL,
      thumbnail_url varchar(700) DEFAULT NULL,
      highlights longtext DEFAULT NULL,
      price decimal(12,2) NOT NULL DEFAULT 0.00,
      currency enum('USD','KHR') NOT NULL DEFAULT 'USD',
      duration_text varchar(80) DEFAULT NULL,
      sort_order smallint unsigned NOT NULL DEFAULT 0,
      is_published tinyint(1) NOT NULL DEFAULT 1,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (id),
      UNIQUE KEY uq_courses_slug (slug),
      KEY idx_courses_published (is_published, sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS course_lessons (
      id int(11) NOT NULL AUTO_INCREMENT,
      course_id int(11) NOT NULL,
      position smallint unsigned NOT NULL,
      title varchar(220) NOT NULL,
      description text DEFAULT NULL,
      video_url varchar(700) DEFAULT NULL,
      pdf_url varchar(700) DEFAULT NULL,
      duration_minutes smallint unsigned NOT NULL DEFAULT 0,
      is_preview tinyint(1) NOT NULL DEFAULT 0,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (id),
      UNIQUE KEY uq_course_lesson_position (course_id, position),
      KEY idx_course_lessons_course (course_id, position),
      CONSTRAINT fk_course_lessons_course FOREIGN KEY (course_id)
        REFERENCES courses (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS course_payments (
      id bigint unsigned NOT NULL AUTO_INCREMENT,
      user_id int(11) NOT NULL,
      course_id int(11) NOT NULL,
      amount decimal(12,2) NOT NULL,
      currency enum('USD','KHR') NOT NULL,
      status enum('pending','paid','expired','cancelled','failed') NOT NULL DEFAULT 'pending',
      payment_method enum('khqr') NOT NULL DEFAULT 'khqr',
      qr_code longtext DEFAULT NULL,
      qr_md5 varchar(255) DEFAULT NULL,
      qr_expires_at datetime DEFAULT NULL,
      transaction_id varchar(255) DEFAULT NULL,
      bakong_hash varchar(255) DEFAULT NULL,
      from_account_id varchar(255) DEFAULT NULL,
      to_account_id varchar(255) DEFAULT NULL,
      paid_at datetime DEFAULT NULL,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (id),
      UNIQUE KEY uq_course_payment_transaction (transaction_id),
      KEY idx_course_payments_user (user_id, status, created_at),
      KEY idx_course_payments_course (course_id, status),
      KEY idx_course_payments_qr_md5 (qr_md5),
      CONSTRAINT fk_course_payments_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
      CONSTRAINT fk_course_payments_course FOREIGN KEY (course_id)
        REFERENCES courses (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS course_enrollments (
      id bigint unsigned NOT NULL AUTO_INCREMENT,
      user_id int(11) NOT NULL,
      course_id int(11) NOT NULL,
      payment_id bigint unsigned DEFAULT NULL,
      progress_percent tinyint unsigned NOT NULL DEFAULT 0,
      last_lesson_id int(11) DEFAULT NULL,
      enrolled_at timestamp NOT NULL DEFAULT current_timestamp(),
      updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (id),
      UNIQUE KEY uq_course_enrollment (user_id, course_id),
      KEY idx_course_enrollments_course (course_id),
      KEY idx_course_enrollments_payment (payment_id),
      CONSTRAINT fk_course_enrollments_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
      CONSTRAINT fk_course_enrollments_course FOREIGN KEY (course_id)
        REFERENCES courses (id) ON DELETE CASCADE,
      CONSTRAINT fk_course_enrollments_payment FOREIGN KEY (payment_id)
        REFERENCES course_payments (id) ON DELETE SET NULL,
      CONSTRAINT fk_course_enrollments_lesson FOREIGN KEY (last_lesson_id)
        REFERENCES course_lessons (id) ON DELETE SET NULL,
      CONSTRAINT chk_course_progress CHECK (progress_percent BETWEEN 0 AND 100)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  await db.query(`
    INSERT IGNORE INTO courses
      (slug, title, description, category, level, instructor_name,
       thumbnail_url, highlights, price, currency, duration_text, sort_order)
    VALUES
      ('react-modern-web', 'React for Modern Web',
       'Build polished, component-driven web applications with modern React, hooks, routing, and API integration.',
       'Frontend', 'beginner', 'Smart Community Academy',
       'https://i.ytimg.com/vi/bMknfKXIFA8/hqdefault.jpg',
       '["Reusable components","Hooks and state","React Router","API integration"]',
       1.00, 'USD', '6 hours', 1),
      ('node-api-development', 'Node.js API Development',
       'Create secure REST APIs with Express, authentication, database access, validation, and production practices.',
       'Backend', 'intermediate', 'Smart Community Academy',
       'https://i.ytimg.com/vi/Oe421EPjeBE/hqdefault.jpg',
       '["Express routing","JWT authentication","MySQL integration","API security"]',
       2.00, 'USD', '5 hours', 2),
      ('ui-ux-design-essentials', 'UI/UX Design Essentials',
       'Learn user-centered design, wireframing, visual hierarchy, prototyping, and practical usability testing.',
       'Design', 'beginner', 'Smart Community Academy',
       'https://i.ytimg.com/vi/c9Wg6Cb_YlU/hqdefault.jpg',
       '["Design thinking","Wireframes","Visual hierarchy","Usability testing"]',
       1.50, 'USD', '4 hours', 3),
      ('python-data-foundations', 'Python Data Foundations',
       'Learn practical Python fundamentals and turn raw information into useful, understandable data insights.',
       'Data', 'beginner', 'Smart Community Academy',
       'https://i.ytimg.com/vi/rfscVS0vtbw/hqdefault.jpg',
       '["Python fundamentals","Data structures","File processing","Practical analysis"]',
       1.50, 'USD', '5 hours', 4),
      ('sql-database-essentials', 'SQL Database Essentials',
       'Design relational data, write useful SQL queries, and work confidently with databases in real applications.',
       'Backend', 'beginner', 'Smart Community Academy',
       'https://i.ytimg.com/vi/HXV3zeQKqGY/hqdefault.jpg',
       '["Relational design","SQL queries","Joins and reports","Database safety"]',
       2.00, 'USD', '5 hours', 5),
      ('git-github-collaboration', 'Git & GitHub Collaboration',
       'Build a professional Git workflow for team projects, code reviews, branches, and confident collaboration.',
       'Career', 'beginner', 'Smart Community Academy',
       'https://i.ytimg.com/vi/RGOj5yH7evk/hqdefault.jpg',
       '["Git foundations","Branches and merges","Pull requests","Team workflow"]',
       1.00, 'USD', '3 hours', 6)
  `);

  await db.query(`
    INSERT IGNORE INTO course_lessons
      (course_id, position, title, description, video_url, pdf_url,
       duration_minutes, is_preview)
    SELECT id, 1, 'Welcome and course roadmap',
           'Preview the learning outcomes, tools, and project you will build.',
           'https://www.youtube.com/watch?v=bMknfKXIFA8',
           'https://eloquentjavascript.net/Eloquent_JavaScript_small.pdf',
           18, 1 FROM courses WHERE slug = 'react-modern-web'
  `);
  await db.query(`
    INSERT IGNORE INTO course_lessons
      (course_id, position, title, description, video_url, pdf_url,
       duration_minutes, is_preview)
    SELECT id, 2, 'Components, props, and composition',
           'Turn a design into reusable React components and compose a complete screen.',
           'https://www.youtube.com/watch?v=bMknfKXIFA8',
           'https://eloquentjavascript.net/Eloquent_JavaScript_small.pdf',
           54, 0 FROM courses WHERE slug = 'react-modern-web'
  `);
  await db.query(`
    INSERT IGNORE INTO course_lessons
      (course_id, position, title, description, video_url, pdf_url,
       duration_minutes, is_preview)
    SELECT id, 3, 'State, effects, and API data',
           'Manage UI state and connect components to real backend data safely.',
           'https://www.youtube.com/watch?v=bMknfKXIFA8',
           'https://eloquentjavascript.net/Eloquent_JavaScript_small.pdf',
           66, 0 FROM courses WHERE slug = 'react-modern-web'
  `);

  await db.query(`
    INSERT IGNORE INTO course_lessons
      (course_id, position, title, description, video_url, pdf_url,
       duration_minutes, is_preview)
    SELECT id, 1, 'Node and Express foundations',
           'Preview how an Express application receives requests and returns JSON.',
           'https://www.youtube.com/watch?v=Oe421EPjeBE',
           'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
           22, 1 FROM courses WHERE slug = 'node-api-development'
  `);
  await db.query(`
    INSERT IGNORE INTO course_lessons
      (course_id, position, title, description, video_url, pdf_url,
       duration_minutes, is_preview)
    SELECT id, 2, 'REST routes and controllers',
           'Organize a maintainable API using routes, controllers, and services.',
           'https://www.youtube.com/watch?v=Oe421EPjeBE',
           'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
           48, 0 FROM courses WHERE slug = 'node-api-development'
  `);
  await db.query(`
    INSERT IGNORE INTO course_lessons
      (course_id, position, title, description, video_url, pdf_url,
       duration_minutes, is_preview)
    SELECT id, 3, 'Authentication and database security',
           'Protect endpoints and avoid common authentication and SQL mistakes.',
           'https://www.youtube.com/watch?v=Oe421EPjeBE',
           'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
           61, 0 FROM courses WHERE slug = 'node-api-development'
  `);

  await db.query(`
    INSERT IGNORE INTO course_lessons
      (course_id, position, title, description, video_url, pdf_url,
       duration_minutes, is_preview)
    SELECT id, 1, 'Design thinking introduction',
           'Preview the user-centered process used throughout the course.',
           'https://www.youtube.com/watch?v=c9Wg6Cb_YlU',
           'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
           16, 1 FROM courses WHERE slug = 'ui-ux-design-essentials'
  `);
  await db.query(`
    INSERT IGNORE INTO course_lessons
      (course_id, position, title, description, video_url, pdf_url,
       duration_minutes, is_preview)
    SELECT id, 2, 'Wireframes and visual hierarchy',
           'Create clear low-fidelity layouts before spending time on visual polish.',
           'https://www.youtube.com/watch?v=c9Wg6Cb_YlU',
           'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
           44, 0 FROM courses WHERE slug = 'ui-ux-design-essentials'
  `);
  await db.query(`
    INSERT IGNORE INTO course_lessons
      (course_id, position, title, description, video_url, pdf_url,
       duration_minutes, is_preview)
    SELECT id, 3, 'Prototype and usability test',
           'Turn a flow into a prototype and collect useful feedback from users.',
           'https://www.youtube.com/watch?v=c9Wg6Cb_YlU',
           'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
           52, 0 FROM courses WHERE slug = 'ui-ux-design-essentials'
  `);

  await db.query(`
    INSERT IGNORE INTO course_lessons
      (course_id, position, title, description, video_url, pdf_url,
       duration_minutes, is_preview)
    SELECT id, 1, 'Python foundations and first program',
           'Preview the Python workflow, core syntax, variables, and the learning roadmap.',
           'https://www.youtube.com/watch?v=rfscVS0vtbw',
           'https://bugs.python.org/file47781/Tutorial.pdf',
           24, 1 FROM courses WHERE slug = 'python-data-foundations'
  `);
  await db.query(`
    INSERT IGNORE INTO course_lessons
      (course_id, position, title, description, video_url, pdf_url,
       duration_minutes, is_preview)
    SELECT id, 2, 'Collections, functions, and reusable logic',
           'Use lists, dictionaries, loops, and functions to solve repeatable data tasks.',
           'https://www.youtube.com/watch?v=rfscVS0vtbw',
           'https://bugs.python.org/file47781/Tutorial.pdf',
           58, 0 FROM courses WHERE slug = 'python-data-foundations'
  `);
  await db.query(`
    INSERT IGNORE INTO course_lessons
      (course_id, position, title, description, video_url, pdf_url,
       duration_minutes, is_preview)
    SELECT id, 3, 'Read, clean, and summarize data',
           'Process files safely and turn a small dataset into clear, useful results.',
           'https://www.youtube.com/watch?v=rfscVS0vtbw',
           'https://bugs.python.org/file47781/Tutorial.pdf',
           64, 0 FROM courses WHERE slug = 'python-data-foundations'
  `);

  await db.query(`
    INSERT IGNORE INTO course_lessons
      (course_id, position, title, description, video_url, pdf_url,
       duration_minutes, is_preview)
    SELECT id, 1, 'Relational database foundations',
           'Preview tables, keys, relationships, and the structure behind reliable application data.',
           'https://www.youtube.com/watch?v=HXV3zeQKqGY',
           'https://www.postgresql.org/files/documentation/pdf/18/postgresql-18-A4.pdf',
           21, 1 FROM courses WHERE slug = 'sql-database-essentials'
  `);
  await db.query(`
    INSERT IGNORE INTO course_lessons
      (course_id, position, title, description, video_url, pdf_url,
       duration_minutes, is_preview)
    SELECT id, 2, 'Query, filter, group, and join data',
           'Write practical SQL queries that answer real product and reporting questions.',
           'https://www.youtube.com/watch?v=HXV3zeQKqGY',
           'https://www.postgresql.org/files/documentation/pdf/18/postgresql-18-A4.pdf',
           56, 0 FROM courses WHERE slug = 'sql-database-essentials'
  `);
  await db.query(`
    INSERT IGNORE INTO course_lessons
      (course_id, position, title, description, video_url, pdf_url,
       duration_minutes, is_preview)
    SELECT id, 3, 'Schema quality and database safety',
           'Improve data integrity with constraints, indexes, transactions, and safe query practices.',
           'https://www.youtube.com/watch?v=HXV3zeQKqGY',
           'https://www.postgresql.org/files/documentation/pdf/18/postgresql-18-A4.pdf',
           62, 0 FROM courses WHERE slug = 'sql-database-essentials'
  `);

  await db.query(`
    INSERT IGNORE INTO course_lessons
      (course_id, position, title, description, video_url, pdf_url,
       duration_minutes, is_preview)
    SELECT id, 1, 'Git and repository foundations',
           'Preview repositories, commits, history, and the workflow used by development teams.',
           'https://www.youtube.com/watch?v=RGOj5yH7evk',
           'https://training.github.com/downloads/github-git-cheat-sheet.pdf',
           18, 1 FROM courses WHERE slug = 'git-github-collaboration'
  `);
  await db.query(`
    INSERT IGNORE INTO course_lessons
      (course_id, position, title, description, video_url, pdf_url,
       duration_minutes, is_preview)
    SELECT id, 2, 'Branches, merges, and conflict resolution',
           'Work in focused branches and combine changes without losing team progress.',
           'https://www.youtube.com/watch?v=RGOj5yH7evk',
           'https://training.github.com/downloads/github-git-cheat-sheet.pdf',
           42, 0 FROM courses WHERE slug = 'git-github-collaboration'
  `);
  await db.query(`
    INSERT IGNORE INTO course_lessons
      (course_id, position, title, description, video_url, pdf_url,
       duration_minutes, is_preview)
    SELECT id, 3, 'Pull requests and professional teamwork',
           'Publish a branch, review changes, respond to feedback, and maintain a clear project history.',
           'https://www.youtube.com/watch?v=RGOj5yH7evk',
           'https://training.github.com/downloads/github-git-cheat-sheet.pdf',
           48, 0 FROM courses WHERE slug = 'git-github-collaboration'
  `);

  // Keep resource links current for installations where these idempotent
  // course rows were already created by an earlier migration run.
  await db.query(`
    UPDATE course_lessons l
    JOIN courses c ON c.id = l.course_id
    SET l.pdf_url = 'https://bugs.python.org/file47781/Tutorial.pdf'
    WHERE c.slug = 'python-data-foundations'
  `);
  await db.query(`
    UPDATE course_lessons l
    JOIN courses c ON c.id = l.course_id
    SET l.pdf_url = 'https://www.postgresql.org/files/documentation/pdf/18/postgresql-18-A4.pdf'
    WHERE c.slug = 'sql-database-essentials'
  `);

  // Remove the original placeholder accounts from existing installations.
  // Their example.com addresses identify only the demo records shipped in the
  // first SQL dump; foreign-key cascades clean up their related demo content.
  await db.query(
    `DELETE FROM users
     WHERE email IN (?, ?, ?, ?, ?)`,
    [
      "john.mentor@example.com",
      "jane.mentor@example.com",
      "mike.mentor@example.com",
      "alice.student@example.com",
      "bob.student@example.com",
    ],
  );

  await db.query(
    `UPDATE users
     SET full_name = 'MUY KALIN'
     WHERE LOWER(REPLACE(full_name, ' ', '')) = 'mutkalin'`,
  );

  // Daily question counts for the site assistant (per user, per guest IP,
  // and one "site" row), used to cap usage and cost.
  await db.query(`
    CREATE TABLE IF NOT EXISTS assistant_usage (
      usage_key varchar(80) NOT NULL,
      usage_day date NOT NULL,
      question_count int(11) NOT NULL DEFAULT 0,
      PRIMARY KEY (usage_key, usage_day)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  const seedAllCourses = require("./seedAllCourses");
  await seedAllCourses();

  console.log("Database migration completed.");
  await db.end();
};

run().catch(async (err) => {
  console.error("Database migration failed:", err.message);
  await db.end();
  process.exit(1);
});
