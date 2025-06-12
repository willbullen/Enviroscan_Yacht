import { Router } from "express";
import { z } from "zod";
import { db, executeWithRetry } from "../db";
import { 
  users,
  vessels,
  buildProjects, 
  buildProjectTeam,
  buildDrawings,
  buildDrawingRevisions,
  buildDrawingComments,
  buildIssues,
  buildIssuePhotos,
  buildIssueComments,
  buildDocuments,
  buildDocumentVersions,
  build3DModels,
  buildMilestones,
  buildActivityLogs,
  insertBuildProjectSchema,
  insertBuildProjectTeamSchema,
  insertBuildDrawingSchema,
  insertBuildDrawingRevisionSchema,
  insertBuildDrawingCommentSchema,
  insertBuildIssueSchema,
  insertBuildIssuePhotoSchema,
  insertBuildIssueCommentSchema,
  insertBuildDocumentSchema,
  insertBuildDocumentVersionSchema,
  insertBuild3DModelSchema,
  insertBuildMilestoneSchema,
  insertBuildActivityLogSchema,
} from "@shared/schema";
import { eq, desc, and, or, like, sql, isNull, asc } from "drizzle-orm";

const router = Router();

// Utility function to log activity
const logActivity = async (
  projectId: number,
  activityType: string,
  entityType: string,
  entityId: number,
  description: string,
  userId: number,
  oldValues?: any,
  newValues?: any,
  req?: any
) => {
  try {
    await db.insert(buildActivityLogs).values({
      projectId,
      activityType,
      entityType,
      entityId,
      description,
      userId,
      oldValues,
      newValues,
      ipAddress: req?.ip,
      userAgent: req?.get('User-Agent'),
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

// Generate unique issue number
const generateIssueNumber = async (projectId: number): Promise<string> => {
  const count = await db.select({ count: sql<number>`count(*)` })
    .from(buildIssues)
    .where(eq(buildIssues.projectId, projectId));
  
  const issueCount = count[0]?.count || 0;
  return `ISSUE-${projectId.toString().padStart(3, '0')}-${(issueCount + 1).toString().padStart(4, '0')}`;
};

// ==================== BUILD PROJECTS ====================

// Get all projects for a vessel
router.get("/projects/vessel/:vesselId", async (req, res) => {
  try {
    const vesselId = parseInt(req.params.vesselId);
    
    const projects = await executeWithRetry(() =>
      db.query.buildProjects.findMany({
        where: eq(buildProjects.vesselId, vesselId),
        with: {
          projectManager: {
            columns: { id: true, fullName: true, username: true }
          },
          createdBy: {
            columns: { id: true, fullName: true, username: true }
          },
          team: {
            with: {
              user: {
                columns: { id: true, fullName: true, username: true }
              }
            }
          }
        },
        orderBy: [desc(buildProjects.createdAt)]
      })
    );

    res.json(projects);
  } catch (error) {
    console.error("Error fetching build projects:", error);
    res.status(500).json({ error: "Failed to fetch build projects" });
  }
});

// Get project by ID with full details
router.get("/projects/:id", async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    const project = await executeWithRetry(() =>
      db.query.buildProjects.findFirst({
        where: eq(buildProjects.id, projectId),
        with: {
          vessel: true,
          projectManager: {
            columns: { id: true, fullName: true, username: true, avatarUrl: true }
          },
          createdBy: {
            columns: { id: true, fullName: true, username: true }
          },
          team: {
            with: {
              user: {
                columns: { id: true, fullName: true, username: true, avatarUrl: true }
              },
              assignedBy: {
                columns: { id: true, fullName: true, username: true }
              }
            }
          },
          drawings: {
            where: eq(buildDrawings.isCurrentRevision, true),
            with: {
              createdBy: {
                columns: { id: true, fullName: true, username: true }
              }
            },
            orderBy: [desc(buildDrawings.createdAt)]
          },
          issues: {
            with: {
              assignedTo: {
                columns: { id: true, fullName: true, username: true }
              },
              reportedBy: {
                columns: { id: true, fullName: true, username: true }
              }
            },
            orderBy: [desc(buildIssues.createdAt)]
          },
          documents: {
            where: eq(buildDocuments.status, 'active'),
            with: {
              uploadedBy: {
                columns: { id: true, fullName: true, username: true }
              }
            },
            orderBy: [desc(buildDocuments.uploadedAt)]
          },
          models3D: {
            where: eq(build3DModels.isActive, true),
            with: {
              uploadedBy: {
                columns: { id: true, fullName: true, username: true }
              }
            },
            orderBy: [desc(build3DModels.createdAt)]
          },
          milestones: {
            with: {
              completedBy: {
                columns: { id: true, fullName: true, username: true }
              },
              createdBy: {
                columns: { id: true, fullName: true, username: true }
              }
            },
            orderBy: [asc(buildMilestones.plannedDate)]
          }
        }
      })
    );
    
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

// Create new project
router.post("/projects", async (req, res) => {
  try {
    const projectData = insertBuildProjectSchema.parse(req.body);
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const [newProject] = await executeWithRetry(() =>
      db.insert(buildProjects).values({
        ...projectData,
        createdById: userId
      }).returning()
    );

    // Log activity
    await logActivity(
      newProject.id,
      'project_created',
      'project', 
      newProject.id,
      `Project "${newProject.name}" created`,
      userId,
      undefined,
      newProject,
      req
    );

    res.status(201).json(newProject);
  } catch (error) {
    console.error("Error creating project:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid project data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create project" });
  }
});

// Update project
router.put("/projects/:id", async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const projectData = insertBuildProjectSchema.partial().parse(req.body);
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Get old values for activity log
    const oldProject = await db.query.buildProjects.findFirst({
      where: eq(buildProjects.id, projectId)
    });

    const [updatedProject] = await executeWithRetry(() =>
      db.update(buildProjects)
        .set({ ...projectData, updatedAt: new Date() })
        .where(eq(buildProjects.id, projectId))
        .returning()
    );

    if (!updatedProject) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Log activity
    await logActivity(
      projectId,
      'project_updated',
      'project',
      projectId,
      `Project "${updatedProject.name}" updated`,
      userId,
      oldProject,
      updatedProject,
      req
    );

    res.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid project data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update project" });
  }
});

// Delete project
router.delete("/projects/:id", async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const project = await db.query.buildProjects.findFirst({
      where: eq(buildProjects.id, projectId)
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    await executeWithRetry(() =>
      db.delete(buildProjects).where(eq(buildProjects.id, projectId))
    );

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// ==================== TEAM MANAGEMENT ====================

// Add team member to project
router.post("/projects/:id/team", async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const teamData = insertBuildProjectTeamSchema.parse({
      ...req.body,
      projectId,
      assignedById: req.user?.id
    });
    
    const [newTeamMember] = await executeWithRetry(() =>
      db.insert(buildProjectTeam).values(teamData).returning()
    );

    // Get full team member details
    const teamMember = await db.query.buildProjectTeam.findFirst({
      where: eq(buildProjectTeam.id, newTeamMember.id),
      with: {
        user: {
          columns: { id: true, fullName: true, username: true, avatarUrl: true }
        },
        assignedBy: {
          columns: { id: true, fullName: true, username: true }
        }
      }
    });

    // Log activity
    await logActivity(
      projectId,
      'team_member_added',
      'team',
      newTeamMember.id,
      `Team member ${teamMember?.user.fullName} added as ${teamData.role}`,
      req.user?.id || 0,
      undefined,
      teamMember,
      req
    );

    res.status(201).json(teamMember);
  } catch (error) {
    console.error("Error adding team member:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid team data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to add team member" });
  }
});

// Remove team member from project
router.delete("/projects/:id/team/:memberId", async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const memberId = parseInt(req.params.memberId);
    
    const teamMember = await db.query.buildProjectTeam.findFirst({
      where: and(
        eq(buildProjectTeam.id, memberId),
        eq(buildProjectTeam.projectId, projectId)
      ),
      with: {
        user: {
          columns: { id: true, fullName: true, username: true }
        }
      }
    });

    if (!teamMember) {
      return res.status(404).json({ error: "Team member not found" });
    }

    await executeWithRetry(() =>
      db.delete(buildProjectTeam).where(eq(buildProjectTeam.id, memberId))
    );

    // Log activity
    await logActivity(
      projectId,
      'team_member_removed',
      'team',
      memberId,
      `Team member ${teamMember.user.fullName} removed from project`,
      req.user?.id || 0,
      teamMember,
      undefined,
      req
    );

    res.json({ message: "Team member removed successfully" });
  } catch (error) {
    console.error("Error removing team member:", error);
    res.status(500).json({ error: "Failed to remove team member" });
  }
});

// ==================== DRAWINGS ====================

// Get drawings for a project
router.get("/projects/:id/drawings", async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { buildGroup, status, search } = req.query;
    
    let whereConditions = [eq(buildDrawings.projectId, projectId)];
    
    if (buildGroup && buildGroup !== 'all') {
      whereConditions.push(eq(buildDrawings.buildGroup, buildGroup as string));
    }
    
    if (status && status !== 'all') {
      whereConditions.push(eq(buildDrawings.status, status as string));
    }

    if (search) {
      const searchCondition = or(
        like(buildDrawings.title, `%${search}%`),
        like(buildDrawings.drawingNumber, `%${search}%`),
        like(buildDrawings.description, `%${search}%`)
      );
      if (searchCondition) {
        whereConditions.push(searchCondition);
      }
    }

    const drawings = await executeWithRetry(() =>
      db.query.buildDrawings.findMany({
        where: and(...whereConditions),
        with: {
          createdBy: {
            columns: { id: true, fullName: true, username: true }
          },
          approvedBy: {
            columns: { id: true, fullName: true, username: true }
          },
          comments: {
            where: eq(buildDrawingComments.status, 'open'),
            with: {
              createdBy: {
                columns: { id: true, fullName: true, username: true }
              }
            }
          }
        },
        orderBy: [desc(buildDrawings.createdAt)]
      })
    );

    res.json(drawings);
  } catch (error) {
    console.error("Error fetching drawings:", error);
    res.status(500).json({ error: "Failed to fetch drawings" });
  }
});

