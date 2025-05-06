import { 
  users, type User, type InsertUser,
  equipment, type Equipment, type InsertEquipment,
  maintenanceTasks, type MaintenanceTask, type InsertMaintenanceTask,
  inventoryItems, type InventoryItem, type InsertInventoryItem,
  activityLogs, type ActivityLog, type InsertActivityLog,
  maintenanceHistory, type MaintenanceHistory, type InsertMaintenanceHistory,
  predictiveMaintenance, type PredictiveMaintenance, type InsertPredictiveMaintenance,
  ismDocuments, type IsmDocument, type InsertIsmDocument,
  ismAudits, type IsmAudit, type InsertIsmAudit,
  ismTraining, type IsmTraining, type InsertIsmTraining,
  ismIncidents, type IsmIncident, type InsertIsmIncident,
  crewMembers, type CrewMember, type InsertCrewMember,
  crewDocuments, type CrewDocument, type InsertCrewDocument,
  voyages, type Voyage, type InsertVoyage,
  waypoints, type Waypoint, type InsertWaypoint,
  fuelConsumptionChart, type FuelConsumptionChart, type InsertFuelConsumptionChart,
  speedChart, type SpeedChart, type InsertSpeedChart,
  vessels, type Vessel, type InsertVessel,
  userVesselAssignments, type UserVesselAssignment, type InsertUserVesselAssignment,
  // New ISM Task Management imports
  formCategories, type FormCategory, type InsertFormCategory,
  formTemplates, type FormTemplate, type InsertFormTemplate,
  formTemplateVersions, type FormTemplateVersion, type InsertFormTemplateVersion,
  ismTasks, type IsmTask, type InsertIsmTask,
  formSubmissions, type FormSubmission, type InsertFormSubmission,
  taskComments, type TaskComment, type InsertTaskComment,
  // Financial Management imports
  financialAccounts, type FinancialAccount, type InsertFinancialAccount,
  vendors, type Vendor, type InsertVendor,
  budgets, type Budget, type InsertBudget,
  budgetAllocations, type BudgetAllocation, type InsertBudgetAllocation,
  expenses, type Expense, type InsertExpense, 
  // transactions, type Transaction, type InsertTransaction, // Old transaction table - being migrated
  bankingTransactions, type BankingTransaction, type InsertBankingTransaction,
  transactionLines, type TransactionLine, type InsertTransactionLine,
  deposits, type Deposit, type InsertDeposit,
  // Banking Integration imports
  bankAccounts, type BankAccount, type InsertBankAccount,
  bankingApiProviders, type BankingApiProvider, type InsertBankingApiProvider,
  bankApiConnections, type BankApiConnection, type InsertBankApiConnection,
  bankApiTransactions, type BankApiTransaction, type InsertBankApiTransaction,
  bankSyncLogs, type BankSyncLog, type InsertBankSyncLog,
  // New Banking Provider imports
  bankingProviders, type BankingProvider, type InsertBankingProvider,
  bankConnections, type BankConnection, type InsertBankConnection,
  transactionReconciliations, type TransactionReconciliation, type InsertTransactionReconciliation
} from "@shared/schema";
import { db } from "./db";
import { eq, and, lt, gt, between, desc, asc } from "drizzle-orm";
import session from "express-session";
import { z } from "zod";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // These are the only types we need for now, so the LSP errors are fine
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getActiveUsers(): Promise<User[]>;
  
  // Session store for authentication
  sessionStore: any; // Using 'any' for session store compatibility

  // Vessel operations
  getVessel(id: number): Promise<Vessel | undefined>;
  getAllVessels(): Promise<Vessel[]>;
  getActiveVessels(): Promise<Vessel[]>;
  createVessel(vessel: InsertVessel): Promise<Vessel>;
  updateVessel(id: number, vessel: Partial<Vessel>): Promise<Vessel | undefined>;
  deleteVessel(id: number): Promise<boolean>;
  
  // User-Vessel Assignment operations
  getUserVesselAssignment(id: number): Promise<UserVesselAssignment | undefined>;
  getUserVesselAssignments(userId: number): Promise<UserVesselAssignment[]>;
  getVesselUserAssignments(vesselId: number): Promise<UserVesselAssignment[]>;
  createUserVesselAssignment(assignment: InsertUserVesselAssignment): Promise<UserVesselAssignment>;
  updateUserVesselAssignment(id: number, assignment: Partial<UserVesselAssignment>): Promise<UserVesselAssignment | undefined>;
  deleteUserVesselAssignment(id: number): Promise<boolean>;

  // Equipment operations
  getEquipment(id: number): Promise<Equipment | undefined>;
  getAllEquipment(): Promise<Equipment[]>;
  getEquipmentByCategory(category: string): Promise<Equipment[]>;
  createEquipment(equipment: InsertEquipment): Promise<Equipment>;
  updateEquipment(id: number, equipment: Partial<Equipment>): Promise<Equipment | undefined>;
  deleteEquipment(id: number): Promise<boolean>;

  // Maintenance task operations
  getMaintenanceTask(id: number): Promise<MaintenanceTask | undefined>;
  getAllMaintenanceTasks(): Promise<MaintenanceTask[]>;
  getMaintenanceTasksByStatus(status: string): Promise<MaintenanceTask[]>;
  getMaintenanceTasksByEquipment(equipmentId: number): Promise<MaintenanceTask[]>;
  getMaintenanceTasksByAssignee(userId: number): Promise<MaintenanceTask[]>;
  getDueMaintenanceTasks(): Promise<MaintenanceTask[]>;
  getUpcomingMaintenanceTasks(): Promise<MaintenanceTask[]>;
  createMaintenanceTask(task: InsertMaintenanceTask): Promise<MaintenanceTask>;
  updateMaintenanceTask(id: number, task: Partial<MaintenanceTask>): Promise<MaintenanceTask | undefined>;
  deleteMaintenanceTask(id: number): Promise<boolean>;

  // Inventory operations
  getInventoryItem(id: number): Promise<InventoryItem | undefined>;
  getAllInventoryItems(): Promise<InventoryItem[]>;
  getLowStockInventoryItems(): Promise<InventoryItem[]>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: number, item: Partial<InventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: number): Promise<boolean>;

  // Activity log operations
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getRecentActivityLogs(limit: number): Promise<ActivityLog[]>;
  
  // Maintenance history operations
  getMaintenanceHistory(id: number): Promise<MaintenanceHistory | undefined>;
  getMaintenanceHistoryByEquipment(equipmentId: number): Promise<MaintenanceHistory[]>;
  createMaintenanceHistory(history: InsertMaintenanceHistory): Promise<MaintenanceHistory>;
  updateMaintenanceHistory(id: number, history: Partial<MaintenanceHistory>): Promise<MaintenanceHistory | undefined>;
  deleteMaintenanceHistory(id: number): Promise<boolean>;
  
  // Predictive maintenance operations
  getPredictiveMaintenance(id: number): Promise<PredictiveMaintenance | undefined>;
  getPredictiveMaintenanceByEquipment(equipmentId: number): Promise<PredictiveMaintenance[]>;
  createPredictiveMaintenance(prediction: InsertPredictiveMaintenance): Promise<PredictiveMaintenance>;
  updatePredictiveMaintenance(id: number, prediction: Partial<PredictiveMaintenance>): Promise<PredictiveMaintenance | undefined>;
  deletePredictiveMaintenance(id: number): Promise<boolean>;
  generatePredictiveMaintenanceForEquipment(equipmentId: number): Promise<PredictiveMaintenance[]>;
  
  // ISM Document operations
  getIsmDocument(id: number): Promise<IsmDocument | undefined>;
  getAllIsmDocuments(): Promise<IsmDocument[]>;
  getIsmDocumentsByType(documentType: string): Promise<IsmDocument[]>;
  getIsmDocumentsByStatus(status: string): Promise<IsmDocument[]>;
  getIsmDocumentsForReview(): Promise<IsmDocument[]>;
  createIsmDocument(document: InsertIsmDocument): Promise<IsmDocument>;
  updateIsmDocument(id: number, document: Partial<IsmDocument>): Promise<IsmDocument | undefined>;
  deleteIsmDocument(id: number): Promise<boolean>;
  
  // ISM Audit operations
  getIsmAudit(id: number): Promise<IsmAudit | undefined>;
  getAllIsmAudits(): Promise<IsmAudit[]>;
  getIsmAuditsByType(auditType: string): Promise<IsmAudit[]>;
  getIsmAuditsByStatus(status: string): Promise<IsmAudit[]>;
  getUpcomingIsmAudits(): Promise<IsmAudit[]>;
  createIsmAudit(audit: InsertIsmAudit): Promise<IsmAudit>;
  updateIsmAudit(id: number, audit: Partial<IsmAudit>): Promise<IsmAudit | undefined>;
  deleteIsmAudit(id: number): Promise<boolean>;
  
  // ISM Training operations
  getIsmTraining(id: number): Promise<IsmTraining | undefined>;
  getAllIsmTraining(): Promise<IsmTraining[]>;
  getIsmTrainingByType(trainingType: string): Promise<IsmTraining[]>;
  getIsmTrainingByStatus(status: string): Promise<IsmTraining[]>;
  getIsmTrainingByParticipant(userId: number): Promise<IsmTraining[]>;
  getUpcomingIsmTraining(): Promise<IsmTraining[]>;
  createIsmTraining(training: InsertIsmTraining): Promise<IsmTraining>;
  updateIsmTraining(id: number, training: Partial<IsmTraining>): Promise<IsmTraining | undefined>;
  deleteIsmTraining(id: number): Promise<boolean>;
  
  // ISM Incident operations
  getIsmIncident(id: number): Promise<IsmIncident | undefined>;
  getAllIsmIncidents(): Promise<IsmIncident[]>;
  getIsmIncidentsByType(incidentType: string): Promise<IsmIncident[]>;
  getIsmIncidentsByStatus(status: string): Promise<IsmIncident[]>;
  getIsmIncidentsByReporter(userId: number): Promise<IsmIncident[]>;
  getOpenIsmIncidents(): Promise<IsmIncident[]>;
  createIsmIncident(incident: InsertIsmIncident): Promise<IsmIncident>;
  updateIsmIncident(id: number, incident: Partial<IsmIncident>): Promise<IsmIncident | undefined>;
  deleteIsmIncident(id: number): Promise<boolean>;
  
  // Crew operations
  getCrewMember(id: number): Promise<CrewMember | undefined>;
  getAllCrewMembers(): Promise<CrewMember[]>;
  getCrewMembersByStatus(status: string): Promise<CrewMember[]>;
  getCrewMembersByPosition(position: string): Promise<CrewMember[]>;
  createCrewMember(member: InsertCrewMember): Promise<CrewMember>;
  updateCrewMember(id: number, member: Partial<CrewMember>): Promise<CrewMember | undefined>;
  deleteCrewMember(id: number): Promise<boolean>;
  
  // Crew Document operations
  getCrewDocument(id: number): Promise<CrewDocument | undefined>;
  getCrewDocumentsByCrewMember(crewMemberId: number): Promise<CrewDocument[]>;
  getCrewDocumentsByType(documentType: string): Promise<CrewDocument[]>;
  getCrewDocumentsByVerificationStatus(status: string): Promise<CrewDocument[]>;
  getExpiringCrewDocuments(daysThreshold: number): Promise<CrewDocument[]>;
  createCrewDocument(document: InsertCrewDocument): Promise<CrewDocument>;
  updateCrewDocument(id: number, document: Partial<CrewDocument>): Promise<CrewDocument | undefined>;
  deleteCrewDocument(id: number): Promise<boolean>;
  
  // Voyage Planning operations
  getVoyage(id: number): Promise<Voyage | null>;
  getVoyagesByVessel(vesselId: number): Promise<Voyage[]>;
  getVoyagesByStatus(status: string): Promise<Voyage[]>;
  createVoyage(voyage: InsertVoyage): Promise<Voyage>;
  updateVoyage(id: number, voyage: Partial<Voyage>): Promise<Voyage | null>;
  deleteVoyage(id: number): Promise<boolean>;
  
  // Waypoint operations
  getWaypoint(id: number): Promise<Waypoint | null>;
  getWaypointsByVoyage(voyageId: number): Promise<Waypoint[]>;
  createWaypoint(waypoint: InsertWaypoint): Promise<Waypoint>;
  updateWaypoint(id: number, waypoint: Partial<Waypoint>): Promise<Waypoint | null>;
  deleteWaypoint(id: number): Promise<boolean>;
  
  // Fuel Consumption Chart operations
  getFuelConsumptionData(vesselId: number): Promise<FuelConsumptionChart[]>;
  addFuelConsumptionDataPoint(dataPoint: InsertFuelConsumptionChart): Promise<FuelConsumptionChart>;
  updateFuelConsumptionDataPoint(id: number, dataPoint: Partial<FuelConsumptionChart>): Promise<FuelConsumptionChart | null>;
  deleteFuelConsumptionDataPoint(id: number): Promise<boolean>;
  
  // Speed Chart operations
  getSpeedData(vesselId: number): Promise<SpeedChart[]>;
  addSpeedDataPoint(dataPoint: InsertSpeedChart): Promise<SpeedChart>;
  updateSpeedDataPoint(id: number, dataPoint: Partial<SpeedChart>): Promise<SpeedChart | null>;
  deleteSpeedDataPoint(id: number): Promise<boolean>;
  
  // ISM Task Management - Form Categories operations
  getFormCategory(id: number): Promise<FormCategory | undefined>;
  getAllFormCategories(): Promise<FormCategory[]>;
  createFormCategory(category: InsertFormCategory): Promise<FormCategory>;
  updateFormCategory(id: number, category: Partial<FormCategory>): Promise<FormCategory | undefined>;
  deleteFormCategory(id: number): Promise<boolean>;
  
  // ISM Task Management - Form Templates operations
  getFormTemplate(id: number): Promise<FormTemplate | undefined>;
  getAllFormTemplates(): Promise<FormTemplate[]>;
  getFormTemplatesByCategory(categoryId: number): Promise<FormTemplate[]>;
  createFormTemplate(template: InsertFormTemplate): Promise<FormTemplate>;
  updateFormTemplate(id: number, template: Partial<FormTemplate>): Promise<FormTemplate | undefined>;
  deleteFormTemplate(id: number): Promise<boolean>;
  
  // ISM Task Management - Form Template Versions operations
  getFormTemplateVersion(id: number): Promise<FormTemplateVersion | undefined>;
  getFormTemplateVersionsByTemplate(templateId: number): Promise<FormTemplateVersion[]>;
  getActiveFormTemplateVersion(templateId: number): Promise<FormTemplateVersion | undefined>;
  createFormTemplateVersion(version: InsertFormTemplateVersion): Promise<FormTemplateVersion>;
  activateFormTemplateVersion(id: number): Promise<FormTemplateVersion | undefined>;
  updateFormTemplateVersion(id: number, version: Partial<FormTemplateVersion>): Promise<FormTemplateVersion | undefined>;
  deleteFormTemplateVersion(id: number): Promise<boolean>;
  
  // ISM Task Management - ISM Tasks operations
  getIsmTask(id: number): Promise<IsmTask | undefined>;
  getAllIsmTasks(): Promise<IsmTask[]>;
  getIsmTasksByVessel(vesselId: number): Promise<IsmTask[]>;
  getIsmTasksByStatus(status: string): Promise<IsmTask[]>;
  getIsmTasksByAssignee(userId: number): Promise<IsmTask[]>;
  getDueIsmTasks(): Promise<IsmTask[]>;
  getIsmTasksByTemplateVersion(versionId: number): Promise<IsmTask[]>;
  createIsmTask(task: InsertIsmTask): Promise<IsmTask>;
  updateIsmTask(id: number, task: Partial<IsmTask>): Promise<IsmTask | undefined>;
  deleteIsmTask(id: number): Promise<boolean>;
  
  // ISM Task Management - Form Submissions operations
  getFormSubmission(id: number): Promise<FormSubmission | undefined>;
  getFormSubmissionsByTask(taskId: number): Promise<FormSubmission[]>;
  getRecentFormSubmissions(limit?: number): Promise<FormSubmission[]>;
  createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission>;
  updateFormSubmission(id: number, submission: Partial<FormSubmission>): Promise<FormSubmission | undefined>;
  deleteFormSubmission(id: number): Promise<boolean>;
  
  // ISM Task Management - Task Comments operations
  getTaskComment(id: number): Promise<TaskComment | undefined>;
  getTaskCommentsByTask(taskId: number): Promise<TaskComment[]>;
  createTaskComment(comment: InsertTaskComment): Promise<TaskComment>;
  
  // Vendor operations
  getVendor(id: number): Promise<Vendor | undefined>;
  getAllVendors(): Promise<Vendor[]>;
  getActiveVendors(): Promise<Vendor[]>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: number, vendor: Partial<Vendor>): Promise<Vendor | undefined>;
  deleteVendor(id: number): Promise<boolean>;
  
  // Financial Account operations
  getFinancialAccount(id: number): Promise<FinancialAccount | undefined>;
  getFinancialAccountsByVessel(vesselId: number): Promise<FinancialAccount[]>;
  getActiveFinancialAccounts(vesselId: number): Promise<FinancialAccount[]>;
  createFinancialAccount(account: InsertFinancialAccount): Promise<FinancialAccount>;
  updateFinancialAccount(id: number, account: Partial<FinancialAccount>): Promise<FinancialAccount | undefined>;
  deleteFinancialAccount(id: number): Promise<boolean>;
  updateTaskComment(id: number, comment: Partial<TaskComment>): Promise<TaskComment | undefined>;
  deleteTaskComment(id: number): Promise<boolean>;
  
  // Financial Account operations
  getFinancialAccount(id: number): Promise<FinancialAccount | undefined>;
  getFinancialAccountsByVessel(vesselId: number): Promise<FinancialAccount[]>;
  getAllFinancialAccounts(): Promise<FinancialAccount[]>;
  getFinancialAccountByCategory(category: string): Promise<FinancialAccount[]>;
  createFinancialAccount(account: InsertFinancialAccount): Promise<FinancialAccount>;
  updateFinancialAccount(id: number, account: Partial<FinancialAccount>): Promise<FinancialAccount | undefined>;
  deleteFinancialAccount(id: number): Promise<boolean>;
  
  // Bank Account operations
  getBankAccount(id: number): Promise<BankAccount | undefined>;
  getAllBankAccounts(): Promise<BankAccount[]>;
  getActiveBankAccounts(): Promise<BankAccount[]>;
  getBankAccountsByVessel(vesselId: number): Promise<BankAccount[]>;
  createBankAccount(account: InsertBankAccount): Promise<BankAccount>;
  updateBankAccount(id: number, account: Partial<BankAccount>): Promise<BankAccount | undefined>;
  deleteBankAccount(id: number): Promise<boolean>;
  
  // Banking Provider operations
  getBankingProvider(id: number): Promise<BankingProvider | undefined>;
  getBankingProvidersByVessel(vesselId: number): Promise<BankingProvider[]>;
  getAllBankingProviders(): Promise<BankingProvider[]>;
  getActiveBankingProviders(): Promise<BankingProvider[]>;
  createBankingProvider(provider: InsertBankingProvider): Promise<BankingProvider>;
  updateBankingProvider(id: number, provider: Partial<BankingProvider>): Promise<BankingProvider | undefined>;
  deleteBankingProvider(id: number): Promise<boolean>;
  
  // Bank Connection operations
  getBankConnection(id: number): Promise<BankConnection | undefined>;
  getBankConnectionsByVessel(vesselId: number): Promise<BankConnection[]>;
  getBankConnectionsByProvider(providerId: number): Promise<BankConnection[]>;
  getActiveBankConnections(vesselId: number): Promise<BankConnection[]>;
  createBankConnection(connection: InsertBankConnection): Promise<BankConnection>;
  updateBankConnection(id: number, connection: Partial<BankConnection>): Promise<BankConnection | undefined>;
  deleteBankConnection(id: number): Promise<boolean>;
  
  // Transaction Reconciliation operations
  getTransactionReconciliation(id: number): Promise<TransactionReconciliation | undefined>;
  getTransactionReconciliationByTransaction(transactionId: number): Promise<TransactionReconciliation | undefined>;
  getTransactionReconciliationByExpense(expenseId: number): Promise<TransactionReconciliation | undefined>;
  getUnmatchedTransactions(vesselId: number): Promise<Transaction[]>;
  getMatchedTransactions(vesselId: number): Promise<Transaction[]>;
  getBankingTransactionsByVessel(vesselId: number): Promise<BankingTransaction[]>;
  createTransactionReconciliation(reconciliation: InsertTransactionReconciliation): Promise<TransactionReconciliation>;
  updateTransactionReconciliation(id: number, reconciliation: Partial<TransactionReconciliation>): Promise<TransactionReconciliation | undefined>;
  deleteTransactionReconciliation(id: number): Promise<boolean>;
  
  // Legacy Banking API operations
  getBankingApiProvider(id: number): Promise<BankingApiProvider | undefined>;
  getBankingApiProviderByType(apiType: string): Promise<BankingApiProvider | undefined>;
  getAllBankingApiProviders(): Promise<BankingApiProvider[]>;
  getActiveBankingApiProviders(): Promise<BankingApiProvider[]>;
  
  // Banking API Connection operations
  getBankApiConnection(id: number): Promise<BankApiConnection | undefined>;
  getBankApiConnections(): Promise<BankApiConnection[]>; 
  getBankApiConnectionsByBankAccount(bankAccountId: number): Promise<BankApiConnection[]>;
  getActiveBankApiConnections(): Promise<BankApiConnection[]>;
  createBankApiConnection(connection: InsertBankApiConnection): Promise<BankApiConnection>;
  updateBankApiConnection(id: number, connection: Partial<BankApiConnection>): Promise<BankApiConnection | undefined>;
  deleteBankApiConnection(id: number): Promise<boolean>;
  
  // Banking API Transaction operations
  getBankApiTransaction(id: number): Promise<BankApiTransaction | undefined>;
  getBankApiTransactionsByConnection(connectionId: number): Promise<BankApiTransaction[]>;
  getBankApiTransactionsByBankAccount(bankAccountId: number): Promise<BankApiTransaction[]>;
  getBankApiTransactionsByDateRange(bankAccountId: number, startDate: Date, endDate: Date): Promise<BankApiTransaction[]>;
  getUnreconciledBankApiTransactions(bankAccountId: number): Promise<BankApiTransaction[]>;
  createBankApiTransaction(transaction: InsertBankApiTransaction): Promise<BankApiTransaction>;
  createBulkBankApiTransactions(transactions: InsertBankApiTransaction[]): Promise<BankApiTransaction[]>;
  updateBankApiTransaction(id: number, transaction: Partial<BankApiTransaction>): Promise<BankApiTransaction | undefined>;
  
  // Bank Sync Log operations
  getBankSyncLog(id: number): Promise<BankSyncLog | undefined>;
  getBankSyncLogsByConnection(connectionId: number): Promise<BankSyncLog[]>;
  getRecentBankSyncLogs(limit?: number): Promise<BankSyncLog[]>;
  createBankSyncLog(log: InsertBankSyncLog): Promise<BankSyncLog>;
  updateBankSyncLog(id: number, log: Partial<BankSyncLog>): Promise<BankSyncLog | undefined>;
  
  // Budget operations
  getBudget(id: number): Promise<Budget | undefined>;
  getBudgetsByVessel(vesselId: number): Promise<Budget[]>;
  getActiveBudgets(): Promise<Budget[]>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: number, budget: Partial<Budget>): Promise<Budget | undefined>;
  deleteBudget(id: number): Promise<boolean>;
  
  // Budget Allocation operations
  getBudgetAllocation(id: number): Promise<BudgetAllocation | undefined>;
  getBudgetAllocationsByBudget(budgetId: number): Promise<BudgetAllocation[]>;
  getBudgetAllocationsByAccount(accountId: number): Promise<BudgetAllocation[]>;
  createBudgetAllocation(allocation: InsertBudgetAllocation): Promise<BudgetAllocation>;
  updateBudgetAllocation(id: number, allocation: Partial<BudgetAllocation>): Promise<BudgetAllocation | undefined>;
  deleteBudgetAllocation(id: number): Promise<boolean>;
  
  // Expense operations
  getExpense(id: number): Promise<Expense | undefined>;
  getExpensesByVessel(vesselId: number): Promise<Expense[]>;
  getExpensesByBudget(budgetId: number): Promise<Expense[]>;
  getExpensesByAccount(accountId: number): Promise<Expense[]>;
  getExpensesByCategory(category: string): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  createBulkExpenses(expenses: InsertExpense[]): Promise<Expense[]>;
  updateExpense(id: number, expense: Partial<Expense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;
  // Receipt reconciliation methods
  getUnreconciledExpenses(vesselId?: number): Promise<Expense[]>;
  updateExpenseReceipt(id: number, receiptUrl: string): Promise<Expense | undefined>;
  
  // Deposit operations
  getDeposit(id: number): Promise<Deposit | undefined>;
  getDepositsByVessel(vesselId: number): Promise<Deposit[]>;
  getDepositsByAccount(accountId: number): Promise<Deposit[]>;
  createDeposit(deposit: InsertDeposit): Promise<Deposit>;
  createBulkDeposits(deposits: InsertDeposit[]): Promise<Deposit[]>;
  updateDeposit(id: number, deposit: Partial<Deposit>): Promise<Deposit | undefined>;
  deleteDeposit(id: number): Promise<boolean>;
  
  // Legacy Transaction operations (to be migrated)
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByVessel(vesselId: number): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: any): Promise<Transaction>;
  
  // Banking Transaction operations
  getBankingTransaction(id: number): Promise<BankingTransaction | undefined>;
  getBankingTransactionsByVessel(vesselId: number): Promise<BankingTransaction[]>;
  getAllBankingTransactions(): Promise<BankingTransaction[]>;
  createBankingTransaction(transaction: InsertBankingTransaction): Promise<BankingTransaction>;
  updateBankingTransaction(id: number, transaction: Partial<BankingTransaction>): Promise<BankingTransaction | undefined>;
  deleteBankingTransaction(id: number): Promise<boolean>;
  getUnmatchedBankingTransactions(vesselId: number): Promise<BankingTransaction[]>;
  
  // Transaction Line operations
  getTransactionLines(transactionId: number): Promise<TransactionLine[]>;
  getTransactionLinesByTransactionIds(transactionIds: number[]): Promise<TransactionLine[]>;
  createTransactionLine(line: InsertTransactionLine): Promise<TransactionLine>;
  updateTransactionLine(id: number, line: Partial<TransactionLine>): Promise<TransactionLine | undefined>;
  deleteTransactionLine(id: number): Promise<boolean>;
  
  // Banking API Provider operations
  getBankingApiProvider(id: number): Promise<BankingApiProvider | undefined>;
  getBankingApiProviderByType(apiType: string): Promise<BankingApiProvider | undefined>;
  getAllBankingApiProviders(): Promise<BankingApiProvider[]>;
  getActiveBankingApiProviders(): Promise<BankingApiProvider[]>;
  
  // Banking API Connection operations
  getBankApiConnection(id: number): Promise<BankApiConnection | undefined>;
  getBankApiConnections(): Promise<BankApiConnection[]>;
  getBankApiConnectionsByBankAccount(bankAccountId: number): Promise<BankApiConnection[]>;
  getActiveBankApiConnections(): Promise<BankApiConnection[]>;
  createBankApiConnection(connection: InsertBankApiConnection): Promise<BankApiConnection>;
  updateBankApiConnection(id: number, connection: Partial<BankApiConnection>): Promise<BankApiConnection | undefined>;
  deleteBankApiConnection(id: number): Promise<boolean>;
  
  // Banking API Transaction operations
  getBankApiTransaction(id: number): Promise<BankApiTransaction | undefined>;
  getBankApiTransactions(connectionId: number, startDate?: Date, endDate?: Date): Promise<BankApiTransaction[]>;
  getBankApiTransactionsByConnection(connectionId: number): Promise<BankApiTransaction[]>;
  getBankApiTransactionsByBankAccount(bankAccountId: number): Promise<BankApiTransaction[]>;
  getBankApiTransactionsByDateRange(bankAccountId: number, startDate: Date, endDate: Date): Promise<BankApiTransaction[]>;
  getUnreconciledBankApiTransactions(bankAccountId: number): Promise<BankApiTransaction[]>;
  createBankApiTransaction(transaction: InsertBankApiTransaction): Promise<BankApiTransaction>;
  createBulkBankApiTransactions(transactions: InsertBankApiTransaction[]): Promise<BankApiTransaction[]>;
  updateBankApiTransaction(id: number, transaction: Partial<BankApiTransaction>): Promise<BankApiTransaction | undefined>;
  
  // Bank Sync Log operations
  getBankSyncLog(id: number): Promise<BankSyncLog | undefined>;
  getBankSyncLogs(connectionId: number): Promise<BankSyncLog[]>;
  getBankSyncLogsByConnection(connectionId: number): Promise<BankSyncLog[]>;
  getRecentBankSyncLogs(limit?: number): Promise<BankSyncLog[]>;
  createBankSyncLog(log: InsertBankSyncLog): Promise<BankSyncLog>;
  updateBankSyncLog(id: number, log: Partial<BankSyncLog>): Promise<BankSyncLog | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private equipment: Map<number, Equipment>;
  private maintenanceTasks: Map<number, MaintenanceTask>;
  private inventoryItems: Map<number, InventoryItem>;
  private activityLogs: Map<number, ActivityLog>;
  private maintenanceHistory: Map<number, MaintenanceHistory>;
  private predictiveMaintenance: Map<number, PredictiveMaintenance>;
  
  // ISM Management maps
  private ismDocuments: Map<number, IsmDocument>;
  private ismAudits: Map<number, IsmAudit>;
  private ismTraining: Map<number, IsmTraining>;
  private ismIncidents: Map<number, IsmIncident>;
  
  // Voyage Planning maps
  private voyages: Map<number, Voyage> = new Map<number, Voyage>();
  private waypoints: Map<number, Waypoint> = new Map<number, Waypoint>();
  private fuelConsumptionCharts: Map<number, FuelConsumptionChart> = new Map<number, FuelConsumptionChart>();
  private speedCharts: Map<number, SpeedChart> = new Map<number, SpeedChart>();
  
  // ISM Task Management maps
  private formCategories: Map<number, FormCategory> = new Map<number, FormCategory>();
  private formTemplates: Map<number, FormTemplate> = new Map<number, FormTemplate>();
  private formTemplateVersions: Map<number, FormTemplateVersion> = new Map<number, FormTemplateVersion>();
  private ismTasks: Map<number, IsmTask> = new Map<number, IsmTask>();
  private formSubmissions: Map<number, FormSubmission> = new Map<number, FormSubmission>();
  private taskComments: Map<number, TaskComment> = new Map<number, TaskComment>();
  
  // Financial Management maps
  private deposits: Map<number, Deposit> = new Map<number, Deposit>();
  private financialAccounts: Map<number, FinancialAccount> = new Map<number, FinancialAccount>();
  private transactions: Map<number, Transaction> = new Map<number, Transaction>();
  private transactionLines: Map<number, TransactionLine> = new Map<number, TransactionLine>();
  private expenses: Map<number, Expense> = new Map<number, Expense>();
  private budgets: Map<number, Budget> = new Map<number, Budget>();
  private budgetAllocations: Map<number, BudgetAllocation> = new Map<number, BudgetAllocation>();
  
  // ISM Task Management - Form Categories operations
  async getFormCategory(id: number): Promise<FormCategory | undefined> {
    return this.formCategories.get(id);
  }
  
  async getAllFormCategories(): Promise<FormCategory[]> {
    return Array.from(this.formCategories.values());
  }
  
  async createFormCategory(category: InsertFormCategory): Promise<FormCategory> {
    const id = this.formCategoryCurrentId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const formCategory: FormCategory = { ...category, id, createdAt, updatedAt };
    this.formCategories.set(id, formCategory);
    return formCategory;
  }
  
  async updateFormCategory(id: number, categoryUpdate: Partial<FormCategory>): Promise<FormCategory | undefined> {
    const existingCategory = this.formCategories.get(id);
    if (!existingCategory) return undefined;
    
    const updatedCategory = { 
      ...existingCategory, 
      ...categoryUpdate,
      updatedAt: new Date()
    };
    this.formCategories.set(id, updatedCategory);
    return updatedCategory;
  }
  
  async deleteFormCategory(id: number): Promise<boolean> {
    return this.formCategories.delete(id);
  }
  
  // ISM Task Management - Form Templates operations
  async getFormTemplate(id: number): Promise<FormTemplate | undefined> {
    return this.formTemplates.get(id);
  }
  
  async getAllFormTemplates(): Promise<FormTemplate[]> {
    return Array.from(this.formTemplates.values());
  }
  
  async getFormTemplatesByCategory(categoryId: number): Promise<FormTemplate[]> {
    return Array.from(this.formTemplates.values()).filter(
      (template) => template.categoryId === categoryId
    );
  }
  
  async createFormTemplate(template: InsertFormTemplate): Promise<FormTemplate> {
    const id = this.formTemplateCurrentId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const formTemplate: FormTemplate = { ...template, id, createdAt, updatedAt };
    this.formTemplates.set(id, formTemplate);
    return formTemplate;
  }
  
  async updateFormTemplate(id: number, templateUpdate: Partial<FormTemplate>): Promise<FormTemplate | undefined> {
    const existingTemplate = this.formTemplates.get(id);
    if (!existingTemplate) return undefined;
    
    const updatedTemplate = { 
      ...existingTemplate, 
      ...templateUpdate,
      updatedAt: new Date()
    };
    this.formTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }
  
  async deleteFormTemplate(id: number): Promise<boolean> {
    return this.formTemplates.delete(id);
  }
  
  // ISM Task Management - Form Template Versions operations
  async getFormTemplateVersion(id: number): Promise<FormTemplateVersion | undefined> {
    return this.formTemplateVersions.get(id);
  }
  
  async getFormTemplateVersionsByTemplate(templateId: number): Promise<FormTemplateVersion[]> {
    return Array.from(this.formTemplateVersions.values()).filter(
      (version) => version.templateId === templateId
    );
  }
  
  async getActiveFormTemplateVersion(templateId: number): Promise<FormTemplateVersion | undefined> {
    return Array.from(this.formTemplateVersions.values()).find(
      (version) => version.templateId === templateId && version.isActive === true
    );
  }
  
  async createFormTemplateVersion(version: InsertFormTemplateVersion): Promise<FormTemplateVersion> {
    const id = this.formTemplateVersionCurrentId++;
    const createdAt = new Date();
    
    // Deactivate all other versions of this template if this one is active
    if (version.isActive) {
      for (const existingVersion of this.formTemplateVersions.values()) {
        if (existingVersion.templateId === version.templateId && existingVersion.isActive) {
          existingVersion.isActive = false;
          this.formTemplateVersions.set(existingVersion.id, existingVersion);
        }
      }
    }
    
    const formTemplateVersion: FormTemplateVersion = { ...version, id, createdAt };
    this.formTemplateVersions.set(id, formTemplateVersion);
    return formTemplateVersion;
  }
  
  async activateFormTemplateVersion(id: number): Promise<FormTemplateVersion | undefined> {
    const existingVersion = this.formTemplateVersions.get(id);
    if (!existingVersion) return undefined;
    
    // Deactivate all other versions of this template
    for (const version of this.formTemplateVersions.values()) {
      if (version.templateId === existingVersion.templateId && version.isActive) {
        version.isActive = false;
        this.formTemplateVersions.set(version.id, version);
      }
    }
    
    // Activate the requested version
    existingVersion.isActive = true;
    this.formTemplateVersions.set(id, existingVersion);
    return existingVersion;
  }
  
  async updateFormTemplateVersion(id: number, versionUpdate: Partial<FormTemplateVersion>): Promise<FormTemplateVersion | undefined> {
    const existingVersion = this.formTemplateVersions.get(id);
    if (!existingVersion) return undefined;
    
    // If activating this version, deactivate all others
    if (versionUpdate.isActive && !existingVersion.isActive) {
      for (const version of this.formTemplateVersions.values()) {
        if (version.templateId === existingVersion.templateId && version.isActive) {
          version.isActive = false;
          this.formTemplateVersions.set(version.id, version);
        }
      }
    }
    
    const updatedVersion = { ...existingVersion, ...versionUpdate };
    this.formTemplateVersions.set(id, updatedVersion);
    return updatedVersion;
  }
  
  async deleteFormTemplateVersion(id: number): Promise<boolean> {
    return this.formTemplateVersions.delete(id);
  }
  
  // ISM Task Management - ISM Tasks operations
  async getIsmTask(id: number): Promise<IsmTask | undefined> {
    return this.ismTasks.get(id);
  }
  
  async getAllIsmTasks(): Promise<IsmTask[]> {
    return Array.from(this.ismTasks.values());
  }
  
  async getIsmTasksByVessel(vesselId: number): Promise<IsmTask[]> {
    return Array.from(this.ismTasks.values()).filter(
      (task) => task.vesselId === vesselId
    );
  }
  
  async getIsmTasksByStatus(status: string): Promise<IsmTask[]> {
    return Array.from(this.ismTasks.values()).filter(
      (task) => task.status === status
    );
  }
  
  async getIsmTasksByAssignee(userId: number): Promise<IsmTask[]> {
    return Array.from(this.ismTasks.values()).filter(
      (task) => task.assignedToId === userId
    );
  }
  
  async getDueIsmTasks(): Promise<IsmTask[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.ismTasks.values()).filter(
      (task) => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate <= today && task.status !== 'completed';
      }
    );
  }
  
  async getIsmTasksByTemplateVersion(versionId: number): Promise<IsmTask[]> {
    return Array.from(this.ismTasks.values()).filter(
      (task) => task.formTemplateVersionId === versionId
    );
  }
  
  async createIsmTask(task: InsertIsmTask): Promise<IsmTask> {
    const id = this.ismTaskCurrentId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    
    const ismTask: IsmTask = { ...task, id, createdAt, updatedAt };
    this.ismTasks.set(id, ismTask);
    return ismTask;
  }
  
  async updateIsmTask(id: number, taskUpdate: Partial<IsmTask>): Promise<IsmTask | undefined> {
    const existingTask = this.ismTasks.get(id);
    if (!existingTask) return undefined;
    
    const updatedTask = { 
      ...existingTask, 
      ...taskUpdate,
      updatedAt: new Date()
    };
    this.ismTasks.set(id, updatedTask);
    return updatedTask;
  }
  
  async deleteIsmTask(id: number): Promise<boolean> {
    return this.ismTasks.delete(id);
  }
  
  // ISM Task Management - Form Submissions operations
  async getFormSubmission(id: number): Promise<FormSubmission | undefined> {
    return this.formSubmissions.get(id);
  }
  
  async getFormSubmissionsByTask(taskId: number): Promise<FormSubmission[]> {
    return Array.from(this.formSubmissions.values()).filter(
      (submission) => submission.taskId === taskId
    );
  }
  
  async getRecentFormSubmissions(limit: number = 10): Promise<FormSubmission[]> {
    return Array.from(this.formSubmissions.values())
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
      .slice(0, limit);
  }
  
  async createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission> {
    const id = this.formSubmissionCurrentId++;
    const submittedAt = new Date();
    
    const formSubmission: FormSubmission = { ...submission, id, submittedAt };
    this.formSubmissions.set(id, formSubmission);
    
    // Update the related task status to 'completed' when a submission is created
    const task = this.ismTasks.get(submission.taskId);
    if (task) {
      task.status = 'completed';
      task.updatedAt = new Date();
      this.ismTasks.set(task.id, task);
    }
    
    return formSubmission;
  }
  
  async updateFormSubmission(id: number, submissionUpdate: Partial<FormSubmission>): Promise<FormSubmission | undefined> {
    const existingSubmission = this.formSubmissions.get(id);
    if (!existingSubmission) return undefined;
    
    const updatedSubmission = { ...existingSubmission, ...submissionUpdate };
    this.formSubmissions.set(id, updatedSubmission);
    
    // If the review status is updated, update the related task status accordingly
    if (submissionUpdate.reviewStatus && existingSubmission.reviewStatus !== submissionUpdate.reviewStatus) {
      const task = this.ismTasks.get(existingSubmission.taskId);
      if (task) {
        if (submissionUpdate.reviewStatus === 'approved') {
          task.status = 'reviewed';
        } else if (submissionUpdate.reviewStatus === 'rejected') {
          task.status = 'in_progress'; // Reset to in_progress to require a new submission
        }
        task.updatedAt = new Date();
        this.ismTasks.set(task.id, task);
      }
    }
    
    return updatedSubmission;
  }
  
  async deleteFormSubmission(id: number): Promise<boolean> {
    return this.formSubmissions.delete(id);
  }
  
  // ISM Task Management - Task Comments operations
  async getTaskComment(id: number): Promise<TaskComment | undefined> {
    return this.taskComments.get(id);
  }
  
  async getTaskCommentsByTask(taskId: number): Promise<TaskComment[]> {
    return Array.from(this.taskComments.values())
      .filter((comment) => comment.taskId === taskId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async createTaskComment(comment: InsertTaskComment): Promise<TaskComment> {
    const id = this.taskCommentCurrentId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    
    const taskComment: TaskComment = { ...comment, id, createdAt, updatedAt };
    this.taskComments.set(id, taskComment);
    return taskComment;
  }
  
  async updateTaskComment(id: number, commentUpdate: Partial<TaskComment>): Promise<TaskComment | undefined> {
    const existingComment = this.taskComments.get(id);
    if (!existingComment) return undefined;
    
    const updatedComment = { 
      ...existingComment, 
      ...commentUpdate,
      updatedAt: new Date()
    };
    this.taskComments.set(id, updatedComment);
    return updatedComment;
  }
  
  async deleteTaskComment(id: number): Promise<boolean> {
    return this.taskComments.delete(id);
  }
  
  private userCurrentId: number;
  private equipmentCurrentId: number;
  private taskCurrentId: number;
  private inventoryCurrentId: number;
  private logCurrentId: number;
  private historyCurrentId: number;
  private predictiveCurrentId: number;
  private ismDocumentCurrentId: number;
  private ismAuditCurrentId: number;
  private ismTrainingCurrentId: number;
  private ismIncidentCurrentId: number;
  private voyageCurrentId: number = 1;
  private waypointCurrentId: number = 1;
  private fuelChartCurrentId: number = 1;
  private speedChartCurrentId: number = 1;
  private formCategoryCurrentId: number = 1;
  private formTemplateCurrentId: number = 1;
  private formTemplateVersionCurrentId: number = 1;
  private ismTaskCurrentId: number = 1;
  private formSubmissionCurrentId: number = 1;
  private taskCommentCurrentId: number = 1;
  private depositCurrentId: number = 1;
  private financialAccountCurrentId: number = 1;
  private transactionCurrentId: number = 1;
  private transactionLineCurrentId: number = 1;
  private expenseCurrentId: number = 1;
  private budgetCurrentId: number = 1;
  private budgetAllocationCurrentId: number = 1;

  constructor() {
    this.users = new Map();
    this.equipment = new Map();
    this.maintenanceTasks = new Map();
    this.inventoryItems = new Map();
    this.activityLogs = new Map();
    this.maintenanceHistory = new Map();
    this.predictiveMaintenance = new Map();
    
    // Initialize ISM maps
    this.ismDocuments = new Map();
    this.ismAudits = new Map();
    this.ismTraining = new Map();
    this.ismIncidents = new Map();
    
    // Initialize Voyage Planning maps
    this.voyages = new Map();
    this.waypoints = new Map();
    this.fuelConsumptionCharts = new Map();
    this.speedCharts = new Map();
    
    // Initialize ISM Task Management maps
    this.formCategories = new Map();
    this.formTemplates = new Map();
    this.formTemplateVersions = new Map();
    this.ismTasks = new Map();
    this.formSubmissions = new Map();
    this.taskComments = new Map();
    
    // Initialize Financial Management maps
    this.deposits = new Map();
    this.financialAccounts = new Map();
    this.transactions = new Map();
    this.transactionLines = new Map();
    this.expenses = new Map();
    this.budgets = new Map();
    this.budgetAllocations = new Map();
    
    this.userCurrentId = 1;
    this.equipmentCurrentId = 1;
    this.taskCurrentId = 1;
    this.inventoryCurrentId = 1;
    this.logCurrentId = 1;
    this.historyCurrentId = 1;
    this.predictiveCurrentId = 1;
    this.ismDocumentCurrentId = 1;
    this.ismAuditCurrentId = 1;
    this.ismTrainingCurrentId = 1;
    this.ismIncidentCurrentId = 1;
    this.voyageCurrentId = 1;
    this.waypointCurrentId = 1;
    this.fuelChartCurrentId = 1;
    this.speedChartCurrentId = 1;
    this.formCategoryCurrentId = 1;
    this.formTemplateCurrentId = 1;
    this.formTemplateVersionCurrentId = 1;
    this.ismTaskCurrentId = 1;
    this.formSubmissionCurrentId = 1;
    this.taskCommentCurrentId = 1;
    
    // Financial Management IDs
    this.depositCurrentId = 1;
    this.financialAccountCurrentId = 1;
    this.transactionCurrentId = 1;
    this.transactionLineCurrentId = 1;
    this.expenseCurrentId = 1;
    this.budgetCurrentId = 1;
    this.budgetAllocationCurrentId = 1;
    
    // Initialize with some demo data
    this.initializeData();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Equipment operations
  async getEquipment(id: number): Promise<Equipment | undefined> {
    return this.equipment.get(id);
  }

  async getAllEquipment(): Promise<Equipment[]> {
    return Array.from(this.equipment.values());
  }

  async getEquipmentByCategory(category: string): Promise<Equipment[]> {
    return Array.from(this.equipment.values()).filter(
      (equipment) => equipment.category === category
    );
  }

  async createEquipment(insertEquipment: InsertEquipment): Promise<Equipment> {
    const id = this.equipmentCurrentId++;
    const createdAt = new Date();
    const equipment: Equipment = { ...insertEquipment, id, createdAt };
    this.equipment.set(id, equipment);
    return equipment;
  }

  async updateEquipment(id: number, equipmentUpdate: Partial<Equipment>): Promise<Equipment | undefined> {
    const existingEquipment = this.equipment.get(id);
    if (!existingEquipment) return undefined;
    
    const updatedEquipment = { ...existingEquipment, ...equipmentUpdate };
    this.equipment.set(id, updatedEquipment);
    return updatedEquipment;
  }

  async deleteEquipment(id: number): Promise<boolean> {
    return this.equipment.delete(id);
  }

  // Maintenance task operations
  async getMaintenanceTask(id: number): Promise<MaintenanceTask | undefined> {
    return this.maintenanceTasks.get(id);
  }

  async getAllMaintenanceTasks(): Promise<MaintenanceTask[]> {
    return Array.from(this.maintenanceTasks.values());
  }

  async getMaintenanceTasksByStatus(status: string): Promise<MaintenanceTask[]> {
    return Array.from(this.maintenanceTasks.values()).filter(
      (task) => task.status === status
    );
  }

  async getMaintenanceTasksByEquipment(equipmentId: number): Promise<MaintenanceTask[]> {
    return Array.from(this.maintenanceTasks.values()).filter(
      (task) => task.equipmentId === equipmentId
    );
  }

  async getMaintenanceTasksByAssignee(userId: number): Promise<MaintenanceTask[]> {
    return Array.from(this.maintenanceTasks.values()).filter(
      (task) => task.assignedToId === userId
    );
  }

  async getDueMaintenanceTasks(): Promise<MaintenanceTask[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.maintenanceTasks.values()).filter(
      (task) => {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate <= today && task.status !== 'completed';
      }
    );
  }

  async getUpcomingMaintenanceTasks(): Promise<MaintenanceTask[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    thirtyDaysLater.setHours(0, 0, 0, 0);
    
    return Array.from(this.maintenanceTasks.values()).filter(
      (task) => {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate > today && dueDate <= thirtyDaysLater && task.status !== 'completed';
      }
    );
  }

  async createMaintenanceTask(insertTask: InsertMaintenanceTask): Promise<MaintenanceTask> {
    const id = this.taskCurrentId++;
    const createdAt = new Date();
    const task: MaintenanceTask = { ...insertTask, id, createdAt };
    this.maintenanceTasks.set(id, task);
    return task;
  }

  async updateMaintenanceTask(id: number, taskUpdate: Partial<MaintenanceTask>): Promise<MaintenanceTask | undefined> {
    const existingTask = this.maintenanceTasks.get(id);
    if (!existingTask) return undefined;
    
    const updatedTask = { ...existingTask, ...taskUpdate };
    this.maintenanceTasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteMaintenanceTask(id: number): Promise<boolean> {
    return this.maintenanceTasks.delete(id);
  }

  // Inventory operations
  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    return this.inventoryItems.get(id);
  }

  async getAllInventoryItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values());
  }

  async getLowStockInventoryItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values()).filter(
      (item) => item.quantity <= item.minQuantity
    );
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const id = this.inventoryCurrentId++;
    const createdAt = new Date();
    const item: InventoryItem = { ...insertItem, id, createdAt };
    this.inventoryItems.set(id, item);
    return item;
  }

  async updateInventoryItem(id: number, itemUpdate: Partial<InventoryItem>): Promise<InventoryItem | undefined> {
    const existingItem = this.inventoryItems.get(id);
    if (!existingItem) return undefined;
    
    const updatedItem = { ...existingItem, ...itemUpdate };
    this.inventoryItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    return this.inventoryItems.delete(id);
  }

  // Activity log operations
  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = this.logCurrentId++;
    const timestamp = new Date();
    const log: ActivityLog = { ...insertLog, id, timestamp };
    this.activityLogs.set(id, log);
    return log;
  }

  async getRecentActivityLogs(limit: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
  
  // Maintenance history operations
  async getMaintenanceHistory(id: number): Promise<MaintenanceHistory | undefined> {
    return this.maintenanceHistory.get(id);
  }

  async getMaintenanceHistoryByEquipment(equipmentId: number): Promise<MaintenanceHistory[]> {
    return Array.from(this.maintenanceHistory.values()).filter(
      (history) => history.equipmentId === equipmentId
    );
  }

  async createMaintenanceHistory(insertHistory: InsertMaintenanceHistory): Promise<MaintenanceHistory> {
    const id = this.historyCurrentId++;
    const createdAt = new Date();
    const history: MaintenanceHistory = { ...insertHistory, id, createdAt };
    this.maintenanceHistory.set(id, history);
    return history;
  }

  async updateMaintenanceHistory(id: number, historyUpdate: Partial<MaintenanceHistory>): Promise<MaintenanceHistory | undefined> {
    const existingHistory = this.maintenanceHistory.get(id);
    if (!existingHistory) return undefined;
    
    const updatedHistory = { ...existingHistory, ...historyUpdate };
    this.maintenanceHistory.set(id, updatedHistory);
    return updatedHistory;
  }

  async deleteMaintenanceHistory(id: number): Promise<boolean> {
    return this.maintenanceHistory.delete(id);
  }
  
  // Predictive maintenance operations
  async getPredictiveMaintenance(id: number): Promise<PredictiveMaintenance | undefined> {
    return this.predictiveMaintenance.get(id);
  }

  async getPredictiveMaintenanceByEquipment(equipmentId: number): Promise<PredictiveMaintenance[]> {
    return Array.from(this.predictiveMaintenance.values()).filter(
      (prediction) => prediction.equipmentId === equipmentId
    );
  }

  async createPredictiveMaintenance(insertPrediction: InsertPredictiveMaintenance): Promise<PredictiveMaintenance> {
    const id = this.predictiveCurrentId++;
    const createdAt = new Date();
    const lastUpdated = new Date();
    const prediction: PredictiveMaintenance = { ...insertPrediction, id, lastUpdated, createdAt };
    this.predictiveMaintenance.set(id, prediction);
    return prediction;
  }

  async updatePredictiveMaintenance(id: number, predictionUpdate: Partial<PredictiveMaintenance>): Promise<PredictiveMaintenance | undefined> {
    const existingPrediction = this.predictiveMaintenance.get(id);
    if (!existingPrediction) return undefined;
    
    // Always update lastUpdated when prediction is modified
    const updatedPrediction = { 
      ...existingPrediction, 
      ...predictionUpdate,
      lastUpdated: new Date()
    };
    this.predictiveMaintenance.set(id, updatedPrediction);
    return updatedPrediction;
  }

  async deletePredictiveMaintenance(id: number): Promise<boolean> {
    return this.predictiveMaintenance.delete(id);
  }
  
  // Generate predictive maintenance forecast based on maintenance history
  async generatePredictiveMaintenanceForEquipment(equipmentId: number): Promise<PredictiveMaintenance[]> {
    // Get the equipment
    const equipment = await this.getEquipment(equipmentId);
    if (!equipment) {
      throw new Error(`Equipment not found with ID: ${equipmentId}`);
    }
    
    // Get all maintenance history for the equipment
    const maintenanceRecords = await this.getMaintenanceHistoryByEquipment(equipmentId);
    
    // We need some maintenance history to make predictions
    if (maintenanceRecords.length < 2) {
      return []; // Not enough data to make predictions
    }
    
    // Group maintenance records by type
    const recordsByType: Record<string, MaintenanceHistory[]> = {};
    
    maintenanceRecords.forEach(record => {
      if (!recordsByType[record.maintenanceType]) {
        recordsByType[record.maintenanceType] = [];
      }
      recordsByType[record.maintenanceType].push(record);
    });
    
    const predictions: PredictiveMaintenance[] = [];
    
    // For each maintenance type, calculate next predicted date and runtime
    for (const [maintenanceType, records] of Object.entries(recordsByType)) {
      // Sort records by date
      records.sort((a, b) => new Date(a.serviceDate).getTime() - new Date(b.serviceDate).getTime());
      
      // Need at least 2 records of same type to establish a pattern
      if (records.length < 2) continue;
      
      // Calculate average time between services
      const intervals: number[] = [];
      const runtimeIntervals: number[] = [];
      
      for (let i = 1; i < records.length; i++) {
        const daysDiff = (new Date(records[i].serviceDate).getTime() - new Date(records[i-1].serviceDate).getTime()) / (1000 * 60 * 60 * 24);
        intervals.push(daysDiff);
        
        // If we have runtime data, calculate runtime intervals
        if (records[i].runtime && records[i-1].runtime) {
          runtimeIntervals.push(records[i].runtime - records[i-1].runtime);
        }
      }
      
      // Calculate averages
      const avgDays = intervals.reduce((sum, days) => sum + days, 0) / intervals.length;
      
      // Calculate the next predicted date
      const lastServiceDate = new Date(records[records.length - 1].serviceDate);
      const predictedDate = new Date(lastServiceDate);
      predictedDate.setDate(predictedDate.getDate() + Math.round(avgDays));
      
      // Calculate next predicted runtime if we have enough data
      let predictedRuntime = null;
      if (runtimeIntervals.length > 0) {
        const avgRuntime = runtimeIntervals.reduce((sum, hours) => sum + hours, 0) / runtimeIntervals.length;
        predictedRuntime = records[records.length - 1].runtime + avgRuntime;
      }
      
      // Calculate confidence based on variation in the data
      // Lower standard deviation = higher confidence
      let confidence = 0.7; // Default medium-high confidence
      
      if (intervals.length > 2) {
        const mean = avgDays;
        const squaredDiffs = intervals.map(interval => Math.pow(interval - mean, 2));
        const variance = squaredDiffs.reduce((sum, squared) => sum + squared, 0) / intervals.length;
        const stdDev = Math.sqrt(variance);
        
        // Normalize standard deviation to a confidence value (0 to 1)
        // Lower stdDev means higher confidence
        const maxExpectedStdDev = avgDays / 2; // Assuming this is the max reasonable variation
        confidence = Math.max(0.1, Math.min(0.95, 1 - (stdDev / maxExpectedStdDev)));
      }
      
      // Create reasoning factors
      const reasoningFactors = {
        numDataPoints: records.length,
        avgTimeBetweenServices: avgDays,
        lastServiceDate: lastServiceDate.toISOString(),
        dataConsistency: confidence,
        maintenanceHistory: records.map(r => ({
          id: r.id,
          date: r.serviceDate,
          runtime: r.runtime
        }))
      };
      
      // Generate recommended action based on prediction
      const daysToPrediction = (predictedDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
      
      let recommendedAction = '';
      if (daysToPrediction < 0) {
        recommendedAction = 'Maintenance overdue, schedule immediately';
      } else if (daysToPrediction < 7) {
        recommendedAction = 'Schedule maintenance within the next week';
      } else if (daysToPrediction < 30) {
        recommendedAction = 'Schedule maintenance within the next month';
      } else {
        recommendedAction = 'Routine maintenance, add to schedule';
      }
      
      // Create a warning threshold (30% of avg interval)
      const warningThreshold = Math.max(7, avgDays * 0.3);
      
      // Create a prediction
      const prediction: InsertPredictiveMaintenance = {
        equipmentId,
        maintenanceType,
        predictedDate,
        predictedRuntime,
        confidence,
        reasoningFactors,
        recommendedAction,
        warningThreshold,
        alertThreshold: Math.max(1, avgDays * 0.1), // 10% of avg interval, at least 1 day
        historyDataPoints: records.length
      };
      
      // Add to our predictions
      const createdPrediction = await this.createPredictiveMaintenance(prediction);
      predictions.push(createdPrediction);
    }
    
    return predictions;
  }
  
  // ISM Document operations
  async getIsmDocument(id: number): Promise<IsmDocument | undefined> {
    return this.ismDocuments.get(id);
  }

  async getAllIsmDocuments(): Promise<IsmDocument[]> {
    return Array.from(this.ismDocuments.values());
  }

  async getIsmDocumentsByType(documentType: string): Promise<IsmDocument[]> {
    return Array.from(this.ismDocuments.values()).filter(
      (doc) => doc.documentType === documentType
    );
  }

  async getIsmDocumentsByStatus(status: string): Promise<IsmDocument[]> {
    return Array.from(this.ismDocuments.values()).filter(
      (doc) => doc.status === status
    );
  }

  async getIsmDocumentsForReview(): Promise<IsmDocument[]> {
    const today = new Date();
    
    return Array.from(this.ismDocuments.values()).filter(
      (doc) => doc.reviewDueDate && new Date(doc.reviewDueDate) <= today && doc.status !== 'obsolete'
    );
  }

  async createIsmDocument(insertDocument: InsertIsmDocument): Promise<IsmDocument> {
    const id = this.ismDocumentCurrentId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const document: IsmDocument = { ...insertDocument, id, createdAt, updatedAt };
    this.ismDocuments.set(id, document);
    return document;
  }

  async updateIsmDocument(id: number, documentUpdate: Partial<IsmDocument>): Promise<IsmDocument | undefined> {
    const existingDocument = this.ismDocuments.get(id);
    if (!existingDocument) return undefined;
    
    const updatedDocument = { 
      ...existingDocument, 
      ...documentUpdate,
      updatedAt: new Date()
    };
    this.ismDocuments.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteIsmDocument(id: number): Promise<boolean> {
    return this.ismDocuments.delete(id);
  }
  
  // ISM Audit operations
  async getIsmAudit(id: number): Promise<IsmAudit | undefined> {
    return this.ismAudits.get(id);
  }

  async getAllIsmAudits(): Promise<IsmAudit[]> {
    return Array.from(this.ismAudits.values());
  }

  async getIsmAuditsByType(auditType: string): Promise<IsmAudit[]> {
    return Array.from(this.ismAudits.values()).filter(
      (audit) => audit.auditType === auditType
    );
  }

  async getIsmAuditsByStatus(status: string): Promise<IsmAudit[]> {
    return Array.from(this.ismAudits.values()).filter(
      (audit) => audit.status === status
    );
  }

  async getUpcomingIsmAudits(): Promise<IsmAudit[]> {
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    
    return Array.from(this.ismAudits.values()).filter(
      (audit) => audit.startDate && 
                new Date(audit.startDate) >= today && 
                new Date(audit.startDate) <= thirtyDaysLater && 
                audit.status !== 'completed'
    );
  }

  async createIsmAudit(insertAudit: InsertIsmAudit): Promise<IsmAudit> {
    const id = this.ismAuditCurrentId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const audit: IsmAudit = { ...insertAudit, id, createdAt, updatedAt };
    this.ismAudits.set(id, audit);
    return audit;
  }

  async updateIsmAudit(id: number, auditUpdate: Partial<IsmAudit>): Promise<IsmAudit | undefined> {
    const existingAudit = this.ismAudits.get(id);
    if (!existingAudit) return undefined;
    
    const updatedAudit = { 
      ...existingAudit, 
      ...auditUpdate,
      updatedAt: new Date()
    };
    this.ismAudits.set(id, updatedAudit);
    return updatedAudit;
  }

  async deleteIsmAudit(id: number): Promise<boolean> {
    return this.ismAudits.delete(id);
  }
  
  // ISM Training operations
  async getIsmTraining(id: number): Promise<IsmTraining | undefined> {
    return this.ismTraining.get(id);
  }

  async getAllIsmTraining(): Promise<IsmTraining[]> {
    return Array.from(this.ismTraining.values());
  }

  async getIsmTrainingByType(trainingType: string): Promise<IsmTraining[]> {
    return Array.from(this.ismTraining.values()).filter(
      (training) => training.trainingType === trainingType
    );
  }

  async getIsmTrainingByStatus(status: string): Promise<IsmTraining[]> {
    return Array.from(this.ismTraining.values()).filter(
      (training) => training.status === status
    );
  }

  async getIsmTrainingByParticipant(userId: number): Promise<IsmTraining[]> {
    return Array.from(this.ismTraining.values()).filter(
      (training) => {
        const requiredParticipants = training.requiredParticipants as number[];
        const actualParticipants = training.actualParticipants as number[];
        return requiredParticipants.includes(userId) || actualParticipants.includes(userId);
      }
    );
  }

  async getUpcomingIsmTraining(): Promise<IsmTraining[]> {
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    
    return Array.from(this.ismTraining.values()).filter(
      (training) => training.scheduledDate && 
                  new Date(training.scheduledDate) >= today && 
                  new Date(training.scheduledDate) <= thirtyDaysLater && 
                  training.status === 'planned'
    );
  }

  async createIsmTraining(insertTraining: InsertIsmTraining): Promise<IsmTraining> {
    const id = this.ismTrainingCurrentId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const training: IsmTraining = { ...insertTraining, id, createdAt, updatedAt };
    this.ismTraining.set(id, training);
    return training;
  }

  async updateIsmTraining(id: number, trainingUpdate: Partial<IsmTraining>): Promise<IsmTraining | undefined> {
    const existingTraining = this.ismTraining.get(id);
    if (!existingTraining) return undefined;
    
    const updatedTraining = { 
      ...existingTraining, 
      ...trainingUpdate,
      updatedAt: new Date()
    };
    this.ismTraining.set(id, updatedTraining);
    return updatedTraining;
  }

  async deleteIsmTraining(id: number): Promise<boolean> {
    return this.ismTraining.delete(id);
  }
  
  // ISM Incident operations
  async getIsmIncident(id: number): Promise<IsmIncident | undefined> {
    return this.ismIncidents.get(id);
  }

  async getAllIsmIncidents(): Promise<IsmIncident[]> {
    return Array.from(this.ismIncidents.values());
  }

  async getIsmIncidentsByType(incidentType: string): Promise<IsmIncident[]> {
    return Array.from(this.ismIncidents.values()).filter(
      (incident) => incident.incidentType === incidentType
    );
  }

  async getIsmIncidentsByStatus(status: string): Promise<IsmIncident[]> {
    return Array.from(this.ismIncidents.values()).filter(
      (incident) => incident.status === status
    );
  }

  async getIsmIncidentsByReporter(userId: number): Promise<IsmIncident[]> {
    return Array.from(this.ismIncidents.values()).filter(
      (incident) => incident.reportedBy === userId
    );
  }

  async getOpenIsmIncidents(): Promise<IsmIncident[]> {
    return Array.from(this.ismIncidents.values()).filter(
      (incident) => incident.status === 'open' || incident.status === 'in-progress'
    );
  }

  async createIsmIncident(insertIncident: InsertIsmIncident): Promise<IsmIncident> {
    const id = this.ismIncidentCurrentId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const incident: IsmIncident = { ...insertIncident, id, createdAt, updatedAt };
    this.ismIncidents.set(id, incident);
    return incident;
  }

  async updateIsmIncident(id: number, incidentUpdate: Partial<IsmIncident>): Promise<IsmIncident | undefined> {
    const existingIncident = this.ismIncidents.get(id);
    if (!existingIncident) return undefined;
    
    const updatedIncident = { 
      ...existingIncident, 
      ...incidentUpdate,
      updatedAt: new Date()
    };
    this.ismIncidents.set(id, updatedIncident);
    return updatedIncident;
  }

  async deleteIsmIncident(id: number): Promise<boolean> {
    return this.ismIncidents.delete(id);
  }
  
  // Voyage Planning methods
  async getVoyage(id: number): Promise<Voyage | null> {
    const voyage = this.voyages.get(id);
    return voyage || null;
  }

  async getVoyagesByVessel(vesselId: number): Promise<Voyage[]> {
    return Array.from(this.voyages.values()).filter(
      (voyage) => voyage.vesselId === vesselId
    );
  }

  async getVoyagesByStatus(status: string): Promise<Voyage[]> {
    return Array.from(this.voyages.values()).filter(
      (voyage) => voyage.status === status
    );
  }

  async createVoyage(insertVoyage: InsertVoyage): Promise<Voyage> {
    const id = this.voyageCurrentId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const voyage: Voyage = { ...insertVoyage, id, createdAt, updatedAt };
    this.voyages.set(id, voyage);
    return voyage;
  }

  async updateVoyage(id: number, voyageUpdate: Partial<Voyage>): Promise<Voyage | null> {
    const existingVoyage = this.voyages.get(id);
    if (!existingVoyage) return null;
    
    const updatedVoyage = { 
      ...existingVoyage, 
      ...voyageUpdate,
      updatedAt: new Date()
    };
    this.voyages.set(id, updatedVoyage);
    return updatedVoyage;
  }

  async deleteVoyage(id: number): Promise<boolean> {
    // First delete all waypoints associated with this voyage
    const waypointsToDelete = await this.getWaypointsByVoyage(id);
    for (const waypoint of waypointsToDelete) {
      await this.deleteWaypoint(waypoint.id);
    }
    return this.voyages.delete(id);
  }

  // Waypoint methods
  async getWaypoint(id: number): Promise<Waypoint | null> {
    const waypoint = this.waypoints.get(id);
    return waypoint || null;
  }

  async getWaypointsByVoyage(voyageId: number): Promise<Waypoint[]> {
    return Array.from(this.waypoints.values())
      .filter(waypoint => waypoint.voyageId === voyageId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async createWaypoint(insertWaypoint: InsertWaypoint): Promise<Waypoint> {
    const id = this.waypointCurrentId++;
    const waypoint: Waypoint = { ...insertWaypoint, id };
    this.waypoints.set(id, waypoint);
    return waypoint;
  }

  async updateWaypoint(id: number, waypointUpdate: Partial<Waypoint>): Promise<Waypoint | null> {
    const existingWaypoint = this.waypoints.get(id);
    if (!existingWaypoint) return null;
    
    const updatedWaypoint = { ...existingWaypoint, ...waypointUpdate };
    this.waypoints.set(id, updatedWaypoint);
    return updatedWaypoint;
  }

  async deleteWaypoint(id: number): Promise<boolean> {
    return this.waypoints.delete(id);
  }

  // Fuel Consumption Chart methods
  async getFuelConsumptionData(vesselId: number): Promise<FuelConsumptionChart[]> {
    return Array.from(this.fuelConsumptionCharts.values())
      .filter(dataPoint => dataPoint.vesselId === vesselId)
      .sort((a, b) => a.engineRpm - b.engineRpm);
  }

  async addFuelConsumptionDataPoint(insertDataPoint: InsertFuelConsumptionChart): Promise<FuelConsumptionChart> {
    const id = this.fuelChartCurrentId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const dataPoint: FuelConsumptionChart = { ...insertDataPoint, id, createdAt, updatedAt };
    this.fuelConsumptionCharts.set(id, dataPoint);
    return dataPoint;
  }

  async updateFuelConsumptionDataPoint(id: number, dataPointUpdate: Partial<FuelConsumptionChart>): Promise<FuelConsumptionChart | null> {
    const existingDataPoint = this.fuelConsumptionCharts.get(id);
    if (!existingDataPoint) return null;
    
    const updatedDataPoint = { 
      ...existingDataPoint, 
      ...dataPointUpdate,
      updatedAt: new Date()
    };
    this.fuelConsumptionCharts.set(id, updatedDataPoint);
    return updatedDataPoint;
  }

  async deleteFuelConsumptionDataPoint(id: number): Promise<boolean> {
    return this.fuelConsumptionCharts.delete(id);
  }

  // Speed Chart methods
  async getSpeedData(vesselId: number): Promise<SpeedChart[]> {
    return Array.from(this.speedCharts.values())
      .filter(dataPoint => dataPoint.vesselId === vesselId)
      .sort((a, b) => a.engineRpm - b.engineRpm);
  }

  async addSpeedDataPoint(insertDataPoint: InsertSpeedChart): Promise<SpeedChart> {
    const id = this.speedChartCurrentId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const dataPoint: SpeedChart = { ...insertDataPoint, id, createdAt, updatedAt };
    this.speedCharts.set(id, dataPoint);
    return dataPoint;
  }

  async updateSpeedDataPoint(id: number, dataPointUpdate: Partial<SpeedChart>): Promise<SpeedChart | null> {
    const existingDataPoint = this.speedCharts.get(id);
    if (!existingDataPoint) return null;
    
    const updatedDataPoint = { 
      ...existingDataPoint, 
      ...dataPointUpdate,
      updatedAt: new Date()
    };
    this.speedCharts.set(id, updatedDataPoint);
    return updatedDataPoint;
  }

  async deleteSpeedDataPoint(id: number): Promise<boolean> {
    return this.speedCharts.delete(id);
  }
  
  // Voyage Planning Calculations
  async calculateVoyageFuelConsumption(voyageId: number): Promise<{ 
    totalFuelConsumption: number, 
    totalDistance: number,
    durationHours: number,
    waypoints: (Waypoint & { 
      estimatedFuelConsumption: number,
      estimatedDuration: number 
    })[]
  }> {
    // Get all waypoints for the voyage
    const waypoints = await this.getWaypointsByVoyage(voyageId);
    if (!waypoints.length) {
      return { 
        totalFuelConsumption: 0, 
        totalDistance: 0, 
        durationHours: 0,
        waypoints: []
      };
    }
    
    // Get the vessel ID from the voyage
    const voyage = await this.getVoyage(voyageId);
    if (!voyage) {
      throw new Error('Voyage not found');
    }
    
    // Get fuel consumption data for this vessel
    const fuelData = await this.getFuelConsumptionData(voyage.vesselId);
    
    // Get speed data for this vessel
    const speedData = await this.getSpeedData(voyage.vesselId);
    
    // Sort waypoints by order index
    waypoints.sort((a, b) => a.orderIndex - b.orderIndex);
    
    let totalFuelConsumption = 0;
    let totalDistance = 0;
    let totalDuration = 0;
    
    // Calculate for each waypoint leg
    const enrichedWaypoints = waypoints.map((waypoint, index) => {
      // Skip the first waypoint when calculating legs (it's the starting point)
      if (index === 0) {
        return { 
          ...waypoint, 
          estimatedFuelConsumption: 0,
          estimatedDuration: 0
        };
      }
      
      // Get the distance to this waypoint (from the previous one)
      const distance = parseFloat(waypoint.distance || '0');
      totalDistance += distance;
      
      // Find the speed based on the engine RPM
      const engineRpm = waypoint.engineRpm || 0;
      let speed = 0;
      
      if (engineRpm > 0) {
        // Find the closest RPM in the speed data
        const closestSpeedData = speedData
          .sort((a, b) => Math.abs(a.engineRpm - engineRpm) - Math.abs(b.engineRpm - engineRpm))
          [0];
        
        if (closestSpeedData) {
          speed = parseFloat(closestSpeedData.speed || '0');
        }
      } else if (waypoint.plannedSpeed) {
        // If RPM not provided but planned speed is
        speed = parseFloat(waypoint.plannedSpeed);
      }
      
      // Calculate duration in hours (distance / speed)
      const duration = speed > 0 ? distance / speed : 0;
      totalDuration += duration;
      
      // Calculate fuel consumption based on engine RPM and duration
      let fuelConsumption = 0;
      
      if (engineRpm > 0) {
        // Find the closest RPM in the fuel consumption data
        const closestFuelData = fuelData
          .sort((a, b) => Math.abs(a.engineRpm - engineRpm) - Math.abs(b.engineRpm - engineRpm))
          [0];
        
        if (closestFuelData) {
          const hourlyRate = parseFloat(closestFuelData.fuelConsumptionRate || '0');
          fuelConsumption = hourlyRate * duration;
        }
      } else if (waypoint.fuelConsumption) {
        // If provided directly
        fuelConsumption = parseFloat(waypoint.fuelConsumption);
      }
      
      totalFuelConsumption += fuelConsumption;
      
      return {
        ...waypoint,
        estimatedFuelConsumption: fuelConsumption,
        estimatedDuration: duration
      };
    });
    
    return {
      totalFuelConsumption,
      totalDistance,
      durationHours: totalDuration,
      waypoints: enrichedWaypoints
    };
  }

  // Initialize demo data
  private initializeData(): void {
    // Create demo users
    const users = [
      {
        username: 'captain',
        password: 'password123',
        fullName: 'Captain Smith',
        role: 'Chief Engineer',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
      },
      {
        username: 'engineer1',
        password: 'password123',
        fullName: 'Engineer L. Johnson',
        role: 'Engineer',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
      },
      {
        username: 'engineer2',
        password: 'password123',
        fullName: 'Engineer A. Williams',
        role: 'Engineer',
        avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
      },
      {
        username: 'technician1',
        password: 'password123',
        fullName: 'S. Thompson',
        role: 'Technician',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
      },
      {
        username: 'technician2',
        password: 'password123',
        fullName: 'T. Rodriguez',
        role: 'Technician',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
      }
    ];

    users.forEach(user => {
      this.createUser(user as InsertUser);
    });

    // Create demo equipment
    const equipmentList = [
      {
        name: 'Main Engine',
        category: 'mechanical',
        model: 'MTU 16V 2000 M94',
        manufacturer: 'MTU',
        serialNumber: 'ME-123456',
        installationDate: new Date('2020-06-15'),
        runtime: 3245,
        lastServiceDate: new Date('2023-08-15'),
        nextServiceDate: new Date(),
        nextServiceHours: 3500,
        notes: 'Regular oil change and inspection required',
        status: 'operational',
        location: 'Engine Room',
        specifications: { power: '2000 kW', weight: '2500 kg' },
        manualUrl: '/manuals/mtu-16v-2000-m94.pdf'
      },
      {
        name: 'Generator',
        category: 'electrical',
        model: 'Kohler 80kW',
        manufacturer: 'Kohler',
        serialNumber: 'GEN-789012',
        installationDate: new Date('2020-06-20'),
        runtime: 1897,
        lastServiceDate: new Date('2023-07-30'),
        nextServiceDate: new Date('2023-09-25'),
        nextServiceHours: 2000,
        notes: 'Check fuel filters and impeller',
        status: 'operational',
        location: 'Engine Room',
        specifications: { power: '80 kW', weight: '1200 kg' },
        manualUrl: '/manuals/kohler-80kw.pdf'
      },
      {
        name: 'Fire System',
        category: 'safety',
        model: 'FM-200 Suppression',
        manufacturer: 'Johnson Controls',
        serialNumber: 'FS-345678',
        installationDate: new Date('2020-07-10'),
        runtime: 0,
        lastServiceDate: new Date('2023-08-20'),
        nextServiceDate: new Date('2023-11-20'),
        nextServiceHours: 0,
        notes: 'Certification valid until Feb 2024',
        status: 'operational',
        location: 'Throughout Vessel',
        specifications: { coverage: 'Full vessel', type: 'FM-200 gas' },
        manualUrl: '/manuals/fm200-system.pdf'
      },
      {
        name: 'HVAC System',
        category: 'mechanical',
        model: 'Marine Air VTD16K',
        manufacturer: 'Marine Air',
        serialNumber: 'HVAC-901234',
        installationDate: new Date('2020-06-25'),
        runtime: 8760,
        lastServiceDate: new Date('2023-08-01'),
        nextServiceDate: new Date('2023-10-10'),
        nextServiceHours: 10000,
        notes: 'Regular filter changes required',
        status: 'operational',
        location: 'Technical Spaces',
        specifications: { capacity: '16,000 BTU', refrigerant: 'R410A' },
        manualUrl: '/manuals/marine-air-vtd16k.pdf'
      },
      {
        name: 'Navigation System',
        category: 'navigation',
        model: 'Raymarine Axiom Pro',
        manufacturer: 'Raymarine',
        serialNumber: 'NAV-567890',
        installationDate: new Date('2020-07-05'),
        runtime: 4500,
        lastServiceDate: new Date('2023-09-15'),
        nextServiceDate: new Date('2024-03-15'),
        nextServiceHours: 6000,
        notes: 'Software update completed',
        status: 'operational',
        location: 'Bridge',
        specifications: { display: '12 inch', connectivity: 'NMEA 2000' },
        manualUrl: '/manuals/raymarine-axiom-pro.pdf'
      },
    ];

    equipmentList.forEach(equipment => {
      this.createEquipment(equipment as InsertEquipment);
    });
    
    // Create demo maintenance history records
    // This will allow us to generate predictive maintenance data
    const maintenanceHistoryRecords = [
      // Engine oil change records for the main engine
      {
        equipmentId: 1,
        maintenanceType: 'oil_change',
        serviceDate: new Date('2021-09-10'),
        runtime: 500,
        description: 'Regular oil change',
        findings: 'Normal wear, slight metal content in oil',
        partsReplaced: ['oil_filter', 'oil_15w40'],
        technician: 'Engineer L. Johnson',
        cost: 350.00,
        isSuccessful: true,
        taskId: null,
        createdById: 2,
        nextRecommendedDate: new Date('2022-03-10'),
        nextRecommendedRuntime: 1000
      },
      {
        equipmentId: 1,
        maintenanceType: 'oil_change',
        serviceDate: new Date('2022-03-15'),
        runtime: 1050,
        description: 'Regular oil change',
        findings: 'Normal wear',
        partsReplaced: ['oil_filter', 'oil_15w40'],
        technician: 'Engineer L. Johnson',
        cost: 350.00,
        isSuccessful: true,
        taskId: null,
        createdById: 2,
        nextRecommendedDate: new Date('2022-09-15'),
        nextRecommendedRuntime: 1500
      },
      {
        equipmentId: 1,
        maintenanceType: 'oil_change',
        serviceDate: new Date('2022-09-12'),
        runtime: 1520,
        description: 'Regular oil change',
        findings: 'Normal wear',
        partsReplaced: ['oil_filter', 'oil_15w40'],
        technician: 'Engineer A. Williams',
        cost: 350.00,
        isSuccessful: true,
        taskId: null,
        createdById: 3,
        nextRecommendedDate: new Date('2023-03-12'),
        nextRecommendedRuntime: 2000
      },
      {
        equipmentId: 1,
        maintenanceType: 'oil_change',
        serviceDate: new Date('2023-03-14'),
        runtime: 2100,
        description: 'Regular oil change',
        findings: 'Slightly higher metal content, monitor',
        partsReplaced: ['oil_filter', 'oil_15w40'],
        technician: 'Engineer L. Johnson',
        cost: 350.00,
        isSuccessful: true,
        taskId: null,
        createdById: 2,
        nextRecommendedDate: new Date('2023-09-14'),
        nextRecommendedRuntime: 2600
      },
      // Fuel filter replacements for main engine
      {
        equipmentId: 1,
        maintenanceType: 'fuel_filter',
        serviceDate: new Date('2021-11-20'),
        runtime: 750,
        description: 'Fuel filter replacement',
        findings: 'Moderate contamination',
        partsReplaced: ['primary_fuel_filter', 'secondary_fuel_filter'],
        technician: 'Engineer L. Johnson',
        cost: 180.00,
        isSuccessful: true,
        taskId: null,
        createdById: 2,
        nextRecommendedDate: new Date('2022-05-20'),
        nextRecommendedRuntime: 1250
      },
      {
        equipmentId: 1,
        maintenanceType: 'fuel_filter',
        serviceDate: new Date('2022-05-25'),
        runtime: 1200,
        description: 'Fuel filter replacement',
        findings: 'Low contamination',
        partsReplaced: ['primary_fuel_filter', 'secondary_fuel_filter'],
        technician: 'Engineer A. Williams',
        cost: 180.00,
        isSuccessful: true,
        taskId: null,
        createdById: 3,
        nextRecommendedDate: new Date('2022-11-25'),
        nextRecommendedRuntime: 1700
      },
      {
        equipmentId: 1,
        maintenanceType: 'fuel_filter',
        serviceDate: new Date('2022-11-28'),
        runtime: 1750,
        description: 'Fuel filter replacement',
        findings: 'Moderate contamination, fuel quality issue noted',
        partsReplaced: ['primary_fuel_filter', 'secondary_fuel_filter'],
        technician: 'Engineer L. Johnson',
        cost: 180.00,
        isSuccessful: true,
        taskId: null,
        createdById: 2,
        nextRecommendedDate: new Date('2023-05-28'),
        nextRecommendedRuntime: 2200
      },
      // Generator impeller replacements
      {
        equipmentId: 2,
        maintenanceType: 'impeller_replacement',
        serviceDate: new Date('2021-10-15'),
        runtime: 450,
        description: 'Water pump impeller replacement',
        findings: 'Slight wear on blades',
        partsReplaced: ['water_pump_impeller', 'gasket'],
        technician: 'Engineer A. Williams',
        cost: 120.00,
        isSuccessful: true,
        taskId: null,
        createdById: 3,
        nextRecommendedDate: new Date('2022-04-15'),
        nextRecommendedRuntime: 950
      },
      {
        equipmentId: 2,
        maintenanceType: 'impeller_replacement',
        serviceDate: new Date('2022-04-20'),
        runtime: 970,
        description: 'Water pump impeller replacement',
        findings: 'One blade damaged, rest in good condition',
        partsReplaced: ['water_pump_impeller', 'gasket'],
        technician: 'S. Thompson',
        cost: 120.00,
        isSuccessful: true,
        taskId: null,
        createdById: 4,
        nextRecommendedDate: new Date('2022-10-20'),
        nextRecommendedRuntime: 1450
      },
      {
        equipmentId: 2,
        maintenanceType: 'impeller_replacement',
        serviceDate: new Date('2022-10-17'),
        runtime: 1420,
        description: 'Water pump impeller replacement',
        findings: 'Normal wear',
        partsReplaced: ['water_pump_impeller', 'gasket'],
        technician: 'Engineer A. Williams',
        cost: 120.00,
        isSuccessful: true,
        taskId: null,
        createdById: 3,
        nextRecommendedDate: new Date('2023-04-17'),
        nextRecommendedRuntime: 1900
      },
      {
        equipmentId: 2,
        maintenanceType: 'impeller_replacement',
        serviceDate: new Date('2023-04-12'),
        runtime: 1880,
        description: 'Water pump impeller replacement',
        findings: 'Normal wear',
        partsReplaced: ['water_pump_impeller', 'gasket'],
        technician: 'Engineer L. Johnson',
        cost: 120.00,
        isSuccessful: true,
        taskId: null,
        createdById: 2,
        nextRecommendedDate: new Date('2023-10-12'),
        nextRecommendedRuntime: 2350
      }
    ];
  
    // Initialize maintenance history records
    this.historyCurrentId = 1;
    maintenanceHistoryRecords.forEach(record => {
      this.createMaintenanceHistory(record as InsertMaintenanceHistory);
    });
    
    // Generate initial predictive maintenance data
    this.predictiveCurrentId = 1;
    this.generatePredictiveMaintenanceForEquipment(1); // Main Engine
    this.generatePredictiveMaintenanceForEquipment(2); // Generator

    // Create demo maintenance tasks
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const maintenanceTasks = [
      {
        title: 'Main Engine Oil Change',
        description: 'Change oil and replace filters according to manufacturer specifications',
        equipmentId: 1,
        priority: 'high',
        status: 'due',
        dueDate: today,
        assignedToId: 2,
        completedById: null,
        completedAt: null,
        procedure: [
          { step: 1, description: 'Warm up engine to operating temperature' },
          { step: 2, description: 'Shut down engine and wait 15 minutes' },
          { step: 3, description: 'Drain old oil into appropriate container' },
          { step: 4, description: 'Replace oil filters' },
          { step: 5, description: 'Fill with new oil to specified level' },
          { step: 6, description: 'Run engine and check for leaks' }
        ],
        estimatedDuration: 120,
        actualDuration: null,
        notes: 'Use MTU approved 15W-40 oil only',
        createdById: 1
      },
      {
        title: 'Replace Water Pump Impeller',
        description: 'Replace impeller on auxiliary generator cooling system',
        equipmentId: 2,
        priority: 'medium',
        status: 'upcoming',
        dueDate: new Date('2023-09-25'),
        assignedToId: 3,
        completedById: null,
        completedAt: null,
        procedure: [
          { step: 1, description: 'Shut down generator and isolate cooling system' },
          { step: 2, description: 'Remove pump cover' },
          { step: 3, description: 'Extract old impeller' },
          { step: 4, description: 'Install new impeller with appropriate lubricant' },
          { step: 5, description: 'Reassemble pump and test' }
        ],
        estimatedDuration: 60,
        actualDuration: null,
        notes: 'Check for debris from damaged impeller in heat exchanger',
        createdById: 1
      },
      {
        title: 'Air Filter Inspection',
        description: 'Inspect and clean HVAC system air filters',
        equipmentId: 4,
        priority: 'low',
        status: 'upcoming',
        dueDate: new Date('2023-10-10'),
        assignedToId: 4,
        completedById: null,
        completedAt: null,
        procedure: [
          { step: 1, description: 'Power down HVAC system' },
          { step: 2, description: 'Remove access panels' },
          { step: 3, description: 'Extract filters' },
          { step: 4, description: 'Inspect and clean or replace as needed' },
          { step: 5, description: 'Reinstall and secure access panels' }
        ],
        estimatedDuration: 45,
        actualDuration: null,
        notes: 'Replace filters if visibly damaged or heavily soiled',
        createdById: 1
      },
      {
        title: 'Battery Inspection',
        description: 'Check and test all navigation system batteries',
        equipmentId: 5,
        priority: 'low',
        status: 'completed',
        dueDate: new Date('2023-09-15'),
        assignedToId: 5,
        completedById: 5,
        completedAt: new Date('2023-09-15T10:30:00'),
        procedure: [
          { step: 1, description: 'Check battery terminals for corrosion' },
          { step: 2, description: 'Measure voltage under load' },
          { step: 3, description: 'Clean connections as needed' },
          { step: 4, description: 'Apply corrosion inhibitor' }
        ],
        estimatedDuration: 30,
        actualDuration: 25,
        notes: 'All batteries in good condition',
        createdById: 1
      },
      {
        title: 'Bilge Pump Testing',
        description: 'Test all bilge pumps for proper operation',
        equipmentId: null,
        priority: 'medium',
        status: 'upcoming',
        dueDate: new Date('2023-09-25'),
        assignedToId: 2,
        completedById: null,
        completedAt: null,
        procedure: [
          { step: 1, description: 'Manually activate each pump' },
          { step: 2, description: 'Verify water flow' },
          { step: 3, description: 'Test automatic float switches' },
          { step: 4, description: 'Check alarm systems' }
        ],
        estimatedDuration: 60,
        actualDuration: null,
        notes: 'Document flow rate for each pump',
        createdById: 1
      },
      {
        title: 'Life Raft Inspection',
        description: 'Visual inspection of life rafts and mounting hardware',
        equipmentId: null,
        priority: 'medium',
        status: 'upcoming',
        dueDate: new Date('2023-09-28'),
        assignedToId: 4,
        completedById: null,
        completedAt: null,
        procedure: [
          { step: 1, description: 'Check hydrostatic release mechanism' },
          { step: 2, description: 'Inspect canister for damage' },
          { step: 3, description: 'Verify certification dates' },
          { step: 4, description: 'Check mounting hardware' }
        ],
        estimatedDuration: 45,
        actualDuration: null,
        notes: 'Professional recertification due in 6 months',
        createdById: 1
      },
      {
        title: 'Hydraulic Fluid Change',
        description: 'Complete hydraulic fluid change for stabilizer system',
        equipmentId: null,
        priority: 'high',
        status: 'upcoming',
        dueDate: new Date('2023-09-30'),
        assignedToId: 3,
        completedById: null,
        completedAt: null,
        procedure: [
          { step: 1, description: 'Drain old fluid' },
          { step: 2, description: 'Replace filters' },
          { step: 3, description: 'Fill with new fluid' },
          { step: 4, description: 'Bleed system of air' },
          { step: 5, description: 'Test operation' }
        ],
        estimatedDuration: 180,
        actualDuration: null,
        notes: 'Use Dexron III fluid only',
        createdById: 1
      }
    ];

    maintenanceTasks.forEach(task => {
      this.createMaintenanceTask(task as InsertMaintenanceTask);
    });

    // Create demo inventory items
    const inventoryItems = [
      {
        name: 'Engine Oil (15W-40)',
        category: 'Fluids',
        description: 'MTU approved 15W-40 marine engine oil',
        quantity: 10,
        unit: 'liters',
        minQuantity: 50,
        location: 'Engine Room Storage',
        partNumber: 'MTU-OIL-15W40',
        supplier: 'MTU Marine Supplies',
        cost: 12.5,
        lastRestockDate: new Date('2023-08-10'),
        compatibleEquipmentIds: [1]
      },
      {
        name: 'Fuel Filters',
        category: 'Filters',
        description: 'Primary fuel filters for main engines',
        quantity: 8,
        unit: 'units',
        minQuantity: 5,
        location: 'Engine Room Storage',
        partNumber: 'FF-MTU-2000',
        supplier: 'MTU Marine Supplies',
        cost: 45.0,
        lastRestockDate: new Date('2023-07-15'),
        compatibleEquipmentIds: [1]
      },
      {
        name: 'Coolant',
        category: 'Fluids',
        description: 'Premixed engine coolant solution',
        quantity: 45,
        unit: 'liters',
        minQuantity: 15,
        location: 'Engine Room Storage',
        partNumber: 'CL-MTU-MIX',
        supplier: 'MTU Marine Supplies',
        cost: 8.75,
        lastRestockDate: new Date('2023-06-20'),
        compatibleEquipmentIds: [1, 2]
      },
      {
        name: 'Impellers',
        category: 'Parts',
        description: 'Replacement water pump impellers',
        quantity: 4,
        unit: 'units',
        minQuantity: 2,
        location: 'Engine Room Storage',
        partNumber: 'IMP-KHL-80',
        supplier: 'Kohler Marine',
        cost: 65.0,
        lastRestockDate: new Date('2023-05-12'),
        compatibleEquipmentIds: [2]
      },
      {
        name: 'Air Filters',
        category: 'Filters',
        description: 'HVAC system air filters',
        quantity: 12,
        unit: 'units',
        minQuantity: 4,
        location: 'Technical Storage',
        partNumber: 'AF-MA-VTD16',
        supplier: 'Marine Air Systems',
        cost: 22.5,
        lastRestockDate: new Date('2023-07-05'),
        compatibleEquipmentIds: [4]
      },
      {
        name: 'Hydraulic Fluid',
        category: 'Fluids',
        description: 'Dexron III hydraulic fluid for stabilizers',
        quantity: 30,
        unit: 'liters',
        minQuantity: 20,
        location: 'Engine Room Storage',
        partNumber: 'HF-DEX-III',
        supplier: 'Marine Hydraulics Inc.',
        cost: 18.0,
        lastRestockDate: new Date('2023-06-10'),
        compatibleEquipmentIds: []
      },
      {
        name: 'Zinc Anodes',
        category: 'Parts',
        description: 'Sacrificial zinc anodes for hull protection',
        quantity: 15,
        unit: 'units',
        minQuantity: 8,
        location: 'Exterior Equipment Storage',
        partNumber: 'ZA-HULL-STD',
        supplier: 'Marine Protection Systems',
        cost: 12.0,
        lastRestockDate: new Date('2023-08-02'),
        compatibleEquipmentIds: []
      }
    ];

    inventoryItems.forEach(item => {
      this.createInventoryItem(item as InsertInventoryItem);
    });

    // Create demo activity logs
    const activityLogs = [
      {
        activityType: 'task_completed',
        description: 'Battery Inspection Completed',
        userId: 5,
        relatedEntityType: 'task',
        relatedEntityId: 4,
        metadata: { notes: 'All batteries in good condition' }
      },
      {
        activityType: 'task_created',
        description: 'New Maintenance Task Added',
        userId: 1,
        relatedEntityType: 'task',
        relatedEntityId: 1,
        metadata: { priority: 'high', dueDate: today.toISOString() }
      },
      {
        activityType: 'inventory_alert',
        description: 'Inventory Alert',
        userId: null,
        relatedEntityType: 'inventory',
        relatedEntityId: 1,
        metadata: { currentStock: 10, minQuantity: 50 }
      },
      {
        activityType: 'maintenance_updated',
        description: 'Maintenance Plan Updated',
        userId: 3,
        relatedEntityType: 'equipment',
        relatedEntityId: 2,
        metadata: { notes: 'Updated based on manufacturer recommendations' }
      }
    ];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    activityLogs.forEach((log, index) => {
      // Set timestamps to simulate a timeline of events
      const timestamp = new Date();
      
      if (index === 0) {
        // Today at 10:30 AM
        timestamp.setHours(10, 30, 0, 0);
      } else if (index === 1) {
        // Today at 9:15 AM
        timestamp.setHours(9, 15, 0, 0);
      } else if (index === 2) {
        // Yesterday at 2:45 PM
        timestamp.setDate(timestamp.getDate() - 1);
        timestamp.setHours(14, 45, 0, 0);
      } else if (index === 3) {
        // Yesterday at 11:20 AM
        timestamp.setDate(timestamp.getDate() - 1);
        timestamp.setHours(11, 20, 0, 0);
      }
      
      const logWithTimestamp = { ...log, timestamp };
      this.activityLogs.set(this.logCurrentId++, logWithTimestamp as ActivityLog);
    });
    
    // Initialize ISM Documents
    const ismDocuments = [
      {
        title: 'Emergency Response Procedures',
        documentType: 'procedure',
        documentNumber: 'ISM-ERP-001',
        version: '2.1',
        status: 'approved',
        approvedBy: 1, // Captain
        approvalDate: new Date('2023-06-15'),
        reviewDueDate: new Date('2024-06-15'),
        content: 'Detailed procedures for emergency situations including fire, flooding, and man overboard.',
        tags: ['emergency', 'safety', 'procedures'],
        createdBy: 1
      },
      {
        title: 'Waste Management Plan',
        documentType: 'policy',
        documentNumber: 'ISM-WMP-002',
        version: '1.5',
        status: 'approved',
        approvedBy: 1,
        approvalDate: new Date('2023-04-20'),
        reviewDueDate: new Date('2024-04-20'),
        content: 'Guidelines for handling waste onboard in compliance with MARPOL regulations.',
        tags: ['environmental', 'waste', 'regulations'],
        createdBy: 1
      },
      {
        title: 'Pre-departure Safety Checklist',
        documentType: 'checklist',
        documentNumber: 'ISM-CHK-003',
        version: '3.0',
        status: 'review',
        approvedBy: null,
        approvalDate: null,
        reviewDueDate: new Date('2023-12-01'),
        content: 'Comprehensive checklist to ensure all safety measures are in place before departure.',
        tags: ['safety', 'departure', 'checklist'],
        createdBy: 2
      },
      {
        title: 'Crew Training Manual',
        documentType: 'manual',
        documentNumber: 'ISM-TRN-004',
        version: '2.3',
        status: 'approved',
        approvedBy: 1,
        approvalDate: new Date('2023-03-10'),
        reviewDueDate: new Date('2024-03-10'),
        content: 'Comprehensive manual for crew training procedures and requirements.',
        tags: ['training', 'crew', 'development'],
        createdBy: 1
      }
    ];
    
    ismDocuments.forEach(doc => {
      this.createIsmDocument(doc as InsertIsmDocument);
    });
    
    // Initialize ISM Audits
    const ismAudits = [
      {
        title: 'Annual Safety Audit',
        auditType: 'internal',
        status: 'planned',
        startDate: new Date('2023-12-10'),
        endDate: new Date('2023-12-12'),
        auditScope: 'Comprehensive review of all safety procedures and equipment',
        auditors: [1, 2], // Captain and Engineer1
        location: 'Onboard',
        findings: [],
        correctiveActions: [],
        createdBy: 1
      },
      {
        title: 'Classification Society Inspection',
        auditType: 'external',
        status: 'completed',
        startDate: new Date('2023-05-15'),
        endDate: new Date('2023-05-16'),
        auditScope: 'Hull inspection and safety systems verification',
        auditors: ['John Smith (DNV GL)'],
        location: 'Marina Bay',
        findings: [
          { id: 1, description: 'Life raft inspection certificate expired', severity: 'major' },
          { id: 2, description: 'Fire extinguisher pressure gauge reading low in cabin 3', severity: 'minor' }
        ],
        correctiveActions: [
          { id: 1, description: 'Schedule life raft inspection and certification', assignedTo: 2, dueDate: new Date('2023-05-30'), status: 'completed' },
          { id: 2, description: 'Replace fire extinguisher in cabin 3', assignedTo: 3, dueDate: new Date('2023-05-20'), status: 'completed' }
        ],
        createdBy: 1
      }
    ];
    
    ismAudits.forEach(audit => {
      this.createIsmAudit(audit as InsertIsmAudit);
    });
    
    // Initialize ISM Training
    const ismTraining = [
      {
        title: 'Fire Fighting Refresher',
        trainingType: 'safety',
        description: 'Annual refresher training on firefighting techniques and equipment use',
        requiredParticipants: [1, 2, 3, 4, 5], // All crew
        actualParticipants: [1, 2, 3, 4], // Technician2 missing
        scheduledDate: new Date('2023-11-15'),
        completionDate: null,
        duration: 4, // hours
        attachments: [],
        notes: 'Will include practical exercise with fire extinguishers',
        status: 'planned',
        createdBy: 1
      },
      {
        title: 'Man Overboard Drill',
        trainingType: 'drill',
        description: 'Practice drill for man overboard emergency response',
        requiredParticipants: [1, 2, 3, 4, 5],
        actualParticipants: [1, 2, 3, 4, 5],
        scheduledDate: new Date('2023-08-10'),
        completionDate: new Date('2023-08-10'),
        duration: 2,
        attachments: ['mob_drill_report_20230810.pdf'],
        notes: 'Successfully completed. Response time improved by 15% from last drill.',
        status: 'completed',
        createdBy: 1
      }
    ];
    
    ismTraining.forEach(training => {
      this.createIsmTraining(training as InsertIsmTraining);
    });
    
    // Initialize ISM Incidents
    const ismIncidents = [
      {
        title: 'Fuel Spillage During Bunkering',
        incidentType: 'near-miss',
        description: 'Small amount of fuel spilled on deck during bunkering operation. Contained before reaching water.',
        dateReported: new Date('2023-09-05'),
        dateOccurred: new Date('2023-09-04'),
        location: 'Aft Deck',
        reportedBy: 2, // Engineer1
        severity: 'minor',
        rootCause: 'Improper connection of fuel hose',
        immediateActions: 'Spillage contained using absorbent materials. Transfer stopped immediately.',
        correctiveActions: [
          { id: 1, action: 'Revise bunkering procedure', status: 'in-progress', assignedTo: 1, dueDate: new Date('2023-09-30') },
          { id: 2, action: 'Additional training for crew', status: 'planned', assignedTo: 2, dueDate: new Date('2023-10-15') }
        ],
        preventiveActions: [
          { id: 1, action: 'Install improved fuel transfer monitoring system', status: 'planned', dueDate: new Date('2023-11-30') }
        ],
        status: 'in-progress',
        verifiedBy: null,
        verificationDate: null,
        attachments: ['incident_report_20230905.pdf', 'photos_fuel_spill.jpg']
      },
      {
        title: 'Navigation Equipment Malfunction',
        incidentType: 'observation',
        description: 'GPS system showed intermittent errors during coastal navigation.',
        dateReported: new Date('2023-08-20'),
        dateOccurred: new Date('2023-08-19'),
        location: 'Bridge',
        reportedBy: 1, // Captain
        severity: 'minor',
        rootCause: 'Software issue in navigation system',
        immediateActions: 'Switched to backup navigation system',
        correctiveActions: [
          { id: 1, action: 'Update navigation system software', status: 'completed', assignedTo: 3, dueDate: new Date('2023-08-25') }
        ],
        preventiveActions: [],
        status: 'closed',
        verifiedBy: 1,
        verificationDate: new Date('2023-08-26'),
        attachments: []
      }
    ];
    
    ismIncidents.forEach(incident => {
      this.createIsmIncident(incident as InsertIsmIncident);
    });

    // Initialize Form Categories
    const formCategories = [
      {
        name: 'Safety Procedures',
        description: 'Forms and checklists related to safety protocols and procedures',
        isActive: true,
        createdBy: 1
      },
      {
        name: 'Engineering Inspections',
        description: 'Technical inspection forms for engineering and mechanical systems',
        isActive: true,
        createdBy: 2
      },
      {
        name: 'Navigation',
        description: 'Navigation and voyage planning checklists',
        isActive: true,
        createdBy: 1
      },
      {
        name: 'Environmental Compliance',
        description: 'Forms for tracking environmental compliance and waste management',
        isActive: true,
        createdBy: 1
      }
    ];

    formCategories.forEach(category => {
      this.createFormCategory(category as InsertFormCategory);
    });

    // Initialize Form Templates
    const formTemplates = [
      {
        title: 'Pre-Departure Safety Checklist',
        description: 'Comprehensive safety check before vessel departure',
        categoryId: 1,
        createdBy: 1,
        isActive: true
      },
      {
        title: 'Main Engine Inspection Form',
        description: 'Detailed inspection checklist for main engines',
        categoryId: 2,
        createdBy: 2,
        isActive: true
      },
      {
        title: 'Voyage Planning Checklist',
        description: 'Route planning and navigation safety checks',
        categoryId: 3,
        createdBy: 1,
        isActive: true
      },
      {
        title: 'Waste Management Log',
        description: 'MARPOL compliance waste tracking form',
        categoryId: 4,
        createdBy: 1,
        isActive: true
      }
    ];

    // Create templates and their initial versions
    formTemplates.forEach((template, index) => {
      const createdTemplate = this.createFormTemplate(template as InsertFormTemplate);
      
      // Create an initial version for each template
      const templateVersion = {
        templateId: createdTemplate.id,
        versionNumber: '1.0',
        structure: JSON.stringify({
          sections: [
            {
              title: index === 0 ? 'Safety Equipment Checks' : 
                     index === 1 ? 'Engine General Condition' :
                     index === 2 ? 'Route Planning' : 'Waste Collection',
              fields: [
                {
                  type: 'checkbox',
                  label: index === 0 ? 'Life jackets inspected and accessible' :
                         index === 1 ? 'Oil levels within normal range' :
                         index === 2 ? 'Weather forecasts reviewed' : 'Waste separated by type',
                  required: true,
                  key: `field_${index}_1`
                },
                {
                  type: 'checkbox',
                  label: index === 0 ? 'Fire extinguishers checked and operational' :
                         index === 1 ? 'Cooling system functioning properly' :
                         index === 2 ? 'Nautical charts up to date' : 'Hazardous waste properly contained',
                  required: true,
                  key: `field_${index}_2`
                },
                {
                  type: 'text',
                  label: 'Additional comments',
                  required: false,
                  key: `field_${index}_3`
                }
              ]
            },
            {
              title: index === 0 ? 'Navigation Readiness' : 
                     index === 1 ? 'Performance Test Results' :
                     index === 2 ? 'Safety Measures' : 'Disposal Records',
              fields: [
                {
                  type: 'checkbox',
                  label: index === 0 ? 'Navigation lights operational' :
                         index === 1 ? 'Engine started and running smoothly' :
                         index === 2 ? 'Crew briefed on voyage plan' : 'Disposal receipts collected',
                  required: true,
                  key: `field_${index}_4`
                },
                {
                  type: 'text',
                  label: 'Notes',
                  required: false,
                  key: `field_${index}_5`
                }
              ]
            }
          ]
        }),
        changes: 'Initial version',
        isActive: true,
        createdBy: template.createdBy
      };
      
      this.createFormTemplateVersion(templateVersion as InsertFormTemplateVersion);
    });

    // Initialize ISM Tasks
    const ismTasks = [
      {
        title: 'Complete Pre-Departure Safety Inspection',
        description: 'Perform all safety checks before departing from Miami port',
        assignedTo: 1,
        templateVersionId: 1,
        dueDate: new Date(Date.now() + 86400000 * 2), // 2 days from now
        priority: 'high',
        status: 'assigned',
        vesselId: 1,
        createdBy: 1
      },
      {
        title: 'Monthly Main Engine Inspection',
        description: 'Conduct standard inspection of main engines as per company policy',
        assignedTo: 2,
        templateVersionId: 2,
        dueDate: new Date(Date.now() + 86400000 * 5), // 5 days from now
        priority: 'medium',
        status: 'in-progress',
        vesselId: 1,
        createdBy: 1
      },
      {
        title: 'Prepare Voyage Plan: Miami to Bahamas',
        description: 'Complete voyage planning checklist for upcoming Bahamas trip',
        assignedTo: 1,
        templateVersionId: 3,
        dueDate: new Date(Date.now() + 86400000 * 1), // 1 day from now
        priority: 'high',
        status: 'assigned',
        vesselId: 1,
        createdBy: 1
      },
      {
        title: 'Weekly Waste Management Log',
        description: 'Complete the waste management log for regulatory compliance',
        assignedTo: 3,
        templateVersionId: 4,
        dueDate: new Date(Date.now() - 86400000 * 1), // 1 day ago (overdue)
        priority: 'low',
        status: 'overdue',
        vesselId: 1,
        createdBy: 1
      }
    ];

    ismTasks.forEach(task => {
      this.createIsmTask(task as InsertIsmTask);
    });

    // Initialize one Form Submission (for the in-progress task)
    const formSubmission = {
      taskId: 2, // Monthly Main Engine Inspection task
      submittedBy: 2,
      submissionData: JSON.stringify({
        field_1_1: true, // Oil levels within normal range - checked
        field_1_2: true, // Cooling system functioning properly - checked
        field_1_3: 'Found minor oil leakage, needs to be monitored',
        field_1_4: false, // Engine started and running smoothly - not checked yet
        field_1_5: 'Will complete performance test tomorrow'
      }),
      status: 'draft',
      feedback: null,
      reviewedBy: null,
      reviewDate: null
    };

    this.createFormSubmission(formSubmission as InsertFormSubmission);

    // Initialize Task Comments
    const taskComments = [
      {
        taskId: 2, // Monthly Main Engine Inspection task
        userId: 2,
        comment: 'Started the inspection, found minor oil leakage that needs monitoring. Will complete performance tests tomorrow.',
        attachments: []
      },
      {
        taskId: 3, // Prepare Voyage Plan task
        userId: 1,
        comment: 'Weather forecast indicates possible storms near Bahamas. Need to prepare alternate routes.',
        attachments: []
      }
    ];

    taskComments.forEach(comment => {
      this.createTaskComment(comment as InsertTaskComment);
    });
  }
  
  // Deposit operations
  async getDeposit(id: number): Promise<Deposit | undefined> {
    return this.deposits.get(id);
  }
  
  async getDepositsByVessel(vesselId: number): Promise<Deposit[]> {
    return Array.from(this.deposits.values()).filter(
      (deposit) => deposit.vesselId === vesselId
    );
  }
  
  async getDepositsByAccount(accountId: number): Promise<Deposit[]> {
    return Array.from(this.deposits.values()).filter(
      (deposit) => deposit.accountId === accountId
    );
  }
  
  async createDeposit(deposit: InsertDeposit): Promise<Deposit> {
    const id = this.depositCurrentId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    
    const newDeposit: Deposit = { 
      ...deposit, 
      id, 
      createdAt, 
      updatedAt 
    };
    
    this.deposits.set(id, newDeposit);
    return newDeposit;
  }
  
  async createBulkDeposits(deposits: InsertDeposit[]): Promise<Deposit[]> {
    const createdDeposits: Deposit[] = [];
    
    for (const deposit of deposits) {
      const newDeposit = await this.createDeposit(deposit);
      createdDeposits.push(newDeposit);
    }
    
    return createdDeposits;
  }
  
  async updateDeposit(id: number, depositUpdate: Partial<Deposit>): Promise<Deposit | undefined> {
    const existingDeposit = this.deposits.get(id);
    if (!existingDeposit) return undefined;
    
    const updatedDeposit = { 
      ...existingDeposit, 
      ...depositUpdate,
      updatedAt: new Date()
    };
    
    this.deposits.set(id, updatedDeposit);
    return updatedDeposit;
  }
  
  async deleteDeposit(id: number): Promise<boolean> {
    return this.deposits.delete(id);
  }
  
  // Financial Account operations
  async getFinancialAccount(id: number): Promise<FinancialAccount | undefined> {
    return this.financialAccounts.get(id);
  }
  
  async getFinancialAccountsByVessel(vesselId: number): Promise<FinancialAccount[]> {
    return Array.from(this.financialAccounts.values()).filter(
      (account) => account.vesselId === vesselId
    );
  }
  
  async getAllFinancialAccounts(): Promise<FinancialAccount[]> {
    return Array.from(this.financialAccounts.values());
  }
  
  async getFinancialAccountByCategory(category: string): Promise<FinancialAccount[]> {
    return Array.from(this.financialAccounts.values()).filter(
      (account) => account.category === category
    );
  }
  
  async createFinancialAccount(account: InsertFinancialAccount): Promise<FinancialAccount> {
    const id = this.financialAccountCurrentId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    
    const newAccount: FinancialAccount = { 
      ...account, 
      id, 
      createdAt, 
      updatedAt 
    };
    
    this.financialAccounts.set(id, newAccount);
    return newAccount;
  }
  
  async updateFinancialAccount(id: number, accountUpdate: Partial<FinancialAccount>): Promise<FinancialAccount | undefined> {
    const existingAccount = this.financialAccounts.get(id);
    if (!existingAccount) return undefined;
    
    const updatedAccount = { 
      ...existingAccount, 
      ...accountUpdate,
      updatedAt: new Date()
    };
    
    this.financialAccounts.set(id, updatedAccount);
    return updatedAccount;
  }
  
  async deleteFinancialAccount(id: number): Promise<boolean> {
    return this.financialAccounts.delete(id);
  }
  
  // Transaction operations
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }
  
  async getTransactionsByVessel(vesselId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.vesselId === vesselId
    );
  }
  
  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }
  
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionCurrentId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    
    const newTransaction: Transaction = { 
      ...transaction, 
      id, 
      createdAt, 
      updatedAt 
    };
    
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }
  
  async updateTransaction(id: number, transactionUpdate: Partial<Transaction>): Promise<Transaction | undefined> {
    const existingTransaction = this.transactions.get(id);
    if (!existingTransaction) return undefined;
    
    const updatedTransaction = { 
      ...existingTransaction, 
      ...transactionUpdate,
      updatedAt: new Date()
    };
    
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }
  
  async deleteTransaction(id: number): Promise<boolean> {
    return this.transactions.delete(id);
  }
  
  // Transaction Line operations
  async getTransactionLine(id: number): Promise<TransactionLine | undefined> {
    return this.transactionLines.get(id);
  }
  
  async getTransactionLines(transactionId: number): Promise<TransactionLine[]> {
    return Array.from(this.transactionLines.values()).filter(
      (line) => line.transactionId === transactionId
    );
  }
  
  async getTransactionLinesByTransactionIds(transactionIds: number[]): Promise<TransactionLine[]> {
    return Array.from(this.transactionLines.values()).filter(
      (line) => transactionIds.includes(line.transactionId)
    );
  }
  
  async createTransactionLine(line: InsertTransactionLine): Promise<TransactionLine> {
    const id = this.transactionLineCurrentId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    
    const newLine: TransactionLine = { 
      ...line, 
      id, 
      createdAt, 
      updatedAt 
    };
    
    this.transactionLines.set(id, newLine);
    return newLine;
  }
  
  async updateTransactionLine(id: number, lineUpdate: Partial<TransactionLine>): Promise<TransactionLine | undefined> {
    const existingLine = this.transactionLines.get(id);
    if (!existingLine) return undefined;
    
    const updatedLine = { 
      ...existingLine, 
      ...lineUpdate,
      updatedAt: new Date()
    };
    
    this.transactionLines.set(id, updatedLine);
    return updatedLine;
  }
  
  async deleteTransactionLine(id: number): Promise<boolean> {
    return this.transactionLines.delete(id);
  }
}

import { DatabaseStorage } from './databaseStorage';

// Use DatabaseStorage with PostgreSQL for production
export const storage = new DatabaseStorage();
