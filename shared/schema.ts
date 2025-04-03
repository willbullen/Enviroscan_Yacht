import { pgTable, text, serial, integer, boolean, timestamp, real, json, decimal } from "drizzle-orm/pg-core";
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

// Crew members schema
export const crewMembers = pgTable("crew_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  fullName: text("full_name").notNull(),
  position: text("position").notNull(), // Captain, Chief Engineer, Deckhand, etc.
  nationality: text("nationality").notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  emergencyContact: text("emergency_contact"),
  phoneNumber: text("phone_number"),
  email: text("email"),
  joinDate: timestamp("join_date"),
  contractExpiryDate: timestamp("contract_expiry_date"),
  photo: text("photo"), // URL to photo
  status: text("status").notNull(), // active, on-leave, inactive
  notes: text("notes"),
  medicalInformation: json("medical_information"), // allergies, conditions, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCrewMemberSchema = createInsertSchema(crewMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertCrewMember = z.infer<typeof insertCrewMemberSchema>;
export type CrewMember = typeof crewMembers.$inferSelect;

// Crew documents schema (Passports, Visas, Certificates, etc.)
export const crewDocuments = pgTable("crew_documents", {
  id: serial("id").primaryKey(),
  crewMemberId: integer("crew_member_id").references(() => crewMembers.id).notNull(),
  documentType: text("document_type").notNull(), // passport, visa, certificate, license, medical
  documentNumber: text("document_number").notNull(),
  title: text("title").notNull(), // "US Passport", "Seaman's Discharge Book", "STCW"
  issuingAuthority: text("issuing_authority").notNull(),
  issueDate: timestamp("issue_date").notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  documentFile: text("document_file"), // URL to document scan/photo
  verificationStatus: text("verification_status").notNull(), // verified, pending, requires_renewal
  notes: text("notes"),
  reminderDays: integer("reminder_days").default(30), // Days before expiry to send reminder
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCrewDocumentSchema = createInsertSchema(crewDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertCrewDocument = z.infer<typeof insertCrewDocumentSchema>;
export type CrewDocument = typeof crewDocuments.$inferSelect;

// Financial Management Schema

// Accounts/Chart of Accounts
export const financialAccounts: any = pgTable("financial_accounts", {
  id: serial("id").primaryKey(),
  accountNumber: text("account_number").notNull().unique(),
  accountName: text("account_name").notNull(),
  accountType: text("account_type").notNull(), // asset, liability, equity, income, expense
  category: text("category").notNull(), // operational, maintenance, crew, fuel, etc.
  description: text("description"),
  isActive: boolean("is_active").default(true),
  parentAccountId: integer("parent_account_id"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFinancialAccountSchema = createInsertSchema(financialAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertFinancialAccount = z.infer<typeof insertFinancialAccountSchema>;
export type FinancialAccount = typeof financialAccounts.$inferSelect;

// Vendors/Suppliers for financial transactions
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  taxIdentifier: text("tax_identifier"),
  accountNumber: text("account_number"),
  notes: text("notes"),
  category: text("category"), // fuel, maintenance, provisions, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendors.$inferSelect;

// Budgets for expense planning
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
  status: text("status").notNull(), // draft, active, closed
  notes: text("notes"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgets.$inferSelect;

// Budget allocations to specific accounts
export const budgetAllocations = pgTable("budget_allocations", {
  id: serial("id").primaryKey(),
  budgetId: integer("budget_id").references(() => budgets.id).notNull(),
  accountId: integer("account_id").references(() => financialAccounts.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBudgetAllocationSchema = createInsertSchema(budgetAllocations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertBudgetAllocation = z.infer<typeof insertBudgetAllocationSchema>;
export type BudgetAllocation = typeof budgetAllocations.$inferSelect;

// Expense transactions
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 6 }).default("1").notNull(),
  transactionDate: timestamp("transaction_date").notNull(),
  category: text("category").notNull(), // maintenance, fuel, crew, provisions, etc.
  accountId: integer("account_id").references(() => financialAccounts.id).notNull(),
  vendorId: integer("vendor_id").references(() => vendors.id),
  paymentMethod: text("payment_method").notNull(), // credit card, bank transfer, cash, etc.
  paymentStatus: text("payment_status").notNull(), // pending, paid, cancelled
  receiptUrl: text("receipt_url"), // URL to receipt image/document
  notes: text("notes"),
  budgetId: integer("budget_id").references(() => budgets.id),
  approvedById: integer("approved_by_id").references(() => users.id),
  approvalDate: timestamp("approval_date"),
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

// Invoices received
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull(),
  description: text("description").notNull(),
  vendorId: integer("vendor_id").references(() => vendors.id).notNull(),
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }),
  currency: text("currency").default("USD").notNull(),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 6 }).default("1").notNull(),
  status: text("status").notNull(), // pending, approved, paid, disputed, cancelled
  attachmentUrl: text("attachment_url"), // URL to invoice document
  notes: text("notes"),
  paymentDate: timestamp("payment_date"),
  paymentMethod: text("payment_method"), // credit card, bank transfer, cash, etc.
  paymentReference: text("payment_reference"),
  approvedById: integer("approved_by_id").references(() => users.id),
  approvalDate: timestamp("approval_date"),
  accountId: integer("account_id").references(() => financialAccounts.id).notNull(),
  budgetId: integer("budget_id").references(() => budgets.id),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// Financial Reports
export const financialReports = pgTable("financial_reports", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  reportType: text("report_type").notNull(), // budget_comparison, expense_summary, account_statement, etc.
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdById: integer("created_by_id").references(() => users.id),
  creationDate: timestamp("creation_date").defaultNow().notNull(),
  reportData: json("report_data"), // Structured JSON data for the report
  notes: text("notes"),
  attachmentUrl: text("attachment_url"), // URL to generated PDF report if applicable
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFinancialReportSchema = createInsertSchema(financialReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertFinancialReport = z.infer<typeof insertFinancialReportSchema>;
export type FinancialReport = typeof financialReports.$inferSelect;

// Payment Methods for expense tracking and management
export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type").notNull(), // credit_card, bank_account, cash, digital_wallet
  accountNumber: text("account_number"), // Last 4 digits for cards or account identifier
  provider: text("provider"), // Bank name, card issuer, etc.
  contactPerson: text("contact_person"), // Accounting contact at provider
  expiryDate: timestamp("expiry_date"), // For credit cards
  currencyCode: text("currency_code").default("USD").notNull(),
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
