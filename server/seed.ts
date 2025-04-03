import { db } from './db';
import { pool } from './db';
import {
  users,
  equipment,
  maintenanceTasks,
  inventoryItems,
  activityLogs,
  maintenanceHistory,
  predictiveMaintenance,
  ismDocuments,
  ismAudits,
  ismTraining,
  ismIncidents,
  crewMembers,
  crewDocuments
} from '@shared/schema';

async function seed() {
  try {
    console.log('Starting database seeding...');

    // Add users
    console.log('Seeding users...');
    const usersData = [
      {
        username: 'captain',
        password: 'password123',
        fullName: 'John Smith',
        role: 'Captain',
        avatarUrl: null
      },
      {
        username: 'engineer',
        password: 'password123',
        fullName: 'Maria Garcia',
        role: 'Chief Engineer',
        avatarUrl: null
      },
      {
        username: 'officer',
        password: 'password123',
        fullName: 'Robert Chen',
        role: 'First Officer',
        avatarUrl: null
      },
      {
        username: 'steward',
        password: 'password123',
        fullName: 'Sophia Williams',
        role: 'Chief Stewardess',
        avatarUrl: null
      }
    ];

    const insertedUsers = [];
    for (const userData of usersData) {
      const [user] = await db.insert(users).values(userData).returning();
      insertedUsers.push(user);
      console.log(`Added user: ${user.username} (${user.fullName})`);
    }

    // Add equipment
    console.log('Seeding equipment...');
    const equipmentData = [
      {
        name: 'Main Engine - Port',
        category: 'mechanical',
        model: 'MTU 16V 4000 M73L',
        manufacturer: 'MTU',
        serialNumber: 'ME-PORT-12345',
        installationDate: new Date('2020-01-15'),
        runtime: 1205.5,
        lastServiceDate: new Date('2022-06-10'),
        nextServiceDate: new Date('2023-06-10'),
        nextServiceHours: 2000,
        notes: 'Last service included replacement of fuel injectors',
        status: 'operational',
        location: 'Engine Room - Port Side',
        specifications: JSON.stringify({
          power: '2560 kW',
          cylinders: 16,
          weight: '8900 kg'
        }),
        manualUrl: '/manuals/mtu_16v_4000.pdf'
      },
      {
        name: 'Main Engine - Starboard',
        category: 'mechanical',
        model: 'MTU 16V 4000 M73L',
        manufacturer: 'MTU',
        serialNumber: 'ME-STBD-12346',
        installationDate: new Date('2020-01-15'),
        runtime: 1180.2,
        lastServiceDate: new Date('2022-06-10'),
        nextServiceDate: new Date('2023-06-10'),
        nextServiceHours: 2000,
        notes: 'Oil pressure slightly lower than port engine - monitor',
        status: 'operational',
        location: 'Engine Room - Starboard Side',
        specifications: JSON.stringify({
          power: '2560 kW',
          cylinders: 16,
          weight: '8900 kg'
        }),
        manualUrl: '/manuals/mtu_16v_4000.pdf'
      },
      {
        name: 'Generator 1',
        category: 'electrical',
        model: 'Kohler 80EOZD',
        manufacturer: 'Kohler',
        serialNumber: 'GEN-01-78901',
        installationDate: new Date('2020-02-20'),
        runtime: 3540.8,
        lastServiceDate: new Date('2022-08-15'),
        nextServiceDate: new Date('2023-02-15'),
        nextServiceHours: 4000,
        notes: 'Primary generator, runs most frequently',
        status: 'operational',
        location: 'Engine Room - Forward Starboard',
        specifications: JSON.stringify({
          power: '80 kW',
          voltage: '240/120V',
          phase: '3'
        }),
        manualUrl: '/manuals/kohler_80eozd.pdf'
      },
      {
        name: 'Generator 2',
        category: 'electrical',
        model: 'Kohler 80EOZD',
        manufacturer: 'Kohler',
        serialNumber: 'GEN-02-78902',
        installationDate: new Date('2020-02-20'),
        runtime: 1850.3,
        lastServiceDate: new Date('2022-07-20'),
        nextServiceDate: new Date('2023-07-20'),
        nextServiceHours: 2500,
        notes: 'Secondary generator',
        status: 'operational',
        location: 'Engine Room - Forward Port',
        specifications: JSON.stringify({
          power: '80 kW',
          voltage: '240/120V',
          phase: '3'
        }),
        manualUrl: '/manuals/kohler_80eozd.pdf'
      },
      {
        name: 'Radar System',
        category: 'navigation',
        model: 'Simrad HALO-6',
        manufacturer: 'Simrad',
        serialNumber: 'RAD-SIM-45678',
        installationDate: new Date('2020-03-10'),
        runtime: 2100.5,
        lastServiceDate: new Date('2022-05-05'),
        nextServiceDate: new Date('2023-05-05'),
        nextServiceHours: null,
        notes: 'Primary radar system, calibrated for 72nm range',
        status: 'operational',
        location: 'Mast - Upper Level',
        specifications: JSON.stringify({
          range: '72 nm',
          beamWidth: '1.2°',
          powerOutput: '25W'
        }),
        manualUrl: '/manuals/simrad_halo6.pdf'
      },
      {
        name: 'Liferaft - Port',
        category: 'safety',
        model: 'Viking RescYou Pro',
        manufacturer: 'Viking Life-Saving Equipment',
        serialNumber: 'LR-PORT-98765',
        installationDate: new Date('2020-01-30'),
        runtime: null,
        lastServiceDate: new Date('2022-01-30'),
        nextServiceDate: new Date('2023-01-30'),
        nextServiceHours: null,
        notes: 'Annual inspection required by regulation',
        status: 'operational',
        location: 'Boat Deck - Port Side',
        specifications: JSON.stringify({
          capacity: '12 persons',
          type: 'Self-inflating',
          weight: '88 kg'
        }),
        manualUrl: '/manuals/viking_liferaft.pdf'
      },
      {
        name: 'Air Conditioning System',
        category: 'mechanical',
        model: 'Dometic VARC240',
        manufacturer: 'Dometic Marine',
        serialNumber: 'AC-MAIN-56789',
        installationDate: new Date('2020-02-15'),
        runtime: 4500.2,
        lastServiceDate: new Date('2022-09-01'),
        nextServiceDate: new Date('2023-03-01'),
        nextServiceHours: 5000,
        notes: 'Main chiller system for all guest and crew areas',
        status: 'maintenance_required',
        location: 'Engine Room - Aft',
        specifications: JSON.stringify({
          capacity: '240,000 BTU',
          refrigerant: 'R410A',
          zones: '8'
        }),
        manualUrl: '/manuals/dometic_varc240.pdf'
      },
      {
        name: 'Watermaker',
        category: 'mechanical',
        model: 'Sea Recovery Aqua Whisper Pro 1800',
        manufacturer: 'Sea Recovery',
        serialNumber: 'WM-SR-34567',
        installationDate: new Date('2020-02-28'),
        runtime: 2800.6,
        lastServiceDate: new Date('2022-08-10'),
        nextServiceDate: new Date('2023-02-10'),
        nextServiceHours: 3000,
        notes: 'Membrane replaced during last service',
        status: 'operational',
        location: 'Engine Room - Port Forward',
        specifications: JSON.stringify({
          capacity: '7,000 liters/day',
          power: '11 kW',
          membranes: '4'
        }),
        manualUrl: '/manuals/searecovery_aw1800.pdf'
      }
    ];

    const insertedEquipment = [];
    for (const equipmentItem of equipmentData) {
      const [item] = await db.insert(equipment).values(equipmentItem).returning();
      insertedEquipment.push(item);
      console.log(`Added equipment: ${item.name}`);
    }

    // Add maintenance tasks
    console.log('Seeding maintenance tasks...');
    const today = new Date();
    const monthFromNow = new Date(today);
    monthFromNow.setMonth(monthFromNow.getMonth() + 1);
    
    const twoWeeksFromNow = new Date(today);
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const tasksData = [
      {
        title: 'Main Engine Oil Change',
        description: 'Change oil and replace filters on both main engines',
        equipmentId: insertedEquipment[0].id, // Main Engine - Port
        priority: 'high',
        status: 'due',
        dueDate: yesterday,
        assignedToId: insertedUsers[1].id, // Engineer
        completedById: null,
        completedAt: null,
        procedure: JSON.stringify([
          'Ensure engines are cool before starting',
          'Drain oil from sump',
          'Replace oil filters',
          'Fill with fresh oil to correct level',
          'Run engines for 5 minutes and check for leaks',
          'Check oil level again and top up if necessary'
        ]),
        estimatedDuration: 180, // 3 hours
        actualDuration: null,
        notes: 'Use MTU approved oil only',
        createdById: insertedUsers[0].id // Captain
      },
      {
        title: 'Generator 1 Fuel Filter Replacement',
        description: 'Replace primary and secondary fuel filters on Generator 1',
        equipmentId: insertedEquipment[2].id, // Generator 1
        priority: 'medium',
        status: 'upcoming',
        dueDate: twoWeeksFromNow,
        assignedToId: insertedUsers[1].id, // Engineer
        completedById: null,
        completedAt: null,
        procedure: JSON.stringify([
          'Shut down generator and allow to cool',
          'Close fuel supply valve',
          'Remove and replace primary fuel filter',
          'Remove and replace secondary fuel filter',
          'Open fuel supply valve',
          'Prime fuel system',
          'Start generator and check for leaks',
          'Run for 10 minutes and verify operation'
        ]),
        estimatedDuration: 90, // 1.5 hours
        actualDuration: null,
        notes: 'Keep spare filters in stock',
        createdById: insertedUsers[0].id // Captain
      },
      {
        title: 'Air Conditioning System Inspection',
        description: 'Inspect all components of the AC system and clean filters',
        equipmentId: insertedEquipment[6].id, // Air Conditioning System
        priority: 'high',
        status: 'in_progress',
        dueDate: today,
        assignedToId: insertedUsers[1].id, // Engineer
        completedById: null,
        completedAt: null,
        procedure: JSON.stringify([
          'Check refrigerant levels',
          'Inspect and clean condenser',
          'Clean or replace all filters',
          'Check all fan motors for proper operation',
          'Inspect all zones for proper cooling',
          'Check and clean all drain lines',
          'Document refrigerant pressure readings'
        ]),
        estimatedDuration: 240, // 4 hours
        actualDuration: null,
        notes: 'Some zones have reported reduced cooling efficiency',
        createdById: insertedUsers[0].id // Captain
      },
      {
        title: 'Watermaker Membrane Cleaning',
        description: 'Perform acid cleaning of watermaker membranes',
        equipmentId: insertedEquipment[7].id, // Watermaker
        priority: 'medium',
        status: 'completed',
        dueDate: yesterday,
        assignedToId: insertedUsers[1].id, // Engineer
        completedById: insertedUsers[1].id, // Engineer
        completedAt: yesterday,
        procedure: JSON.stringify([
          'Prepare acid cleaning solution',
          'Connect cleaning tank to system',
          'Circulate cleaning solution as per manufacturer instructions',
          'Rinse thoroughly with freshwater',
          'Test water quality before returning to service',
          'Document water quality readings'
        ]),
        estimatedDuration: 180, // 3 hours
        actualDuration: 210, // 3.5 hours
        notes: 'Production rate was reduced by 15% before cleaning',
        createdById: insertedUsers[0].id // Captain
      },
      {
        title: 'Liferaft Annual Inspection',
        description: 'Send liferaft to certified facility for annual inspection',
        equipmentId: insertedEquipment[5].id, // Liferaft - Port
        priority: 'high',
        status: 'upcoming',
        dueDate: monthFromNow,
        assignedToId: insertedUsers[2].id, // First Officer
        completedById: null,
        completedAt: null,
        procedure: JSON.stringify([
          'Contact certified liferaft service center',
          'Schedule pickup/delivery',
          'Ensure replacement liferaft is installed temporarily',
          'Update documentation with new inspection date',
          'Check certifications are valid'
        ]),
        estimatedDuration: 480, // 8 hours (including transport)
        actualDuration: null,
        notes: 'Regulatory requirement, must be completed before expiry',
        createdById: insertedUsers[0].id // Captain
      }
    ];

    const insertedTasks = [];
    for (const task of tasksData) {
      const [insertedTask] = await db.insert(maintenanceTasks).values(task).returning();
      insertedTasks.push(insertedTask);
      console.log(`Added maintenance task: ${insertedTask.title}`);
    }

    // Add inventory items
    console.log('Seeding inventory items...');
    const inventoryData = [
      {
        name: 'Engine Oil - MTU Approved',
        category: 'consumables',
        description: 'Premium synthetic oil for MTU engines',
        quantity: 120,
        unit: 'liters',
        minQuantity: 40,
        location: 'Engine Room Storage - Section A',
        partNumber: 'MTU-OIL-15W40',
        supplier: 'MTU Service Partner',
        cost: 12.5,
        lastRestockDate: new Date('2022-11-15'),
        compatibleEquipmentIds: JSON.stringify([insertedEquipment[0].id, insertedEquipment[1].id])
      },
      {
        name: 'Fuel Filter - Generator',
        category: 'filters',
        description: 'Primary fuel filter for Kohler generators',
        quantity: 5,
        unit: 'units',
        minQuantity: 2,
        location: 'Engine Room Storage - Section B',
        partNumber: 'KH-FF-8080',
        supplier: 'Kohler Marine',
        cost: 45.75,
        lastRestockDate: new Date('2022-10-20'),
        compatibleEquipmentIds: JSON.stringify([insertedEquipment[2].id, insertedEquipment[3].id])
      },
      {
        name: 'Oil Filter - Main Engine',
        category: 'filters',
        description: 'Oil filter for MTU 16V 4000 series engines',
        quantity: 12,
        unit: 'units',
        minQuantity: 4,
        location: 'Engine Room Storage - Section B',
        partNumber: 'MTU-OF-4000-16V',
        supplier: 'MTU Service Partner',
        cost: 120.50,
        lastRestockDate: new Date('2022-09-05'),
        compatibleEquipmentIds: JSON.stringify([insertedEquipment[0].id, insertedEquipment[1].id])
      },
      {
        name: 'Coolant - Extended Life',
        category: 'consumables',
        description: 'Extended life coolant for diesel engines',
        quantity: 60,
        unit: 'liters',
        minQuantity: 20,
        location: 'Engine Room Storage - Section A',
        partNumber: 'MTU-COOL-ELC',
        supplier: 'MTU Service Partner',
        cost: 18.25,
        lastRestockDate: new Date('2022-08-10'),
        compatibleEquipmentIds: JSON.stringify([
          insertedEquipment[0].id, 
          insertedEquipment[1].id, 
          insertedEquipment[2].id, 
          insertedEquipment[3].id
        ])
      },
      {
        name: 'Air Filter - Generator',
        category: 'filters',
        description: 'Air intake filter for Kohler generators',
        quantity: 3,
        unit: 'units',
        minQuantity: 2,
        location: 'Engine Room Storage - Section B',
        partNumber: 'KH-AF-9090',
        supplier: 'Kohler Marine',
        cost: 65.00,
        lastRestockDate: new Date('2022-07-15'),
        compatibleEquipmentIds: JSON.stringify([insertedEquipment[2].id, insertedEquipment[3].id])
      },
      {
        name: 'Watermaker Membrane Cleaning Solution',
        category: 'chemicals',
        description: 'Acid cleaning solution for RO membranes',
        quantity: 10,
        unit: 'liters',
        minQuantity: 5,
        location: 'Chemical Storage Locker',
        partNumber: 'SR-MEM-CLEAN',
        supplier: 'Sea Recovery',
        cost: 32.40,
        lastRestockDate: new Date('2022-10-05'),
        compatibleEquipmentIds: JSON.stringify([insertedEquipment[7].id])
      },
      {
        name: 'Air Conditioning Refrigerant - R410A',
        category: 'consumables',
        description: 'Refrigerant for HVAC system',
        quantity: 2,
        unit: 'cylinders',
        minQuantity: 1,
        location: 'Chemical Storage Locker',
        partNumber: 'R410A-10KG',
        supplier: 'Marine HVAC Supply',
        cost: 250.00,
        lastRestockDate: new Date('2022-06-20'),
        compatibleEquipmentIds: JSON.stringify([insertedEquipment[6].id])
      },
      {
        name: 'Zinc Anodes - 2.5kg',
        category: 'hardware',
        description: 'Sacrificial anodes for hull protection',
        quantity: 8,
        unit: 'units',
        minQuantity: 4,
        location: 'Deck Storage - Forward',
        partNumber: 'ZINC-2.5KG',
        supplier: 'Marine Hardware Inc',
        cost: 45.00,
        lastRestockDate: new Date('2022-11-01'),
        compatibleEquipmentIds: JSON.stringify([])
      }
    ];

    const insertedInventory = [];
    for (const item of inventoryData) {
      const [insertedItem] = await db.insert(inventoryItems).values(item).returning();
      insertedInventory.push(insertedItem);
      console.log(`Added inventory item: ${insertedItem.name}`);
    }

    // Add activity logs
    console.log('Seeding activity logs...');
    
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const activityLogsData = [
      {
        activityType: 'task_completed',
        description: 'Completed watermaker membrane cleaning',
        userId: insertedUsers[1].id, // Engineer
        relatedEntityType: 'maintenance_task',
        relatedEntityId: insertedTasks[3].id, // Watermaker task
        timestamp: yesterday,
        metadata: JSON.stringify({
          task: 'Watermaker Membrane Cleaning',
          duration: 210
        })
      },
      {
        activityType: 'equipment_status_changed',
        description: 'Air conditioning system status changed to maintenance_required',
        userId: insertedUsers[1].id, // Engineer
        relatedEntityType: 'equipment',
        relatedEntityId: insertedEquipment[6].id, // AC System
        timestamp: threeDaysAgo,
        metadata: JSON.stringify({
          previous_status: 'operational',
          new_status: 'maintenance_required',
          reason: 'Reduced cooling efficiency in guest cabins'
        })
      },
      {
        activityType: 'inventory_restocked',
        description: 'Restocked Engine Oil - MTU Approved',
        userId: insertedUsers[2].id, // First Officer
        relatedEntityType: 'inventory',
        relatedEntityId: insertedInventory[0].id, // Engine Oil
        timestamp: oneWeekAgo,
        metadata: JSON.stringify({
          quantity_added: 80,
          new_total: 120,
          supplier: 'MTU Service Partner',
          invoice: 'INV-2022-11-15'
        })
      },
      {
        activityType: 'task_assigned',
        description: 'Assigned Main Engine Oil Change task to Chief Engineer',
        userId: insertedUsers[0].id, // Captain
        relatedEntityType: 'maintenance_task',
        relatedEntityId: insertedTasks[0].id, // Engine Oil Change task
        timestamp: twoWeeksFromNow,
        metadata: JSON.stringify({
          assigned_to: 'Maria Garcia',
          priority: 'high'
        })
      },
      {
        activityType: 'crew_document_expiring',
        description: 'Medical Certificate for Robert Chen expiring soon',
        userId: insertedUsers[0].id, // Captain
        relatedEntityType: 'crew_document',
        relatedEntityId: 3, // Assuming ID for Robert's medical certificate
        timestamp: oneMonthAgo,
        metadata: JSON.stringify({
          crew_member: 'Robert Chen',
          document_type: 'Medical Certificate',
          expiry_date: new Date(today.getTime() + (14 * 24 * 60 * 60 * 1000)).toISOString() // 14 days from now
        })
      }
    ];

    for (const log of activityLogsData) {
      const [insertedLog] = await db.insert(activityLogs).values(log).returning();
      console.log(`Added activity log: ${insertedLog.description}`);
    }

    // Add maintenance history
    console.log('Seeding maintenance history...');
    const maintenanceHistoryData = [
      {
        equipmentId: insertedEquipment[0].id, // Main Engine - Port
        maintenanceType: 'routine',
        serviceDate: new Date('2022-06-10'),
        runtime: 1000.5,
        description: 'Regular 1000-hour service',
        findings: 'All components in good condition',
        partsReplaced: JSON.stringify([
          { part: 'Oil Filter', quantity: 1 },
          { part: 'Fuel Filter', quantity: 2 }
        ]),
        technician: 'Maria Garcia',
        cost: 1250.00,
        isSuccessful: true,
        taskId: null,
        createdById: insertedUsers[1].id, // Engineer
        nextRecommendedDate: new Date('2023-06-10'),
        nextRecommendedRuntime: 2000,
        photos: JSON.stringify([]),
        documents: JSON.stringify([])
      },
      {
        equipmentId: insertedEquipment[1].id, // Main Engine - Starboard
        maintenanceType: 'routine',
        serviceDate: new Date('2022-06-10'),
        runtime: 980.2,
        description: 'Regular 1000-hour service',
        findings: 'Slight oil leak at rear seal - monitored but not replaced',
        partsReplaced: JSON.stringify([
          { part: 'Oil Filter', quantity: 1 },
          { part: 'Fuel Filter', quantity: 2 }
        ]),
        technician: 'Maria Garcia',
        cost: 1250.00,
        isSuccessful: true,
        taskId: null,
        createdById: insertedUsers[1].id, // Engineer
        nextRecommendedDate: new Date('2023-06-10'),
        nextRecommendedRuntime: 2000,
        photos: JSON.stringify([]),
        documents: JSON.stringify([])
      },
      {
        equipmentId: insertedEquipment[2].id, // Generator 1
        maintenanceType: 'repair',
        serviceDate: new Date('2022-08-15'),
        runtime: 3500.3,
        description: 'Replacement of faulty voltage regulator',
        findings: 'Voltage fluctuations caused by failing regulator',
        partsReplaced: JSON.stringify([
          { part: 'Voltage Regulator', quantity: 1 }
        ]),
        technician: 'External Technician - Kohler Certified',
        cost: 850.00,
        isSuccessful: true,
        taskId: null,
        createdById: insertedUsers[1].id, // Engineer
        nextRecommendedDate: new Date('2023-02-15'),
        nextRecommendedRuntime: 4000,
        photos: JSON.stringify([]),
        documents: JSON.stringify([])
      },
      {
        equipmentId: insertedEquipment[7].id, // Watermaker
        maintenanceType: 'routine',
        serviceDate: yesterday, // Yesterday (from variable defined earlier)
        runtime: 2800.6,
        description: 'Acid cleaning of membranes',
        findings: 'Membranes had scale buildup reducing efficiency',
        partsReplaced: JSON.stringify([]),
        technician: 'Maria Garcia',
        cost: 320.00,
        isSuccessful: true,
        taskId: insertedTasks[3].id, // Watermaker task
        createdById: insertedUsers[1].id, // Engineer
        nextRecommendedDate: new Date('2023-02-10'),
        nextRecommendedRuntime: 3000,
        photos: JSON.stringify([]),
        documents: JSON.stringify([])
      }
    ];

    for (const history of maintenanceHistoryData) {
      const [inserted] = await db.insert(maintenanceHistory).values(history).returning();
      console.log(`Added maintenance history: ${inserted.description} for equipment ID ${inserted.equipmentId}`);
    }

    // Add predictive maintenance data
    console.log('Seeding predictive maintenance...');
    const predictiveMaintenanceData = [
      {
        equipmentId: insertedEquipment[0].id, // Main Engine - Port
        maintenanceType: 'oil_change',
        predictedDate: new Date('2023-05-15'),
        predictedRuntime: 1800,
        confidence: 0.85,
        reasoningFactors: JSON.stringify({
          oil_analysis: 'Indicates increased metal particles',
          historical_interval: '980 hours average between changes',
          manufacturer_recommendation: '1000 hours or 12 months'
        }),
        recommendedAction: 'Schedule oil change before next long voyage',
        warningThreshold: 30, // 30 days before predicted date
        alertThreshold: 7, // 7 days before predicted date
        historyDataPoints: 5
      },
      {
        equipmentId: insertedEquipment[1].id, // Main Engine - Starboard
        maintenanceType: 'oil_change',
        predictedDate: new Date('2023-05-20'),
        predictedRuntime: 1780,
        confidence: 0.82,
        reasoningFactors: JSON.stringify({
          oil_analysis: 'Indicates normal wear',
          historical_interval: '950 hours average between changes',
          manufacturer_recommendation: '1000 hours or 12 months'
        }),
        recommendedAction: 'Schedule oil change before next long voyage',
        warningThreshold: 30, // 30 days before predicted date
        alertThreshold: 7, // 7 days before predicted date
        historyDataPoints: 5
      },
      {
        equipmentId: insertedEquipment[6].id, // Air Conditioning System
        maintenanceType: 'refrigerant_check',
        predictedDate: new Date('2023-01-15'), // Intentionally set to be due soon
        predictedRuntime: 4800,
        confidence: 0.75,
        reasoningFactors: JSON.stringify({
          performance_trend: 'Decreasing cooling efficiency',
          historical_pattern: 'Refrigerant top-up needed approximately every 6 months',
          seasonal_factors: 'Higher usage during summer months'
        }),
        recommendedAction: 'Check refrigerant levels and recharge if necessary',
        warningThreshold: 14, // 14 days before predicted date
        alertThreshold: 3, // 3 days before predicted date
        historyDataPoints: 3
      }
    ];

    for (const pm of predictiveMaintenanceData) {
      const [inserted] = await db.insert(predictiveMaintenance).values(pm).returning();
      console.log(`Added predictive maintenance for ${inserted.maintenanceType} on equipment ID ${inserted.equipmentId}`);
    }

    // Add ISM documents
    console.log('Seeding ISM documents...');
    const ismDocumentsData = [
      {
        title: 'Emergency Response Procedures',
        documentType: 'procedure',
        documentNumber: 'ISM-PROC-001',
        version: '2.1',
        status: 'approved',
        approvedBy: insertedUsers[0].id, // Captain
        approvalDate: oneMonthAgo,
        reviewDueDate: new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()),
        content: 'Detailed procedures for responding to various emergency situations including fire, flooding, man overboard, and medical emergencies.',
        attachmentPath: '/documents/ism/emergency_response_2.1.pdf',
        tags: JSON.stringify(['emergency', 'safety', 'procedures']),
        createdBy: insertedUsers[0].id, // Captain
      },
      {
        title: 'Environmental Protection Policy',
        documentType: 'policy',
        documentNumber: 'ISM-POL-002',
        version: '1.5',
        status: 'approved',
        approvedBy: insertedUsers[0].id, // Captain
        approvalDate: twoMonthsAgo,
        reviewDueDate: new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()),
        content: 'Outlines the yacht\'s commitment to protecting the marine environment, including waste management, emissions control, and spill prevention.',
        attachmentPath: '/documents/ism/env_protection_1.5.pdf',
        tags: JSON.stringify(['environment', 'policy', 'waste']),
        createdBy: insertedUsers[0].id, // Captain
      },
      {
        title: 'Daily Safety Checklist',
        documentType: 'checklist',
        documentNumber: 'ISM-CHK-003',
        version: '3.0',
        status: 'approved',
        approvedBy: insertedUsers[0].id, // Captain
        approvalDate: oneWeekAgo,
        reviewDueDate: new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()),
        content: 'Daily checklist for verifying critical safety equipment and systems are operational.',
        attachmentPath: '/documents/ism/daily_safety_checklist_3.0.pdf',
        tags: JSON.stringify(['safety', 'checklist', 'daily']),
        createdBy: insertedUsers[2].id, // First Officer
      },
      {
        title: 'Safety Management Manual',
        documentType: 'manual',
        documentNumber: 'ISM-MAN-004',
        version: '2.3',
        status: 'review',
        approvedBy: null,
        approvalDate: null,
        reviewDueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14), // Due in 14 days
        content: 'Comprehensive manual outlining the Safety Management System for the vessel in accordance with ISM Code requirements.',
        attachmentPath: '/documents/ism/safety_management_manual_draft_2.3.pdf',
        tags: JSON.stringify(['safety', 'management', 'manual']),
        createdBy: insertedUsers[0].id, // Captain
      }
    ];

    for (const doc of ismDocumentsData) {
      const [inserted] = await db.insert(ismDocuments).values(doc).returning();
      console.log(`Added ISM document: ${inserted.title}`);
    }

    // Add ISM audits
    console.log('Seeding ISM audits...');
    const ismAuditsData = [
      {
        title: 'Annual Internal ISM Audit',
        auditType: 'internal',
        status: 'completed',
        startDate: twoMonthsAgo,
        endDate: twoMonthsAgo, // Same day audit
        auditScope: 'Complete review of Safety Management System implementation',
        auditors: JSON.stringify(['John Smith', 'External ISM Consultant']),
        location: 'Onboard - At Berth',
        findings: JSON.stringify([
          {
            id: 1,
            description: 'Emergency drill records incomplete',
            severity: 'minor',
            corrective_action: 'Update drill log template and retrain crew',
            due_date: oneMonthAgo.toISOString(),
            status: 'closed'
          },
          {
            id: 2,
            description: 'Some crew unfamiliar with updated fire procedures',
            severity: 'major',
            corrective_action: 'Conduct additional fire training session',
            due_date: oneWeekAgo.toISOString(),
            status: 'closed'
          }
        ]),
        correctiveActions: JSON.stringify([
          {
            id: 1,
            finding_id: 1,
            description: 'Updated drill log templates created and distributed',
            responsible: 'Robert Chen',
            completed_date: oneMonthAgo.toISOString(),
            verified_by: 'John Smith'
          },
          {
            id: 2,
            finding_id: 2,
            description: 'Fire training conducted for all crew on January 15',
            responsible: 'Robert Chen',
            completed_date: oneWeekAgo.toISOString(),
            verified_by: 'John Smith'
          }
        ]),
        reportAttachment: '/documents/ism/annual_audit_report_2022.pdf',
        createdBy: insertedUsers[0].id, // Captain
      },
      {
        title: 'Flag State Inspection',
        auditType: 'flag-state',
        status: 'planned',
        startDate: monthFromNow, // One month from now
        endDate: new Date(monthFromNow.getTime() + (1 * 24 * 60 * 60 * 1000)), // Day after
        auditScope: 'Compliance with Flag State regulations and ISM Code',
        auditors: JSON.stringify(['Flag State Inspector (TBD)']),
        location: 'Onboard - TBD',
        findings: JSON.stringify([]),
        correctiveActions: JSON.stringify([]),
        reportAttachment: null,
        createdBy: insertedUsers[0].id, // Captain
      }
    ];

    for (const audit of ismAuditsData) {
      const [inserted] = await db.insert(ismAudits).values(audit).returning();
      console.log(`Added ISM audit: ${inserted.title}`);
    }

    // Add ISM training
    console.log('Seeding ISM training...');
    const ismTrainingData = [
      {
        title: 'Fire Fighting Refresher',
        trainingType: 'safety',
        description: 'Annual refresher training on firefighting equipment and procedures',
        requiredParticipants: JSON.stringify([1, 2, 3, 4]), // All crew
        actualParticipants: JSON.stringify([1, 2, 3, 4]), // All crew attended
        scheduledDate: oneWeekAgo,
        completionDate: oneWeekAgo,
        duration: 4, // 4 hours
        attachments: JSON.stringify(['/documents/training/fire_training_jan2023.pdf']),
        notes: 'Included practical exercises with fire extinguishers and fire hoses',
        status: 'completed',
        createdBy: insertedUsers[2].id, // First Officer
      },
      {
        title: 'Man Overboard Drill',
        trainingType: 'drill',
        description: 'Quarterly drill for man overboard emergency response',
        requiredParticipants: JSON.stringify([1, 2, 3]), // Captain, Engineer, First Officer
        actualParticipants: JSON.stringify([1, 2, 3]), // All required attended
        scheduledDate: threeDaysAgo,
        completionDate: threeDaysAgo,
        duration: 2, // 2 hours
        attachments: JSON.stringify(['/documents/training/mob_drill_feb2023.pdf']),
        notes: 'Used rescue dummy and achieved recovery in 3 minutes 45 seconds',
        status: 'completed',
        createdBy: insertedUsers[0].id, // Captain
      },
      {
        title: 'Environmental Regulations Update',
        trainingType: 'certification',
        description: 'Training on updated MARPOL regulations and compliance requirements',
        requiredParticipants: JSON.stringify([1, 2]), // Captain, Engineer
        actualParticipants: JSON.stringify([]),
        scheduledDate: twoWeeksFromNow, // Two weeks from now
        completionDate: null,
        duration: 3, // 3 hours
        attachments: JSON.stringify([]),
        notes: 'External trainer scheduled to conduct session',
        status: 'planned',
        createdBy: insertedUsers[0].id, // Captain
      }
    ];

    for (const training of ismTrainingData) {
      const [inserted] = await db.insert(ismTraining).values(training).returning();
      console.log(`Added ISM training: ${inserted.title}`);
    }

    // Add ISM incidents
    console.log('Seeding ISM incidents...');
    const ismIncidentsData = [
      {
        title: 'Minor Fuel Spill During Bunkering',
        incidentType: 'environmental',
        description: 'Approximately 2 liters of diesel spilled on deck during fuel transfer. Contained using spill kit and prevented from reaching water.',
        dateReported: oneMonthAgo,
        dateOccurred: oneMonthAgo,
        location: 'Main Deck - Port Side Bunkering Station',
        reportedBy: insertedUsers[1].id, // Engineer
        severity: 'minor',
        rootCause: 'Connection not properly secured before transfer started',
        immediateActions: 'Stopped transfer, contained spill with absorbent materials, cleaned affected area',
        correctiveActions: JSON.stringify([
          {
            description: 'Review bunkering procedures with all engineering team',
            assigned_to: 'Maria Garcia',
            due_date: oneWeekAgo.toISOString(),
            completed_date: oneWeekAgo.toISOString(),
            status: 'completed'
          },
          {
            description: 'Update bunkering checklist to include double-verification of connections',
            assigned_to: 'Maria Garcia',
            due_date: oneWeekAgo.toISOString(),
            completed_date: oneWeekAgo.toISOString(),
            status: 'completed'
          }
        ]),
        preventiveActions: JSON.stringify([
          {
            description: 'Install improved quick-disconnect fittings on bunkering lines',
            assigned_to: 'Maria Garcia',
            due_date: twoWeeksFromNow.toISOString(),
            completed_date: null,
            status: 'in-progress'
          }
        ]),
        status: 'closed',
        verifiedBy: insertedUsers[0].id, // Captain
        verificationDate: oneWeekAgo,
        attachments: JSON.stringify(['/documents/incidents/fuel_spill_jan2023.pdf']),
      },
      {
        title: 'Near Miss - Tender Operation',
        incidentType: 'near-miss',
        description: 'During tender launch, a crew member almost caught their hand between the tender and davit.',
        dateReported: threeDaysAgo,
        dateOccurred: threeDaysAgo,
        location: 'Boat Deck - Starboard Side',
        reportedBy: insertedUsers[2].id, // First Officer
        severity: 'major',
        rootCause: 'Procedure not followed - insufficient communication between crew members',
        immediateActions: 'Stopped operation, conducted safety briefing before resuming',
        correctiveActions: JSON.stringify([
          {
            description: 'Re-train all deck crew on tender launch procedures',
            assigned_to: 'Robert Chen',
            due_date: twoWeeksFromNow.toISOString(),
            completed_date: null,
            status: 'open'
          }
        ]),
        preventiveActions: JSON.stringify([
          {
            description: 'Implement formal communication protocol for all tender operations',
            assigned_to: 'Robert Chen',
            due_date: twoWeeksFromNow.toISOString(),
            completed_date: null,
            status: 'open'
          }
        ]),
        status: 'in-progress',
        verifiedBy: null,
        verificationDate: null,
        attachments: JSON.stringify([]),
      }
    ];

    for (const incident of ismIncidentsData) {
      const [inserted] = await db.insert(ismIncidents).values(incident).returning();
      console.log(`Added ISM incident: ${inserted.title}`);
    }

    // Add crew members
    console.log('Seeding crew members...');
    
    const crewMembersData = [
      {
        userId: insertedUsers[0].id,
        fullName: 'John Smith',
        position: 'Captain',
        nationality: 'United States',
        dateOfBirth: new Date('1975-06-15'),
        emergencyContact: '+1 (555) 123-4567',
        phoneNumber: '+1 (555) 987-6543',
        email: 'john.smith@example.com',
        joinDate: new Date('2020-03-01'),
        contractExpiryDate: new Date('2023-12-31'),
        status: 'active',
        notes: 'Experienced captain with 20+ years of maritime experience',
        medicalInformation: JSON.stringify({ allergies: ['Penicillin'], bloodType: 'A+' })
      },
      {
        userId: insertedUsers[1].id,
        fullName: 'Maria Garcia',
        position: 'Chief Engineer',
        nationality: 'Spain',
        dateOfBirth: new Date('1982-09-23'),
        emergencyContact: '+34 612 345 678',
        phoneNumber: '+34 698 765 432',
        email: 'maria.garcia@example.com',
        joinDate: new Date('2021-05-15'),
        contractExpiryDate: new Date('2023-11-15'),
        status: 'active',
        notes: 'Specialized in hybrid propulsion systems',
        medicalInformation: JSON.stringify({ conditions: ['None'] })
      },
      {
        userId: insertedUsers[2].id,
        fullName: 'Robert Chen',
        position: 'First Officer',
        nationality: 'Singapore',
        dateOfBirth: new Date('1990-02-10'),
        emergencyContact: '+65 9123 4567',
        phoneNumber: '+65 8765 4321',
        email: 'robert.chen@example.com',
        joinDate: new Date('2022-01-10'),
        contractExpiryDate: new Date('2023-07-10'),
        status: 'active',
        notes: 'First yacht position after merchant shipping experience',
        medicalInformation: JSON.stringify({ vaccinations: ['COVID-19', 'Yellow Fever'] })
      },
      {
        userId: insertedUsers[3].id,
        fullName: 'Sophia Williams',
        position: 'Chief Stewardess',
        nationality: 'Australia',
        dateOfBirth: new Date('1988-11-05'),
        emergencyContact: '+61 4 1234 5678',
        phoneNumber: '+61 4 8765 4321',
        email: 'sophia.williams@example.com',
        joinDate: new Date('2021-08-20'),
        contractExpiryDate: new Date('2023-08-20'),
        status: 'active',
        notes: 'Silver service trained with 10+ years experience',
        medicalInformation: JSON.stringify({ allergies: ['Shellfish'] })
      }
    ];
    
    const insertedCrewMembers = [];
    for (const crewMember of crewMembersData) {
      const [inserted] = await db.insert(crewMembers).values(crewMember).returning();
      insertedCrewMembers.push(inserted);
      console.log(`Added crew member: ${inserted.fullName}`);
    }
    
    // Add crew documents for each crew member
    console.log('Seeding crew documents...');
    const documentTypes = [
      { type: 'passport', title: 'Passport', expiryMonths: 60 },
      { type: 'visa', title: 'Seaman Visa', expiryMonths: 24 },
      { type: 'certificate', title: 'STCW Certificate', expiryMonths: 36 },
      { type: 'license', title: 'Maritime License', expiryMonths: 24 },
      { type: 'medical', title: 'Medical Certificate', expiryMonths: 12 }
    ];
    
    // Countries and their authorities for documents
    const countries = {
      'United States': {
        passport: 'U.S. Department of State',
        visa: 'U.S. Department of State',
        certificate: 'U.S. Coast Guard',
        license: 'U.S. Coast Guard',
        medical: 'Maritime Medical Center'
      },
      'Spain': {
        passport: 'Spanish Ministry of Foreign Affairs',
        visa: 'Spanish Ministry of Foreign Affairs',
        certificate: 'Spanish Maritime Authority',
        license: 'Spanish Maritime Authority',
        medical: 'Spanish Maritime Health Center'
      },
      'Singapore': {
        passport: 'Immigration & Checkpoints Authority',
        visa: 'Immigration & Checkpoints Authority',
        certificate: 'Maritime and Port Authority',
        license: 'Maritime and Port Authority',
        medical: 'Singapore Maritime Medical Center'
      },
      'Australia': {
        passport: 'Australian Passport Office',
        visa: 'Department of Home Affairs',
        certificate: 'Australian Maritime Safety Authority',
        license: 'Australian Maritime Safety Authority',
        medical: 'Australian Maritime Medical Center'
      }
    };
    
    for (const crewMember of insertedCrewMembers) {
      const country = crewMember.nationality;
      const authorities = countries[country] || countries['United States']; // Default to US if country not found
      
      // Create documents for this crew member
      for (const docType of documentTypes) {
        const issueDate = new Date(crewMember.joinDate);
        const expiryDate = new Date(issueDate);
        expiryDate.setMonth(expiryDate.getMonth() + docType.expiryMonths);
        
        // For testing expiring documents, make some documents expire soon
        if (docType.type === 'medical' && crewMember.id % 2 === 0) {
          expiryDate.setDate(expiryDate.getDate() + 14); // Expires in 14 days
        }
        
        const documentNumber = `${docType.type.toUpperCase()}-${crewMember.id}-${Math.floor(100000 + Math.random() * 900000)}`;
        
        const document = {
          crewMemberId: crewMember.id,
          documentType: docType.type,
          title: `${country} ${docType.title}`,
          documentNumber: documentNumber,
          issuingAuthority: authorities[docType.type],
          issueDate: issueDate,
          expiryDate: expiryDate,
          verificationStatus: 'verified',
          notes: `Standard ${docType.title} document`,
          reminderDays: 30
        };
        
        const [inserted] = await db.insert(crewDocuments).values(document).returning();
        console.log(`Added ${docType.title} for ${crewMember.fullName}`);
      }
    }
    
    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await pool.end();
  }
}

seed();