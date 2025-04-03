import { pgTable, text, serial, integer, boolean, timestamp, real, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Equipment model for yacht components
export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // mechanical, electrical, navigation, safety
  model: text("model").notNull(),
  manufacturer: text("manufacturer").notNull(),
  serialNumber: text("serial_number"),
  installationDate: timestamp("installation_date"),
  runtime: real("runtime").default(0), // in hours
  lastServiceDate: timestamp("last_service_date"),
  nextServiceDate: timestamp("next_service_date"),
  nextServiceHours: real("next_service_hours"),
  notes: text("notes"),
  status: text("status").notNull(), // operational, maintenance_required, non_operational
  location: text("location"), // where on the yacht
  specifications: json("specifications"),
  manualUrl: text("manual_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEquipmentSchema = createInsertSchema(equipment).omit({ id: true, createdAt: true });
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type Equipment = typeof equipment.$inferSelect;

// Maintenance tasks model
export const maintenanceTasks = pgTable("maintenance_tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  equipmentId: integer("equipment_id").references(() => equipment.id),
  priority: text("priority").notNull(), // high, medium, low
  status: text("status").notNull(), // due, upcoming, completed, in_progress
  dueDate: timestamp("due_date").notNull(),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  completedById: integer("completed_by_id").references(() => users.id),
  completedAt: timestamp("completed_at"),
  procedure: json("procedure"), // step by step instructions
  estimatedDuration: integer("estimated_duration"), // in minutes
  actualDuration: integer("actual_duration"), // in minutes
  notes: text("notes"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMaintenanceTaskSchema = createInsertSchema(maintenanceTasks).omit({ 
  id: true, 
  completedAt: true, 
  createdAt: true 
});
export type InsertMaintenanceTask = z.infer<typeof insertMaintenanceTaskSchema>;
export type MaintenanceTask = typeof maintenanceTasks.$inferSelect;

// Inventory items model
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  quantity: integer("quantity").notNull().default(0),
  unit: text("unit").notNull(), // liters, units, pcs, etc.
  minQuantity: integer("min_quantity").notNull(), // reorder point
  location: text("location"),
  partNumber: text("part_number"),
  supplier: text("supplier"),
  cost: real("cost"),
  lastRestockDate: timestamp("last_restock_date"),
  compatibleEquipmentIds: json("compatible_equipment_ids"), // array of equipment IDs
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({ id: true, createdAt: true });
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;

// Activity log model
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  activityType: text("activity_type").notNull(), // task_completed, inventory_updated, etc.
  description: text("description").notNull(),
  userId: integer("user_id").references(() => users.id),
  relatedEntityType: text("related_entity_type"), // equipment, task, inventory
  relatedEntityId: integer("related_entity_id"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: json("metadata"),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, timestamp: true });
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

// Maintenance history for predictive analysis
export const maintenanceHistory = pgTable("maintenance_history", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").references(() => equipment.id).notNull(),
  maintenanceType: text("maintenance_type").notNull(), // routine, repair, inspection, replacement
  serviceDate: timestamp("service_date").notNull(),
  runtime: real("runtime").notNull(), // equipment runtime hours at service
  description: text("description").notNull(),
  findings: text("findings"), // issues discovered during maintenance
  partsReplaced: json("parts_replaced"), // array of inventory item IDs
  technician: text("technician"), // who did the work
  cost: real("cost"), // cost of service
  isSuccessful: boolean("is_successful").default(true),
  taskId: integer("task_id").references(() => maintenanceTasks.id), // related task if any
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  nextRecommendedDate: timestamp("next_recommended_date"),
  nextRecommendedRuntime: real("next_recommended_runtime"),
  photos: json("photos"), // URLs to photos taken during maintenance
  documents: json("documents"), // URLs to related documents
});

export const insertMaintenanceHistorySchema = createInsertSchema(maintenanceHistory).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertMaintenanceHistory = z.infer<typeof insertMaintenanceHistorySchema>;
export type MaintenanceHistory = typeof maintenanceHistory.$inferSelect;

// Predictive maintenance model data
export const predictiveMaintenance = pgTable("predictive_maintenance", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").references(() => equipment.id).notNull(),
  maintenanceType: text("maintenance_type").notNull(), // type of maintenance being predicted
  predictedDate: timestamp("predicted_date"), // next predicted date
  predictedRuntime: real("predicted_runtime"), // next predicted runtime hours
  confidence: real("confidence"), // confidence score (0-1)
  reasoningFactors: json("reasoning_factors"), // factors that led to prediction
  recommendedAction: text("recommended_action"),
  warningThreshold: real("warning_threshold"), // days or hours before predicted date to warn
  alertThreshold: real("alert_threshold"), // days or hours before predicted date to alert
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  historyDataPoints: integer("history_data_points"), // number of historical points used for prediction
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPredictiveMaintenanceSchema = createInsertSchema(predictiveMaintenance).omit({ 
  id: true, 
  lastUpdated: true,
  createdAt: true 
});
export type InsertPredictiveMaintenance = z.infer<typeof insertPredictiveMaintenanceSchema>;
export type PredictiveMaintenance = typeof predictiveMaintenance.$inferSelect;

// ISM Management Schema
export const ismDocuments = pgTable("ism_documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  documentType: text("document_type").notNull(), // procedure, policy, checklist, form, report
  documentNumber: text("document_number").notNull(), // ISM reference code
  version: text("version").notNull(),
  status: text("status").notNull(), // draft, review, approved, obsolete
  approvedBy: integer("approved_by").references(() => users.id),
  approvalDate: timestamp("approval_date"),
  reviewDueDate: timestamp("review_due_date"),
  content: text("content"), // Main document content
  attachmentPath: text("attachment_path"), // Path to attached file if any
  tags: json("tags"), // For categorization
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertIsmDocumentSchema = createInsertSchema(ismDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertIsmDocument = z.infer<typeof insertIsmDocumentSchema>;
export type IsmDocument = typeof ismDocuments.$inferSelect;

// ISM Audit Schema
export const ismAudits = pgTable("ism_audits", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  auditType: text("audit_type").notNull(), // internal, external, flag-state, class
  status: text("status").notNull(), // planned, in-progress, completed, overdue
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  auditScope: text("audit_scope").notNull(),
  auditors: json("auditors"), // Array of auditor names or IDs
  location: text("location"),
  findings: json("findings"), // Array of findings
  correctiveActions: json("corrective_actions"), // Array of actions
  reportAttachment: text("report_attachment"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertIsmAuditSchema = createInsertSchema(ismAudits).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertIsmAudit = z.infer<typeof insertIsmAuditSchema>;
export type IsmAudit = typeof ismAudits.$inferSelect;

// ISM Training Schema
export const ismTraining = pgTable("ism_training", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  trainingType: text("training_type").notNull(), // safety, technical, certification, drill
  description: text("description"),
  requiredParticipants: json("required_participants"), // Array of user IDs
  actualParticipants: json("actual_participants"), // Array of user IDs
  scheduledDate: timestamp("scheduled_date"),
  completionDate: timestamp("completion_date"),
  duration: real("duration"), // Hours
  attachments: json("attachments"), // Array of attachment paths
  notes: text("notes"),
  status: text("status").notNull(), // planned, completed, cancelled
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertIsmTrainingSchema = createInsertSchema(ismTraining).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertIsmTraining = z.infer<typeof insertIsmTrainingSchema>;
export type IsmTraining = typeof ismTraining.$inferSelect;

// ISM Incidents/Non-conformities Schema
export const ismIncidents = pgTable("ism_incidents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  incidentType: text("incident_type").notNull(), // non-conformity, accident, near-miss, observation
  description: text("description").notNull(),
  dateReported: timestamp("date_reported").notNull(),
  dateOccurred: timestamp("date_occurred").notNull(),
  location: text("location"),
  reportedBy: integer("reported_by").references(() => users.id),
  severity: text("severity").notNull(), // minor, major, critical
  rootCause: text("root_cause"),
  immediateActions: text("immediate_actions"),
  correctiveActions: json("corrective_actions"),
  preventiveActions: json("preventive_actions"),
  status: text("status").notNull(), // open, in-progress, closed
  verifiedBy: integer("verified_by").references(() => users.id),
  verificationDate: timestamp("verification_date"),
  attachments: json("attachments"), // Array of attachment paths
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertIsmIncidentSchema = createInsertSchema(ismIncidents).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertIsmIncident = z.infer<typeof insertIsmIncidentSchema>;
export type IsmIncident = typeof ismIncidents.$inferSelect;
