import { pgTable, text, serial, integer, boolean, timestamp, real, json, decimal, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model for authentication
// This schema is adjusted to match the actual DB structure
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull(), // admin, manager, crew
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Fields below exist in code but not in DB, handled separately in DatabaseStorage
  // email: text("email"),
  // isActive: boolean("is_active").default(true).notNull(),
  // updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Since the database structure doesn't match our schema, we need to define a custom insert schema
export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  fullName: z.string().min(1),
  role: z.string().min(1),
  avatarUrl: z.string().nullable().optional(),
  // These fields don't exist in the DB but are used in the application code
  email: z.string().email().nullable().optional(),
  isActive: z.boolean().optional()
});
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

// Voyage Planning Schema
export const voyages = pgTable('voyages', {
  id: serial('id').primaryKey(),
  vesselId: integer('vessel_id').notNull(),
  name: text('name').notNull(),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  status: text('status').default('planned').notNull(), // planned, active, completed, canceled
  fuelConsumption: decimal('fuel_consumption'), // Total estimated fuel consumption
  distance: decimal('distance'), // Total distance in nautical miles
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  notes: text('notes'),
  createdById: integer('created_by_id')
});

export const waypoints = pgTable('waypoints', {
  id: serial('id').primaryKey(),
  voyageId: integer('voyage_id').notNull().references(() => voyages.id, { onDelete: 'cascade' }),
  orderIndex: integer('order_index').notNull(), // Sequence of the waypoint in the voyage
  latitude: decimal('latitude').notNull(),
  longitude: decimal('longitude').notNull(),
  name: text('name'),
  estimatedArrival: timestamp('estimated_arrival'),
  estimatedDeparture: timestamp('estimated_departure'),
  plannedSpeed: decimal('planned_speed'), // Speed in knots
  engineRpm: integer('engine_rpm'),
  fuelConsumption: decimal('fuel_consumption'), // Fuel consumption for leg to this waypoint
  distance: decimal('distance'), // Distance from previous waypoint in nautical miles
  notes: text('notes')
});

