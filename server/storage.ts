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
  speedChart, type SpeedChart, type InsertSpeedChart
} from "@shared/schema";
import { db } from "./db";
import { eq, and, lt, gt, between, desc, asc } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

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
  }
}

import { DatabaseStorage } from './databaseStorage';

// Use DatabaseStorage with PostgreSQL for production
export const storage = new DatabaseStorage();
