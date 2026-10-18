import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const client = postgres(connectionString);

export const db = drizzle(client);

export {
  guilds,
  globalSettings,
  bannedGuilds,
  ownerActions,
  guildSettings,
  guildChannels,
  guildRoles,
  tickets,
  guildActions,
  warnings,
  moderationActions,
  healthDailyMetrics,
  healthHourlyActivity,
  healthDailyActiveMembers,
  healthMemberLifecycle,
  guildStaffMembers,
  erlcConnections,
  erlcSessions,
  erlcPlayers,
  erlcPlayerAttendance,
  erlcManagementSettings,
  erlcStaffProfiles,
  erlcDepartmentMappings,
  erlcManagedSessions,
  erlcManagedSessionParticipants,
  applicationPortals,
  applicationForms,
  applicationQuestions,
  applicationSubmissions,
  applicationAnswers,
  applicationReviews,
  applicationAdvancedSettings,
  applicationQuestionSettings,
  applicationAssignments,
  applicationQuestionScores,
  applicationInterviews,
  applicationCustomStatuses,
  applicationStatusHistory,
  applicationAuditLogs,
  applicationSubmissionCodes,
  applicationTemplates,
  applicationAppeals,
  applicationPortalSlugs,
} from "./schema.js";