// Upload new drawing
router.post("/projects/:id/drawings", async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const drawingData = insertBuildDrawingSchema.parse({
      ...req.body,
      projectId,
      createdById: req.user?.id
    });
    
    const [newDrawing] = await executeWithRetry(() =>
      db.insert(buildDrawings).values(drawingData).returning()
    );

    // Log activity
    await logActivity(
      projectId,
      'drawing_uploaded',
      'drawing',
      newDrawing.id,
      `Drawing "${newDrawing.drawingNumber} - ${newDrawing.title}" uploaded`,
      req.user?.id || 0,
      undefined,
      newDrawing,
      req
    );

    res.status(201).json(newDrawing);
  } catch (error) {
    console.error("Error uploading drawing:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid drawing data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to upload drawing" });
  }
});

// Approve drawing
router.post("/drawings/:id/approve", async (req, res) => {
  try {
    const drawingId = parseInt(req.params.id);
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const [updatedDrawing] = await executeWithRetry(() =>
      db.update(buildDrawings)
        .set({ 
          status: 'approved',
          approvedById: userId,
          approvedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(buildDrawings.id, drawingId))
        .returning()
    );

    if (!updatedDrawing) {
      return res.status(404).json({ error: "Drawing not found" });
    }

    // Log activity
    await logActivity(
      updatedDrawing.projectId,
      'drawing_approved',
      'drawing',
      drawingId,
      `Drawing "${updatedDrawing.drawingNumber}" approved`,
      userId,
      undefined,
      updatedDrawing,
      req
    );

    res.json(updatedDrawing);
  } catch (error) {
    console.error("Error approving drawing:", error);
    res.status(500).json({ error: "Failed to approve drawing" });
  }
});

// Add comment to drawing
router.post("/drawings/:id/comments", async (req, res) => {
  try {
    const drawingId = parseInt(req.params.id);
    const commentData = insertBuildDrawingCommentSchema.parse({
      ...req.body,
      drawingId,
      createdById: req.user?.id
    });
    
    const [newComment] = await executeWithRetry(() =>
      db.insert(buildDrawingComments).values(commentData).returning()
    );

    // Get full comment details
    const comment = await db.query.buildDrawingComments.findFirst({
      where: eq(buildDrawingComments.id, newComment.id),
      with: {
        createdBy: {
          columns: { id: true, fullName: true, username: true, avatarUrl: true }
        },
        assignedTo: {
          columns: { id: true, fullName: true, username: true }
        }
      }
    });

    // Get drawing details for activity log
    const drawing = await db.query.buildDrawings.findFirst({
      where: eq(buildDrawings.id, drawingId)
    });

    if (drawing) {
      // Log activity
      await logActivity(
        drawing.projectId,
        'drawing_comment_added',
        'drawing_comment',
        newComment.id,
        `Comment added to drawing "${drawing.drawingNumber}"`,
        req.user?.id || 0,
        undefined,
        comment,
        req
      );
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error("Error adding drawing comment:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid comment data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// ==================== ISSUES ====================

// Get issues for a project
router.get("/projects/:id/issues", async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { status, priority, category, assignedTo, search } = req.query;
    
    let whereConditions = [eq(buildIssues.projectId, projectId)];
    
    if (status && status !== 'all') {
      whereConditions.push(eq(buildIssues.status, status as string));
    }
    
    if (priority && priority !== 'all') {
      whereConditions.push(eq(buildIssues.priority, priority as string));
    }
    
    if (category && category !== 'all') {
      whereConditions.push(eq(buildIssues.category, category as string));
    }
    
    if (assignedTo && assignedTo !== 'all') {
      if (assignedTo === 'unassigned') {
        whereConditions.push(isNull(buildIssues.assignedToId));
      } else {
        whereConditions.push(eq(buildIssues.assignedToId, parseInt(assignedTo as string)));
      }
    }

    if (search) {
      const searchCondition = or(
        like(buildIssues.title, `%${search}%`),
        like(buildIssues.description, `%${search}%`),
        like(buildIssues.issueNumber, `%${search}%`)
      );
      if (searchCondition) {
        whereConditions.push(searchCondition);
      }
    }

    const issues = await executeWithRetry(() =>
      db.query.buildIssues.findMany({
        where: and(...whereConditions),
        with: {
          assignedTo: {
            columns: { id: true, fullName: true, username: true, avatarUrl: true }
          },
          reportedBy: {
            columns: { id: true, fullName: true, username: true, avatarUrl: true }
          },
          resolvedBy: {
            columns: { id: true, fullName: true, username: true }
          },
          relatedDrawing: {
            columns: { id: true, drawingNumber: true, title: true }
          },
          photos: {
            with: {
              uploadedBy: {
                columns: { id: true, fullName: true, username: true }
              }
            },
            orderBy: [desc(buildIssuePhotos.uploadedAt)]
          },
          comments: {
            with: {
              createdBy: {
                columns: { id: true, fullName: true, username: true, avatarUrl: true }
              }
            },
            orderBy: [desc(buildIssueComments.createdAt)]
          }
        },
        orderBy: [desc(buildIssues.createdAt)]
      })
    );

    res.json(issues);
  } catch (error) {
    console.error("Error fetching issues:", error);
    res.status(500).json({ error: "Failed to fetch issues" });
  }
});

// Create new issue
router.post("/projects/:id/issues", async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Generate unique issue number
    const issueNumber = await generateIssueNumber(projectId);
    
    const issueData = insertBuildIssueSchema.parse({
      ...req.body,
      projectId,
      issueNumber,
      reportedById: userId
    });
    
    const [newIssue] = await executeWithRetry(() =>
      db.insert(buildIssues).values(issueData).returning()
    );

    // Get full issue details
    const issue = await db.query.buildIssues.findFirst({
      where: eq(buildIssues.id, newIssue.id),
      with: {
        assignedTo: {
          columns: { id: true, fullName: true, username: true, avatarUrl: true }
        },
        reportedBy: {
          columns: { id: true, fullName: true, username: true, avatarUrl: true }
        },
        relatedDrawing: {
          columns: { id: true, drawingNumber: true, title: true }
        }
      }
    });

    // Log activity
    await logActivity(
      projectId,
      'issue_created',
      'issue',
      newIssue.id,
      `Issue "${issueNumber}" created: ${newIssue.title}`,
      userId,
      undefined,
      issue,
      req
    );

    res.status(201).json(issue);
  } catch (error) {
    console.error("Error creating issue:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid issue data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create issue" });
  }
});

// Update issue
router.put("/issues/:id", async (req, res) => {
  try {
    const issueId = parseInt(req.params.id);
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Get old values for activity log
    const oldIssue = await db.query.buildIssues.findFirst({
      where: eq(buildIssues.id, issueId)
    });

    if (!oldIssue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    const issueData = insertBuildIssueSchema.partial().parse(req.body);
    
    const [updatedIssue] = await executeWithRetry(() =>
      db.update(buildIssues)
        .set({ ...issueData, updatedAt: new Date() })
        .where(eq(buildIssues.id, issueId))
        .returning()
    );

    // Log activity
    await logActivity(
      oldIssue.projectId,
      'issue_updated',
      'issue',
      issueId,
      `Issue "${oldIssue.issueNumber}" updated`,
      userId,
      oldIssue,
      updatedIssue,
      req
    );

    res.json(updatedIssue);
  } catch (error) {
    console.error("Error updating issue:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid issue data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update issue" });
  }
});

// Add photo to issue
router.post("/issues/:id/photos", async (req, res) => {
  try {
    const issueId = parseInt(req.params.id);
    const photoData = insertBuildIssuePhotoSchema.parse({
      ...req.body,
      issueId,
      uploadedById: req.user?.id
    });
    
    const [newPhoto] = await executeWithRetry(() =>
      db.insert(buildIssuePhotos).values(photoData).returning()
    );

    // Get issue details for activity log
    const issue = await db.query.buildIssues.findFirst({
      where: eq(buildIssues.id, issueId)
    });

    if (issue) {
      // Log activity
      await logActivity(
        issue.projectId,
        'issue_photo_added',
        'issue_photo',
        newPhoto.id,
        `Photo added to issue "${issue.issueNumber}"`,
        req.user?.id || 0,
        undefined,
        newPhoto,
        req
      );
    }

    res.status(201).json(newPhoto);
  } catch (error) {
    console.error("Error adding issue photo:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid photo data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to add photo" });
  }
});

