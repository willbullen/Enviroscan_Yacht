import { 
  users, type User, type InsertUser,
  equipment, type Equipment, type InsertEquipment,
  maintenanceTasks, type MaintenanceTask, type InsertMaintenanceTask,
  inventoryItems, type InventoryItem, type InsertInventoryItem,
  activityLogs, type ActivityLog, type InsertActivityLog
} from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private equipment: Map<number, Equipment>;
  private maintenanceTasks: Map<number, MaintenanceTask>;
  private inventoryItems: Map<number, InventoryItem>;
  private activityLogs: Map<number, ActivityLog>;
  
  private userCurrentId: number;
  private equipmentCurrentId: number;
  private taskCurrentId: number;
  private inventoryCurrentId: number;
  private logCurrentId: number;

  constructor() {
    this.users = new Map();
    this.equipment = new Map();
    this.maintenanceTasks = new Map();
    this.inventoryItems = new Map();
    this.activityLogs = new Map();
    
    this.userCurrentId = 1;
    this.equipmentCurrentId = 1;
    this.taskCurrentId = 1;
    this.inventoryCurrentId = 1;
    this.logCurrentId = 1;
    
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
  }
}

export const storage = new MemStorage();
