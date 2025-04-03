import { db } from './db';
import { crewMembers, crewDocuments } from '@shared/schema';
import { pool } from './db';

async function seed() {
  try {
    console.log('Seeding crew members...');
    
    // Add crew members
    const crewMembersData = [
      {
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
        fullName: 'Robert Chen',
        position: 'Deckhand',
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
    
    // Insert crew members and get their IDs
    const insertedCrewMembers = [];
    for (const crewMember of crewMembersData) {
      const [inserted] = await db.insert(crewMembers).values(crewMember).returning();
      insertedCrewMembers.push(inserted);
      console.log(`Added crew member: ${inserted.fullName}`);
    }
    
    // Add crew documents for each crew member
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