// Add comment to issue
router.post("/issues/:id/comments", async (req, res) => {
  try {
    const issueId = parseInt(req.params.id);
    const commentData = insertBuildIssueCommentSchema.parse({
      ...req.body,
      issueId,
      createdById: req.user?.id
    });
    
    const [newComment] = await executeWithRetry(() =>
      db.insert(buildIssueComments).values(commentData).returning()
    );

    // Get full comment details
    const comment = await db.query.buildIssueComments.findFirst({
      where: eq(buildIssueComments.id, newComment.id),
      with: {
        createdBy: {
          columns: { id: true, fullName: true, username: true, avatarUrl: true }
        }
      }
    });

    // Get issue details for activity log
    const issue = await db.query.buildIssues.findFirst({
      where: eq(buildIssues.id, issueId)
    });

    if (issue) {
      // Log activity
      await logActivity(
        issue.projectId,
        'issue_comment_added',
        'issue_comment',
        newComment.id,
        `Comment added to issue "${issue.issueNumber}"`,
        req.user?.id || 0,
        undefined,
        comment,
        req
      );
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error("Error adding issue comment:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid comment data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// ==================== DOCUMENTS ====================

// Get documents for a project
router.get("/projects/:id/documents", async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { documentType, category, status, search } = req.query;
    
    let whereConditions = [
      eq(buildDocuments.projectId, projectId),
      eq(buildDocuments.status, 'active')
    ];
    
    if (documentType && documentType !== 'all') {
      whereConditions.push(eq(buildDocuments.documentType, documentType as string));
    }
    
    if (category && category !== 'all') {
      whereConditions.push(eq(buildDocuments.category, category as string));
    }

    if (search) {
      const searchCondition = or(
        like(buildDocuments.title, `%${search}%`),
        like(buildDocuments.description, `%${search}%`),
        like(buildDocuments.documentNumber, `%${search}%`)
      );
      if (searchCondition) {
        whereConditions.push(searchCondition);
      }
    }

    const documents = await executeWithRetry(() =>
      db.query.buildDocuments.findMany({
        where: and(...whereConditions),
        with: {
          uploadedBy: {
            columns: { id: true, fullName: true, username: true, avatarUrl: true }
          },
          reviewedBy: {
            columns: { id: true, fullName: true, username: true }
          }
        },
        orderBy: [desc(buildDocuments.uploadedAt)]
      })
    );

    res.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

// Upload new document
router.post("/projects/:id/documents", async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const documentData = insertBuildDocumentSchema.parse({
      ...req.body,
      projectId,
      uploadedById: req.user?.id
    });
    
    const [newDocument] = await executeWithRetry(() =>
      db.insert(buildDocuments).values(documentData).returning()
    );

    // Log activity
    await logActivity(
      projectId,
      'document_uploaded',
      'document',
      newDocument.id,
      `Document "${newDocument.title}" uploaded`,
      req.user?.id || 0,
      undefined,
      newDocument,
      req
    );

    res.status(201).json(newDocument);
  } catch (error) {
    console.error("Error uploading document:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid document data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to upload document" });
  }
});

// ==================== 3D MODELS ====================

// Get 3D models for a project
router.get("/projects/:id/models", async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    const models = await executeWithRetry(() =>
      db.query.build3DModels.findMany({
        where: and(
          eq(build3DModels.projectId, projectId),
          eq(build3DModels.isActive, true)
        ),
        with: {
          uploadedBy: {
            columns: { id: true, fullName: true, username: true, avatarUrl: true }
          }
        },
        orderBy: [desc(build3DModels.createdAt)]
      })
    );

    res.json(models);
  } catch (error) {
    console.error("Error fetching 3D models:", error);
    res.status(500).json({ error: "Failed to fetch 3D models" });
  }
});

// Add 3D model
router.post("/projects/:id/models", async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const modelData = insertBuild3DModelSchema.parse({
      ...req.body,
      projectId,
      uploadedById: req.user?.id
    });
    
    const [newModel] = await executeWithRetry(() =>
      db.insert(build3DModels).values(modelData).returning()
    );

    // Log activity
    await logActivity(
      projectId,
      '3d_model_added',
      '3d_model',
      newModel.id,
      `3D model "${newModel.modelName}" added`,
      req.user?.id || 0,
      undefined,
      newModel,
      req
    );

    res.status(201).json(newModel);
  } catch (error) {
    console.error("Error adding 3D model:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid 3D model data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to add 3D model" });
  }
});

// ==================== MILESTONES ====================

// Get milestones for a project
router.get("/projects/:id/milestones", async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    const milestones = await executeWithRetry(() =>
      db.query.buildMilestones.findMany({
        where: eq(buildMilestones.projectId, projectId),
        with: {
          completedBy: {
            columns: { id: true, fullName: true, username: true }
          },
          createdBy: {
            columns: { id: true, fullName: true, username: true }
          }
        },
        orderBy: [asc(buildMilestones.plannedDate)]
      })
    );

    res.json(milestones);
  } catch (error) {
    console.error("Error fetching milestones:", error);
    res.status(500).json({ error: "Failed to fetch milestones" });
  }
});

// Create milestone
router.post("/projects/:id/milestones", async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const milestoneData = insertBuildMilestoneSchema.parse({
      ...req.body,
      projectId,
      createdById: req.user?.id
    });
    
    const [newMilestone] = await executeWithRetry(() =>
      db.insert(buildMilestones).values(milestoneData).returning()
    );

    // Log activity
    await logActivity(
      projectId,
      'milestone_created',
      'milestone',
      newMilestone.id,
      `Milestone "${newMilestone.name}" created`,
      req.user?.id || 0,
      undefined,
      newMilestone,
      req
    );

    res.status(201).json(newMilestone);
  } catch (error) {
    console.error("Error creating milestone:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid milestone data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create milestone" });
  }
});

// ==================== ACTIVITY LOGS ====================

// Get activity logs for a project
router.get("/projects/:id/activity", async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const activities = await executeWithRetry(() =>
      db.query.buildActivityLogs.findMany({
        where: eq(buildActivityLogs.projectId, projectId),
        with: {
          user: {
            columns: { id: true, fullName: true, username: true, avatarUrl: true }
          }
        },
        orderBy: [desc(buildActivityLogs.timestamp)],
        limit,
        offset
      })
    );

    res.json(activities);
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({ error: "Failed to fetch activity logs" });
  }
});

// ==================== TEST DATA ENDPOINTS ====================

