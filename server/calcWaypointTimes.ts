import { db } from './db';
import { waypoints } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { storage } from './storage';

/**
 * Calculate arrival and departure times for all waypoints in a voyage
 * based on the engine RPM settings and planned speeds
 */
export async function calculateWaypointTimes(voyageId: number): Promise<void> {
  try {
    console.log(`Calculating waypoint times for voyage ID: ${voyageId}`);
    
    // Get the voyage details
    const voyage = await storage.getVoyage(voyageId);
    if (!voyage) {
      throw new Error(`Voyage with ID ${voyageId} not found`);
    }
    
    // Get all waypoints for the voyage, sorted by order
    const allWaypoints = await storage.getWaypointsByVoyage(voyageId);
    if (allWaypoints.length === 0) {
      console.log(`No waypoints found for voyage ID: ${voyageId}`);
      return;
    }
    
    // Sort waypoints by order
    const sortedWaypoints = [...allWaypoints].sort((a, b) => a.orderIndex - b.orderIndex);
    
    // Get vessel speed data and fuel consumption data
    const speedData = await storage.getSpeedData(voyage.vesselId);
    const fuelData = await storage.getFuelConsumptionData(voyage.vesselId);
    
    // Start from the voyage start date
    let currentDateTime = voyage.startDate ? new Date(voyage.startDate) : new Date();
    
    // For each waypoint, calculate arrival and departure times
    for (let i = 0; i < sortedWaypoints.length; i++) {
      const waypoint = sortedWaypoints[i];
      
      // For the first waypoint, set it as the departure point
      if (i === 0) {
        // Update the first waypoint with departure time (no arrival time)
        await db.update(waypoints)
          .set({
            estimatedDeparture: currentDateTime.toISOString(),
            estimatedArrival: null
          })
          .where(eq(waypoints.id, waypoint.id));
          
        console.log(`Updated first waypoint (ID: ${waypoint.id}) departure time: ${currentDateTime.toISOString()}`);
        continue;
      }
      
      // Calculate the duration to reach this waypoint from the previous one
      const distance = parseFloat(waypoint.distance || '0');
      
      // Find the speed based on the engine RPM
      const engineRpm = waypoint.engineRpm || 0;
      let speed = 0;
      
      if (engineRpm > 0) {
        // Find the closest RPM in the speed data
        const closestSpeedData = speedData.length > 0 
          ? speedData.sort((a, b) => 
              Math.abs(a.engineRpm - engineRpm) - Math.abs(b.engineRpm - engineRpm)
            )[0] 
          : null;
        
        if (closestSpeedData) {
          speed = parseFloat(closestSpeedData.speed || '0');
        }
      } else if (waypoint.plannedSpeed) {
        // If RPM not provided but planned speed is
        speed = parseFloat(waypoint.plannedSpeed);
      }
      
      // Default to a reasonable speed if we couldn't calculate it
      if (speed <= 0) {
        speed = 10; // Default to 10 knots if no speed data available
        console.log(`No speed data available for waypoint ${waypoint.id}, using default speed: ${speed} knots`);
      }
      
      // Calculate duration in hours (distance / speed)
      const durationHours = distance / speed;
      const durationMs = durationHours * 60 * 60 * 1000;
      
      // Calculate arrival time by adding duration to the previous departure time
      const arrivalTime = new Date(currentDateTime.getTime() + durationMs);
      
      // For intermediate waypoints, add a 30-minute stop (arbitrary)
      // For the final waypoint, don't set a departure time
      let departureTime = null;
      if (i < sortedWaypoints.length - 1) {
        departureTime = new Date(arrivalTime.getTime() + 30 * 60 * 1000); // Add 30 minutes
        currentDateTime = departureTime; // Update for next iteration
      } else {
        // This is the final waypoint - no departure needed
        currentDateTime = arrivalTime;
      }
      
      // Update the waypoint with calculated times
      await db.update(waypoints)
        .set({
          estimatedArrival: arrivalTime.toISOString(),
          estimatedDeparture: departureTime ? departureTime.toISOString() : null
        })
        .where(eq(waypoints.id, waypoint.id));
      
      console.log(`Updated waypoint (ID: ${waypoint.id}) arrival: ${arrivalTime.toISOString()}, departure: ${departureTime?.toISOString() || 'N/A'}`);
    }
    
    console.log(`Successfully calculated and updated all waypoint times for voyage ID: ${voyageId}`);
  } catch (error) {
    console.error('Error calculating waypoint times:', error);
    throw error;
  }
}