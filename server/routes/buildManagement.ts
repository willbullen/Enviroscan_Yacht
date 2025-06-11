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
      req.user?.id,
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
      whereConditions.push(
        or(
          like(buildDrawings.title, `%${search}%`),
          like(buildDrawings.drawingNumber, `%${search}%`),
          like(buildDrawings.description, `%${search}%`)
        )
      );
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
      req.user?.id,
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
        req.user?.id,
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
      whereConditions.push(
        or(
          like(buildIssues.title, `%${search}%`),
          like(buildIssues.description, `%${search}%`),
          like(buildIssues.issueNumber, `%${search}%`)
        )
      );
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
        req.user?.id,
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
        req.user?.id,
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
      whereConditions.push(
        or(
          like(buildDocuments.title, `%${search}%`),
          like(buildDocuments.description, `%${search}%`),
          like(buildDocuments.documentNumber, `%${search}%`)
        )
      );
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
      req.user?.id,
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
      req.user?.id,
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
      req.user?.id,
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
        thumbnailUrl: '/api/files/thumbnails/ga-001-thumb.jpg'
      },
      {
        drawingNumber: 'STR-002',
        title: 'Hull Structure - Frames 10-20',
        description: 'Detailed structural drawings for hull frames 10 through 20',
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
        thumbnailUrl: '/api/files/thumbnails/str-002-thumb.jpg'
      },
      {
        drawingNumber: 'ELE-003',
        title: 'Electrical Distribution - Main Panel',
        description: 'Main electrical distribution panel layout and wiring diagram',
        buildGroup: 'electrical',
        discipline: 'engineering',
        drawingType: 'schematic',
        scale: '1:25',
        status: 'draft',
        revisionNumber: 'A',
        isCurrentRevision: true,
        approvalRequired: true,
        fileUrl: '/api/files/drawings/ele-003-rev-a.pdf',
        fileName: 'ELE-003-Rev-A.pdf',
        fileSize: 987654,
        thumbnailUrl: '/api/files/thumbnails/ele-003-thumb.jpg'
      },
      {
        drawingNumber: 'INT-004',
        title: 'Main Salon Interior Layout',
        description: 'Interior design and furniture layout for main salon area',
        buildGroup: 'interior',
        discipline: 'interior_design',
        drawingType: 'plan',
        scale: '1:50',
        status: 'approved',
        revisionNumber: 'A',
        isCurrentRevision: true,
        approvalRequired: false,
        fileUrl: '/api/files/drawings/int-004-rev-a.pdf',
        fileName: 'INT-004-Rev-A.pdf',
        fileSize: 3456789,
        thumbnailUrl: '/api/files/thumbnails/int-004-thumb.jpg'
      }
    ];

    for (const drawing of drawingsData) {
      const [newDrawing] = await db.insert(buildDrawings).values({
        ...drawing,
        projectId,
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
        description: 'Detailed technical specifications for hull construction materials and methods',
        category: 'specification',
        documentType: 'technical',
        documentNumber: 'SPEC-001',
        tags: ['hull', 'construction', 'fiberglass', 'resin'],
        fileUrl: '/api/files/documents/spec-001-hull-construction.pdf',
        fileName: 'SPEC-001-Hull-Construction.pdf',
        fileSize: 1547892,
        mimeType: 'application/pdf',
        isLatestVersion: true,
        versionNumber: '2.1'
      },
      {
        title: 'Survey Report - Pre-delivery Inspection',
        description: 'Comprehensive pre-delivery survey report covering all systems and structures',
        category: 'report',
        documentType: 'operational',
        documentNumber: 'RPT-002',
        tags: ['survey', 'inspection', 'delivery', 'compliance'],
        fileUrl: '/api/files/documents/rpt-002-survey-report.pdf',
        fileName: 'RPT-002-Survey-Report.pdf',
        fileSize: 3247891,
        mimeType: 'application/pdf',
        isLatestVersion: true,
        versionNumber: '1.0'
      },
      {
        title: 'CE Certification Documentation',
        description: 'European Conformity certification documents and compliance records',
        category: 'certificate',
        documentType: 'legal',
        documentNumber: 'CERT-003',
        tags: ['certification', 'CE', 'compliance', 'legal'],
        fileUrl: '/api/files/documents/cert-003-ce-certification.pdf',
        fileName: 'CERT-003-CE-Certification.pdf',
        fileSize: 892456,
        mimeType: 'application/pdf',
        isLatestVersion: true,
        versionNumber: '1.0'
      },
      {
        title: 'Build Contract - Phase 2 Modifications',
        description: 'Contract addendum for Phase 2 modifications including interior upgrades',
        category: 'contract',
        documentType: 'legal',
        documentNumber: 'CONT-004',
        tags: ['contract', 'modifications', 'interior', 'legal'],
        fileUrl: '/api/files/documents/cont-004-phase2-contract.pdf',
        fileName: 'CONT-004-Phase2-Contract.pdf',
        fileSize: 1247893,
        mimeType: 'application/pdf',
        isLatestVersion: true,
        versionNumber: '1.2'
      },
      {
        title: 'Owner Manual - Systems Operation',
        description: 'Comprehensive owner manual covering all onboard systems operation and maintenance',
        category: 'manual',
        documentType: 'operational',
        documentNumber: 'MAN-005',
        tags: ['manual', 'systems', 'operation', 'maintenance'],
        fileUrl: '/api/files/documents/man-005-owner-manual.pdf',
        fileName: 'MAN-005-Owner-Manual.pdf',
        fileSize: 5647891,
        mimeType: 'application/pdf',
        isLatestVersion: true,
        versionNumber: '3.0'
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
        modelName: 'Hull Structure Scan - Week 12',
        description: 'Matterport 3D scan of hull structure taken during week 12 of construction',
        modelType: 'matterport',
        fileUrl: 'https://my.matterport.com/show/?m=sample123',
        embedCode: '<iframe src="https://my.matterport.com/show/?m=sample123" width="100%" height="400"></iframe>',
        fileSize: 45678912,
        captureDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        isActive: true,
        tags: ['hull', 'structure', 'progress']
      },
      {
        modelName: 'Interior Progress Scan - Guest Areas',
        description: '3D scan showing interior construction progress in guest cabin areas',
        modelType: 'matterport',
        fileUrl: 'https://my.matterport.com/show/?m=sample456',
        embedCode: '<iframe src="https://my.matterport.com/show/?m=sample456" width="100%" height="400"></iframe>',
        fileSize: 38947612,
        captureDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        isActive: true,
        tags: ['interior', 'guest', 'progress']
      },
      {
        modelName: 'Final Assembly 3D Model',
        description: 'CAD-based 3D model showing final assembly with all systems integrated',
        modelType: 'cad',
        fileUrl: '/api/files/3d-models/final-assembly.obj',
        thumbnailUrl: '/api/files/3d-models/thumbs/final-assembly-thumb.jpg',
        fileSize: 125678943,
        isActive: true,
        tags: ['cad', 'assembly', 'final']
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
        plannedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        actualDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
        status: 'completed',
        completedById: 3,
        notes: 'Hull structure completed 2 days ahead of schedule'
      },
      {
        name: 'Systems Integration',
        description: 'Installation and integration of all mechanical and electrical systems',
        plannedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        actualDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'completed',
        completedById: 4,
        notes: 'All systems integrated and tested successfully'
      },
      {
        name: 'Interior Fit-out',
        description: 'Complete interior installation including furniture and finishes',
        plannedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'pending',
        notes: 'Waiting for custom furniture delivery'
      },
      {
        name: 'Sea Trials',
        description: 'Comprehensive sea trials and performance testing',
        plannedDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        status: 'pending'
      },
      {
        name: 'Final Delivery',
        description: 'Final inspection, documentation, and delivery to owner',
        plannedDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
        status: 'pending'
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