// Generate comprehensive test data for a project
router.post("/projects/:id/generate-test-data", async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const userId = req.user?.id || 1; // Fallback for testing

    // Verify project exists
    const project = await db.query.buildProjects.findFirst({
      where: eq(buildProjects.id, projectId)
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const testData = {
      team: 0,
      drawings: 0,
      issues: 0,
      documents: 0,
      models3D: 0,
      milestones: 0
    };

    // Add team members
    const teamMembers = [
      { userId: 1, role: 'project_manager', isLead: true },
      { userId: 2, role: 'naval_architect', isLead: false },
      { userId: 3, role: 'construction_manager', isLead: false },
      { userId: 4, role: 'electrical_engineer', isLead: false },
      { userId: 5, role: 'quality_inspector', isLead: false }
    ];

    for (const member of teamMembers) {
      try {
        await db.insert(buildProjectTeam).values({
          projectId,
          userId: member.userId,
          role: member.role,
          isLead: member.isLead,
          assignedById: userId,
          assignedAt: new Date()
        });
        testData.team++;
      } catch (error) {
        // Skip if already exists
      }
    }

    // Add drawings
    const drawingsData = [
      {
        drawingNumber: 'GA-001',
        title: 'General Arrangement - Main Deck',
        description: 'General arrangement showing main deck layout and structure',
        category: 'general_arrangement',
        buildGroup: 'general_arrangement',
        discipline: 'naval_architecture',
        drawingType: 'plan',
        scale: '1:100',
        status: 'approved',
        revisionNumber: 'C',
        isCurrentRevision: true,
        approvalRequired: true,
        approvedById: userId,
        approvedAt: new Date(),
        fileUrl: '/api/files/drawings/ga-001-rev-c.pdf',
        fileName: 'GA-001-Rev-C.pdf',
        fileSize: 2547892,
        fileMimeType: 'application/pdf',
        thumbnailUrl: '/api/files/thumbnails/ga-001-thumb.jpg',
        tags: ['general_arrangement', 'main_deck', 'layout'],
        metadata: { revision_reason: 'Updated galley layout per owner request', approval_date: new Date() }
      },
      {
        drawingNumber: 'GA-002',
        title: 'General Arrangement - Upper Deck',
        description: 'Upper deck layout including flybridge and sundeck areas',
        category: 'general_arrangement',
        buildGroup: 'general_arrangement',
        discipline: 'naval_architecture',
        drawingType: 'plan',
        scale: '1:100',
        status: 'approved',
        revisionNumber: 'B',
        isCurrentRevision: true,
        approvalRequired: true,
        approvedById: userId,
        approvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        fileUrl: '/api/files/drawings/ga-002-rev-b.pdf',
        fileName: 'GA-002-Rev-B.pdf',
        fileSize: 2234567,
        fileMimeType: 'application/pdf',
        thumbnailUrl: '/api/files/thumbnails/ga-002-thumb.jpg',
        tags: ['general_arrangement', 'upper_deck', 'flybridge'],
        metadata: { revision_reason: 'Added hardtop structure details' }
      },
      {
        drawingNumber: 'GA-003',
        title: 'General Arrangement - Lower Deck',
        description: 'Lower deck arrangement showing guest cabins and crew quarters',
        category: 'general_arrangement',
        buildGroup: 'general_arrangement',
        discipline: 'naval_architecture',
        drawingType: 'plan',
        scale: '1:100',
        status: 'for_review',
        revisionNumber: 'A',
        isCurrentRevision: true,
        approvalRequired: true,
        fileUrl: '/api/files/drawings/ga-003-rev-a.pdf',
        fileName: 'GA-003-Rev-A.pdf',
        fileSize: 1987654,
        fileMimeType: 'application/pdf',
        thumbnailUrl: '/api/files/thumbnails/ga-003-thumb.jpg',
        tags: ['general_arrangement', 'lower_deck', 'cabins'],
        metadata: { pending_approval: 'Waiting for interior designer review' }
      },
      {
        drawingNumber: 'STR-001',
        title: 'Hull Lines and Offsets',
        description: 'Hull form lines plan and table of offsets',
        category: 'structural',
        buildGroup: 'structural',
        discipline: 'naval_architecture',
        drawingType: 'lines_plan',
        scale: '1:100',
        status: 'approved',
        revisionNumber: 'A',
        isCurrentRevision: true,
        approvalRequired: true,
        approvedById: userId,
        approvedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        fileUrl: '/api/files/drawings/str-001-rev-a.dwg',
        fileName: 'STR-001-Rev-A.dwg',
        fileSize: 1456789,
        fileMimeType: 'application/dwg',
        thumbnailUrl: '/api/files/thumbnails/str-001-thumb.jpg',
        tags: ['hull', 'lines_plan', 'offsets'],
        metadata: { tank_tested: true, hydrostatic_approved: true }
      },
      {
        drawingNumber: 'STR-002',
        title: 'Hull Structure - Frames 10-20',
        description: 'Detailed structural drawings for hull frames 10 through 20',
        category: 'structural',
        buildGroup: 'structural',
        discipline: 'naval_architecture',
        drawingType: 'section',
        scale: '1:50',
        status: 'for_review',
        revisionNumber: 'B',
        isCurrentRevision: true,
        approvalRequired: true,
        fileUrl: '/api/files/drawings/str-002-rev-b.dwg',
        fileName: 'STR-002-Rev-B.dwg',
        fileSize: 1823456,
        fileMimeType: 'application/dwg',
        thumbnailUrl: '/api/files/thumbnails/str-002-thumb.jpg',
        tags: ['structure', 'frames', 'midship'],
        metadata: { structural_analysis: 'pending', load_calculations: 'in_review' }
      },
      {
        drawingNumber: 'STR-003',
        title: 'Deck Structure and Reinforcement',
        description: 'Main deck structural layout with reinforcement details',
        category: 'structural',
        buildGroup: 'structural',
        discipline: 'naval_architecture',
        drawingType: 'plan',
        scale: '1:75',
        status: 'draft',
        revisionNumber: 'A',
        isCurrentRevision: true,
        approvalRequired: true,
        fileUrl: '/api/files/drawings/str-003-rev-a.dwg',
        fileName: 'STR-003-Rev-A.dwg',
        fileSize: 2145678,
        fileMimeType: 'application/dwg',
        thumbnailUrl: '/api/files/thumbnails/str-003-thumb.jpg',
        tags: ['deck', 'structure', 'reinforcement'],
        metadata: { status: 'initial_draft', engineer_review: 'pending' }
      },
      {
        drawingNumber: 'ELE-001',
        title: 'Main Electrical Single Line Diagram',
        description: 'Overall electrical system single line diagram showing main distribution',
        category: 'electrical',
        buildGroup: 'electrical',
        discipline: 'engineering',
        drawingType: 'schematic',
        scale: 'NTS',
        status: 'approved',
        revisionNumber: 'C',
        isCurrentRevision: true,
        approvalRequired: true,
        approvedById: userId,
        approvedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        fileUrl: '/api/files/drawings/ele-001-rev-c.pdf',
        fileName: 'ELE-001-Rev-C.pdf',
        fileSize: 1234567,
        fileMimeType: 'application/pdf',
        thumbnailUrl: '/api/files/thumbnails/ele-001-thumb.jpg',
        tags: ['electrical', 'single_line', 'distribution'],
        metadata: { classification_approved: true, load_analysis: 'complete' }
      },
      {
        drawingNumber: 'ELE-002',
        title: 'AC Distribution Panel Layout',
        description: 'AC electrical distribution panels layout and wiring details',
        category: 'electrical',
        buildGroup: 'electrical',
        discipline: 'engineering',
        drawingType: 'detail',
        scale: '1:10',
        status: 'approved',
        revisionNumber: 'B',
        isCurrentRevision: true,
        approvalRequired: true,
        approvedById: userId,
        approvedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        fileUrl: '/api/files/drawings/ele-002-rev-b.pdf',
        fileName: 'ELE-002-Rev-B.pdf',
        fileSize: 987654,
        fileMimeType: 'application/pdf',
        thumbnailUrl: '/api/files/thumbnails/ele-002-thumb.jpg',
        tags: ['electrical', 'AC', 'distribution', 'panels'],
        metadata: { panel_manufacturer: 'Blue Sea Systems', approval_date: new Date() }
      },
      {
        drawingNumber: 'ELE-003',
        title: 'DC Systems and Battery Layout',
        description: 'DC electrical systems including battery banks and charging systems',
        category: 'electrical',
        buildGroup: 'electrical',
        discipline: 'engineering',
        drawingType: 'schematic',
        scale: '1:25',
        status: 'for_review',
        revisionNumber: 'A',
        isCurrentRevision: true,
        approvalRequired: true,
        fileUrl: '/api/files/drawings/ele-003-rev-a.pdf',
        fileName: 'ELE-003-Rev-A.pdf',
        fileSize: 876543,
        fileMimeType: 'application/pdf',
        thumbnailUrl: '/api/files/thumbnails/ele-003-thumb.jpg',
        tags: ['electrical', 'DC', 'batteries', 'charging'],
        metadata: { battery_spec: 'Lithium-ion 800Ah', charger_type: 'Victron MultiPlus' }
      },
      {
        drawingNumber: 'PLU-001',
        title: 'Fresh Water System Schematic',
        description: 'Fresh water system including tanks, pumps, and distribution',
        category: 'mechanical',
        buildGroup: 'plumbing',
        discipline: 'engineering',
        drawingType: 'schematic',
        scale: 'NTS',
        status: 'approved',
        revisionNumber: 'B',
        isCurrentRevision: true,
        approvalRequired: true,
        approvedById: userId,
        approvedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        fileUrl: '/api/files/drawings/plu-001-rev-b.pdf',
        fileName: 'PLU-001-Rev-B.pdf',
        fileSize: 1345678,
        fileMimeType: 'application/pdf',
        thumbnailUrl: '/api/files/thumbnails/plu-001-thumb.jpg',
        tags: ['plumbing', 'fresh_water', 'tanks', 'pumps'],
        metadata: { tank_capacity: '500 gallons', pump_type: 'Variable speed' }
      },
      {
        drawingNumber: 'PLU-002',
        title: 'Waste Water and Blackwater Systems',
        description: 'Waste water collection, treatment, and discharge systems',
        category: 'mechanical',
        buildGroup: 'plumbing',
        discipline: 'engineering',
        drawingType: 'schematic',
        scale: 'NTS',
        status: 'draft',
        revisionNumber: 'A',
        isCurrentRevision: true,
        approvalRequired: true,
        fileUrl: '/api/files/drawings/plu-002-rev-a.pdf',
        fileName: 'PLU-002-Rev-A.pdf',
        fileSize: 1123456,
        fileMimeType: 'application/pdf',
        thumbnailUrl: '/api/files/thumbnails/plu-002-thumb.jpg',
        tags: ['plumbing', 'waste_water', 'blackwater', 'treatment'],
        metadata: { treatment_system: 'ElectroScan', msd_type: 'Type I' }
      },
      {
        drawingNumber: 'INT-001',
        title: 'Main Salon Interior Elevation',
        description: 'Interior elevation views of main salon showing furniture and finishes',
        category: 'interior',
        buildGroup: 'interior',
        discipline: 'interior_design',
        drawingType: 'elevation',
        scale: '1:50',
        status: 'approved',
        revisionNumber: 'B',
        isCurrentRevision: true,
        approvalRequired: false,
        fileUrl: '/api/files/drawings/int-001-rev-b.pdf',
        fileName: 'INT-001-Rev-B.pdf',
        fileSize: 3456789,
        fileMimeType: 'application/pdf',
        thumbnailUrl: '/api/files/thumbnails/int-001-thumb.jpg',
        tags: ['interior', 'salon', 'elevation', 'furniture'],
        metadata: { designer: 'Studio Yacht Interiors', finish_material: 'Teak and leather' }
      },
      {
        drawingNumber: 'INT-002',
        title: 'Master Stateroom Layout',
        description: 'Master stateroom interior layout including ensuite bathroom',
        category: 'interior',
        buildGroup: 'interior',
        discipline: 'interior_design',
        drawingType: 'plan',
        scale: '1:25',
        status: 'for_review',
        revisionNumber: 'A',
        isCurrentRevision: true,
        approvalRequired: true,
        fileUrl: '/api/files/drawings/int-002-rev-a.pdf',
        fileName: 'INT-002-Rev-A.pdf',
        fileSize: 2987654,
        fileMimeType: 'application/pdf',
        thumbnailUrl: '/api/files/thumbnails/int-002-thumb.jpg',
        tags: ['interior', 'master', 'stateroom', 'ensuite'],
        metadata: { bed_size: 'King', bathroom_fixtures: 'Grohe', marble_type: 'Calacatta' }
      },
      {
        drawingNumber: 'HVAC-001',
        title: 'Air Conditioning System Layout',
        description: 'HVAC system layout showing units, ductwork, and controls',
        category: 'mechanical',
        buildGroup: 'hvac',
        discipline: 'engineering',
        drawingType: 'plan',
        scale: '1:100',
        status: 'approved',
        revisionNumber: 'A',
        isCurrentRevision: true,
        approvalRequired: true,
        approvedById: userId,
        approvedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        fileUrl: '/api/files/drawings/hvac-001-rev-a.pdf',
        fileName: 'HVAC-001-Rev-A.pdf',
        fileSize: 2234567,
        fileMimeType: 'application/pdf',
        thumbnailUrl: '/api/files/thumbnails/hvac-001-thumb.jpg',
        tags: ['hvac', 'air_conditioning', 'ductwork'],
        metadata: { system_type: 'Variable Refrigerant Flow', manufacturer: 'Dometic' }
      },
      {
        drawingNumber: 'FIR-001',
        title: 'Fire Suppression System',
        description: 'Fire detection and suppression system layout and equipment',
        category: 'safety',
        buildGroup: 'safety',
        discipline: 'engineering',
        drawingType: 'plan',
        scale: '1:100',
        status: 'superseded',
        revisionNumber: 'A',
        isCurrentRevision: false,
        approvalRequired: true,
        fileUrl: '/api/files/drawings/fir-001-rev-a.pdf',
        fileName: 'FIR-001-Rev-A.pdf',
        fileSize: 1765432,
        fileMimeType: 'application/pdf',
        thumbnailUrl: '/api/files/thumbnails/fir-001-thumb.jpg',
        tags: ['fire', 'suppression', 'safety', 'detection'],
        metadata: { system_type: 'FM-200', superseded_reason: 'Updated to CO2 system' }
      }
    ];

    for (const drawing of drawingsData) {
      const [newDrawing] = await db.insert(buildDrawings).values({
        projectId,
        drawingNumber: drawing.drawingNumber,
        title: drawing.title,
        description: drawing.description,
        category: drawing.category,
        buildGroup: drawing.buildGroup,
        discipline: drawing.discipline,
        drawingType: drawing.drawingType,
        scale: drawing.scale,
        status: drawing.status,
        revisionNumber: drawing.revisionNumber,
        isCurrentRevision: drawing.isCurrentRevision,
        approvalRequired: drawing.approvalRequired,
        approvedById: drawing.approvedById,
        approvedAt: drawing.approvedAt,
        fileUrl: drawing.fileUrl,
        fileName: drawing.fileName,
        fileSize: drawing.fileSize,
        fileMimeType: drawing.fileMimeType,
        thumbnailUrl: drawing.thumbnailUrl,
        tags: drawing.tags,
        metadata: drawing.metadata,
        createdById: userId
      }).returning();
      testData.drawings++;

      // Add some comments to drawings
      if (drawing.status === 'for_review') {
        await db.insert(buildDrawingComments).values({
          drawingId: newDrawing.id,
          commentText: 'Please review the structural calculations for frame 15. The load distribution seems asymmetric.',
          commentType: 'review',
          status: 'open',
          createdById: userId
        });
      }
    }

    // Add issues with spatial coordinates (Pinpoint Works style)
    const issuesData = [
      {
        title: 'Hull gelcoat delamination on starboard side',
        description: 'Significant gelcoat delamination observed on starboard hull between frames 8-12. Area approximately 2m x 0.5m showing signs of osmotic blistering.',
        issueType: 'defect',
        category: 'structural',
        severity: 'high',
        priority: 'high',
        status: 'open',
        locationReference: 'Starboard hull, frames 8-12',
        coordinateX: 0.35, // Relative coordinates on vessel plan (0-1 scale)
        coordinateY: 0.22,
        coordinateZ: 0.15, // Z for deck level
        assignedToId: 3,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      },
      {
        title: 'Electrical panel door alignment issue',
        description: 'Main electrical panel door does not close properly. Hinge appears to be misaligned causing gap at bottom edge.',
        issueType: 'defect',
        category: 'electrical',
        severity: 'medium',
        priority: 'medium',
        status: 'in_progress',
        locationReference: 'Engine room, main electrical panel',
        coordinateX: 0.48,
        coordinateY: 0.78,
        coordinateZ: 0.05,
        assignedToId: 4,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Air conditioning duct interference',
        description: 'HVAC ductwork interferes with planned overhead lighting installation in guest cabin 2. Need design modification.',
        issueType: 'design_change',
        category: 'mechanical',
        severity: 'medium',
        priority: 'high',
        status: 'open',
        locationReference: 'Guest cabin 2, overhead',
        coordinateX: 0.72,
        coordinateY: 0.45,
        coordinateZ: 0.85,
        assignedToId: 2,
        relatedDrawingId: null // Will be set after we have drawing IDs
      },
      {
        title: 'Nonskid application quality concern',
        description: 'Nonskid application on aft deck shows uneven texture and several air bubbles. May need re-application.',
        issueType: 'quality',
        category: 'exterior',
        severity: 'low',
        priority: 'medium',
        status: 'resolved',
        locationReference: 'Aft deck, starboard side',
        coordinateX: 0.15,
        coordinateY: 0.85,
        coordinateZ: 0.98,
        resolvedById: 5,
        resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        resolutionNotes: 'Nonskid re-applied with proper surface preparation. Quality approved.'
      },
      {
        title: 'Window seal water ingress',
        description: 'Water ingress detected around port side salon window during pressure testing. Seal requires replacement.',
        issueType: 'defect',
        category: 'structural',
        severity: 'critical',
        priority: 'urgent',
        status: 'open',
        locationReference: 'Main salon, port window #3',
        coordinateX: 0.85,
        coordinateY: 0.35,
        coordinateZ: 0.45,
        assignedToId: 3,
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) // 1 day
      },
      {
        title: 'Fresh water tank mounting bracket stress crack',
        description: 'Stress crack discovered in starboard fresh water tank mounting bracket during vibration testing.',
        issueType: 'defect',
        category: 'structural',
        severity: 'high',
        priority: 'high',
        status: 'in_progress',
        locationReference: 'Engine room, starboard fresh water tank',
        coordinateX: 0.65,
        coordinateY: 0.80,
        coordinateZ: 0.25,
        assignedToId: 4,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Fire suppression system pressure anomaly',
        description: 'Engine room fire suppression system showing irregular pressure readings during system test.',
        issueType: 'safety',
        category: 'safety',
        severity: 'critical',
        priority: 'urgent',
        status: 'open',
        locationReference: 'Engine room, fire suppression control panel',
        coordinateX: 0.55,
        coordinateY: 0.85,
        coordinateZ: 0.40,
        assignedToId: 2,
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Navigation antenna interference issue',
        description: 'Radar and VHF antennas positioned too close causing signal interference. Relocation required.',
        issueType: 'design_change',
        category: 'electronics',
        severity: 'medium',
        priority: 'medium',
        status: 'open',
        locationReference: 'Flybridge hardtop, antenna array',
        coordinateX: 0.50,
        coordinateY: 0.10,
        coordinateZ: 1.15,
        assignedToId: 3,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Galley countertop installation misalignment',
        description: 'Main galley countertop sections do not align properly with cabinet structure.',
        issueType: 'quality',
        category: 'interior',
        severity: 'medium',
        priority: 'medium',
        status: 'resolved',
        locationReference: 'Main deck galley, central island',
        coordinateX: 0.35,
        coordinateY: 0.70,
        coordinateZ: 0.85,
        assignedToId: 3,
        resolvedById: 3,
        resolvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        resolutionNotes: 'Countertop sections re-measured and reinstalled. Perfect alignment achieved.'
      },
      {
        title: 'Waste water pump excessive vibration',
        description: 'Guest head waste water pump generating excessive vibration and noise during operation.',
        issueType: 'quality',
        category: 'mechanical',
        severity: 'low',
        priority: 'low',
        status: 'in_progress',
        locationReference: 'Guest head, pump compartment',
        coordinateX: 0.80,
        coordinateY: 0.45,
        coordinateZ: 0.15,
        assignedToId: 2,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Deck hardware hole misalignment',
        description: 'Port side bow cleat mounting holes do not align with structural backing plate.',
        issueType: 'rework',
        category: 'structural',
        severity: 'medium',
        priority: 'medium',
        status: 'closed',
        locationReference: 'Foredeck port side, bow cleat position',
        coordinateX: 0.05,
        coordinateY: 0.05,
        coordinateZ: 0.95,
        assignedToId: 5,
        resolvedById: 5,
        resolvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        resolutionNotes: 'New holes drilled with proper backing plate alignment. Hardware installed and load tested.'
      },
      {
        title: 'Interior lighting circuit overload',
        description: 'Main salon lighting circuit experiencing overload conditions with all lights activated.',
        issueType: 'design_change',
        category: 'electrical',
        severity: 'medium',
        priority: 'high',
        status: 'open',
        locationReference: 'Main salon, lighting control panel',
        coordinateX: 0.25,
        coordinateY: 0.55,
        coordinateZ: 0.75,
        assignedToId: 2,
        dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)
      }
    ];

    for (const issue of issuesData) {
      const issueNumber = await generateIssueNumber(projectId);
      const [newIssue] = await db.insert(buildIssues).values({
        ...issue,
        projectId,
        issueNumber,
        reportedById: userId
      }).returning();
      testData.issues++;

      // Add photos to some issues
      if (issue.severity === 'high' || issue.severity === 'critical') {
        const photoData = [
          {
            issueId: newIssue.id,
            photoUrl: `/api/files/issue-photos/issue-${newIssue.id}-photo-1.jpg`,
            thumbnailUrl: `/api/files/issue-photos/thumbs/issue-${newIssue.id}-thumb-1.jpg`,
            fileName: `issue-${newIssue.id}-photo-1.jpg`,
            fileSize: 245678,
            caption: 'Overview of the defect area',
            uploadedById: userId
          },
          {
            issueId: newIssue.id,
            photoUrl: `/api/files/issue-photos/issue-${newIssue.id}-photo-2.jpg`,
            thumbnailUrl: `/api/files/issue-photos/thumbs/issue-${newIssue.id}-thumb-2.jpg`,
            fileName: `issue-${newIssue.id}-photo-2.jpg`,
            fileSize: 198765,
            caption: 'Close-up detail showing extent of damage',
            uploadedById: userId
          }
        ];

        for (const photo of photoData) {
          await db.insert(buildIssuePhotos).values(photo);
        }
      }

      // Add comments to some issues
      if (issue.status === 'in_progress' || issue.status === 'resolved') {
        const comments = [
          {
            issueId: newIssue.id,
            commentText: 'Started investigation. Will need to order replacement parts.',
            createdById: issue.assignedToId || userId,
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        ];

        if (issue.status === 'resolved') {
          comments.push({
            issueId: newIssue.id,
            commentText: 'Work completed and quality checked. Issue resolved.',
            createdById: issue.resolvedById || userId,
            createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
          });
        }

        for (const comment of comments) {
          await db.insert(buildIssueComments).values(comment);
        }
      }
    }

    // Add documents
    const documentsData = [
      {
        title: 'Technical Specification - Hull Construction',
        description: 'Detailed technical specifications for hull construction materials and methods including fiberglass schedules and resin systems',
        documentType: 'technical',
        category: 'specification',
        subCategory: 'construction',
        documentNumber: 'SPEC-001',
        version: '2.1',
        status: 'active',
        confidentialityLevel: 'internal',
        fileUrl: '/api/files/documents/spec-001-hull-construction.pdf',
        fileName: 'SPEC-001-Hull-Construction-v2.1.pdf',
        fileSize: 1547892,
        fileMimeType: 'application/pdf',
        thumbnailUrl: '/api/files/thumbnails/spec-001-thumb.jpg',
        tags: ['hull', 'construction', 'fiberglass', 'resin', 'specifications'],
        metadata: { classification_society: 'Lloyd\'s Register', approval_date: '2024-01-15' },
        authorName: 'Naval Architecture Team',
        authorCompany: 'Marine Design Associates',
        reviewRequired: true,
        reviewedById: userId,
        reviewedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        reviewNotes: 'Technical specifications approved for construction phase'
      },
      {
        title: 'Survey Report - Pre-delivery Inspection',
        description: 'Comprehensive pre-delivery survey report covering all systems, structures, and compliance requirements',
        documentType: 'inspection',
        category: 'report',
        subCategory: 'survey',
        documentNumber: 'RPT-002',
        version: '1.0',
        status: 'active',
        confidentialityLevel: 'confidential',
        fileUrl: '/api/files/documents/rpt-002-survey-report.pdf',
        fileName: 'RPT-002-Survey-Report-v1.0.pdf',
        fileSize: 3247891,
        fileMimeType: 'application/pdf',
        thumbnailUrl: '/api/files/thumbnails/rpt-002-thumb.jpg',
        tags: ['survey', 'inspection', 'delivery', 'compliance', 'certification'],
        metadata: { surveyor: 'Marine Survey International', survey_date: '2024-05-20', expires: '2025-05-20' },
        authorName: 'Capt. James Morrison',
        authorCompany: 'Marine Survey International',
        reviewRequired: false
      },
      {
        title: 'CE Certification Documentation',
        description: 'European Conformity certification documents including compliance records and test results',
        documentType: 'certification',
        category: 'certificate',
        subCategory: 'compliance',
        documentNumber: 'CERT-003',
        version: '1.0',
        status: 'active',
        confidentialityLevel: 'public',
        fileUrl: '/api/files/documents/cert-003-ce-certification.pdf',
        fileName: 'CERT-003-CE-Certification-v1.0.pdf',
        fileSize: 892456,
        fileMimeType: 'application/pdf',
        thumbnailUrl: '/api/files/thumbnails/cert-003-thumb.jpg',
        tags: ['certification', 'CE', 'compliance', 'legal', 'European'],
        metadata: { notified_body: 'Bureau Veritas', certificate_number: 'CE-2024-0892', valid_until: '2029-06-15' },
        authorName: 'Bureau Veritas Marine',
        authorCompany: 'Bureau Veritas',
        reviewRequired: false
      },
      {
        title: 'Build Contract - Phase 2 Modifications',
        description: 'Contract addendum for Phase 2 modifications including interior upgrades and system enhancements',
        documentType: 'contract',
        category: 'legal',
        subCategory: 'agreements',
        documentNumber: 'CONT-004',
        version: '1.2',
        status: 'active',
        confidentialityLevel: 'confidential',
        fileUrl: '/api/files/documents/cont-004-phase2-contract.pdf',
        fileName: 'CONT-004-Phase2-Contract-v1.2.pdf',
        fileSize: 1247893,
        fileMimeType: 'application/pdf',
        thumbnailUrl: '/api/files/thumbnails/cont-004-thumb.jpg',
        tags: ['contract', 'modifications', 'interior', 'legal', 'addendum'],
        metadata: { contract_value: '€485,000', signed_date: '2024-03-10', completion_date: '2024-08-15' },
        authorName: 'Legal Department',
        authorCompany: 'Shipyard Legal Services',
        reviewRequired: true,
        reviewedById: userId,
        reviewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        reviewNotes: 'Contract terms reviewed and approved by legal team'
      },
      {
        title: 'Owner\'s Manual - Systems Operation',
        description: 'Comprehensive owner manual covering all onboard systems operation, maintenance schedules, and troubleshooting',
        documentType: 'manual',
        category: 'operational',
        subCategory: 'maintenance',
        documentNumber: 'MAN-005',
        version: '3.0',
        status: 'active',
        confidentialityLevel: 'internal',
        fileUrl: '/api/files/documents/man-005-owner-manual.pdf',
        fileName: 'MAN-005-Owner-Manual-v3.0.pdf',
        fileSize: 5647891,
        fileMimeType: 'application/pdf',
        thumbnailUrl: '/api/files/thumbnails/man-005-thumb.jpg',
        tags: ['manual', 'systems', 'operation', 'maintenance', 'troubleshooting'],
        metadata: { last_updated: '2024-05-30', languages: ['English', 'French', 'German'] },
        authorName: 'Technical Documentation Team',
        authorCompany: 'Yacht Systems Documentation',
        reviewRequired: false
      },
      {
        title: 'Stability Calculation Report',
        description: 'Detailed stability analysis and calculations including inclining test results and loading conditions',
        documentType: 'technical',
        category: 'analysis',
        subCategory: 'stability',
        documentNumber: 'STAB-006',
        version: '1.3',
        status: 'active',
        confidentialityLevel: 'internal',
        fileUrl: '/api/files/documents/stab-006-stability-report.pdf',
        fileName: 'STAB-006-Stability-Report-v1.3.pdf',
        fileSize: 2134567,
        fileMimeType: 'application/pdf',
        thumbnailUrl: '/api/files/thumbnails/stab-006-thumb.jpg',
        tags: ['stability', 'calculations', 'inclining', 'loading', 'naval_architecture'],
        metadata: { inclining_date: '2024-04-18', approved_by: 'Lloyd\'s Register', gm_minimum: '1.2m' },
        authorName: 'Dr. Sarah Chen',
        authorCompany: 'Maritime Engineering Consultants',
        reviewRequired: true,
        reviewedById: userId,
        reviewedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        reviewNotes: 'Stability calculations verified and approved for all loading conditions'
      },
      {
        title: 'Material Test Certificates - Structural Steel',
        description: 'Material test certificates for all structural steel components including chemical composition and mechanical properties',
        documentType: 'certification',
        category: 'materials',
        subCategory: 'steel',
        documentNumber: 'MTC-007',
        version: '1.0',
        status: 'active',
        confidentialityLevel: 'internal',
        fileUrl: '/api/files/documents/mtc-007-steel-certificates.pdf',
        fileName: 'MTC-007-Steel-Certificates-v1.0.pdf',
        fileSize: 4532189,
        fileMimeType: 'application/pdf',
        thumbnailUrl: '/api/files/thumbnails/mtc-007-thumb.jpg',
        tags: ['materials', 'steel', 'certificates', 'testing', 'quality'],
        metadata: { steel_grade: 'S355', mill_certificates: 47, batch_numbers: 'ST-2024-001 to ST-2024-047' },
        authorName: 'Quality Control Department',
        authorCompany: 'Steel Supply International',
        reviewRequired: false
      },
      {
        title: 'Fire Safety Systems Manual',
        description: 'Complete fire safety systems documentation including detection, suppression, and emergency procedures',
        documentType: 'safety',
        category: 'manual',
        subCategory: 'fire_safety',
        documentNumber: 'FIRE-008',
        version: '2.0',
        status: 'active',
        confidentialityLevel: 'internal',
        fileUrl: '/api/files/documents/fire-008-safety-manual.pdf',
        fileName: 'FIRE-008-Safety-Manual-v2.0.pdf',
        fileSize: 3987654,
        fileMimeType: 'application/pdf',
        thumbnailUrl: '/api/files/thumbnails/fire-008-thumb.jpg',
        tags: ['fire_safety', 'suppression', 'detection', 'emergency', 'procedures'],
        metadata: { system_type: 'CO2/Water Mist', zones: 12, last_inspection: '2024-05-25' },
        authorName: 'Fire Safety Engineering',
        authorCompany: 'Marine Safety Systems Ltd',
        reviewRequired: true,
        reviewedById: userId,
        reviewedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        reviewNotes: 'Fire safety systems documentation reviewed and approved by maritime authority'
      },
      {
        title: 'Electrical Load Analysis Report',
        description: 'Comprehensive electrical load analysis including power consumption calculations and generator sizing',
        documentType: 'technical',
        category: 'analysis',
        subCategory: 'electrical',
        documentNumber: 'ELEC-009',
        version: '1.1',
        status: 'active',
        confidentialityLevel: 'internal',
        fileUrl: '/api/files/documents/elec-009-load-analysis.pdf',
        fileName: 'ELEC-009-Load-Analysis-v1.1.pdf',
        fileSize: 1876543,
        fileMimeType: 'application/pdf',
        thumbnailUrl: '/api/files/thumbnails/elec-009-thumb.jpg',
        tags: ['electrical', 'load_analysis', 'power', 'generators', 'calculations'],
        metadata: { total_load: '145kW', generator_capacity: '2x80kW', diversity_factor: '0.7' },
        authorName: 'Marine Electrical Engineering',
        authorCompany: 'PowerMarine Systems',
        reviewRequired: false
      },
      {
        title: 'Interior Design Specification',
        description: 'Detailed interior design specifications including materials, finishes, furniture, and artwork selection',
        documentType: 'specification',
        category: 'interior',
        subCategory: 'design',
        documentNumber: 'INT-010',
        version: '2.3',
        status: 'active',
        confidentialityLevel: 'confidential',
        fileUrl: '/api/files/documents/int-010-design-spec.pdf',
        fileName: 'INT-010-Design-Specification-v2.3.pdf',
        fileSize: 8765432,
        fileMimeType: 'application/pdf',
        thumbnailUrl: '/api/files/thumbnails/int-010-thumb.jpg',
        tags: ['interior', 'design', 'materials', 'finishes', 'furniture'],
        metadata: { design_theme: 'Contemporary Luxury', primary_materials: ['Teak', 'Marble', 'Leather'], budget: '€650,000' },
        authorName: 'Isabella Romano',
        authorCompany: 'Romano Interior Design Studio',
        reviewRequired: true,
        reviewedById: userId,
        reviewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        reviewNotes: 'Design specifications approved with minor material substitutions'
      },
      {
        title: 'Commissioning Test Results',
        description: 'Complete commissioning test results for all mechanical and electrical systems including performance data',
        documentType: 'testing',
        category: 'report',
        subCategory: 'commissioning',
        documentNumber: 'COMM-011',
        version: '1.0',
        status: 'draft',
        confidentialityLevel: 'internal',
        fileUrl: '/api/files/documents/comm-011-test-results.pdf',
        fileName: 'COMM-011-Test-Results-v1.0-DRAFT.pdf',
        fileSize: 6234567,
        fileMimeType: 'application/pdf',
        thumbnailUrl: '/api/files/thumbnails/comm-011-thumb.jpg',
        tags: ['commissioning', 'testing', 'systems', 'performance', 'mechanical'],
        metadata: { test_date: '2024-06-01', systems_tested: 23, pass_rate: '96%', pending_items: 3 },
        authorName: 'Commissioning Team',
        authorCompany: 'Marine Systems Commissioning Ltd',
        reviewRequired: true
      },
      {
        title: 'Environmental Impact Assessment',
        description: 'Environmental impact assessment covering construction activities, waste management, and marine environment protection',
        documentType: 'assessment',
        category: 'environmental',
        subCategory: 'impact',
        documentNumber: 'ENV-012',
        version: '1.0',
        status: 'active',
        confidentialityLevel: 'public',
        fileUrl: '/api/files/documents/env-012-impact-assessment.pdf',
        fileName: 'ENV-012-Impact-Assessment-v1.0.pdf',
        fileSize: 3456789,
        fileMimeType: 'application/pdf',
        thumbnailUrl: '/api/files/thumbnails/env-012-thumb.jpg',
        tags: ['environmental', 'impact', 'assessment', 'marine', 'sustainability'],
        metadata: { assessment_date: '2024-01-30', environmental_consultant: 'Green Marine Consulting', approval_ref: 'ENV-2024-0156' },
        authorName: 'Environmental Consulting Team',
        authorCompany: 'Green Marine Consulting',
        reviewRequired: false
      }
    ];

    for (const document of documentsData) {
      await db.insert(buildDocuments).values({
        ...document,
        projectId,
        uploadedById: userId
      });
      testData.documents++;
    }

    // Add 3D models
    const modelsData = [
      {
        modelName: 'Hull Structure Progress Scan - Week 12',
        description: 'Matterport 3D scan of hull structure taken during week 12 of construction showing structural progress',
        modelType: 'matterport',
        fileUrl: 'https://my.matterport.com/show/?m=sample123',
        embedCode: '<iframe width="853" height="480" src="https://my.matterport.com/show/?m=sample123&play=1" frameborder="0" allowfullscreen allow="xr-spatial-tracking"></iframe>',
        fileSize: 45678912,
        thumbnailUrl: '/api/files/3d-models/thumbs/hull-scan-week12-thumb.jpg',
        captureDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        tags: ['hull', 'structure', 'progress', 'matterport', 'construction'],
        metadata: { 
          scan_duration: '45 minutes', 
          coverage_area: 'Hull frames 10-20', 
          quality: 'Ultra High', 
          matterport_id: 'sample123',
          scan_equipment: 'Matterport Pro2'
        }
      },
      {
        modelName: 'Interior Progress Scan - Guest Areas',
        description: '3D scan showing interior construction progress in guest cabin areas including finishes and furniture placement',
        modelType: 'matterport',
        fileUrl: 'https://my.matterport.com/show/?m=sample456',
        embedCode: '<iframe width="853" height="480" src="https://my.matterport.com/show/?m=sample456&play=1" frameborder="0" allowfullscreen allow="xr-spatial-tracking"></iframe>',
        fileSize: 38947612,
        thumbnailUrl: '/api/files/3d-models/thumbs/interior-guest-scan-thumb.jpg',
        captureDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        tags: ['interior', 'guest', 'progress', 'matterport', 'finishes'],
        metadata: { 
          scan_duration: '35 minutes', 
          coverage_area: 'Guest cabins and corridors', 
          quality: 'High', 
          matterport_id: 'sample456',
          completion_percentage: '85%'
        }
      },
      {
        modelName: 'Main Salon and Galley Scan',
        description: 'Detailed 3D scan of main salon and galley areas showing completed interior work and furniture installation',
        modelType: 'matterport',
        fileUrl: 'https://my.matterport.com/show/?m=sample789',
        embedCode: '<iframe width="853" height="480" src="https://my.matterport.com/show/?m=sample789&play=1" frameborder="0" allowfullscreen allow="xr-spatial-tracking"></iframe>',
        fileSize: 52341678,
        thumbnailUrl: '/api/files/3d-models/thumbs/salon-galley-scan-thumb.jpg',
        captureDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        tags: ['salon', 'galley', 'interior', 'matterport', 'completed'],
        metadata: { 
          scan_duration: '50 minutes', 
          coverage_area: 'Main salon, galley, and dining area', 
          quality: 'Ultra High', 
          matterport_id: 'sample789',
          furniture_installed: true
        }
      },
      {
        modelName: 'Engine Room Systems Scan',
        description: 'Comprehensive 3D scan of engine room showing all mechanical systems, piping, and electrical installations',
        modelType: 'matterport',
        fileUrl: 'https://my.matterport.com/show/?m=sample101',
        embedCode: '<iframe width="853" height="480" src="https://my.matterport.com/show/?m=sample101&play=1" frameborder="0" allowfullscreen allow="xr-spatial-tracking"></iframe>',
        fileSize: 41236789,
        thumbnailUrl: '/api/files/3d-models/thumbs/engine-room-scan-thumb.jpg',
        captureDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        tags: ['engine_room', 'mechanical', 'systems', 'matterport', 'piping'],
        metadata: { 
          scan_duration: '40 minutes', 
          coverage_area: 'Complete engine room and machinery spaces', 
          quality: 'High', 
          matterport_id: 'sample101',
          systems_visible: ['Main engines', 'Generators', 'HVAC', 'Plumbing']
        }
      },
      {
        modelName: 'Master Stateroom and Ensuite Scan',
        description: '3D scan of master stateroom and ensuite bathroom showing luxury finishes and custom millwork',
        modelType: 'matterport',
        fileUrl: 'https://my.matterport.com/show/?m=sample202',
        embedCode: '<iframe width="853" height="480" src="https://my.matterport.com/show/?m=sample202&play=1" frameborder="0" allowfullscreen allow="xr-spatial-tracking"></iframe>',
        fileSize: 47892345,
        thumbnailUrl: '/api/files/3d-models/thumbs/master-stateroom-scan-thumb.jpg',
        captureDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        tags: ['master', 'stateroom', 'ensuite', 'matterport', 'luxury'],
        metadata: { 
          scan_duration: '30 minutes', 
          coverage_area: 'Master stateroom, ensuite, and walk-in closet', 
          quality: 'Ultra High', 
          matterport_id: 'sample202',
          marble_type: 'Calacatta',
          millwork_completed: true
        }
      },
      {
        modelName: 'Flybridge and Upper Deck Scan',
        description: '3D scan of flybridge and upper deck areas including hardtop, seating, and navigation equipment',
        modelType: 'matterport',
        fileUrl: 'https://my.matterport.com/show/?m=sample303',
        embedCode: '<iframe width="853" height="480" src="https://my.matterport.com/show/?m=sample303&play=1" frameborder="0" allowfullscreen allow="xr-spatial-tracking"></iframe>',
        fileSize: 39456781,
        thumbnailUrl: '/api/files/3d-models/thumbs/flybridge-scan-thumb.jpg',
        captureDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        tags: ['flybridge', 'upper_deck', 'navigation', 'matterport', 'exterior'],
        metadata: { 
          scan_duration: '25 minutes', 
          coverage_area: 'Flybridge, hardtop, and upper deck seating', 
          quality: 'High', 
          matterport_id: 'sample303',
          electronics_installed: true,
          weather_conditions: 'Clear'
        }
      },
      {
        modelName: 'CAD Assembly Model - Complete Vessel',
        description: 'CAD-based 3D model showing complete vessel assembly with all systems, structures, and components integrated',
        modelType: 'cad',
        fileUrl: '/api/files/3d-models/complete-vessel-assembly.obj',
        fileSize: 125678943,
        thumbnailUrl: '/api/files/3d-models/thumbs/complete-vessel-thumb.jpg',
        isActive: true,
        tags: ['cad', 'assembly', 'complete', 'vessel', 'technical'],
        metadata: { 
          file_format: 'OBJ with materials', 
          polygon_count: '2.4M triangles', 
          texture_resolution: '4K', 
          created_by: 'CAD Engineering Team',
          last_updated: '2024-05-28',
          includes_systems: true
        }
      },
      {
        modelName: 'Hull Lines 3D Visualization',
        description: 'CAD-based 3D model showing hull form and lines plan for design visualization and analysis',
        modelType: 'cad',
        fileUrl: '/api/files/3d-models/hull-lines-3d.obj',
        fileSize: 45789123,
        thumbnailUrl: '/api/files/3d-models/thumbs/hull-lines-thumb.jpg',
        isActive: true,
        tags: ['hull', 'lines_plan', 'cad', 'design', 'naval_architecture'],
        metadata: { 
          file_format: 'OBJ', 
          polygon_count: '850K triangles', 
          design_software: 'Rhino 3D', 
          created_by: 'Naval Architecture Team',
          hydrostatics_verified: true,
          scale: '1:1'
        }
      },
      {
        modelName: 'Structural Framework Model',
        description: 'Detailed CAD model showing internal structural framework including frames, bulkheads, and reinforcements',
        modelType: 'cad',
        fileUrl: '/api/files/3d-models/structural-framework.obj',
        fileSize: 78945612,
        thumbnailUrl: '/api/files/3d-models/thumbs/structural-framework-thumb.jpg',
        isActive: true,
        tags: ['structure', 'framework', 'cad', 'engineering', 'analysis'],
        metadata: { 
          file_format: 'OBJ with wireframe', 
          polygon_count: '1.2M triangles', 
          material_properties: 'Included', 
          created_by: 'Structural Engineering Team',
          fem_analysis_ready: true,
          includes_loads: true
        }
      },
      {
        modelName: 'Point Cloud Scan - Complete Vessel',
        description: 'High-resolution point cloud scan of the complete vessel for as-built documentation and quality control',
        modelType: 'point_cloud',
        fileUrl: '/api/files/3d-models/complete-vessel-pointcloud.las',
        fileSize: 2456789123,
        thumbnailUrl: '/api/files/3d-models/thumbs/pointcloud-complete-thumb.jpg',
        captureDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        tags: ['point_cloud', 'as_built', 'documentation', 'quality_control', 'survey'],
        metadata: { 
          file_format: 'LAS', 
          point_count: '847 million points', 
          accuracy: '±2mm', 
          scan_equipment: 'Faro Focus3D X 330',
          scan_positions: 156,
          processing_software: 'CloudCompare'
        }
      },
      {
        modelName: 'BIM Model - MEP Systems',
        description: 'Building Information Model (BIM) showing all mechanical, electrical, and plumbing systems with detailed routing',
        modelType: 'bim',
        fileUrl: '/api/files/3d-models/mep-systems-bim.ifc',
        fileSize: 234567891,
        thumbnailUrl: '/api/files/3d-models/thumbs/bim-mep-thumb.jpg',
        isActive: true,
        tags: ['bim', 'mep', 'systems', 'mechanical', 'electrical', 'plumbing'],
        metadata: { 
          file_format: 'IFC 4.0', 
          bim_software: 'Autodesk Revit', 
          includes_specifications: true, 
          created_by: 'MEP Engineering Team',
          clash_detection_completed: true,
          systems_included: ['HVAC', 'Electrical', 'Plumbing', 'Fire Safety']
        }
      },
      {
        modelName: 'VR Training Model - Safety Systems',
        description: 'Virtual Reality training model for safety systems operation and emergency procedures',
        modelType: 'vr',
        fileUrl: '/api/files/3d-models/safety-training-vr.unity3d',
        fileSize: 156789234,
        thumbnailUrl: '/api/files/3d-models/thumbs/vr-safety-thumb.jpg',
        isActive: true,
        tags: ['vr', 'training', 'safety', 'emergency', 'procedures'],
        metadata: { 
          file_format: 'Unity 3D Package', 
          vr_platforms: ['Oculus', 'HTC Vive', 'Pico'], 
          interaction_types: ['Hand tracking', 'Controller'], 
          created_by: 'VR Training Solutions',
          training_scenarios: 12,
          languages: ['English', 'Spanish', 'French']
        }
      }
    ];

    for (const model of modelsData) {
      await db.insert(build3DModels).values({
        ...model,
        projectId,
        uploadedById: userId
      });
      testData.models3D++;
    }

    // Add milestones
    const milestonesData = [
      {
        name: 'Hull Completion',
        description: 'Complete hull structure including deck and superstructure',
        milestoneType: 'completion',
        category: 'structural',
        plannedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        actualDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
        status: 'completed',
        progressPercentage: 100,
        completedById: 3,
        responsibleParty: 'Construction Team',
        notes: 'Hull structure completed 2 days ahead of schedule'
      },
      {
        name: 'Systems Integration',
        description: 'Installation and integration of all mechanical and electrical systems',
        milestoneType: 'completion',
        category: 'mechanical',
        plannedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        actualDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'completed',
        progressPercentage: 100,
        completedById: 4,
        responsibleParty: 'Systems Team',
        notes: 'All systems integrated and tested successfully'
      },
      {
        name: 'Interior Fit-out',
        description: 'Complete interior installation including furniture and finishes',
        milestoneType: 'completion',
        category: 'interior',
        plannedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'in_progress',
        progressPercentage: 65,
        responsibleParty: 'Interior Design Team',
        notes: 'Waiting for custom furniture delivery'
      },
      {
        name: 'Sea Trials',
        description: 'Comprehensive sea trials and performance testing',
        milestoneType: 'inspection',
        category: 'commissioning',
        plannedDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        status: 'planned',
        progressPercentage: 0,
        responsibleParty: 'Sea Trial Team'
      },
      {
        name: 'Final Delivery',
        description: 'Final inspection, documentation, and delivery to owner',
        milestoneType: 'delivery',
        category: 'commissioning',
        plannedDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
        status: 'planned',
        progressPercentage: 0,
        responsibleParty: 'Project Management'
      }
    ];

    for (const milestone of milestonesData) {
      await db.insert(buildMilestones).values({
        ...milestone,
        projectId,
        createdById: userId
      });
      testData.milestones++;
    }

    // Log test data generation activity
    await logActivity(
      projectId,
      'test_data_generated',
      'project',
      projectId,
      `Test data generated: ${testData.team} team members, ${testData.drawings} drawings, ${testData.issues} issues, ${testData.documents} documents, ${testData.models3D} 3D models, ${testData.milestones} milestones`,
      userId,
      undefined,
      testData,
      req
    );

    res.json({
      message: "Test data generated successfully",
      data: testData
    });

  } catch (error) {
    console.error("Error generating test data:", error);
    res.status(500).json({ error: "Failed to generate test data" });
  }
});