export const fuelConsumptionChart = pgTable('fuel_consumption_chart', {
  id: serial('id').primaryKey(),
  vesselId: integer('vessel_id').notNull(),
  engineRpm: integer('engine_rpm').notNull(),
  fuelConsumptionRate: decimal('fuel_consumption_rate').notNull(), // L/h
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const speedChart = pgTable('speed_chart', {
  id: serial('id').primaryKey(),
  vesselId: integer('vessel_id').notNull(),
  engineRpm: integer('engine_rpm').notNull(),
  speed: decimal('speed').notNull(), // Speed in knots
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Types
export type Voyage = typeof voyages.$inferSelect;
export type InsertVoyage = typeof voyages.$inferInsert;

export type Waypoint = typeof waypoints.$inferSelect;
export type InsertWaypoint = typeof waypoints.$inferInsert;

export type FuelConsumptionChart = typeof fuelConsumptionChart.$inferSelect;
export type InsertFuelConsumptionChart = typeof fuelConsumptionChart.$inferInsert;

export type SpeedChart = typeof speedChart.$inferSelect;
export type InsertSpeedChart = typeof speedChart.$inferInsert;

// Zod Schemas
export const insertVoyageSchema = createInsertSchema(voyages).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWaypointSchema = createInsertSchema(waypoints).omit({ id: true });
export const insertFuelConsumptionChartSchema = createInsertSchema(fuelConsumptionChart).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSpeedChartSchema = createInsertSchema(speedChart).omit({ id: true, createdAt: true, updatedAt: true });

// Financial Management Schema

// Vessels schema
export const vessels = pgTable("vessels", {
  id: serial("id").primaryKey(),
  vesselName: text("vessel_name").notNull(),
  registrationNumber: text("registration_number").notNull(),
  flagCountry: text("flag_country").notNull(),
  vesselType: text("vessel_type").notNull(),
  length: text("length").notNull(),
  beam: text("beam").notNull(),
  draft: text("draft").notNull(),
  buildYear: text("build_year").notNull(),
  manufacturer: text("manufacturer").notNull(),
  ownerId: integer("owner_id"), // Could reference to Customers table
  status: text("status").notNull().default("active"), // active, maintenance, charter
  mmsi: text("mmsi"), // Maritime Mobile Service Identity for AIS
  imo: text("imo"), // International Maritime Organization number
  callSign: text("call_sign"), // Vessel radio call sign
  // Position and navigation data
  latitude: decimal("latitude", { precision: 10, scale: 6 }), // Current latitude
  longitude: decimal("longitude", { precision: 10, scale: 6 }), // Current longitude
  heading: real("heading"), // Heading in degrees (0-359)
  speed: real("speed"), // Speed in knots
  lastPositionUpdate: timestamp("last_position_update"), // When position was last updated
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertVesselSchema = createInsertSchema(vessels).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertVessel = z.infer<typeof insertVesselSchema>;
export type Vessel = typeof vessels.$inferSelect;

// User-to-Vessel assignments for role-based access control
export const userVesselAssignments = pgTable("user_vessel_assignments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  vesselId: integer("vessel_id").references(() => vessels.id).notNull(),
  role: text("role").notNull(), // captain, engineer, deckhand, etc.
  isPrimary: boolean("is_primary").default(false).notNull(), // is this the user's primary vessel assignment
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  assignedById: integer("assigned_by_id").references(() => users.id).notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertUserVesselAssignmentSchema = createInsertSchema(userVesselAssignments).omit({
  id: true,
  assignedAt: true
});
export type InsertUserVesselAssignment = z.infer<typeof insertUserVesselAssignmentSchema>;
export type UserVesselAssignment = typeof userVesselAssignments.$inferSelect;

// Customers (owners, charterers, service providers)
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  customerType: text("customer_type").notNull(), // owner, charterer, service provider
  name: text("name").notNull(),
  companyName: text("company_name"),
  email: text("email"),
  phone: text("phone"),
  billingAddress: text("billing_address"),
  shippingAddress: text("shipping_address"),
  currencyPreference: text("currency_preference").default("USD"),
  paymentTerms: text("payment_terms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Accounts/Chart of Accounts
export const financialAccounts = pgTable("financial_accounts", {
  id: serial("id").primaryKey(),
  accountNumber: text("account_number").notNull().unique(),
  accountName: text("account_name").notNull(),
  accountType: text("account_type").notNull(), // asset, liability, equity, income, expense
  category: text("category").notNull(), // operational, maintenance, crew, fuel, docking fees, etc.
  description: text("description"),
  isActive: boolean("is_active").default(true),
  parentAccountId: integer("parent_account_id"), // Self-reference to support parent-child relationships
  balance: decimal("balance", { precision: 12, scale: 2 }).default("0").notNull(),
  vesselId: integer("vessel_id").references(() => vessels.id).notNull(),
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
  website: text("website"),
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
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
  status: text("status").notNull(), // draft, active, closed
  notes: text("notes"),
  vesselId: integer("vessel_id").references(() => vessels.id),
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
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
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

// Banking transactions - main financial transactions table (replacing old transactions table)
export const bankingTransactions = pgTable("banking_transactions", {
  id: serial("id").primaryKey(),
  transactionType: text("transaction_type").notNull(), // invoice, payment, expense, payroll, transfer
  transactionDate: timestamp("transaction_date").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 6 }).default("1").notNull(),
  description: text("description").notNull(),
  vesselId: integer("vessel_id").references(() => vessels.id),
  customerId: integer("customer_id").references(() => customers.id),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

const baseBankingTransactionSchema = createInsertSchema(bankingTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Create a custom schema that handles date string conversion and amount validation
export const insertBankingTransactionSchema = baseBankingTransactionSchema.extend({
  transactionDate: z.union([
    z.date(),
    z.string().transform((val) => new Date(val)),
  ]),
  amount: z.union([
    z.string(),
    z.number().transform((val) => val.toString()),
  ]),
});
export type InsertBankingTransaction = z.infer<typeof insertBankingTransactionSchema>;
export type BankingTransaction = typeof bankingTransactions.$inferSelect;

// Legacy transactions table reference for backwards compatibility during migration
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  transactionType: text("transaction_type").notNull(),
  transactionDate: timestamp("transaction_date").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 6 }).default("1").notNull(),
  description: text("description").notNull(),
  vesselId: integer("vessel_id").references(() => vessels.id),
  customerId: integer("customer_id").references(() => customers.id),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;

// Transaction Lines for double-entry bookkeeping
export const transactionLines = pgTable("transaction_lines", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").references(() => bankingTransactions.id).notNull(),
  accountId: integer("account_id").references(() => financialAccounts.id).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  isDebit: boolean("is_debit").notNull(), // true for debit, false for credit
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTransactionLineSchema = createInsertSchema(transactionLines).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertTransactionLine = z.infer<typeof insertTransactionLineSchema>;
export type TransactionLine = typeof transactionLines.$inferSelect;

// Expense transactions
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  expenseDate: timestamp("expense_date").notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(), // The column is named 'total' in the DB, not 'amount'
  // Note: currency is not in the database schema, but kept in the model for future migration
  // Leaving it out of the schema completely since it's not in the DB
  transactionId: integer("transaction_id").references(() => bankingTransactions.id, { onDelete: 'set null' }), // Making this nullable so expenses can exist without transactions
  vendorId: integer("vendor_id").references(() => vendors.id),
  vesselId: integer("vessel_id").references(() => vessels.id).notNull(),
  paymentMethod: text("payment_method").notNull(), // credit card, bank transfer, cash, etc.
  referenceNumber: text("reference_number"),
  status: text("status").notNull(), // draft, submitted, approved, paid
  receiptUrl: text("receipt_url"), // URL to receipt image/document
  notes: text("notes"),
  category: text("category").notNull(), // fuel, maintenance, dockage, crew, provisions, etc.
  accountId: integer("account_id").references(() => financialAccounts.id).notNull(),
  budgetId: integer("budget_id").references(() => budgets.id),
  approvedById: integer("approved_by_id").references(() => users.id),
  approvalDate: timestamp("approval_date"),
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

const baseExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Create a custom schema that handles date string conversion
export const insertExpenseSchema = baseExpenseSchema.extend({
  expenseDate: z.union([
    z.date(),
    z.string().transform((val) => new Date(val)),
  ]),
  // Add manual handling for currency since it's not in the database schema
  currency: z.string().default("USD").optional(),
});
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

// Expense Lines - detail lines for expenses
export const expenseLines = pgTable("expense_lines", {
  id: serial("id").primaryKey(),
  expenseId: integer("expense_id").references(() => expenses.id).notNull(),
  accountId: integer("account_id").references(() => financialAccounts.id).notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertExpenseLineSchema = createInsertSchema(expenseLines).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertExpenseLine = z.infer<typeof insertExpenseLineSchema>;
export type ExpenseLine = typeof expenseLines.$inferSelect;

// Deposits - for tracking money deposits to accounts
export const deposits = pgTable("deposits", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").references(() => bankingTransactions.id).notNull(),
  accountId: integer("account_id").references(() => financialAccounts.id).notNull(),
  vesselId: integer("vessel_id").references(() => vessels.id).notNull(),
  depositDate: timestamp("deposit_date").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 6 }).default("1.0"),
  description: text("description").notNull(),
  depositType: text("deposit_type").notNull(), // cash, check, wire, electronic, other
  depositNumber: text("deposit_number"), // Check number, wire confirmation, etc.
  depositedBy: integer("deposited_by").references(() => users.id),
  notes: text("notes"),
  status: text("status").default("completed").notNull(), // pending, completed, rejected, cancelled
  attachments: json("attachments"), // Scanned copies of deposit slips, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDepositSchema = createInsertSchema(deposits).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertDeposit = z.infer<typeof insertDepositSchema>;
export type Deposit = typeof deposits.$inferSelect;

// Invoices
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").references(() => bankingTransactions.id).notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  vesselId: integer("vessel_id").references(() => vessels.id),
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: text("status").notNull(), // draft, sent, paid, overdue, void
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  taxTotal: decimal("tax_total", { precision: 12, scale: 2 }).default("0"),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  balanceDue: decimal("balance_due", { precision: 12, scale: 2 }).notNull(),
  terms: text("terms"),
  notes: text("notes"),
  isRecurring: boolean("is_recurring").default(false),
  recurringFrequency: text("recurring_frequency"), // monthly, quarterly, etc.
  attachmentUrl: text("attachment_url"), // URL to invoice document
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

// Invoice Lines
export const invoiceLines = pgTable("invoice_lines", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }),
  accountId: integer("account_id").references(() => financialAccounts.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInvoiceLineSchema = createInsertSchema(invoiceLines).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertInvoiceLine = z.infer<typeof insertInvoiceLineSchema>;
export type InvoiceLine = typeof invoiceLines.$inferSelect;

// Payments received
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").references(() => bankingTransactions.id).notNull(),
  paymentDate: timestamp("payment_date").notNull(),
  paymentMethod: text("payment_method").notNull(), // credit card, bank transfer, etc.
  referenceNumber: text("reference_number"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 6 }).default("1").notNull(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  notes: text("notes"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// Payment Applications - links payments to invoices
export const paymentApplications = pgTable("payment_applications", {
  id: serial("id").primaryKey(),
  paymentId: integer("payment_id").references(() => payments.id).notNull(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  amountApplied: decimal("amount_applied", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPaymentApplicationSchema = createInsertSchema(paymentApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertPaymentApplication = z.infer<typeof insertPaymentApplicationSchema>;
export type PaymentApplication = typeof paymentApplications.$inferSelect;

// Bank accounts for reconciliation
export const bankAccounts = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  accountName: text("account_name").notNull(),
  accountNumber: text("account_number").notNull(),
  bankName: text("bank_name").notNull(),
  routingNumber: text("routing_number"),
  iban: text("iban"),
  swiftCode: text("swift_code"),
  currency: text("currency").default("USD").notNull(),
  accountType: text("account_type").notNull(), // checking, savings, credit
  openingBalance: decimal("opening_balance", { precision: 12, scale: 2 }).default("0"),
  currentBalance: decimal("current_balance", { precision: 12, scale: 2 }).default("0"),
  lastReconciledDate: timestamp("last_reconciled_date"),
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  vesselId: integer("vessel_id").references(() => vessels.id),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBankAccountSchema = createInsertSchema(bankAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type BankAccount = typeof bankAccounts.$inferSelect;

// Bank reconciliation 
export const bankReconciliations = pgTable("bank_reconciliations", {
  id: serial("id").primaryKey(),
  bankAccountId: integer("bank_account_id").references(() => bankAccounts.id).notNull(),
  statementDate: date("statement_date").notNull(),
  beginningBalance: decimal("beginning_balance", { precision: 12, scale: 2 }).notNull(),
  endingBalance: decimal("ending_balance", { precision: 12, scale: 2 }).notNull(),
  reconciledBalance: decimal("reconciled_balance", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull(), // in_progress, completed
  notes: text("notes"),
  completedBy: integer("completed_by").references(() => users.id),
  completedAt: timestamp("completed_at"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBankReconciliationSchema = createInsertSchema(bankReconciliations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertBankReconciliation = z.infer<typeof insertBankReconciliationSchema>;
export type BankReconciliation = typeof bankReconciliations.$inferSelect;

// Bank reconciliation items - links transactions to reconciliations
export const bankReconciliationItems = pgTable("bank_reconciliation_items", {
  id: serial("id").primaryKey(),
  reconciliationId: integer("reconciliation_id").references(() => bankReconciliations.id).notNull(),
  transactionId: integer("transaction_id").references(() => bankingTransactions.id).notNull(),
  isReconciled: boolean("is_reconciled").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBankReconciliationItemSchema = createInsertSchema(bankReconciliationItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertBankReconciliationItem = z.infer<typeof insertBankReconciliationItemSchema>;
export type BankReconciliationItem = typeof bankReconciliationItems.$inferSelect;

// Banking Providers
export const bankingProviders = pgTable("banking_providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  logoUrl: text("logo_url"),
  apiEndpoint: text("api_endpoint"),
  isActive: boolean("is_active").default(true),
  vesselId: integer("vessel_id").references(() => vessels.id),
  credentials: json("credentials"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBankingProviderSchema = createInsertSchema(bankingProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertBankingProvider = z.infer<typeof insertBankingProviderSchema>;
export type BankingProvider = typeof bankingProviders.$inferSelect;

// Bank Connections
export const bankConnections = pgTable("bank_connections", {
  id: serial("id").primaryKey(),
  vesselId: integer("vessel_id").references(() => vessels.id).notNull(),
  providerId: integer("provider_id").references(() => bankingProviders.id).notNull(),
  connectionStatus: text("connection_status").default("pending"),
  credentials: json("credentials"),
  lastSyncAt: timestamp("last_sync_at"),
  connectionDetails: json("connection_details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBankConnectionSchema = createInsertSchema(bankConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertBankConnection = z.infer<typeof insertBankConnectionSchema>;
export type BankConnection = typeof bankConnections.$inferSelect;

// Transaction Reconciliations
export const transactionReconciliations = pgTable("transaction_reconciliations", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").references(() => bankingTransactions.id).notNull(),
  expenseId: integer("expense_id").references(() => expenses.id),
  status: text("status").default("unmatched").notNull(),
  matchConfidence: real("match_confidence"),
  reconciledById: integer("reconciled_by").references(() => users.id),
  reconciledAt: timestamp("reconciled_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTransactionReconciliationSchema = createInsertSchema(transactionReconciliations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertTransactionReconciliation = z.infer<typeof insertTransactionReconciliationSchema>;
export type TransactionReconciliation = typeof transactionReconciliations.$inferSelect;

// Payroll runs 
export const payrollRuns = pgTable("payroll_runs", {
  id: serial("id").primaryKey(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  paymentDate: date("payment_date").notNull(),
  status: text("status").notNull(), // draft, processing, completed
  totalGross: decimal("total_gross", { precision: 12, scale: 2 }).default("0"),
  totalDeductions: decimal("total_deductions", { precision: 12, scale: 2 }).default("0"),
  totalNet: decimal("total_net", { precision: 12, scale: 2 }).default("0"),
  vesselId: integer("vessel_id").references(() => vessels.id),
  notes: text("notes"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPayrollRunSchema = createInsertSchema(payrollRuns).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertPayrollRun = z.infer<typeof insertPayrollRunSchema>;
export type PayrollRun = typeof payrollRuns.$inferSelect;

// Payroll items - individual crew payments
export const payrollItems = pgTable("payroll_items", {
  id: serial("id").primaryKey(),
  payrollRunId: integer("payroll_run_id").references(() => payrollRuns.id).notNull(),
  crewMemberId: integer("crew_member_id").references(() => crewMembers.id).notNull(),
  vesselId: integer("vessel_id").references(() => vessels.id),
  hoursWorked: decimal("hours_worked", { precision: 8, scale: 2 }),
  daysWorked: decimal("days_worked", { precision: 8, scale: 2 }),
  grossPay: decimal("gross_pay", { precision: 12, scale: 2 }).notNull(),
  deductions: decimal("deductions", { precision: 12, scale: 2 }).default("0"),
  netPay: decimal("net_pay", { precision: 12, scale: 2 }).notNull(),
  taxJurisdiction: text("tax_jurisdiction"),
  notes: text("notes"),
  transactionId: integer("transaction_id").references(() => bankingTransactions.id),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPayrollItemSchema = createInsertSchema(payrollItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertPayrollItem = z.infer<typeof insertPayrollItemSchema>;
export type PayrollItem = typeof payrollItems.$inferSelect;

// Payroll deductions
export const payrollDeductions = pgTable("payroll_deductions", {
  id: serial("id").primaryKey(),
  payrollItemId: integer("payroll_item_id").references(() => payrollItems.id).notNull(),
  deductionType: text("deduction_type").notNull(), // tax, insurance, advance, other
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPayrollDeductionSchema = createInsertSchema(payrollDeductions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertPayrollDeduction = z.infer<typeof insertPayrollDeductionSchema>;
export type PayrollDeduction = typeof payrollDeductions.$inferSelect;

// Financial reports
// Financial categories for expense classification
export const financialCategories = pgTable("financial_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  parentCategoryId: integer("parent_category_id"),
  level: integer("level").default(1).notNull(), // For hierarchical categorization
  isActive: boolean("is_active").default(true),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Add self-referential relation after table creation to avoid circular reference errors
export const financialCategoriesRelations = relations(financialCategories, ({ one }) => ({
  parentCategory: one(financialCategories, {
    fields: [financialCategories.parentCategoryId],
    references: [financialCategories.id],
  }),
  createdBy: one(users, {
    fields: [financialCategories.createdById],
    references: [users.id],
  }),
}));

export const insertFinancialCategorySchema = createInsertSchema(financialCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertFinancialCategory = z.infer<typeof insertFinancialCategorySchema>;
export type FinancialCategory = typeof financialCategories.$inferSelect;

export const financialReports = pgTable("financial_reports", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  reportType: text("report_type").notNull(), // balance_sheet, profit_loss, cash_flow, budget_comparison, tax_report
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  vesselId: integer("vessel_id").references(() => vessels.id),
  currency: text("currency").default("USD").notNull(),
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

// Tax information for multiple jurisdictions
export const taxInformation = pgTable("tax_information", {
  id: serial("id").primaryKey(),
  jurisdictionName: text("jurisdiction_name").notNull(),
  jurisdictionCode: text("jurisdiction_code").notNull(),
  taxType: text("tax_type").notNull(), // vat, sales_tax, income_tax, etc.
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }),
  effectiveDate: date("effective_date").notNull(),
  expiryDate: date("expiry_date"),
  registrationNumber: text("registration_number"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTaxInformationSchema = createInsertSchema(taxInformation).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertTaxInformation = z.infer<typeof insertTaxInformationSchema>;
export type TaxInformation = typeof taxInformation.$inferSelect;

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
  bankAccountId: integer("bank_account_id").references(() => bankAccounts.id),
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

// ISM Task Management System

// 1. Form Categories
export const formCategories = pgTable("form_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFormCategorySchema = createInsertSchema(formCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertFormCategory = z.infer<typeof insertFormCategorySchema>;
export type FormCategory = typeof formCategories.$inferSelect;

// 2. Form Templates
export const formTemplates = pgTable("form_templates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  categoryId: integer("category_id").references(() => formCategories.id).notNull(),
  originalFilename: text("original_filename"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdById: integer("created_by_id").references(() => users.id),
});

export const insertFormTemplateSchema = createInsertSchema(formTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertFormTemplate = z.infer<typeof insertFormTemplateSchema>;
export type FormTemplate = typeof formTemplates.$inferSelect;

// 3. Form Template Versions
export const formTemplateVersions = pgTable("form_template_versions", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => formTemplates.id).notNull(),
  versionNumber: text("version_number").notNull(),
  structureDefinition: json("structure_definition").notNull(), // JSON structure defining the form fields and layout
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdById: integer("created_by_id").references(() => users.id),
});

export const insertFormTemplateVersionSchema = createInsertSchema(formTemplateVersions).omit({
  id: true,
  createdAt: true
});
export type InsertFormTemplateVersion = z.infer<typeof insertFormTemplateVersionSchema>;
export type FormTemplateVersion = typeof formTemplateVersions.$inferSelect;

// 4. ISM Tasks
export const ismTasks = pgTable("ism_tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  formTemplateVersionId: integer("form_template_version_id").references(() => formTemplateVersions.id).notNull(),
  assignedToId: integer("assigned_to_id").references(() => users.id).notNull(),
  vesselId: integer("vessel_id"),
  dueDate: timestamp("due_date"),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, overdue, reviewed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdById: integer("created_by_id").references(() => users.id),
});

// Create a base schema then customize the dueDate field to handle string dates too
const baseIsmTaskSchema = createInsertSchema(ismTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertIsmTaskSchema = baseIsmTaskSchema.extend({
  dueDate: z.union([
    z.date(),
    z.string().transform((val) => new Date(val)),
    z.null()
  ]).optional()
});
export type InsertIsmTask = z.infer<typeof insertIsmTaskSchema>;
export type IsmTask = typeof ismTasks.$inferSelect;

// 5. Form Submissions
export const formSubmissions = pgTable("form_submissions", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => ismTasks.id).notNull(),
  submittedById: integer("submitted_by_id").references(() => users.id).notNull(),
  submissionData: json("submission_data").notNull(), // JSON data containing form values
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewStatus: text("review_status"), // approved, rejected, feedback_required
  reviewComments: text("review_comments"),
});

export const insertFormSubmissionSchema = createInsertSchema(formSubmissions).omit({
  id: true,
  submittedAt: true
});
export type InsertFormSubmission = z.infer<typeof insertFormSubmissionSchema>;
export type FormSubmission = typeof formSubmissions.$inferSelect;

// 6. Task Comments
export const taskComments = pgTable("task_comments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => ismTasks.id).notNull(),
  commenterId: integer("commenter_id").references(() => users.id).notNull(),
  commentText: text("comment_text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTaskCommentSchema = createInsertSchema(taskComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertTaskComment = z.infer<typeof insertTaskCommentSchema>;
export type TaskComment = typeof taskComments.$inferSelect;

// Banking Integration Schema

// Banking API Providers
export const bankingApiProviders = pgTable("banking_api_providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  apiType: text("api_type").notNull(), // centtrip, revolut, etc.
  baseUrl: text("base_url").notNull(),
  isActive: boolean("is_active").default(true),
  authType: text("auth_type").notNull(), // oauth, api_key, etc.
  requiredCredentials: json("required_credentials").notNull(), // Fields needed for connection
  defaultHeaders: json("default_headers"), // Default headers for API calls
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBankingApiProviderSchema = createInsertSchema(bankingApiProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertBankingApiProvider = z.infer<typeof insertBankingApiProviderSchema>;
export type BankingApiProvider = typeof bankingApiProviders.$inferSelect;

// Banking API Connections - stores credentials and connection info
export const bankApiConnections = pgTable("bank_api_connections", {
  id: serial("id").primaryKey(),
  bankAccountId: integer("bank_account_id").references(() => bankAccounts.id).notNull(),
  providerId: integer("provider_id").references(() => bankingApiProviders.id).notNull(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true),
  credentials: json("credentials").notNull(), // Encrypted credentials (tokens, keys)
  lastSyncDate: timestamp("last_sync_date"),
  refreshToken: text("refresh_token"),
  tokenExpiryDate: timestamp("token_expiry_date"),
  connectionMetadata: json("connection_metadata"), // Additional data specific to provider
  syncFrequency: text("sync_frequency").default("daily"), // daily, hourly, manual
  syncStatus: text("sync_status").default("pending"), // pending, in_progress, completed, failed
  lastSyncResult: text("last_sync_result"),
  lastSyncError: text("last_sync_error"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBankApiConnectionSchema = createInsertSchema(bankApiConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertBankApiConnection = z.infer<typeof insertBankApiConnectionSchema>;
export type BankApiConnection = typeof bankApiConnections.$inferSelect;

// Bank API Transactions - imported from banking API
export const bankApiTransactions = pgTable("bank_api_transactions", {
  id: serial("id").primaryKey(),
  connectionId: integer("connection_id").references(() => bankApiConnections.id).notNull(),
  bankAccountId: integer("bank_account_id").references(() => bankAccounts.id).notNull(),
  externalId: text("external_id").notNull(), // ID from the external banking system
  transactionDate: timestamp("transaction_date").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
  type: text("type").notNull(), // debit, credit
  category: text("category"), // From bank categorization if available
  merchant: text("merchant"), // From bank information if available
  reference: text("reference"),
  status: text("status").notNull(), // pending, settled, rejected
  metadata: json("metadata"), // Raw data from API
  isReconciled: boolean("is_reconciled").default(false),
  matchedTransactionId: integer("matched_transaction_id").references(() => transactions.id), // Link to internal transaction
  matchedExpenseId: integer("matched_expense_id").references(() => expenses.id), // Link to expense
  matchConfidence: real("match_confidence"), // Confidence score (0-1) for automated matching
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBankApiTransactionSchema = createInsertSchema(bankApiTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertBankApiTransaction = z.infer<typeof insertBankApiTransactionSchema>;
export type BankApiTransaction = typeof bankApiTransactions.$inferSelect;

// Sync history
export const bankSyncLogs = pgTable("bank_sync_logs", {
  id: serial("id").primaryKey(),
  connectionId: integer("connection_id").references(() => bankApiConnections.id).notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  status: text("status").notNull(), // started, completed, failed
  recordsFetched: integer("records_fetched"),
  recordsProcessed: integer("records_processed"),
  recordsMatched: integer("records_matched"),
  recordsFailed: integer("records_failed"),
  errorMessage: text("error_message"),
  requestDetails: json("request_details"), // Request parameters
  responseDetails: json("response_details"), // API response summary
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBankSyncLogSchema = createInsertSchema(bankSyncLogs).omit({
  id: true,
  createdAt: true
});
export type InsertBankSyncLog = z.infer<typeof insertBankSyncLogSchema>;
export type BankSyncLog = typeof bankSyncLogs.$inferSelect;