// Clear all test data for a project
router.delete("/projects/:id/test-data", async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    // Delete in reverse dependency order
    await db.delete(buildActivityLogs).where(eq(buildActivityLogs.projectId, projectId));
    await db.delete(buildMilestones).where(eq(buildMilestones.projectId, projectId));
    await db.delete(build3DModels).where(eq(build3DModels.projectId, projectId));
    await db.delete(buildDocumentVersions).where(sql`${buildDocumentVersions.documentId} IN (SELECT id FROM ${buildDocuments} WHERE project_id = ${projectId})`);
    await db.delete(buildDocuments).where(eq(buildDocuments.projectId, projectId));
    await db.delete(buildIssueComments).where(sql`${buildIssueComments.issueId} IN (SELECT id FROM ${buildIssues} WHERE project_id = ${projectId})`);
    await db.delete(buildIssuePhotos).where(sql`${buildIssuePhotos.issueId} IN (SELECT id FROM ${buildIssues} WHERE project_id = ${projectId})`);
    await db.delete(buildIssues).where(eq(buildIssues.projectId, projectId));
    await db.delete(buildDrawingComments).where(sql`${buildDrawingComments.drawingId} IN (SELECT id FROM ${buildDrawings} WHERE project_id = ${projectId})`);
    await db.delete(buildDrawingRevisions).where(sql`${buildDrawingRevisions.drawingId} IN (SELECT id FROM ${buildDrawings} WHERE project_id = ${projectId})`);
    await db.delete(buildDrawings).where(eq(buildDrawings.projectId, projectId));
    await db.delete(buildProjectTeam).where(eq(buildProjectTeam.projectId, projectId));

    res.json({ message: "Test data cleared successfully" });
  } catch (error) {
    console.error("Error clearing test data:", error);
    res.status(500).json({ error: "Failed to clear test data" });
  }
});

export default router; 