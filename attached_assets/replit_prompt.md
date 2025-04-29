# Replit Prompt: Enhance ISM Management Module

## Goal

Enhance the existing ISM Management module in the web application hosted at `https://fead71cf-ed0f-4dc9-965c-4c90df83140c-00-2aqewwmae7psg.picard.replit.dev/ism-management` (or the corresponding Replit project source) by adding a comprehensive task management system based on digital forms and checklists.

## Core Requirements

1.  **Task Creation:** Allow authorized users (e.g., managers) to create tasks assigned to crew members. Each task should be based on a specific, versioned form or checklist template.
2.  **Form/Checklist Templates:** Create digital templates corresponding to the various ISM forms provided (originally as PDFs). These templates must:
    *   Be **categorized** (e.g., Checklist, Report, Permit).
    *   Be **versioned**, allowing updates to form structures over time while preserving historical data integrity.
    *   Have a defined **structure** (fields, sections, input types like text, checkbox, date, dropdown, etc.).
3.  **Task Completion:** Allow assigned crew members to view their tasks, access the corresponding digital form/checklist, fill it out, and submit the data.
4.  **Data Storage:** Save the submitted form data persistently in the application's database.
5.  **Commenting:** Enable users to add comments to tasks for communication and record-keeping.
6.  **Integration:** Integrate this new functionality smoothly into the existing ISM Management section of the application.

## Existing Application Structure (Observations)

-   The application has a main navigation sidebar with sections like Dashboard, Vessels, Tasks, ISM Management, etc.
-   The ISM Management section currently has tabs for Documents, Audits, Training, and Incidents.
-   The Documents tab displays a list of documents with Title, Document Type, Doc. Number, Version, Status, Updated date, and Actions.
-   This existing structure should be considered when integrating the new features.

## Design & Specifications

The following designs and specifications have been prepared to guide the implementation. You should adhere to these unless technical constraints necessitate changes (which should be discussed).

### 1. Form Categories

Forms should be categorized. Based on the provided file names, the following initial categories are suggested. Implement a mechanism to manage these categories (e.g., in the database).

```
### Checklists
- Working Aloft Checklist
- Safety Checklist Monthly - Mooring Lines Working Conditions and Environment
- Safety Alarms Monthly Check
- Pre-Departure Checklist
- Pre-Arrival Checklist
- Life Saving Appliances Checklist
- Bunkering Checklist
- Anchoring Checklist
- EM01 - Drugs Stowaways and Contraband Checklist

### Reports
- SOPEP Report
- Note of Protest
- Noon Report
- Non-conformity Report
- Near Miss Report
- Misc Machinery - Monthly Report
- Masters Monthly Review
- Masters Hand Over Report
- Main Engine - Monthly Report
- Defect Report
- Damage Report
- Chief Engineers Monthly Report Form
- Chief Engineers Handover
- Aux Engines - Monthly Report
- Collision Report
- EM08 - Pollution Report
- EM03 - Flooding Report

### Permits / Work Authorizations
- Permit to Work - Work Aloft
- Permit to work - Hot work
- Permit to Work - Enclosed Space Entry
- Permit to Work - Electrical
- Permit to Work - Diving Operations
- Hot Work Notice
- Hazardous Work Safe Entry Form
- Risk Assessment

### Procedures / Plans
- Preparation for Sea
- Preparation for Sea - Engine Room
- Preparation for Arrival - Engine Room
- Passage Plan
- Calling the Master

### Logs / Records
- Watch Handover
- Safety Meeting Minutes
- Medical Log
- FFE Maintenance Records
- Engine Room Watch Changover

### Familiarization / Training
- Security Familiarization
- Familiarization Engine Watchkeeper
- Familiarization Bridge Watchkeeper
- Crew Familiarisation Form
- Drill Form
- EM14 ISPS - Annual Security Exercise

### Emergency Procedures / Reports
- EM13 - Violent Act
- EM12 - Stowaway Questionnaire
- EM11 - Steering Failure
- EM10 - Security Breach
- EM09 - Request for Medical Attention
- EM07 - Man Overboard Discovery
- EM06 - Medical Emergency
- EM05 - Main Propulsion Failure
- EM02 - Emergency Broadcast

### Administrative
- Form Change Request
```




### 2. Database Schema

Implement the following database schema to support the new features. Adapt table and field names as necessary to match the application's existing conventions, but preserve the relationships and data types.

```markdown
# Proposed Database Schema for ISM Task Management

This schema outlines the necessary tables and fields to support the requested functionality: adding tasks based on versioned and categorized forms/checklists, allowing form completion, saving data, and adding comments.

## 1. `form_categories`

Stores the different categories for forms/checklists.

- `category_id` (Primary Key, Integer/UUID)
- `name` (String, unique, e.g., 'Checklist', 'Report', 'Permit')
- `description` (Text, optional)

## 2. `form_templates`

Stores the master record for each type of form or checklist.

- `template_id` (Primary Key, Integer/UUID)
- `title` (String, e.g., 'Working Aloft Checklist')
- `category_id` (Foreign Key referencing `form_categories.category_id`)
- `original_filename` (String, optional, e.g., 'Working Aloft Checklist.pdf')
- `description` (Text, optional)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

## 3. `form_template_versions`

Stores specific versions of each form template, including its structure.

- `version_id` (Primary Key, Integer/UUID)
- `template_id` (Foreign Key referencing `form_templates.template_id`)
- `version_number` (String or Decimal, e.g., '1.0', '2.1')
- `structure_definition` (JSON/Text, defines the form fields, types, labels, options, sections, etc. This needs detailed definition based on each PDF.)
- `is_active` (Boolean, indicates if this is the current version to be used for new tasks)
- `created_at` (Timestamp)
- `created_by` (Foreign Key referencing user/crew table, optional)

*Note:* The `structure_definition` is critical. It needs to capture all elements of the original PDF form (text fields, checkboxes, radio buttons, dropdowns, date pickers, signature areas, etc.) in a structured format like JSON.

## 4. `tasks`

Stores tasks assigned to crew members, linked to a specific form version.

- `task_id` (Primary Key, Integer/UUID)
- `title` (String, can be auto-generated or custom)
- `description` (Text, optional)
- `form_template_version_id` (Foreign Key referencing `form_template_versions.version_id`)
- `assigned_crew_id` (Foreign Key referencing user/crew table)
- `due_date` (Date/Timestamp, optional)
- `status` (String, e.g., 'Pending', 'In Progress', 'Completed', 'Overdue', 'Reviewed')
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

## 5. `form_submissions`

Stores the data entered by crew members when completing a task/form.

- `submission_id` (Primary Key, Integer/UUID)
- `task_id` (Foreign Key referencing `tasks.task_id`)
- `submitted_by_crew_id` (Foreign Key referencing user/crew table)
- `submission_data` (JSON/Text, stores the actual filled data as key-value pairs corresponding to `structure_definition`)
- `submitted_at` (Timestamp)

## 6. `comments`

Stores comments related to tasks or specific form submissions.

- `comment_id` (Primary Key, Integer/UUID)
- `task_id` (Foreign Key referencing `tasks.task_id`, nullable)
- `submission_id` (Foreign Key referencing `form_submissions.submission_id`, nullable)
- `commenter_id` (Foreign Key referencing user/crew table)
- `comment_text` (Text)
- `created_at` (Timestamp)

*Note:* Link comments primarily to `task_id`.

## Relationships:

- One `form_category` can have many `form_templates`.
- One `form_template` can have many `form_template_versions`.
- One `form_template_version` can be used in many `tasks`.
- One `task` is linked to exactly one `form_template_version`.
- One `task` can have one `form_submission` (assuming one final submission per task).
- One `task` can have many `comments`.
```




### 3. Form Versioning System

Implement the form versioning system as described below:

```markdown
# Form Versioning System Design

## Core Principles

1.  **Immutability:** Once a form version is used in a task submission, its structure (`structure_definition`) should ideally remain unchanged.
2.  **Clarity:** Clearly indicate the active version and the version used for each task submission.
3.  **Traceability:** Allow tracking of version changes (sequential numbering is sufficient).

## Database Tables Involved

-   `form_templates`
-   `form_template_versions`
-   `tasks`
-   `form_submissions`

## Version Creation Workflow

1.  **Initiation:** Allow authorized users to create a new version from an existing template.
2.  **Basis:** New version starts as a copy of the latest version's structure.
3.  **Modification:** User modifies the `structure_definition` via a form editor.
4.  **Version Numbering:** Assign a unique (per template) version number (e.g., 1.0, 1.1, 2.0).
5.  **Saving:** Create a new `form_template_versions` record (`is_active` = false initially).

## Activating a Version

1.  **Selection:** User selects an inactive version to activate.
2.  **Deactivation:** Automatically set `is_active = false` for the previously active version of the same template.
3.  **Activation:** Set `is_active = true` for the selected version.
4.  **Effect:** New tasks for this template use the newly activated version.

## Linking Tasks and Submissions

-   New `tasks` link to the `version_id` of the *currently active* `form_template_version`.
-   `form_submissions` are linked to the `task_id`, implicitly tying the submitted data to the specific form version used for that task.
```




### 4. Task Management Interface Design

Implement the user interface based on the following design concepts. Adapt the layout and styling to match the existing application.

```markdown
# Task Management Interface Design

## 1. Integration Point

-   **Recommendation:** Add a new primary tab within "ISM Management" named "ISM Tasks" or similar.

## 2. Main Views

### 2.1. ISM Task List View (Crew & Managers)

-   **Location:** New "ISM Tasks" tab.
-   **Content:** Filterable/sortable table of tasks (user's or all).
-   **Filters:** Status, Due Date, Form Template, Assigned Crew.
-   **Columns:** Task Title, Form Name, Form Version, Assigned To, Due Date, Status, Actions (View/Complete, View Details).
-   **Actions:** `+ New Task` button (Managers).

### 2.2. Task Detail & Form Completion View (Crew)

-   **Access:** Via "View/Complete" button.
-   **Layout:** Header (Task/Form details), Dynamic Form Area (rendered from `structure_definition`), Action Buttons (Save Draft, Submit), Comments Section.
-   **Form Rendering:** Requires an engine to render various field types (text, checkbox, date, etc.) from JSON structure.

### 2.3. Form Template Management View (Managers/Admins)

-   **Location:** Sub-section under ISM Management or dedicated "Form Templates" area.
-   **Content:** Table of `form_templates`.
-   **Columns:** Title, Category, Active Version, Last Updated, Actions (Manage Versions, Edit Details).
-   **Actions:** `+ New Form Template` button.

### 2.4. Form Version Management View (Managers/Admins)

-   **Access:** Via "Manage Versions" button.
-   **Content:** Parent template details + list of its `form_template_versions`.
-   **Version Columns:** Version Number, Status (Active/Inactive), Created At/By, Actions (View Structure, Edit Structure [if inactive], Activate, Create New Version From This).
-   **Form Builder/Editor:** Crucial component to create/edit `structure_definition` (JSON).

## 3. Commenting Interface

-   **Location:** Integrated within Task Detail View.
-   **Display:** Chronological list of comments (Commenter, Timestamp, Text).
-   **Input:** Text area + "Post Comment" button.

## 4. Key UI Elements Needed

-   Dynamic Form Renderer (JSON -> HTML Form).
-   Form Builder/Editor (UI for creating/editing JSON `structure_definition`).
-   Data tables with filtering/sorting/pagination.
-   Modals/pages for create/edit operations.
```




### 5. Form Submission Functionality

Implement the form submission logic based on the following specification:

```markdown
# Form Submission Functionality Specification

## Overview

Capture, validate, and store data submitted by crew members for assigned tasks.

## Frontend Logic (Task Detail & Form Completion View)

1.  **Data Capture:** Capture input values from the dynamically rendered form.
2.  **Client-Side Validation:** Perform basic validation (required, type) in the browser.
3.  **Data Packaging:** On "Submit", gather form data into JSON (keys matching `structure_definition`).
4.  **API Request:** Send JSON data via POST/PUT to a backend endpoint (e.g., `/api/ism/tasks/{task_id}/submit`).
5.  **Feedback Handling:** Display success/error messages based on API response; update task status in UI.

## Backend Logic (API Endpoint: e.g., `/api/ism/tasks/{task_id}/submit`)

1.  **Auth:** Verify user authentication and authorization for the task.
2.  **Task Verification:** Check task existence and status; retrieve `form_template_version_id`.
3.  **Structure Retrieval:** Fetch `structure_definition` for the specific version.
4.  **Data Validation:** Validate received JSON against `structure_definition` rules and perform security checks.
5.  **Database Insertion:** If valid, create a new `form_submissions` record (linking `task_id`, `submitted_by_crew_id`, storing `submission_data` JSON, `submitted_at`).
6.  **Task Status Update:** Update `tasks.status` to 'Completed' (or 'Pending Review').
7.  **Success Response:** Return success (e.g., 200 OK) to frontend.

## Error Handling

-   Handle backend errors gracefully (DB issues, invalid IDs) with appropriate HTTP status codes.

## Considerations

-   **Drafts:** Implement separately if needed (save submission with 'draft' status, don't update task status).
```




### 6. Commenting Functionality

Implement the commenting feature as specified below:

```markdown
# Commenting Functionality Specification

## Overview

Allow users to add textual comments to tasks.

## Database Integration

- Use the `comments` table.
- Link comments primarily to `task_id`.

## Frontend Logic (Integrated into Task Detail View)

1.  **Display Area:** Show chronological list of comments (Commenter Name, Timestamp, Text).
2.  **Fetching Comments:** API call (e.g., GET `/api/ism/tasks/{task_id}/comments`) on view load.
3.  **Adding Comments:** Text input area + "Post Comment" button.
    *   Send API request (e.g., POST `/api/ism/tasks/{task_id}/comments`) with `comment_text`.
4.  **Updating Display:** Dynamically add new comment on success; clear input.

## Backend Logic (API Endpoints)

1.  **Fetch Comments (e.g., `GET /api/ism/tasks/{task_id}/comments`)**
    *   Auth check.
    *   Query `comments` table for the `task_id`, join with user table for names.
    *   Order chronologically.
    *   Return JSON array of comments.
2.  **Add Comment (e.g., `POST /api/ism/tasks/{task_id}/comments`)**
    *   Auth check.
    *   Validate `comment_text` (non-empty).
    *   Insert new record into `comments` table (linking `task_id`, `commenter_id`, `comment_text`, `created_at`).
    *   Return newly created comment data (e.g., 201 Created).

## Considerations

-   Notifications, editing/deleting comments are potential future enhancements.
```




### 7. Form Structure Definition (`structure_definition` JSON)

This JSON field in `form_template_versions` defines the actual layout and fields of a form. It must be flexible enough to represent all the provided PDF forms. Here is a conceptual example for the "Working Aloft Checklist":

```json
{
  "title": "Working Aloft Checklist",
  "sections": [
    {
      "id": "section_personal_info",
      "title": "Personal Information",
      "fields": [
        {
          "id": "port",
          "label": "Port",
          "type": "text",
          "required": true
        },
        {
          "id": "vessel_name",
          "label": "Vessel",
          "type": "text",
          "required": true
        },
        {
          "id": "person_name",
          "label": "Name of person carrying out work",
          "type": "text",
          "required": true
        }
      ]
    },
    {
      "id": "section_checklist",
      "title": "The following must be checked before work is approved",
      "type": "checklist_group", // Custom type to handle repeating structure
      "items": [
        {
          "id": "chk_physically_fit",
          "label": "Is the person responsible for work in a physically fit condition for the work?"
        },
        {
          "id": "chk_appropriate_clothing",
          "label": "Is the person wearing appropriate clothing for the work?"
        },
        {
          "id": "chk_ppe_provided",
          "label": "Has the person been provided with adequate personal protective equipment?"
        },
        {
          "id": "chk_equipment_suitable",
          "label": "Are bosun chairs, stage boards, scaffoldings, ladders and any required equipment suitable for use?"
        },
        {
          "id": "chk_ropes_lifelines_checked",
          "label": "Has the condition and strength of ropes and lifelines been checked?"
        },
        {
          "id": "chk_equipment_damage_prevented",
          "label": "Has equipment been correctly and properly checked and measures taken to prevent damage?"
        },
        {
          "id": "chk_anti_falling_measures",
          "label": "Are there anti-falling measures in place?"
        },
        {
          "id": "chk_wind_speed_accounted",
          "label": "Has wind speed been accounted for, can the work be carried out safely?"
        },
        {
          "id": "chk_traffic_blocked",
          "label": "Has traffic under the working site been blocked?"
        },
        {
          "id": "chk_persons_notified",
          "label": "Before working in vicinity of radar scanner, funnel and whistle, have proper persons been notified?"
        },
        {
          "id": "chk_warning_notices_posted",
          "label": "Are warning notices posted?"
        },
        {
          "id": "chk_watchman_posted",
          "label": "Is watchman posted?"
        },
        {
          "id": "chk_ladders_set_correctly",
          "label": "If using portable ladders, have they been set correctly at suitable places?"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"]
        },
        {
          "id": "remarks",
          "label": "Remarks",
          "type": "textarea"
        }
      ]
    },
    {
      "id": "section_signature",
      "title": "Confirmation",
      "fields": [
        {
          "id": "crew_signature",
          "label": "Crew member signature",
          "type": "signature" // Requires a signature capture component
        },
        {
          "id": "signature_date",
          "label": "Date",
          "type": "date"
        }
      ]
    }
  ]
}
```

**Note:** You will need to define the `structure_definition` JSON for *each* of the provided PDF forms. This example provides a template; adapt it for different field types (dropdowns, multi-select, etc.) as needed.

### 8. Form Submission Data (`submission_data` JSON)

This JSON field in `form_submissions` stores the actual data entered by the user. It should correspond to the `structure_definition`. Example for the above checklist:

```json
{
  "port": "Rotterdam",
  "vessel_name": "M/Y Serenity",
  "person_name": "John Doe",
  "checklist_items": {
    "chk_physically_fit": {
      "status": "Yes",
      "remarks": ""
    },
    "chk_appropriate_clothing": {
      "status": "Yes",
      "remarks": "Standard overalls and safety shoes."
    },
    "chk_ppe_provided": {
      "status": "Yes",
      "remarks": "Harness, helmet, gloves provided."
    },
    "chk_equipment_suitable": {
      "status": "Yes",
      "remarks": "Bosun chair inspected OK."
    },
    "chk_ropes_lifelines_checked": {
      "status": "Yes",
      "remarks": ""
    },
    "chk_equipment_damage_prevented": {
      "status": "Yes",
      "remarks": "Tools secured with lanyards."
    },
    "chk_anti_falling_measures": {
      "status": "Yes",
      "remarks": "Safety harness attached."
    },
    "chk_wind_speed_accounted": {
      "status": "Yes",
      "remarks": "Wind speed 10 knots, acceptable."
    },
    "chk_traffic_blocked": {
      "status": "Yes",
      "remarks": "Area cordoned off."
    },
    "chk_persons_notified": {
      "status": "Yes",
      "remarks": "Bridge and ECR notified."
    },
    "chk_warning_notices_posted": {
      "status": "Yes",
      "remarks": "Signs posted at access points."
    },
    "chk_watchman_posted": {
      "status": "Yes",
      "remarks": "Standby person assigned."
    },
    "chk_ladders_set_correctly": {
      "status": "N/A", // Or handle Not Applicable if needed
      "remarks": "Ladder not used."
    }
  },
  "crew_signature": "<base64_encoded_signature_image_or_data>",
  "signature_date": "2025-04-29"
}
```

### 9. Implementation Details

-   **Technology Stack:** Use the existing application's technology stack (frontend framework, backend language/framework, database).
-   **Form Builder:** Implement or integrate a form builder component that allows managers to visually create/edit the `structure_definition` JSON for form templates.
-   **Form Renderer:** Implement a dynamic form rendering component that takes the `structure_definition` JSON and generates the interactive form for the crew member.
-   **API Endpoints:** Create the necessary backend API endpoints to handle:
    *   CRUD operations for `form_categories`, `form_templates`, `form_template_versions`.
    *   Managing active versions.
    *   CRUD operations for `tasks`.
    *   Fetching task lists (filtered).
    *   Fetching task details (including the correct form structure).
    *   Handling `form_submissions` (POST/PUT).
    *   Fetching and adding `comments`.
-   **User Roles/Permissions:** Ensure appropriate access control for creating templates, assigning tasks, completing tasks, and viewing data.

## Deliverable

Update the Replit project source code to include this new functionality, ensuring it is well-integrated, tested, and follows the specifications outlined above.




### Detailed Form Structure Definitions

Below are the detailed JSON structure definitions for each form provided. These should be used to dynamically generate the forms within the application.



#### Anchoring Checklist.json

```json
{
  "title": "Anchoring Checklist",
  "sections": [
    {
      "id": "section_header",
      "title": "Checklist Details",
      "fields": [
        {
          "id": "vessel_name",
          "label": "Vessel Name",
          "type": "text",
          "required": true
        },
        {
          "id": "report_filled_by",
          "label": "Report filled out by",
          "type": "user_select", // Assuming a dropdown to select the user/crew member
          "required": true
        },
        {
          "id": "checklist_date",
          "label": "Date",
          "type": "date",
          "required": true
        }
      ]
    },
    {
      "id": "section_pre_anchoring",
      "title": "Pre-Anchoring",
      "type": "checklist_group",
      "items": [
        {
          "id": "pre_room_swinging",
          "label": "Ensure there is enough room for swinging"
        },
        {
          "id": "pre_speed_reduction",
          "label": "Speed reduction in sufficient time"
        },
        {
          "id": "pre_wind_current_accounted",
          "label": "Direction/strength of wind and current accounted for"
        },
        {
          "id": "pre_chief_eng_crew_ready",
          "label": "Chief engineer, crew on standby ready with instructions"
        },
        {
          "id": "pre_standby_informed",
          "label": "Have the engine room, crew and deck been informed of the time of standby for anchoring?"
        },
        {
          "id": "pre_position_reported",
          "label": "Has the anchor position of the ship been reported to the port authority?"
        },
        {
          "id": "pre_chain_clear",
          "label": "Chain clear to lower"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks",
          "type": "textarea",
          "required": false // Remarks likely needed if 'No'
        }
      ]
    },
    {
      "id": "section_during_anchoring",
      "title": "During-Anchoring",
      "type": "checklist_group",
      "items": [
        {
          "id": "during_plot_position",
          "label": "Determine and plot the ships position on the appropriate chart as soon as practicable"
        },
        {
          "id": "during_check_secure",
          "label": "Check whether the ship is remaining securely at anchor by taking bearings of fixed navigation marks or readily identifiable shore objects"
        },
        {
          "id": "during_maintain_lookout",
          "label": "Ensure that proper look out is maintained"
        },
        {
          "id": "during_notify_dragging",
          "label": "Notify the master and undertake all necessary measures if the ship drags anchor"
        },
        {
          "id": "during_observe_conditions",
          "label": "Observe meteorological and tidal conditions and the state of the sea"
        },
        {
          "id": "during_inspection_rounds",
          "label": "Ensure that inspection rounds of the ship are made periodically"
        },
        {
          "id": "during_notify_visibility",
          "label": "If visibility deteriorates, notify the master of any weather condition changes"
        },
        {
          "id": "during_exhibit_lights_shapes",
          "label": "Ensure that the ship exhibits the appropriate lights and shapes and the appropriate sound signals are made in accordance with all applicable regulations"
        },
        {
          "id": "during_engine_readiness",
          "label": "Ensure that state of readiness of the main engines and other machinery is in accordance with the masters instructions"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks",
          "type": "textarea",
          "required": false // Remarks likely needed if 'No'
        }
      ]
    }
    // Signature section is missing from the text, assume it's handled by the overall task submission/user context
  ]
}
```



#### Aux Engines - Monthly Report.json

```json
{
  "title": "Aux Engines - Monthly Report",
  "sections": [
    {
      "id": "section_header",
      "title": "Vessel Information",
      "fields": [
        {
          "id": "ship_name",
          "label": "Ship",
          "type": "text",
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call Sign",
          "type": "text",
          "required": false
        },
        {
          "id": "inmo_no",
          "label": "INMO No",
          "type": "text",
          "required": false
        }
      ]
    },
    {
      "id": "section_engines",
      "title": "Engine Reports",
      "type": "array",
      "item_label": "Engine",
      "max_items": 4, // Assuming up to 3 Aux + 1 Emergency based on layout
      "item_structure": {
        "type": "object",
        "fields": [
          {
            "id": "engine_identifier",
            "label": "Engine Identifier (e.g., Aux 1, Emergency Gen)",
            "type": "text",
            "required": true
          },
          {
            "id": "engine_type",
            "label": "Type",
            "type": "text",
            "required": false
          },
          {
            "id": "total_hours_last_month",
            "label": "Total running hours at end of last month",
            "type": "number",
            "required": false
          },
          {
            "id": "hours_this_month",
            "label": "Running hours this month",
            "type": "number",
            "required": false
          },
          {
            "id": "total_hours_this_month",
            "label": "Total running hours at end of this month",
            "type": "number",
            "required": false
          },
          {
            "id": "maintenance_log",
            "label": "Maintenance Log (Hours/Date Last Done)",
            "type": "repeating_group",
            "items": [
              {
                "id": "cyl_heads",
                "label": "Cylinder Heads (12,000 hrs*)",
                "fields": [{"id": "last_done", "label": "Last Done", "type": "text"}]
              },
              {
                "id": "pistons",
                "label": "Pistons (12,000 hrs*)",
                "fields": [{"id": "last_done", "label": "Last Done", "type": "text"}]
              },
              {
                "id": "liners",
                "label": "Liners (12,000 hrs*)",
                "fields": [{"id": "last_done", "label": "Last Done", "type": "text"}]
              },
              {
                "id": "fuel_valves",
                "label": "Fuel valves (3,000 hrs*)",
                "fields": [{"id": "last_done", "label": "Last Done", "type": "text"}]
              },
              {
                "id": "main_bearings",
                "label": "Main bearings (12,000 hrs*)",
                "fields": [{"id": "last_done", "label": "Last Done", "type": "text"}]
              },
              {
                "id": "bottom_end_bearings",
                "label": "Bottom end bearings (12,000 hrs*)",
                "fields": [{"id": "last_done", "label": "Last Done", "type": "text"}]
              },
              {
                "id": "alarms_test",
                "label": "Alarms, Overspeed, Emergency Shut Down – Test (1 mth*)",
                "fields": [{"id": "last_done", "label": "Last Done", "type": "text"}]
              },
              {
                "id": "cooling_water_test",
                "label": "Cooling Water Treatment – Test (1 mth*)",
                "fields": [{"id": "last_done", "label": "Last Done", "type": "text"}]
              },
              {
                "id": "lub_oil_change",
                "label": "Lub Oil Change (600 hrs*)",
                "fields": [{"id": "last_done", "label": "Last Done", "type": "text"}]
              },
              {
                 "id": "turbocharger", // Specific to Emergency Gen in PDF layout
                 "label": "Turbocharger",
                 "fields": [{"id": "last_done", "label": "Last Done", "type": "text"}]
              }
            ]
          }
        ]
      }
    },
    {
      "id": "section_remarks",
      "title": "Remarks",
      "fields": [
        {
          "id": "remarks",
          "label": "Remarks",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_signatures",
      "title": "Signatures",
      "fields": [
        {
          "id": "ch_eng_signature",
          "label": "Ch.Eng (Signature / Name / Date)",
          "type": "signature_block",
          "required": true
        },
        {
          "id": "dpa_signature",
          "label": "DPA (Signature / Name / Date)",
          "type": "signature_block",
          "required": false // Office use
        }
      ]
    }
  ]
}
```



#### Bunkering Checklist.json

```json
{
  "title": "Bunkering Safety Checklist",
  "sections": [
    {
      "id": "section_header",
      "title": "Bunkering Details",
      "fields": [
        {
          "id": "port_of_supply",
          "label": "Port Of Supply",
          "type": "text",
          "required": true
        },
        {
          "id": "receiving_vessel_name",
          "label": "Receiving Vessel Name",
          "type": "text",
          "required": true,
          "defaultValue": "Quinta Essentia" // Pre-filled based on PDF
        },
        {
          "id": "oil_type",
          "label": "Oil Type",
          "type": "text",
          "required": true
        },
        {
          "id": "oil_quantity",
          "label": "Oil Quantity",
          "type": "text", // Could be number + unit, using text for flexibility
          "required": true
        },
        {
          "id": "bunkering_time_place",
          "label": "Time and Place of Bunkering Operation",
          "type": "textarea",
          "required": true
        }
      ]
    },
    {
      "id": "section_pre_bunkering",
      "title": "Pre-Bunkering",
      "type": "checklist_group",
      "items": [
        {
          "id": "pre_vessel_secured",
          "label": "1. Is the Vessel properly Secured to Dock?"
        },
        {
          "id": "pre_hoses_condition",
          "label": "2. Are bunkering hoses in good condition?"
        },
        {
          "id": "pre_hoses_connected",
          "label": "3. Are bunkering hoses correctly connected and the drip trays in position?"
        },
        {
          "id": "pre_receiving_valve_open",
          "label": "4. Is the valve of the receiving tank open?"
        },
        {
          "id": "pre_tank_capacity_checked",
          "label": "5. Has the capacity of the receiving tank been checked?"
        },
        {
          "id": "pre_valves_hull_condition",
          "label": "6. Are the valves opened and the hull in good condition with no leaks?"
        },
        {
          "id": "pre_absorbing_materials",
          "label": "7. Are the necessary absorbing materials available for dealing with accidental oil spills?"
        },
        {
          "id": "pre_comms_signals_ready",
          "label": "8. Are Communications and signals ready?"
        },
        {
          "id": "pre_supply_amounts_established",
          "label": "9. Are Supply amounts established?"
        },
        {
          "id": "pre_transfer_hose_rigged",
          "label": "10. Is the transfer hose properly rigged and flanges fully bolted?"
        },
        {
          "id": "pre_doors_portholes_closed",
          "label": "11. Are exterior doors and portholes closed?"
        },
        {
          "id": "pre_vessel_moored_securely",
          "label": "12. Is the vessel securely moored?"
        },
        {
          "id": "pre_unused_manifolds_blanked",
          "label": "13. Are unused manifold valves closed and connections blanked and fully bolted?"
        },
        {
          "id": "pre_sopep_equipment_checked",
          "label": "14. Has all the equipment in SOPEP been checked?"
        },
        {
          "id": "pre_red_flag_light",
          "label": "15. Red flag/light is presented on masthead"
        },
        {
          "id": "pre_fire_extinguisher_ready",
          "label": "16. Is the portable chemical fire extinguisher near and ready?"
        },
        {
          "id": "pre_no_smoking_signs",
          "label": "17. Are the No Smoking signs visible?"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks (Required if No)",
          "type": "textarea",
          "required": false // Conditional requirement handled by frontend/backend logic
        }
      ],
      "fields": [
        {
          "id": "pre_truck_barge_meters",
          "label": "18. Check Truck/Barge Meters Reading",
          "type": "text", // Or number
          "required": false
        },
        {
          "id": "pre_vessel_meters",
          "label": "19. Check Vessel's Meters Reading",
          "type": "text", // Or number
          "required": false
        }
      ]
    },
    {
      "id": "section_during_bunkering",
      "title": "During-Bunkering",
      "type": "checklist_group",
      "items": [
        {
          "id": "during_monitor_connections",
          "label": "1. Monitor Fuel Connections"
        },
        {
          "id": "during_temp_check",
          "label": "2. Bunker temperature Check"
        },
        {
          "id": "during_take_sample",
          "label": "3. Take Sample during Bunkering"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks (Required if No)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_completion",
      "title": "Bunkering Completion",
      "type": "checklist_group",
      "items": [
        {
          "id": "comp_disconnect_hose",
          "label": "1. Disconnect Hose, Check lines are empty"
        },
        {
          "id": "comp_bunker_valve_closed",
          "label": "2. Is the Bunker valve Closed?"
        },
        {
          "id": "comp_red_flag_removed",
          "label": "5. Red Flag/Signal removed or turned off?"
        },
        {
          "id": "comp_paperwork_completed",
          "label": "6. Sign Bunker receipts, all paper work completed?"
        },
        {
          "id": "comp_master_informed",
          "label": "7. Master informed of Completion?"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks (Required if No)",
          "type": "textarea",
          "required": false
        }
      ],
      "fields": [
        {
          "id": "comp_vessel_meter",
          "label": "3. Check Vessel's Meter Reading",
          "type": "text", // Or number
          "required": false
        },
        {
          "id": "comp_barge_truck_meter",
          "label": "4. Check Barge/Truck Meter Reading",
          "type": "text", // Or number
          "required": false
        }
      ]
    },
    {
      "id": "section_signatures",
      "title": "Signatures",
      "fields": [
        {
          "id": "supplier_name",
          "label": "Person in charge for supplier",
          "type": "text",
          "required": true
        },
        {
          "id": "supplier_position",
          "label": "Position (Supplier)",
          "type": "text",
          "required": true
        },
        {
          "id": "supplier_signature",
          "label": "Signature (Supplier)",
          "type": "signature",
          "required": true
        },
        {
          "id": "supplier_datetime",
          "label": "Date & Time (Supplier)",
          "type": "datetime", // Combined date and time
          "required": true
        },
        {
          "id": "receiver_name",
          "label": "Person in charge for receiver",
          "type": "text",
          "required": true
        },
        {
          "id": "receiver_position",
          "label": "Position (Receiver)",
          "type": "text",
          "required": true
        },
        {
          "id": "receiver_signature",
          "label": "Signature (Receiver)",
          "type": "signature",
          "required": true
        },
        {
          "id": "receiver_datetime",
          "label": "Date & Time (Receiver)",
          "type": "datetime",
          "required": true
        }
      ]
    }
  ]
}
```



#### Calling the Master.json

```json
{
  "title": "Calling the Master",
  "description": "Safety Management System - Guidelines for when the Officer On Watch (OOW) should notify the Master.",
  "sections": [
    {
      "id": "section_header_info",
      "title": "Vessel Information",
      "fields": [
        {
          "id": "ship_name",
          "label": "Ship",
          "type": "text",
          "defaultValue": "Quinta Essentia", // Assuming default
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call Sign",
          "type": "text",
          "required": false
        },
        {
          "id": "imo_no",
          "label": "INMO No", // Typo in PDF? Should be IMO No?
          "type": "text",
          "required": false
        }
        // Note: This form seems informational, no specific date/time or user input required beyond vessel context.
      ]
    },
    {
      "id": "section_guidelines",
      "title": "Notify the Master Immediately If:",
      "fields": [
        {
          "id": "guidelines_list",
          "label": "Conditions Requiring Notification",
          "type": "markdown",
          "content": "*   If restricted visibility is encountered or expected\n*   If traffic conditions or the movements of other ships are causing concern\n*   If difficulties are experienced in maintaining course\n*   On failure to sight land, a navigation mark or obtain soundings by the expected time\n*   If, unexpectedly, land or a navigation mark is sighted or a change in soundings occurs\n*   On breakdown of engines, propulsion machinery remote control, steering gear or any essential navigational equipment, alarm or indicator\n*   If the radio equipment malfunctions\n*   In heavy weather if in any doubt about the possibility of weather damage\n*   If the ship meets any hazard to navigation, such as ice or a derelict\n*   In any other emergency or if in any doubt"
        }
      ]
    },
    {
      "id": "section_other_points",
      "title": "Other Points",
      "fields": [
        {
          "id": "other_points_details",
          "label": "Additional points or notes",
          "type": "textarea",
          "required": false
        }
      ]
    }
    // Note: This form appears purely informational/guidance. No signatures or specific checklist inputs are indicated.
  ]
}
```



#### Chief Engineers Handover.json

```json
{
  "title": "Chief Engineer's Handover Checklist",
  "sections": [
    {
      "id": "section_header",
      "title": "Vessel Information",
      "fields": [
        {
          "id": "ship_name",
          "label": "Ship",
          "type": "text",
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call Sign",
          "type": "text",
          "required": false
        },
        {
          "id": "inmo_no",
          "label": "INMO No",
          "type": "text",
          "required": false
        }
        // Handover participants (Outgoing/Incoming) likely handled by task assignment/user context
      ]
    },
    {
      "id": "section_checklist",
      "title": "Handover Items Checklist",
      "description": "Description of items handed over and accepted. Both Chief Engineers are to tick each section. Any items found un-acceptable to be marked with an “X” and remarks made for reasons.",
      "type": "checklist_group",
      "items": [
        {
          "id": "chk_engine_logbook",
          "label": "Engine room log book (up to date with correct entries, etc)"
        },
        {
          "id": "chk_oil_record_book",
          "label": "Oil record book (up to date with correct entries, etc)"
        },
        {
          "id": "chk_company_manuals",
          "label": "Company manuals and instructions (location)"
        },
        {
          "id": "chk_company_forms",
          "label": "Company forms (location of blanks, instructions, completed forms)"
        },
        {
          "id": "chk_bunker_robs",
          "label": "Bunker ROBS agreed and any immediate requirements advised. Typical consumptions advised."
        },
        {
          "id": "chk_luboil_robs",
          "label": "Lub oil ROBS agreed and any immediate requirements advised. Typical consumptions advised."
        },
        {
          "id": "chk_main_engine_status",
          "label": "Main engine status and operation"
        },
        {
          "id": "chk_aux_engine_status",
          "label": "Auxiliary engine status and operation"
        },
        {
          "id": "chk_boilers_aux_status",
          "label": "Boilers, auxiliary machinery, critical components, status and operation"
        },
        {
          "id": "chk_class_survey_status",
          "label": "Classification survey status including any overdue or imminent items"
        },
        {
          "id": "chk_major_works",
          "label": "Any major works in hand or imminent"
        },
        {
          "id": "chk_outstanding_spares",
          "label": "Status of any outstanding spares and stores that are on order or will be needed imminently"
        },
        {
          "id": "chk_passwords_keys",
          "label": "Passwords for computer, location of keys for safe, CO2, etc."
        },
        {
          "id": "chk_other_items",
          "label": "Any other items"
        }
      ],
      "columns": [
        {
          "id": "outgoing_status",
          "label": "Outgoing Ch.Eng (Tick/X)",
          "type": "radio",
          "options": ["Tick", "X"],
          "required": true
        },
        {
          "id": "incoming_status",
          "label": "Incoming Ch.Eng (Tick/X)",
          "type": "radio",
          "options": ["Tick", "X"],
          "required": true
        }
      ]
    },
    {
      "id": "section_remarks",
      "title": "Remarks",
      "fields": [
        {
          "id": "unacceptable_remarks",
          "label": "Remarks regarding any items found unacceptable and marked with “X”",
          "type": "textarea",
          "required": false // Required only if any 'X' is selected
        }
      ]
    },
    {
      "id": "section_signatures",
      "title": "Signatures",
      "fields": [
        {
          "id": "outgoing_ce_signature", // Assuming Master/CE refers to Outgoing CE here
          "label": "Outgoing Chief Engineer (Signature / Name / Date)",
          "type": "signature_block",
          "required": true
        },
        {
          "id": "incoming_ce_signature", // Assuming DPA refers to Incoming CE here, based on context
          "label": "Incoming Chief Engineer (Signature / Name / Date)",
          "type": "signature_block",
          "required": true
        }
      ]
    }
  ]
}
```



#### Chief Engineers Monthly Report Form.json

```json
{
  "title": "Chief Engineers Monthly Report Form",
  "sections": [
    {
      "id": "section_header",
      "title": "Report Header",
      "fields": [
        {
          "id": "yacht_name",
          "label": "YACHT",
          "type": "text",
          "required": true
        },
        {
          "id": "report_month",
          "label": "REPORT MONTH",
          "type": "month", // Assuming month/year input
          "required": true
        },
        {
          "id": "completed_date",
          "label": "COMPLETED DATE",
          "type": "date",
          "required": true
        }
      ]
    },
    {
      "id": "section_general_ops",
      "title": "GENERAL OPERATIONAL DETAILS",
      "fields": [
        {
          "id": "current_location",
          "label": "Current Location",
          "type": "text",
          "required": false
        },
        {
          "id": "summary_activities",
          "label": "Summary of Activities",
          "type": "textarea",
          "required": false
        },
        {
          "id": "future_activities",
          "label": "Future Activities",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_main_propulsion",
      "title": "MAIN PROPULSION ENGINES AND GEAR BOXES",
      "fields": [
        {
          "id": "main_hours_prt",
          "label": "Current Operating Hours: PRT",
          "type": "number",
          "required": false
        },
        {
          "id": "main_hours_stbd",
          "label": "Current Operating Hours: STBD",
          "type": "number",
          "required": false
        },
        {
          "id": "main_general_condition",
          "label": "General Condition",
          "type": "textarea",
          "required": false
        },
        {
          "id": "main_planned_maintenance",
          "label": "Planned Maintenance Conducted (enter details or attach report)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "main_unplanned_maintenance",
          "label": "Unplanned Maintenance Conducted (enter details or attach report)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_generators",
      "title": "GENERATORS AND POWER MANAGEMENT EQUIPMENT",
      "fields": [
        {
          "id": "gen_hours_1",
          "label": "Current Operating Hours: Number 1",
          "type": "number",
          "required": false
        },
        {
          "id": "gen_hours_2",
          "label": "Current Operating Hours: Number 2",
          "type": "number",
          "required": false
        },
        {
          "id": "gen_hours_3",
          "label": "Current Operating Hours: Number 3",
          "type": "number",
          "required": false
        },
        {
          "id": "gen_general_condition",
          "label": "General Condition",
          "type": "textarea",
          "required": false
        },
        {
          "id": "gen_planned_maintenance",
          "label": "Planned Maintenance Conducted (enter details or attach report)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "gen_unplanned_maintenance",
          "label": "Unplanned Maintenance Conducted (enter details or attach report)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "emergency_gen_hours",
          "label": "Emergency Power Generator Operating Hours",
          "type": "number",
          "required": false
        }
      ]
    },
    {
      "id": "section_controls_steering",
      "title": "CONTROLS AND STEERING",
      "fields": [
        {
          "id": "controls_bridge_wing",
          "label": "BRIDGE And Wing Controls (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "steering_principle_emergency",
          "label": "Principle And Emergency Steering Gear (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_bridge_nav",
      "title": "BRIDGE AND NAVIGATION EQUIPMENT",
      "fields": [
        {
          "id": "bridge_nav_notes",
          "label": "Including AutoPilot, Plotter, GPS, Radar, Depth Sounder, Navigation Lights, AIS (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_fire_bilge",
      "title": "FIRE FIGHTING EQUIPT AND BILGE PUMPING",
      "fields": [
        {
          "id": "fire_bilge_pumps",
          "label": "Fire And Bilge Pumps (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "fire_sprinkler_fixed",
          "label": "Sprinkler or Fixed System (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "fire_smoke_sensors",
          "label": "Fire / Smoke Sensors (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "fire_bilge_alarms",
          "label": "Bilge Alarms (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "fire_emergency_pump",
          "label": "Emergency Pump (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "fire_watertight_doors",
          "label": "Watertight / Fire Doors And Openings (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_lsa",
      "title": "LIFE SAVING EQUIPMENT",
      "fields": [
        {
          "id": "lsa_davits_cranes",
          "label": "Davits And Cranes (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "lsa_rescue_boat",
          "label": "Rescue Boat (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_auxiliary",
      "title": "ADDITIONAL AUXILLARY EQUIPMENT",
      "fields": [
        {
          "id": "aux_hydraulics_pneumatics",
          "label": "Hydraulics And Pneumatics (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "aux_electrical_electronics",
          "label": "Electrical And Electronics (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "aux_pumps_plumbing",
          "label": "Pumps And Plumbing (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "aux_tenders_toys_other",
          "label": "Tenders And Toys And Other (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_other_maintenance",
      "title": "OTHER NON CRITICAL EQUIPMENT MAINTENANCE",
      "fields": [
        {
          "id": "other_maintenance_details",
          "label": "Maintenance done this month (with reason)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_compliance_spares",
      "title": "Compliance and Spares",
      "fields": [
        {
          "id": "oil_record_book_maintained",
          "label": "OIL RECORD BOOK MAINTAINED AS PER MARPOL AND COMPLETED PAGES SIGNED BY MASTER",
          "type": "radio",
          "options": ["Yes", "No", "N/A"],
          "required": false
        },
        {
          "id": "spares_replaced",
          "label": "HAVE SPARES PARTS, CONSUMABLES ,COMPONENTS USED BEEN REPLACED?",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": false
        },
        {
          "id": "spares_reason_not_replaced",
          "label": "If NO, specify reason",
          "type": "textarea",
          "required": false,
          "condition": {
            "field": "spares_replaced",
            "value": "No"
          }
        }
      ]
    },
    {
      "id": "section_defect_reports",
      "title": "DEFECT REPORTS (NUMBER OF REPORTS, INCLUDING NEW, OUTSTANDING AND CLOSED)",
      "fields": [
        {
          "id": "defects_new",
          "label": "NEW",
          "type": "number",
          "required": false
        },
        {
          "id": "defects_ongoing",
          "label": "ONGOING",
          "type": "number",
          "required": false
        },
        {
          "id": "defects_closed",
          "label": "CLOSED",
          "type": "number",
          "required": false
        },
        {
          "id": "essential_equip_failure_reported",
          "label": "Attention! Essential Equipment Failure is required to be reported to flag. Confirm Flag Has Been Informed.",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": false
        }
      ]
    },
    {
      "id": "section_additional_comments",
      "title": "ADDITIONAL COMMENTS",
      "fields": [
        {
          "id": "additional_comments",
          "label": "Additional Comments",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_signatures",
      "title": "Signatures",
      "fields": [
        {
          "id": "chief_engineer_signature",
          "label": "Completed By (Chief Engineer Signature / Name / Date)",
          "type": "signature_block",
          "required": true
        },
        {
          "id": "dpa_signature",
          "label": "DPA Signature (Signature / Name / Date)",
          "type": "signature_block",
          "required": false // Office use
        }
      ]
    }
  ]
}
```



#### Collision Report.json

```json
{
  "title": "EM04 - Grounding/Collision Report", // Title based on filename and internal title
  "sections": [
    {
      "id": "section_incident_details",
      "title": "Incident Details",
      "fields": [
        {
          "id": "vessel_name",
          "label": "Vessel name",
          "type": "text",
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call sign",
          "type": "text",
          "required": false
        },
        {
          "id": "incident_date",
          "label": "Date of incident",
          "type": "date",
          "required": true
        },
        {
          "id": "incident_time",
          "label": "Time",
          "type": "time",
          "required": true
        },
        {
          "id": "incident_location",
          "label": "Location",
          "type": "text",
          "required": true
        },
        {
          "id": "weather_conditions",
          "label": "Weather",
          "type": "text",
          "required": false
        },
        {
          "id": "incident_type",
          "label": "Type of incident (Grounding/Collision)",
          "type": "select",
          "options": ["Grounding", "Collision", "Other"],
          "required": true
        },
        {
          "id": "persons_involved",
          "label": "Persons involved",
          "type": "textarea",
          "required": false
        },
        {
          "id": "injuries_sustained",
          "label": "Injuries sustained",
          "type": "textarea",
          "required": false
        },
        {
          "id": "damage_to_vessel",
          "label": "Damage to vessel",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_general_checklist",
      "title": "General Emergency Actions Checklist",
      "type": "checklist",
      "items": [
        {"id": "chk_sound_alarm", "label": "Sound Emergency Alarm"},
        {"id": "chk_assess_damage", "label": "Assess damage"},
        {"id": "chk_muster_passengers", "label": "Passengers Mustered"},
        {"id": "chk_don_lifejackets", "label": "All persons not involved in tackling incident to don lifejackets"},
        {"id": "chk_start_bilge_pumps", "label": "Start bilge pumps"},
        {"id": "chk_minimise_pollution", "label": "Minimise Pollution – Deploy pollution control kit if required"},
        {"id": "chk_identify_safe_haven", "label": "Identify nearest safe haven or landing point"},
        {"id": "chk_request_assistance", "label": "Request assistance from nearby vessels"},
        {"id": "chk_display_lights_shapes", "label": "Display lights and shapes"},
        {"id": "chk_ready_liferafts", "label": "Ready liferafts for deployment"},
        {"id": "chk_initiate_pan_mayday", "label": "Initiate PAN PAN or MAYDAY"}
      ]
    },
    {
      "id": "section_grounding_specifics",
      "title": "Specific Actions (Grounding)",
      "condition": { // Show only if incident type is Grounding
        "field": "incident_type",
        "value": "Grounding"
      },
      "fields": [
        {
          "id": "grounding_remaining_aground",
          "label": "Remaining Aground Considerations (State of tide, Ballast/fuel transfer, Ground tackle, External assistance, Transfer passengers)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "grounding_before_refloating",
          "label": "Before Refloating Actions (Assess damage/stability, Repair/isolate damage, Test engines/intakes/filters, Formulate plan, Agree procedures/comms)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "grounding_after_refloating",
          "label": "After Refloating Actions (Reassess damage/stability, Test engines/intakes/filters, Assess seaworthiness, Clear tackle, Contact insurers/authorities)",
          "type": "textarea",
          "required": false
        }
      ]
    }
    // Note: No specific section for Collision actions was detailed in the provided text.
    // Signatures might be handled by the task completion workflow rather than specific fields here.
  ]
}
```



#### Crew Familiarisation Form.json

```json
{
  "title": "Crew Familiarization Safety Form",
  "sections": [
    {
      "id": "section_header",
      "title": "Form Details",
      "fields": [
        {
          "id": "port",
          "label": "Port",
          "type": "text",
          "required": false
        },
        {
          "id": "date_last_updated",
          "label": "Date last updated",
          "type": "date",
          "required": false
        }
      ]
    },
    {
      "id": "section_personal_info",
      "title": "Personal Information",
      "fields": [
        {
          "id": "vessel_name",
          "label": "Vessel",
          "type": "text",
          "required": true
        },
        {
          "id": "crew_member_name",
          "label": "Crew member name",
          "type": "user_select", // Assuming selection of the crew member
          "required": true
        },
        {
          "id": "crew_position",
          "label": "Position",
          "type": "text",
          "required": false
        },
        {
          "id": "stcw_qualifications",
          "label": "STCW Qualifications",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_knowledge_checklist",
      "title": "Crew Knowledge Checklist",
      "description": "All crewmembers on joining the vessel should be shown the vessel layout, the location of essential Emergency Equipment, and have their emergency assignments identified and explained to them.",
      "type": "checklist_group",
      "items": [
        {
          "id": "chk_understands_duties",
          "label": "Understands Duties"
        },
        {
          "id": "chk_knows_station_bill",
          "label": "Knows location of Station Bill"
        },
        {
          "id": "chk_knows_muster_escape",
          "label": "Knows Muster and Emergency station location and emergency escape routes"
        },
        {
          "id": "chk_knows_life_jacket",
          "label": "Knows location of personal life jacket"
        },
        {
          "id": "chk_understands_drug_policy",
          "label": "Understands Drug and Alcohol policy"
        },
        {
          "id": "chk_knows_lsa_solas",
          "label": "Knows location of life saving equipment and knows SOLAS training manual"
        },
        {
          "id": "chk_knows_ffe",
          "label": "Knows location of Firefighting equipment"
        },
        {
          "id": "chk_read_ism_manual",
          "label": "Crew member has read and understood the ISM Manual (Safety Management Manual)"
        },
        {
          "id": "chk_familiar_masters_orders",
          "label": "Familiarized in Master's standing Orders"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks (Required if No)",
          "type": "textarea",
          "required": false // Conditionally required
        }
      ]
    },
    {
      "id": "section_alarm_signals_checklist",
      "title": "Alarm Signals Recognition",
      "type": "checklist_group",
      "items": [
        {
          "id": "chk_alarm_man_overboard",
          "label": "Man Overboard"
        },
        {
          "id": "chk_alarm_general",
          "label": "General Alarm"
        },
        {
          "id": "chk_alarm_fire",
          "label": "Fire Alarm"
        },
        {
          "id": "chk_alarm_abandon_ship",
          "label": "Abandon ship"
        },
        {
          "id": "chk_principles_ism",
          "label": "Principles of ISM"
        },
        {
          "id": "chk_code_safe_working",
          "label": "Code of Safe Working Practices"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Recognized",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks (Required if No)",
          "type": "textarea",
          "required": false // Conditionally required
        }
      ]
    },
    {
      "id": "section_signatures",
      "title": "Signatures",
      "fields": [
        {
          "id": "crew_member_signature",
          "label": "Crew Member Signature & Date",
          "type": "signature_block",
          "required": true
        },
        {
          "id": "training_officer_signature",
          "label": "Training Officer Signature & Date",
          "type": "signature_block",
          "required": true
        }
      ]
    }
  ]
}
```



#### Damage Report.json

```json
{
  "title": "Damage Report",
  "sections": [
    {
      "id": "section_header",
      "title": "Report Identification",
      "fields": [
        {
          "id": "ship_name",
          "label": "Ship",
          "type": "text",
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call Sign",
          "type": "text",
          "required": false
        },
        {
          "id": "inmo_no",
          "label": "INMO No",
          "type": "text",
          "required": false
        },
        {
          "id": "report_number",
          "label": "Report Number",
          "type": "text", // Could be auto-generated
          "required": false
        }
      ]
    },
    {
      "id": "section_event_details",
      "title": "Event Details",
      "fields": [
        {
          "id": "event_date",
          "label": "Date of event",
          "type": "date",
          "required": true
        },
        {
          "id": "event_time",
          "label": "Time of event",
          "type": "time",
          "required": true
        },
        {
          "id": "vessel_position",
          "label": "Position",
          "type": "text", // Could use specific lat/lon fields
          "required": false
        },
        {
          "id": "vessel_course",
          "label": "Course",
          "type": "number",
          "step": "any",
          "required": false
        },
        {
          "id": "vessel_speed",
          "label": "Speed (Knots)",
          "type": "number",
          "step": "any",
          "required": false
        },
        {
          "id": "weather_sea_condition",
          "label": "Weather and sea condition",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_damage_type",
      "title": "Type of Damage",
      "fields": [
        {
          "id": "vessel_damage_flag",
          "label": "Vessel damage",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "vessel_damage_nature",
          "label": "Nature of damage (Vessel)",
          "type": "textarea",
          "required": false,
          "condition": {
            "field": "vessel_damage_flag",
            "value": "Yes"
          }
        },
        {
          "id": "cargo_damage_flag",
          "label": "Cargo damage",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "cargo_damage_description",
          "label": "Cargo description (Damaged)",
          "type": "textarea",
          "required": false,
          "condition": {
            "field": "cargo_damage_flag",
            "value": "Yes"
          }
        },
        {
          "id": "equipment_damage_flag",
          "label": "Equipment damage",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "equipment_damage_description",
          "label": "Equipment description (Damaged)",
          "type": "textarea",
          "required": false,
          "condition": {
            "field": "equipment_damage_flag",
            "value": "Yes"
          }
        }
      ]
    },
    {
      "id": "section_attachments",
      "title": "Attachments",
      "fields": [
        {
          "id": "attach_photos",
          "label": "Photos",
          "type": "file_upload",
          "multiple": true,
          "required": false
        },
        {
          "id": "attach_log_abstract",
          "label": "Log Abstract",
          "type": "file_upload",
          "multiple": false,
          "required": false
        },
        {
          "id": "attach_other",
          "label": "Other Attachments",
          "type": "file_upload",
          "multiple": true,
          "required": false
        },
        {
          "id": "attach_other_specify",
          "label": "Specify Other Attachments",
          "type": "textarea",
          "required": false,
          "condition": {
            "field": "attach_other", // Condition based on if 'other' files are uploaded
            "operator": "exists"
          }
        }
      ]
    },
    {
      "id": "section_details_report",
      "title": "Details to Report",
      "fields": [
        {
          "id": "report_details",
          "label": "Details",
          "type": "textarea",
          "required": true
        }
      ]
    },
    {
      "id": "section_signatures",
      "title": "Signatures",
      "fields": [
        {
          "id": "master_ce_signature",
          "label": "Master / Chief Engineer (Signature / Name / Date)",
          "type": "signature_block",
          "required": true
        },
        {
          "id": "dpa_signature",
          "label": "DPA (Signature / Name / Date)",
          "type": "signature_block",
          "required": false // Office use
        }
      ]
    }
  ]
}
```



#### Defect Report.json

```json
{
  "title": "Defect and Repair Advice", // Title based on PDF content
  "sections": [
    {
      "id": "section_header",
      "title": "Report Identification",
      "fields": [
        {
          "id": "vessel_name",
          "label": "Vessel",
          "type": "text",
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call Sign",
          "type": "text",
          "required": false
        },
        {
          "id": "inmo_no",
          "label": "INMO No",
          "type": "text",
          "required": false
        },
        {
          "id": "report_no",
          "label": "Report No.",
          "type": "text", // Could be auto-generated
          "required": false
        },
        {
          "id": "report_date", // Assuming this is the date the report is created
          "label": "Date",
          "type": "date",
          "required": true
        }
      ]
    },
    {
      "id": "section_defect_details",
      "title": "Defect Details",
      "fields": [
        {
          "id": "item_name",
          "label": "Item",
          "type": "text",
          "required": true
        },
        {
          "id": "item_location",
          "label": "Location",
          "type": "text",
          "required": false
        },
        {
          "id": "item_description",
          "label": "Description",
          "type": "textarea",
          "required": true
        }
      ]
    },
    {
      "id": "section_repair_details",
      "title": "Repair Details",
      "fields": [
        {
          "id": "repair_by",
          "label": "To be done by",
          "type": "radio",
          "options": ["Ship's staff", "Shore side", "Dry dock"],
          "required": true
        },
        {
          "id": "po_related",
          "label": "Is there a PO relating to this item?",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "po_number",
          "label": "PO Number",
          "type": "text",
          "required": false,
          "condition": {
            "field": "po_related",
            "value": "Yes"
          }
        },
        {
          "id": "needs_landing",
          "label": "Does item need to be landed for repair?",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "lr_number",
          "label": "LR Number (Landing Receipt?)",
          "type": "text",
          "required": false,
          "condition": {
            "field": "needs_landing",
            "value": "Yes"
          }
        }
      ]
    },
    {
      "id": "section_dates",
      "title": "Dates",
      "fields": [
        {
          "id": "date_raised",
          "label": "Raised",
          "type": "date",
          "required": true
        },
        {
          "id": "date_required_by",
          "label": "Required by",
          "type": "date",
          "required": false
        },
        {
          "id": "date_completed",
          "label": "Completed",
          "type": "date",
          "required": false
        }
      ]
    },
    {
      "id": "section_signatures",
      "title": "Signatures",
      "fields": [
        {
          "id": "master_signature", // Assuming Master or relevant dept head raises it
          "label": "Requested by (Master/Dept Head Signature / Name / Date)",
          "type": "signature_block",
          "required": true
        },
        {
          "id": "dpa_signature",
          "label": "DPA (Signature / Name / Date)",
          "type": "signature_block",
          "required": false // Office use
        }
      ]
    }
  ]
}
```



#### Drill Form.json

```json
{
  "title": "Drill Form", // Could be more specific based on drill type
  "sections": [
    {
      "id": "section_general_info",
      "title": "Report General Information",
      "fields": [
        {
          "id": "vessel_name",
          "label": "Vessel name",
          "type": "text",
          "required": true,
          "defaultValue": "Quinta Essentia" // Pre-filled based on PDF
        },
        {
          "id": "reporting_by",
          "label": "Reporting By",
          "type": "user_select",
          "required": true
        },
        {
          "id": "drill_date",
          "label": "Date",
          "type": "date",
          "required": true
        },
        {
          "id": "drill_time",
          "label": "Time",
          "type": "time",
          "required": true
        },
        {
          "id": "non_standard_drill", // Added based on PDF title area
          "label": "Non Standard Drill?",
          "type": "checkbox",
          "required": false
        },
        {
          "id": "crew_missing",
          "label": "List name of Crew missing from Drill",
          "type": "textarea",
          "required": false
        },
        {
          "id": "recorded_in_matrix",
          "label": "Drill Recorded in Drill Matrix",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        }
      ]
    },
    {
      "id": "section_drill_details",
      "title": "Drill Details",
      "fields": [
        {
          "id": "drill_description",
          "label": "Description of Drill(s)",
          "type": "textarea",
          "required": true
        },
        {
          "id": "drill_notes_observations",
          "label": "Notes, Observations",
          "type": "textarea",
          "required": false
        },
        {
          "id": "drill_discrepancies",
          "label": "Discrepancies",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_signature",
      "title": "Signature",
      "fields": [
        {
          "id": "reporter_signature", // Assuming the reporter signs
          "label": "Signature & Date",
          "type": "signature_block",
          "required": true
        }
      ]
    }
  ]
}
```



#### EM01 - Drugs Stowaways and Contraband Checklist.json

```json
{
  "title": "EM01 - Drugs Stowaways and Contraband Checklist",
  "sections": [
    {
      "id": "section_header",
      "title": "Report Header",
      "fields": [
        {
          "id": "ship_name",
          "label": "Ship",
          "type": "text",
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call Sign",
          "type": "text",
          "required": false
        },
        {
          "id": "inmo_no",
          "label": "INMO No",
          "type": "text",
          "required": false
        },
        {
          "id": "voyage_no",
          "label": "Voyage No.",
          "type": "text",
          "required": false
        },
        {
          "id": "report_date",
          "label": "Date",
          "type": "date",
          "required": true
        },
        {
          "id": "port_departure",
          "label": "Port of departure",
          "type": "text",
          "required": false
        },
        {
          "id": "next_port_call",
          "label": "Next port of call",
          "type": "text",
          "required": false
        }
      ]
    },
    {
      "id": "section_deck_dept",
      "title": "Deck Department Checklist",
      "type": "checklist_group",
      "items": [
        {"id": "deck_forecastle", "label": "Forecastle Space"},
        {"id": "deck_bridge", "label": "Bridge"},
        {"id": "deck_radio_room", "label": "Radio Room"},
        {"id": "deck_funnel", "label": "Funnel"},
        {"id": "deck_lifeboats", "label": "Lifeboats"},
        {"id": "deck_paint_store_lockers", "label": "Paint and Store Lockers"},
        {"id": "deck_cargo_control_room", "label": "Cargo Control Room"},
        {"id": "deck_life_jacket_lockers", "label": "Life Jacket Lockers"},
        {"id": "deck_ship_offices", "label": "Ship's Office(s)"},
        {"id": "deck_officer_ratings_quarters", "label": "Officer and Ratings Quarters"},
        {"id": "deck_hospital_medical_locker", "label": "Hospital and Medical Locker"},
        {"id": "deck_gymnasium", "label": "Gymnasium"},
        {"id": "deck_alleyways", "label": "Alleyways"},
        {"id": "deck_rope_store", "label": "Rope Store"},
        {"id": "deck_laundry_room", "label": "Laundry Room"},
        {"id": "deck_tanks_void_spaces", "label": "Tanks and Void Spaces"},
        {"id": "deck_storage_rooms", "label": "Storage Rooms"}
      ],
      "columns": [
        {
          "id": "checked_initials",
          "label": "Checked (Initials)",
          "type": "text",
          "required": false // Required per item checked
        },
        {
          "id": "remarks",
          "label": "Remarks",
          "type": "textarea",
          "required": false
        }
      ],
      "fields": [ // Fields specific to this section
        {
          "id": "deck_reporting_officer",
          "label": "Reporting Officer (Deck)",
          "type": "user_select",
          "required": true
        },
        {
          "id": "deck_datetime_checked",
          "label": "Date and Time Checked (Deck)",
          "type": "datetime",
          "required": true
        }
      ]
    },
    {
      "id": "section_engine_dept",
      "title": "Engine Department Checklist",
      "type": "checklist_group",
      "items": [
        {"id": "eng_bilges", "label": "Bilges"},
        {"id": "eng_shaft_alley", "label": "Shaft Alley"},
        {"id": "eng_control_room", "label": "Control Room"},
        {"id": "eng_steering_gear_room", "label": "Steering Gear Room"},
        {"id": "eng_tanks_void_spaces", "label": "Tanks and Void Spaces"},
        {"id": "eng_stores_lockers", "label": "Stores Lockers"},
        {"id": "eng_machinery_spaces", "label": "Machinery Spaces"},
        {"id": "eng_emergency_gen_room", "label": "Emergency Generator Room"}
      ],
      "columns": [
        {
          "id": "checked_initials",
          "label": "Checked (Initials)",
          "type": "text",
          "required": false
        },
        {
          "id": "remarks",
          "label": "Remarks",
          "type": "textarea",
          "required": false
        }
      ],
      "fields": [
        {
          "id": "eng_reporting_officer",
          "label": "Reporting Officer (Engine)",
          "type": "user_select",
          "required": true
        },
        {
          "id": "eng_datetime_checked",
          "label": "Date and Time Checked (Engine)",
          "type": "datetime",
          "required": true
        }
      ]
    },
    {
      "id": "section_accomodation",
      "title": "Accomodation Spaces Checklist",
      "type": "checklist_group",
      "items": [
        {"id": "acc_galley", "label": "Galley"},
        {"id": "acc_dining_smoking_rooms", "label": "Dining and Smoking Rooms"},
        {"id": "acc_pantries", "label": "Pantries"},
        {"id": "acc_bonded_stores_lockers", "label": "Bonded Stores Lockers"},
        {"id": "acc_linen_storage_lockers", "label": "Linen and Storage Lockers"},
        {"id": "acc_refrigerators", "label": "Refrigerators"},
        {"id": "acc_food_storage_compartments", "label": "Food Storage Compartments"},
        {"id": "acc_butchers_space", "label": "Butcher's Space"}
      ],
      "columns": [
        {
          "id": "checked_initials",
          "label": "Checked (Initials)",
          "type": "text",
          "required": false
        },
        {
          "id": "remarks",
          "label": "Remarks",
          "type": "textarea",
          "required": false
        }
      ],
      "fields": [
        {
          "id": "acc_reporting_officer",
          "label": "Reporting Officer (Accomodation)",
          "type": "user_select",
          "required": true
        },
        {
          "id": "acc_datetime_checked",
          "label": "Date and Time Checked (Accomodation)",
          "type": "datetime",
          "required": true
        }
      ]
    }
    // Note: No overall signature block in the PDF text, signatures are per section.
  ]
}
```



#### EM02 - Emergency Broadcast.json

```json
{
  "title": "EM02 - Emergency Broadcast",
  "sections": [
    {
      "id": "section_incident_details",
      "title": "Incident Details (For Broadcast Log)",
      "fields": [
        {
          "id": "vessel_name",
          "label": "Vessel name",
          "type": "text",
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call sign",
          "type": "text",
          "required": false
        },
        {
          "id": "incident_date",
          "label": "Date of incident",
          "type": "date",
          "required": true
        },
        {
          "id": "incident_time",
          "label": "Time",
          "type": "time",
          "required": true
        },
        {
          "id": "incident_location",
          "label": "Location",
          "type": "text",
          "required": true
        },
        {
          "id": "weather_conditions",
          "label": "Weather",
          "type": "text",
          "required": false
        },
        {
          "id": "incident_type",
          "label": "Type of incident",
          "type": "text", // Free text for incident description
          "required": true
        },
        {
          "id": "persons_involved",
          "label": "Persons involved",
          "type": "textarea",
          "required": false
        },
        {
          "id": "injuries_sustained",
          "label": "Injuries sustained",
          "type": "textarea",
          "required": false
        },
        {
          "id": "damage_to_vessel",
          "label": "Damage to vessel",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_pan_pan_template",
      "title": "PAN PAN Broadcast Template",
      "fields": [
        {
          "id": "pan_pan_info",
          "type": "markdown", // Display template as informational text
          "content": "**Sample PAN PAN message:**\n\n*   Pan Pan, Pan Pan, Pan Pan\n*   All stations x3 OR Specific Coastguard x 3 OR Specific Coast Station x 3\n*   This is [NAME OF VESSEL] x 3\n*   Call Sign [CALL SIGN] x 3\n*   In position [Lat…….Long……… OR by reference to known point]\n*   I require [Type of assistance]\n*   We have [Number] Persons on board and [Any further information].\n*   Over"
        }
      ]
    },
    {
      "id": "section_mayday_template",
      "title": "MAYDAY Broadcast Template",
      "fields": [
        {
          "id": "mayday_info",
          "type": "markdown", // Display template as informational text
          "content": "**Sample MAYDAY message:**\n\n*   MAYDAY, MAYDAY, MAYDAY\n*   All stations x3 OR Specific Coastguard x 3 OR Specific Coast Station x 3\n*   This is [NAME OF VESSEL] x 3\n*   Call Sign [CALL SIGN] x 3\n*   In position [Lat…….Long……… OR by reference to known point]\n*   I require [Type of assistance]\n*   We have [Number] Persons on board and [Any further information].\n*   Over"
        }
      ]
    }
    // Note: This form is primarily informational/template based on the PDF content.
    // No signature block present in the text.
  ]
}
```



#### EM03 - Flooding Report.json

```json
{
  "title": "EM03 - Flooding Report",
  "sections": [
    {
      "id": "section_incident_details",
      "title": "Incident Details",
      "fields": [
        {
          "id": "vessel_name",
          "label": "Vessel name",
          "type": "text",
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call sign",
          "type": "text",
          "required": false
        },
        {
          "id": "incident_date",
          "label": "Date of incident",
          "type": "date",
          "required": true
        },
        {
          "id": "incident_time",
          "label": "Time",
          "type": "time",
          "required": true
        },
        {
          "id": "incident_location",
          "label": "Location",
          "type": "text",
          "required": true
        },
        {
          "id": "weather_conditions",
          "label": "Weather",
          "type": "text",
          "required": false
        },
        {
          "id": "incident_type",
          "label": "Type of incident (Flooding)",
          "type": "text",
          "defaultValue": "Flooding",
          "readOnly": true,
          "required": true
        },
        {
          "id": "persons_involved",
          "label": "Persons involved",
          "type": "textarea",
          "required": false
        },
        {
          "id": "injuries_sustained",
          "label": "Injuries sustained",
          "type": "textarea",
          "required": false
        },
        {
          "id": "damage_to_vessel",
          "label": "Damage to vessel",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_general_checklist",
      "title": "General Emergency Actions Checklist",
      "type": "checklist",
      "items": [
        {"id": "chk_sea_swell_position", "label": "Sea/swell state – position vessel head to wind?"},
        {"id": "chk_close_openings", "label": "Close watertight doors, deadlights, hatches and all openings"},
        {"id": "chk_sound_alarm", "label": "Sound emergency alarm"},
        {"id": "chk_start_bilge_pumps", "label": "Start bilge pumps"},
        {"id": "chk_ready_emergency_pump", "label": "Ready emergency bilge pump"},
        {"id": "chk_remove_non_essential_crew", "label": "Remove non essential crew away from the damaged area"},
        {"id": "chk_muster_passengers", "label": "Passengers mustered and counted"},
        {"id": "chk_don_lifejackets", "label": "All persons not involved in response to don lifejackets"},
        {"id": "chk_assess_damage_stability", "label": "Assess damage paying particular attention to stability"},
        {"id": "chk_identify_safe_haven", "label": "Identify nearest safe haven or landing point"},
        {"id": "chk_request_assistance", "label": "Request assistance from nearby vessels"},
        {"id": "chk_ready_liferafts", "label": "Ready liferafts for deployment"},
        {"id": "chk_initiate_pan_mayday", "label": "Initiate PAN PAN or MAYDAY"}
      ]
    },
    {
      "id": "section_specific_incidents",
      "title": "Specific Incident Considerations",
      "fields": [
        {
          "id": "ingress_engine_room_notes",
          "label": "Ingress in engine room (Will pumps start? Can pumps cope? Extra pumping available? Is stability affected?)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "ingress_hull_notes",
          "label": "Ingress from hull outside engine room (Locate ingress, Isolate space, Can pumps cope? Extra pumping available? Is stability affected?)",
          "type": "textarea",
          "required": false
        }
      ]
    }
    // Note: No signature block present in the PDF text for this emergency checklist.
  ]
}
```



#### EM05 - Main Propulsion Failure.json

```json
{
  "title": "EM05 - Main Propulsion Failure",
  "sections": [
    {
      "id": "section_incident_details",
      "title": "Incident Details",
      "fields": [
        {
          "id": "vessel_name",
          "label": "Vessel name",
          "type": "text",
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call sign",
          "type": "text",
          "required": false
        },
        {
          "id": "incident_date",
          "label": "Date of incident",
          "type": "date",
          "required": true
        },
        {
          "id": "incident_time",
          "label": "Time",
          "type": "time",
          "required": true
        },
        {
          "id": "incident_location",
          "label": "Location",
          "type": "text",
          "required": true
        },
        {
          "id": "weather_conditions",
          "label": "Weather",
          "type": "text",
          "required": false
        },
        {
          "id": "incident_type",
          "label": "Type of incident (Main Propulsion Failure)",
          "type": "text",
          "defaultValue": "Main Propulsion Failure",
          "readOnly": true,
          "required": true
        },
        {
          "id": "persons_involved",
          "label": "Persons involved",
          "type": "textarea",
          "required": false
        },
        {
          "id": "injuries_sustained",
          "label": "Injuries sustained",
          "type": "textarea",
          "required": false
        },
        {
          "id": "damage_to_vessel",
          "label": "Damage to vessel",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_general_checklist",
      "title": "General Considerations Checklist",
      "type": "checklist",
      "items": [
        {"id": "chk_can_manoeuvre", "label": "Can the vessel be manoeuvred"},
        {"id": "chk_identify_anchorage_haven", "label": "Identify nearest anchorages or safe haven"},
        {"id": "chk_request_assistance", "label": "Request assistance from nearby vessels"},
        {"id": "chk_determine_repairs_insitu", "label": "Determine if repairs can be made in-situ"},
        {"id": "chk_prepare_tow", "label": "Prepare tow if required"}
      ]
    }
    // Note: No signature block present in the PDF text for this emergency checklist.
  ]
}
```



#### EM06 - Medical Emergency.json

```json
{
  "title": "EM06 - Medical Emergency",
  "sections": [
    {
      "id": "section_incident_details",
      "title": "Incident Details",
      "fields": [
        {
          "id": "vessel_name",
          "label": "Vessel name",
          "type": "text",
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call sign",
          "type": "text",
          "required": false
        },
        {
          "id": "incident_date",
          "label": "Date of incident",
          "type": "date",
          "required": true
        },
        {
          "id": "incident_time",
          "label": "Time",
          "type": "time",
          "required": true
        },
        {
          "id": "incident_location",
          "label": "Location",
          "type": "text",
          "required": true
        },
        {
          "id": "weather_conditions",
          "label": "Weather",
          "type": "text",
          "required": false
        },
        {
          "id": "incident_type",
          "label": "Type of incident (Medical Emergency)",
          "type": "text",
          "defaultValue": "Medical Emergency",
          "readOnly": true,
          "required": true
        },
        {
          "id": "persons_involved",
          "label": "Persons involved",
          "type": "textarea",
          "required": true // Important for medical emergency
        },
        {
          "id": "injuries_sustained",
          "label": "Injuries sustained / Symptoms", // Clarified label
          "type": "textarea",
          "required": true
        },
        {
          "id": "damage_to_vessel", // Seems less relevant here, but included as per PDF
          "label": "Damage to vessel",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_general_checklist",
      "title": "General Considerations Checklist",
      "type": "checklist",
      "items": [
        {"id": "chk_administer_first_aid", "label": "Administer First Aid"},
        {"id": "chk_seek_radio_medical_advice", "label": "Seek radio medical advice"},
        {"id": "chk_identify_landing_point", "label": "Identify nearest landing point accessible by ambulance"},
        {"id": "chk_determine_assistance_required", "label": "Determine what assistance required"},
        {"id": "chk_contact_emergency_services", "label": "Contact emergency services"}
      ]
    }
    // Note: No signature block present in the PDF text for this emergency checklist.
  ]
}
```



#### EM07 - Man Overboard Discovery.json

```json
{
  "title": "EM07 - Man Overboard Discovery",
  "sections": [
    {
      "id": "section_general_info",
      "title": "Report General Information",
      "fields": [
        {
          "id": "vessel_name",
          "label": "Vessel name",
          "type": "text",
          "required": true
        },
        {
          "id": "reporting_by",
          "label": "Reporting By",
          "type": "user_select",
          "required": true
        },
        {
          "id": "discovery_date",
          "label": "Date",
          "type": "date",
          "required": true
        },
        {
          "id": "discovery_time",
          "label": "Time",
          "type": "time",
          "required": true
        }
      ]
    },
    {
      "id": "section_immediate_actions",
      "title": "Immediate Actions Checklist",
      "type": "checklist",
      "items": [
        {"id": "chk_oow_notified", "label": "Officer on watch notified"},
        {"id": "chk_drop_lights_buoys", "label": "Drop Lights, buoys, floatation device"},
        {"id": "chk_mob_key_gps", "label": "MOB key Punched on GPS"},
        {"id": "chk_sound_rescue_boat_signal", "label": "Sound Rescue Boat Signal"},
        {"id": "chk_oic_keeping_watch", "label": "Officer In charge keeping watch pointing at the victim"},
        {"id": "chk_engines_stopped_slowed", "label": "Engines stopped, slowed and turn around to location of man overboard"},
        {"id": "chk_location_time_noted", "label": "Location and time noted"},
        {"id": "chk_sound_whistle_blasts", "label": "At least 6 short blasts sounded on the whistle"},
        {"id": "chk_notify_surrounding_ships", "label": "Surrounding ships notified"},
        {"id": "chk_hoist_oscar_flag_lights", "label": "By day the OSCAR flag is hoisted where it can be seen best. By night, two pulsating red lights arranged and displayed vertically"},
        {"id": "chk_deploy_retrieval_line", "label": "Deploy floatable retrieval line"},
        {"id": "chk_victim_back_on_boat", "label": "Victim back on boat"},
        {"id": "chk_decide_medical_attention", "label": "Decide if Victim needs medical attention, request medical assistance if needed."},
        {"id": "chk_report_injuries", "label": "Report any injuries"}
      ]
    },
    {
      "id": "section_notes",
      "title": "Notes",
      "fields": [
        {
          "id": "notes_comments",
          "label": "Notes, comments",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_signature",
      "title": "Signature",
      "fields": [
        {
          "id": "reporter_signature", // Assuming the reporter signs
          "label": "Signature, Name & Date",
          "type": "signature_block",
          "required": true
        }
      ]
    }
  ]
}
```



#### EM08 - Pollution Report.json

```json
{
  "title": "EM08 - Pollution Report",
  "sections": [
    {
      "id": "section_incident_details",
      "title": "Incident Details",
      "fields": [
        {
          "id": "vessel_name",
          "label": "Vessel name",
          "type": "text",
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call sign",
          "type": "text",
          "required": false
        },
        {
          "id": "incident_date",
          "label": "Date of incident",
          "type": "date",
          "required": true
        },
        {
          "id": "incident_time",
          "label": "Time",
          "type": "time",
          "required": true
        },
        {
          "id": "incident_location",
          "label": "Location",
          "type": "text",
          "required": true
        },
        {
          "id": "weather_conditions",
          "label": "Weather",
          "type": "text",
          "required": false
        },
        {
          "id": "incident_type",
          "label": "Type of incident (Pollution)",
          "type": "text",
          "defaultValue": "Pollution",
          "readOnly": true,
          "required": true
        },
        {
          "id": "persons_involved",
          "label": "Persons involved",
          "type": "textarea",
          "required": false
        },
        {
          "id": "injuries_sustained",
          "label": "Injuries sustained",
          "type": "textarea",
          "required": false
        },
        {
          "id": "damage_to_vessel",
          "label": "Damage to vessel",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_general_checklist",
      "title": "General Considerations Checklist",
      "type": "checklist",
      "items": [
        {"id": "chk_stop_source_close_valves", "label": "Stop source of spill and close all valves"},
        {"id": "chk_sound_alarm_activate_plan", "label": "Sound emergency alarm and activate response plan"},
        {"id": "chk_reduce_level_transfer", "label": "Reduce level of oil by transfer to empty/slack tanks"},
        {"id": "chk_pump_water_cushion", "label": "Pump water into tank to create water cushion to prevent further oil spill"},
        {"id": "chk_commence_cleanup_boom", "label": "Commence clean up procedures, deploy containment boom"},
        {"id": "chk_assess_fire_risks", "label": "Assess fire risks"},
        {"id": "chk_assess_weather_tide_effects", "label": "Assess weather and tide effects on spill"},
        {"id": "chk_make_initial_report_sopep", "label": "Make initial report as per Appendix 5 SOPEP"},
        {"id": "chk_complete_cleanup", "label": "Complete clean up"},
        {"id": "chk_follow_up_reports_sopep", "label": "Follow up reports as necessary as per Section 2.3 SOPEP"},
        {"id": "chk_contact_stakeholders", "label": "Contact Company/Owners/Insurers/Flag Administration"},
        {"id": "chk_take_photos_document", "label": "Take photographs and document steps taken to reduce pollution"}
      ]
    },
    {
      "id": "section_specific_incidents",
      "title": "Specific Incident Considerations",
      "fields": [
        {
          "id": "specific_collision_notes",
          "label": "Collision (Assess further damage/capsize/sinking, Check stability, Request assistance)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "specific_bunkering_notes",
          "label": "Bunkering (Stop operations, Check scuppers/freeing ports, Open other tank)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "specific_slops_discharge_notes",
          "label": "Discharge of Slops (Stop operations, Check scuppers/freeing ports)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "specific_garbage_notes",
          "label": "Garbage (Collect by tender)",
          "type": "textarea",
          "required": false
        }
      ]
    }
    // Note: No signature block present in the PDF text for this emergency checklist.
  ]
}
```



#### EM09 - Request for Medical Attention.json

```json
{
  "title": "EM09 - Request for Medical Attention",
  "sections": [
    {
      "id": "section_patient_details",
      "title": "Patient Details",
      "fields": [
        {
          "id": "ship_name",
          "label": "Ship",
          "type": "text",
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call Sign",
          "type": "text",
          "required": false
        },
        {
          "id": "inmo_no",
          "label": "INMO No",
          "type": "text",
          "required": false
        },
        {
          "id": "crew_name",
          "label": "Name of Crewmember",
          "type": "text", // Or user_select if crew list available
          "required": true
        },
        {
          "id": "crew_age",
          "label": "Age of Crewmember",
          "type": "number",
          "required": false
        },
        {
          "id": "crew_nationality",
          "label": "Nationality",
          "type": "text",
          "required": false
        },
        {
          "id": "request_date",
          "label": "Date (Request)",
          "type": "date",
          "required": true
        },
        {
          "id": "port",
          "label": "Port",
          "type": "text",
          "required": false
        },
        {
          "id": "agency",
          "label": "Agency",
          "type": "text",
          "required": false
        }
      ]
    },
    {
      "id": "section_master_request",
      "title": "Request from Master",
      "fields": [
        {
          "id": "symptoms_recorded",
          "label": "To the Doctor: Please examine the above patient who has symptoms as recorded",
          "type": "textarea",
          "required": true
        },
        {
          "id": "treatment_on_vessel",
          "label": "Treatment administered on vessel",
          "type": "textarea",
          "required": false
        },
        {
          "id": "master_signature",
          "label": "Master (Signature / Name / Date)",
          "type": "signature_block",
          "required": true
        }
      ]
    },
    {
      "id": "section_doctor_response",
      "title": "Response from Doctor",
      "fields": [
        {
          "id": "doctor_treatment_prescribed",
          "label": "Treatment given and medicines prescribed (attach medical documents as necessary)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "doctor_assessment",
          "label": "Assessment (Please tick appropriate box - one box only)",
          "type": "radio",
          "options": [
            "Fit for Duty",
            "Fit for limited / light duty",
            "Rest required",
            "Unfit for duty: to be hospitalized",
            "Unfit for duty: to be repatriated to hometown"
          ],
          "required": true
        },
        {
          "id": "limited_duty_days",
          "label": "Limited / light duty days",
          "type": "number",
          "required": false,
          "condition": {
            "field": "doctor_assessment",
            "value": "Fit for limited / light duty"
          }
        },
        {
          "id": "rest_required_days",
          "label": "Rest required for days",
          "type": "number",
          "required": false,
          "condition": {
            "field": "doctor_assessment",
            "value": "Rest required"
          }
        },
        {
          "id": "doctor_signature",
          "label": "Doctor (Signature / Name / Date)",
          "type": "signature_block",
          "required": true
        }
      ]
    },
    {
      "id": "section_office_use",
      "title": "Office Use Only",
      "fields": [
        {
          "id": "dpa_signature",
          "label": "DPA (Signature / Name / Date)",
          "type": "signature_block",
          "required": false
        }
      ]
    }
  ]
}
```



#### EM10 - Security Breach.json

```json
{
  "title": "EM10 - Security Breach",
  "sections": [
    {
      "id": "section_incident_details",
      "title": "Incident Details",
      "fields": [
        {
          "id": "vessel_name",
          "label": "Vessel name",
          "type": "text",
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call sign",
          "type": "text",
          "required": false
        },
        {
          "id": "incident_date",
          "label": "Date of incident",
          "type": "date",
          "required": true
        },
        {
          "id": "incident_time",
          "label": "Time",
          "type": "time",
          "required": true
        },
        {
          "id": "incident_location",
          "label": "Location",
          "type": "text",
          "required": true
        },
        {
          "id": "weather_conditions",
          "label": "Weather",
          "type": "text",
          "required": false
        },
        {
          "id": "incident_type",
          "label": "Type of incident (Security Breach)",
          "type": "text",
          "defaultValue": "Security Breach",
          "readOnly": true,
          "required": true
        },
        {
          "id": "persons_involved",
          "label": "Persons involved",
          "type": "textarea",
          "required": false
        },
        {
          "id": "injuries_sustained",
          "label": "Injuries sustained",
          "type": "textarea",
          "required": false
        },
        {
          "id": "damage_to_vessel",
          "label": "Damage to vessel",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_general_checklist",
      "title": "General Considerations Checklist",
      "type": "checklist",
      "items": [
        {"id": "chk_refer_ssp", "label": "Refer to Ship Security Plan"},
        {"id": "chk_activate_ssas", "label": "Activate covert Ships Security Alert alarm"},
        {"id": "chk_contact_shore_vessels_org", "label": "Contact shore - other vessels - security response organisation"},
        {"id": "chk_remove_non_essential_crew", "label": "Remove non essential crew away from incident if possible"},
        {"id": "chk_retreat_secure_area", "label": "Retreat to secure area if possible"},
        {"id": "chk_preserve_evidence", "label": "Preserve evidence"}
      ]
    }
    // Note: No signature block present in the PDF text for this emergency checklist.
  ]
}
```



#### EM11 - Steering Failure.json

```json
{
  "title": "EM11 - Steering Failure",
  "sections": [
    {
      "id": "section_incident_details",
      "title": "Incident Details",
      "fields": [
        {
          "id": "vessel_name",
          "label": "Vessel name",
          "type": "text",
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call sign",
          "type": "text",
          "required": false
        },
        {
          "id": "incident_date",
          "label": "Date of incident",
          "type": "date",
          "required": true
        },
        {
          "id": "incident_time",
          "label": "Time",
          "type": "time",
          "required": true
        },
        {
          "id": "incident_location",
          "label": "Location",
          "type": "text",
          "required": true
        },
        {
          "id": "weather_conditions",
          "label": "Weather",
          "type": "text",
          "required": false
        },
        {
          "id": "incident_type",
          "label": "Type of incident (Steering Failure)",
          "type": "text",
          "defaultValue": "Steering Failure",
          "readOnly": true,
          "required": true
        },
        {
          "id": "persons_involved",
          "label": "Persons involved",
          "type": "textarea",
          "required": false
        },
        {
          "id": "injuries_sustained",
          "label": "Injuries sustained",
          "type": "textarea",
          "required": false
        },
        {
          "id": "damage_to_vessel",
          "label": "Damage to vessel",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_general_checklist",
      "title": "General Considerations Checklist",
      "type": "checklist",
      "items": [
        {"id": "chk_determine_proximity_dangers", "label": "Determine proximity of traffic and navigational dangers"},
        {"id": "chk_determine_emergency_steering", "label": "Determine if emergency steering can be used"},
        {"id": "chk_determine_manoeuvre_engine", "label": "Determine if vessel can be manoeuvered on the engine"},
        {"id": "chk_request_assistance", "label": "Request assistance from nearby vessels if posible"},
        {"id": "chk_switch_on_nuc_lights", "label": "Switch on NUC lights"},
        {"id": "chk_identify_anchorage_haven", "label": "Identify nearest anchorages or safe havens"},
        {"id": "chk_make_anchor_ready", "label": "Make anchor ready"}
      ]
    }
    // Note: No signature block present in the PDF text for this emergency checklist.
  ]
}
```



#### EM12 - Stowaway Questionnaire.json

```json
{
  "title": "EM12 - Stowaway Questionnaire",
  "sections": [
    {
      "id": "section_yacht_port_info",
      "title": "Yacht / Port Information",
      "fields": [
        {
          "id": "yacht_name",
          "label": "Own Yacht Name",
          "type": "text",
          "defaultValue": "Quinta Essentia",
          "required": true
        },
        {
          "id": "yacht_imo_number",
          "label": "Own Yacht IMO Number",
          "type": "text",
          "required": false
        },
        {
          "id": "yacht_port_registry_flag",
          "label": "Own Yacht Port of Registry/Flag",
          "type": "text",
          "required": false
        },
        {
          "id": "interfacing_with_name",
          "label": "Interfacing with (Port / Port Facility / Other vessel Name)",
          "type": "text",
          "required": false
        },
        {
          "id": "interfacing_with_id",
          "label": "Interfacing with Identifying information (IMO No, address, etc)",
          "type": "text",
          "required": false
        },
        {
          "id": "interfacing_with_country_flag",
          "label": "Interfacing with Country/Flag",
          "type": "text",
          "required": false
        },
        {
          "id": "dos_valid_from",
          "label": "Declaration of Security Valid From",
          "type": "date",
          "required": false
        },
        {
          "id": "dos_valid_to",
          "label": "Declaration of Security Valid To",
          "type": "date",
          "required": false
        },
        {
          "id": "yacht_security_level",
          "label": "Own Yacht Security Level",
          "type": "text", // Could be select if levels are defined
          "required": false
        },
        {
          "id": "port_other_security_level",
          "label": "Port/Other Vessel Security Level",
          "type": "text",
          "required": false
        }
      ]
    },
    {
      "id": "section_personal_info",
      "title": "Personal Information",
      "fields": [
        {"id": "pi_01_surname", "label": "01 Surname", "type": "text", "required": false},
        {"id": "pi_02_first_name", "label": "02 First name", "type": "text", "required": false},
        {"id": "pi_03_other_name", "label": "03 Other name", "type": "text", "required": false},
        {"id": "pi_04_dob", "label": "04 Date of birth", "type": "date", "required": false},
        {"id": "pi_05_pob", "label": "05 Place of birth", "type": "text", "required": false},
        {"id": "pi_06_nationality", "label": "06 Nationality", "type": "text", "required": false},
        {"id": "pi_07_religion", "label": "07 Religion", "type": "text", "required": false},
        {"id": "pi_08_tribe", "label": "08 Tribe", "type": "text", "required": false},
        {"id": "pi_09_chief", "label": "09 Chief", "type": "text", "required": false},
        {"id": "pi_10_sub_chief", "label": "10 Sub-Chief", "type": "text", "required": false},
        {"id": "pi_11_passport_no", "label": "11 Passport No", "type": "text", "required": false},
        {"id": "pi_12_passport_issue_date", "label": "12 Passport issue date", "type": "date", "required": false},
        {"id": "pi_13_passport_issue_place", "label": "13 Passport issue place", "type": "text", "required": false},
        {"id": "pi_14_passport_issued_by", "label": "14 Passport issued by", "type": "text", "required": false},
        {"id": "pi_15_id_card_no", "label": "15 ID Card No.", "type": "text", "required": false},
        {"id": "pi_16_id_issue_date", "label": "16 ID issue date", "type": "date", "required": false},
        {"id": "pi_17_id_issue_place", "label": "17 ID issue place", "type": "text", "required": false},
        {"id": "pi_18_id_issued_by", "label": "18 ID issued by", "type": "text", "required": false},
        {"id": "pi_19_seaman_book_no", "label": "19 Seaman's Book No.", "type": "text", "required": false},
        {"id": "pi_20_sbook_issue_date", "label": "20 S. Book issue date", "type": "date", "required": false},
        {"id": "pi_21_sbook_issue_place", "label": "21 S. Book issue place", "type": "text", "required": false},
        {"id": "pi_22_sbook_issued_by", "label": "22 S. Book issued by", "type": "text", "required": false},
        {"id": "pi_23_emergency_passport_no", "label": "23 Emergency Passport No.", "type": "text", "required": false},
        {"id": "pi_24_epass_issue_date", "label": "24 E. Pass. issue date", "type": "date", "required": false},
        {"id": "pi_25_epass_issue_place", "label": "25 E. Pass. issue place", "type": "text", "required": false},
        {"id": "pi_26_epass_issued_by", "label": "26 E. Pass. issued by", "type": "text", "required": false}
      ]
    },
    {
      "id": "section_embark_land",
      "title": "Embarkation / Landing",
      "fields": [
        {"id": "el_27_when_embarked", "label": "27 When Embarked", "type": "datetime", "required": false},
        {"id": "el_28_where_embarked", "label": "28 Where embarked", "type": "text", "required": false},
        {"id": "el_29_when_landed", "label": "29 When Landed", "type": "datetime", "required": false},
        {"id": "el_30_where_landed", "label": "30 Where Landed", "type": "text", "required": false},
        {"id": "el_31_address", "label": "31 Address (House#, St, City, PO Box)", "type": "textarea", "required": false}
      ]
    },
    {
      "id": "section_physical",
      "title": "Physical Marks and Characteristics",
      "fields": [
        {"id": "ph_32_height", "label": "32 Height (cm)", "type": "number", "required": false},
        {"id": "ph_33_weight", "label": "33 Weight (kg)", "type": "number", "required": false},
        {"id": "ph_34_complexion", "label": "34 Complexion", "type": "text", "required": false},
        {"id": "ph_35_eye_color", "label": "35 Color of eyes", "type": "text", "required": false},
        {"id": "ph_36_hair_color", "label": "36 Hair color", "type": "text", "required": false},
        {"id": "ph_37_skin_color", "label": "37 Skin color", "type": "text", "required": false},
        {"id": "ph_38_marks", "label": "38 Marks (scars, tattoos)", "type": "textarea", "required": false}
      ]
    },
    {
      "id": "section_marital",
      "title": "Marital Status",
      "fields": [
        {"id": "ma_39_married", "label": "39 Married", "type": "radio", "options": ["Yes", "No"], "required": false},
        {"id": "ma_40_spouse_name", "label": "40 Name of spouse", "type": "text", "required": false, "condition": {"field": "ma_39_married", "value": "Yes"}},
        {"id": "ma_41_spouse_dob", "label": "41 Spouse's Date of Birth", "type": "date", "required": false, "condition": {"field": "ma_39_married", "value": "Yes"}},
        {"id": "ma_42_spouse_pob", "label": "42 Spouse's Place of Birth", "type": "text", "required": false, "condition": {"field": "ma_39_married", "value": "Yes"}},
        {"id": "ma_43_spouse_address", "label": "43 Spouse's Address", "type": "textarea", "required": false, "condition": {"field": "ma_39_married", "value": "Yes"}}
      ]
    },
    {
      "id": "section_children",
      "title": "Children",
      "fields": [
        {"id": "ch_44_children_details", "label": "44 Name / Date of birth / Place of birth", "type": "textarea", "required": false}
      ]
    },
    {
      "id": "section_parents",
      "title": "Parents",
      "fields": [
        {"id": "pa_45_father_surname", "label": "45 Father's surname", "type": "text", "required": false},
        {"id": "pa_46_father_firstname", "label": "46 Father's first name", "type": "text", "required": false},
        {"id": "pa_47_father_dob", "label": "47 Father's date of birth (age)", "type": "text", "required": false},
        {"id": "pa_48_father_pob", "label": "48 Father's Place of birth", "type": "text", "required": false},
        {"id": "pa_49_father_address", "label": "49 Father's address", "type": "textarea", "required": false},
        {"id": "pa_50_mother_surname", "label": "50 Mother's surname", "type": "text", "required": false},
        {"id": "pa_51_mother_firstname", "label": "51 Mother's firstname", "type": "text", "required": false},
        {"id": "pa_52_mother_dob", "label": "52 Mother's date of birth (age)", "type": "text", "required": false},
        {"id": "pa_53_mother_pob", "label": "53 Mother's place of birth", "type": "text", "required": false},
        {"id": "pa_54_mother_address", "label": "54 Mother's address", "type": "textarea", "required": false}
      ]
    },
    {
      "id": "section_siblings",
      "title": "Siblings",
      "fields": [
        {"id": "si_55_brothers", "label": "55 Brothers: Name / Date of birth/ Place of birth", "type": "textarea", "required": false},
        {"id": "si_56_sisters", "label": "56 Sisters: Name / Date of birth/ Place of birth", "type": "textarea", "required": false}
      ]
    },
    {
      "id": "section_other_relatives",
      "title": "Other Relatives",
      "fields": [
        {"id": "or_57_relatives_details", "label": "57 Relationship, names, date of birth, place of birth, address", "type": "textarea", "required": false}
      ]
    },
    {
      "id": "section_profession",
      "title": "Professional Career / Education",
      "fields": [
        {"id": "pr_58_professions", "label": "58 Profession(s)", "type": "text", "required": false},
        {"id": "pr_59_languages_spoken", "label": "59 Languages spoken", "type": "text", "required": false},
        {"id": "pr_60_languages_written", "label": "60 Languages written", "type": "text", "required": false},
        {"id": "pr_61_employers", "label": "61 Employer(s)", "type": "textarea", "required": false},
        {"id": "pr_62_school", "label": "62 School (name of school, address)", "type": "textarea", "required": false},
        {"id": "pr_63_headmaster", "label": "63 Headmaster", "type": "text", "required": false},
        {"id": "pr_64_teachers", "label": "64 Teachers", "type": "text", "required": false}
      ]
    },
    {
      "id": "section_other_info",
      "title": "Other Information",
      "fields": [
        {"id": "oi_65_reason_stowing", "label": "65 Reason for stowing away", "type": "textarea", "required": false},
        {"id": "oi_66_intention_repatriation", "label": "66 Intention (willing to be repatriated?)", "type": "radio", "options": ["Yes", "No", "Unsure"], "required": false},
        {"id": "oi_67_remarks_history", "label": "67 Remarks/History", "type": "textarea", "required": false}
      ]
    },
    {
      "id": "section_completion",
      "title": "Questionnaire Completion",
      "fields": [
        {
          "id": "completion_date",
          "label": "Date of completion of questionnaire",
          "type": "date",
          "required": true
        },
        {
          "id": "interviewer_name",
          "label": "Interviewer",
          "type": "user_select", // Or text
          "required": true
        }
      ]
    },
    {
      "id": "section_signatures",
      "title": "Signatures",
      "fields": [
        {
          "id": "yacht_signature_name",
          "label": "Agreed and signed for and on behalf of: The Yacht (Name)",
          "type": "text",
          "required": false
        },
        {
          "id": "yacht_signature_title",
          "label": "The Yacht (Title)",
          "type": "text",
          "required": false
        },
        {
          "id": "port_signature_name",
          "label": "Agreed and signed for and on behalf of: The Port facility / other vessel (Name)",
          "type": "text",
          "required": false
        },
        {
          "id": "port_signature_title",
          "label": "The Port facility / other vessel (Title)",
          "type": "text",
          "required": false
        },
        {
          "id": "signature_location",
          "label": "At",
          "type": "text",
          "required": false
        },
        {
          "id": "signature_date",
          "label": "On date",
          "type": "date",
          "required": false
        }
        // Actual signatures might be handled differently (e.g., digital signature block)
      ]
    },
    {
      "id": "section_contact_details",
      "title": "Contact Details",
      "fields": [
        {"id": "contact_yacht_general", "label": "Yacht (General Contact)", "type": "text", "required": false},
        {"id": "contact_yacht_master", "label": "Yacht Master", "type": "text", "required": false},
        {"id": "contact_yacht_sso", "label": "Yacht SSO", "type": "text", "required": false},
        {"id": "contact_yacht_company", "label": "Yacht Company", "type": "text", "required": false},
        {"id": "contact_port_general", "label": "Port / other vessel (General Contact)", "type": "text", "required": false},
        {"id": "contact_port_master_pfso", "label": "Port Facility / Master / PFSO / SSO", "type": "text", "required": false},
        {"id": "contact_port_cso", "label": "CSO", "type": "text", "required": false}
      ]
    }
  ]
}
```



#### EM13 - Violent Act.json

```json
{
  "title": "EM13 - Violent Act",
  "description": "Safety Management System - Emergency Checklist for Violent Act",
  "sections": [
    {
      "id": "section_incident_details",
      "title": "Incident Details",
      "fields": [
        {
          "id": "vessel_name",
          "label": "Vessel name",
          "type": "text",
          "defaultValue": "Quinta Essentia", // Assuming default
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call sign",
          "type": "text",
          "required": false
        },
        {
          "id": "incident_date",
          "label": "Date of incident",
          "type": "date",
          "required": true
        },
        {
          "id": "incident_time",
          "label": "Time",
          "type": "time",
          "required": true
        },
        {
          "id": "incident_location",
          "label": "Location",
          "type": "text",
          "required": true
        },
        {
          "id": "weather_conditions",
          "label": "Weather",
          "type": "text",
          "required": false
        },
        {
          "id": "type_of_incident",
          "label": "Type of incident",
          "type": "textarea",
          "required": true
        },
        {
          "id": "persons_involved",
          "label": "Persons involved",
          "type": "textarea", // Or multi-user select
          "required": false
        },
        {
          "id": "injuries_sustained",
          "label": "Injuries sustained",
          "type": "textarea",
          "required": false
        },
        {
          "id": "damage_to_vessel",
          "label": "Damage to vessel",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_general_considerations",
      "title": "General Considerations",
      "fields": [
        {
          "id": "general_considerations_list",
          "label": "Actions to Consider",
          "type": "markdown",
          "content": "*   Attempt to diffuse incident if safely possible\n*   Remove non essential crew from incident if possible\n*   Retreat to secure area if possible\n*   Preserve evidence"
        }
        // Note: These are guidelines, not checklist items requiring input in the PDF.
      ]
    }
    // Note: No signature blocks present in the PDF text.
  ]
}
```



#### EM14 ISPS - Annual Security Exercise.json

```json
{
  "title": "EM14 ISPS - Annual Security Exercise",
  "description": "Placeholder for the Annual ISPS Security Exercise form. The provided PDF content was minimal.",
  "sections": [
    {
      "id": "section_placeholder",
      "title": "Exercise Details",
      "fields": [
        {
          "id": "exercise_date",
          "label": "Date of Exercise",
          "type": "date",
          "required": false
        },
        {
          "id": "exercise_scenario",
          "label": "Exercise Scenario / Description",
          "type": "textarea",
          "required": false
        },
        {
          "id": "participants",
          "label": "Participants",
          "type": "textarea",
          "required": false
        },
        {
          "id": "observations",
          "label": "Observations / Lessons Learned",
          "type": "textarea",
          "required": false
        }
        // Add more fields as needed based on actual form requirements
      ]
    }
  ]
}
```



#### Engine Room Watch Changover.json

```json
{
  "title": "Changing Engine Room Watch",
  "description": "Safety Management System - Checklist for changing the engine room watch.",
  "sections": [
    {
      "id": "section_header_info",
      "title": "Vessel Information",
      "fields": [
        {
          "id": "ship_name",
          "label": "Ship",
          "type": "text",
          "defaultValue": "Quinta Essentia", // Assuming default
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call Sign",
          "type": "text",
          "required": false
        },
        {
          "id": "imo_no",
          "label": "INMO No", // Typo in PDF? Should be IMO No?
          "type": "text",
          "required": false
        }
        // Note: Date/Time of changeover not explicitly asked for, but might be needed.
      ]
    },
    {
      "id": "section_changeover_checklist",
      "title": "Items to Check",
      "description": "When changing over the watch relieving Officer should personally satisfy themselves regarding the following:",
      "type": "checklist_group",
      "items": [
        {"id": "chk_standing_orders", "label": "Standing orders and other special instructions of the Chief Engineer relating to operation of the main and auxiliary equipment"},
        {"id": "chk_tank_status", "label": "Status of all tanks"},
        {"id": "chk_internal_transfers", "label": "Internal transfers of bunkers / water / lube. Oil in operation (where practical all such operations should be completed and pipes/valves returned to normal before handing over)"},
        {"id": "chk_external_bunkering", "label": "External bunkering operations"},
        {"id": "chk_running_machinery_op", "label": "Operation of all running machinery"},
        {"id": "chk_standby_machinery_readiness", "label": "Readiness of all stand-by machinery"},
        {"id": "chk_bilge_status", "label": "Status of bilges and associated equipment"},
        {"id": "chk_vessel_location_special_areas", "label": "Location of vessel with regard to special areas, etc."},
        {"id": "chk_boiler_water_levels", "label": "Boiler water levels"},
        {"id": "chk_defects_alarms_previous_watch", "label": "Any defects/alarms that occurred during the previous watch"},
        {"id": "chk_cargo_ops_services", "label": "Any cargo operations that are in hand requiring engine room supplied services"},
        {"id": "chk_expected_eta_etd", "label": "Expected ETA / ETD"},
        {"id": "chk_maintenance_in_progress", "label": "Any maintenance works that are in progress"},
        {"id": "chk_logbooks_completed", "label": "Log books completed and signed"}
      ],
      "columns": [
        {
          "id": "status",
          "label": "Checked",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks (if No)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_other_checks",
      "title": "Other Checks",
      "fields": [
        {
          "id": "other_checks_details",
          "label": "Details of other checks performed",
          "type": "textarea",
          "required": false
        }
      ]
    }
    // Note: No signature blocks present in the PDF text for this checklist.
  ]
}
```



#### Familiarization Bridge Watchkeeper.json

```json
{
  "title": "Bridge Watchkeeper Familiarization",
  "description": "Safety Management System - Bridge Watchkeeper Familiarization",
  "sections": [
    {
      "id": "section_header_info",
      "title": "Seafarer and Vessel Information",
      "fields": [
        {
          "id": "ship_name",
          "label": "Ship",
          "type": "text",
          "defaultValue": "Quinta Essentia", // Assuming default
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call Sign",
          "type": "text",
          "required": false
        },
        {
          "id": "imo_no",
          "label": "INMO No", // Typo in PDF? Should be IMO No?
          "type": "text",
          "required": false
        },
        {
          "id": "seafarer_name",
          "label": "Seafarer's Name",
          "type": "user_select", // Or text
          "required": true
        },
        {
          "id": "seafarer_position",
          "label": "Position",
          "type": "text",
          "required": true
        },
        {
          "id": "place_of_joining",
          "label": "Place of Joining",
          "type": "text",
          "required": false
        },
        {
          "id": "date_of_joining",
          "label": "Date of Joining",
          "type": "date",
          "required": true
        }
      ]
    },
    {
      "id": "section_familiarization_checklist",
      "title": "Familiarization Checklist",
      "description": "Has the operation of the following equipment been studied and fully understood?",
      "type": "checklist_group",
      "items": [
        {"id": "fam_bridge_deck_lighting", "label": "Bridge and deck lighting Emergency arrangements in the event of main power failure"},
        {"id": "fam_nav_signal_lights", "label": "Navigation and signal lights, including Searchlights, signaling lamp, morse light"},
        {"id": "fam_sound_signaling", "label": "Sound signaling apparatus, including Whistles, Fog bell and gong system"},
        {"id": "fam_safety_equipment_lsa", "label": "Safety equipment, including LSA equipment including pyrotechnics, EPIRB and SART"},
        {"id": "fam_general_fire_alarm", "label": "General and fire alarm signaling arrangements"},
        {"id": "fam_emergency_pump_vent_wt", "label": "Emergency pump, ventilation and water tight door controls"},
        {"id": "fam_internal_comms", "label": "Internal ship communications facilities, including Portable radios Emergency 'battery-less' phone system Public address system"},
        {"id": "fam_alarm_systems_bridge", "label": "Alarm systems on bridge"},
        {"id": "fam_bridge_fire_detection", "label": "Bridge fire detection panel"},
        {"id": "fam_electronic_nav_systems", "label": "Electronic Navigational position fixing systems"},
        {"id": "fam_gyro_magnetic_compass", "label": "Gyro compass/repeaters, Magnetic compass, Off course alarm"},
        {"id": "fam_radar_arpa", "label": "Radar including ARPA"},
        {"id": "fam_echo_sounder", "label": "Echo sounder"},
        {"id": "fam_speed_distance_recorder", "label": "Speed/distance recorder"},
        {"id": "fam_engine_thruster_controls", "label": "Engine and thruster controls"},
        {"id": "fam_steering_gear", "label": "Steering gear, including manual, auto pilot and emergency changeover and testing arrangements"},
        {"id": "fam_ancillary_bridge_equipment", "label": "Location and operation of ancillary bridge equipment (e.g. Binoculars, signaling flags, meteorological equipment)"},
        {"id": "fam_stowage_charts_pubs", "label": "Stowage of charts and publications"}
      ],
      "columns": [
        {
          "id": "completion_date",
          "label": "Date of Completion",
          "type": "date",
          "required": false // Required per item?
        }
        // Note: The PDF layout implies a single date per item, not a Yes/No checkbox.
      ]
    },
    {
      "id": "section_signatures",
      "title": "Signatures",
      "fields": [
        {
          "id": "seafarer_signature",
          "label": "On-Signing Seafarer signature and name",
          "type": "signature_block",
          "required": true
        },
        {
          "id": "requested_by_signature",
          "label": "Requested by (Master)",
          "type": "signature_block",
          "required": false
        },
        {
          "id": "office_use_signature",
          "label": "Office use only (DPA)",
          "type": "signature_block",
          "required": false
        }
      ]
    }
  ]
}
```



#### Familiarization Engine Watchkeeper.json

```json
{
  "title": "Engine Watchkeeper Familiarization",
  "description": "Safety Management System - Engine Watchkeeper Familiarization",
  "sections": [
    {
      "id": "section_header_info",
      "title": "Seafarer and Vessel Information",
      "fields": [
        {
          "id": "ship_name",
          "label": "Ship",
          "type": "text",
          "defaultValue": "Quinta Essentia", // Assuming default
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call Sign",
          "type": "text",
          "required": false
        },
        {
          "id": "imo_no",
          "label": "INMO No", // Typo in PDF? Should be IMO No?
          "type": "text",
          "required": false
        },
        {
          "id": "seafarer_name",
          "label": "Seafarer's Name",
          "type": "user_select", // Or text
          "required": true
        },
        {
          "id": "seafarer_position",
          "label": "Position",
          "type": "text",
          "required": true
        },
        {
          "id": "place_of_joining",
          "label": "Place of Joining",
          "type": "text",
          "required": false
        },
        {
          "id": "date_of_joining",
          "label": "Date of Joining",
          "type": "date",
          "required": true
        }
      ]
    },
    {
      "id": "section_familiarization_checklist",
      "title": "Familiarization Checklist",
      "description": "Has the operation of the following equipment been studied and fully understood?",
      "type": "checklist_group",
      "items": [
        {"id": "fam_main_propulsion", "label": "Main propulsion plant operation and manoeuvering"},
        {"id": "fam_emergency_system", "label": "Emergency System"},
        {"id": "fam_electrical_generation", "label": "Electrical generation plant operation"},
        {"id": "fam_emergency_generator_pumps", "label": "Emergency generator, fire pumps, compressor operation"},
        {"id": "fam_main_aux_emergency_stops", "label": "Main and auxiliary engine emergency stops"},
        {"id": "fam_steering_system", "label": "Steering system operation"},
        {"id": "fam_emergency_changeover", "label": "Emergency change over procedure"},
        {"id": "fam_fire_pumps_location", "label": "Location and operation of fire pumps"},
        {"id": "fam_emergency_fire_pump_location", "label": "Location and operation of emergency fire pump"},
        {"id": "fam_bilge_pumping_location", "label": "Location and operation of bilge pumping system"},
        {"id": "fam_emergency_bilge_pumping_location", "label": "Location and operation of emergency bilge pumping arrangement"},
        {"id": "fam_fuel_lub_emergency_stops", "label": "Fuel and lub oil pump emergency stops and quick closing valves"},
        {"id": "fam_fire_dampers", "label": "Fire dampers"},
        {"id": "fam_emergency_escape_routes", "label": "Emergency escape routes"},
        {"id": "fam_other_emergency_controls", "label": "Other emergency control systems and measures"},
        {"id": "fam_bunkering_arrangements", "label": "Bunkering arrangements and oil transfer procedures"},
        {"id": "fam_ows_location", "label": "Location and operation of Oily Water Separator"},
        {"id": "fam_msd_location", "label": "Location and operation of Marine Sanitation Device"},
        {"id": "fam_refrigeration_location", "label": "Location and operation of refrigeration equipment"},
        {"id": "fam_ac_location", "label": "Location and operation of air conditioning equipment"}
      ],
      "columns": [
        {
          "id": "completion_date",
          "label": "Date of Completion",
          "type": "date",
          "required": false // Required per item?
        }
        // Note: The PDF layout implies a single date per item, not a Yes/No checkbox.
      ]
    },
    {
      "id": "section_signatures",
      "title": "Signatures",
      "fields": [
        {
          "id": "seafarer_signature",
          "label": "On-Signing Seafarer signature and name",
          "type": "signature_block",
          "required": true
        },
        {
          "id": "requested_by_signature",
          "label": "Requested by (Master)",
          "type": "signature_block",
          "required": false
        },
        {
          "id": "office_use_signature",
          "label": "Office use only (DPA)",
          "type": "signature_block",
          "required": false
        }
      ]
    }
  ]
}
```



#### FFE Maintenance Records.json

```json
{
  "title": "FFE Maintenance Records",
  "description": "Safety Management System - FFE Maintenance Records. Records maintenance schedules over a two-year cycle.",
  "sections": [
    {
      "id": "section_header_info",
      "title": "Vessel Information",
      "fields": [
        {
          "id": "vessel_name",
          "label": "Vessel",
          "type": "text",
          "defaultValue": "Quinta Essentia", // Assuming default
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call Sign",
          "type": "text",
          "required": false
        },
        {
          "id": "imo_no",
          "label": "INMO No", // Typo in PDF? Should be IMO No?
          "type": "text",
          "required": false
        },
        {
          "id": "record_year",
          "label": "Year",
          "type": "number", // Year input
          "required": true
        }
      ]
    },
    {
      "id": "section_weekly_items",
      "title": "Weekly Items",
      "type": "maintenance_log_grid", // Custom type representing the monthly grid
      "description": "Insert the day of the month when maintenance is completed.",
      "items": [
        {"id": "wk_main_fire_pump", "label": "1 Main Fire Pump"},
        {"id": "wk_emergency_fire_pump", "label": "2 Emergency Fire Pump"},
        {"id": "wk_foam_pump", "label": "3 Foam Pump"},
        {"id": "wk_fire_hoses_boxes", "label": "4 Fire Hoses Boxes"},
        {"id": "wk_fire_flaps_dampers", "label": "5 Fire Flaps/Dampers"},
        {"id": "wk_emergency_diesel_alternator", "label": "6 Emergency Diesel Alternator"},
        {"id": "wk_galley_exhaust_trunking", "label": "7 Galley Exhaust and Trunking"}
      ],
      "columns": [ // Represents the months
        {"id": "jan", "label": "Jan"},
        {"id": "feb", "label": "Feb"},
        {"id": "mar", "label": "Mar"},
        {"id": "apr", "label": "Apr"},
        {"id": "may", "label": "May"},
        {"id": "jun", "label": "Jun"},
        {"id": "jul", "label": "Jul"},
        {"id": "aug", "label": "Aug"},
        {"id": "sep", "label": "Sep"},
        {"id": "oct", "label": "Oct"},
        {"id": "nov", "label": "Nov"},
        {"id": "dec", "label": "Dec"}
      ],
      "cell_input_type": "day_number", // Input type for each cell in the grid
      "additional_fields": [
        {
          "id": "weekly_remarks",
          "label": "Remarks",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_monthly_items",
      "title": "Monthly Items",
      "type": "maintenance_log_grid",
      "description": "Insert the day of the month when maintenance is completed.",
      "items": [
        {"id": "mo_emergency_hq", "label": "8 Emergency Headquarters"},
        {"id": "mo_suppl_equip_stations", "label": "9 Suppl. Equipment Stations/Spare"},
        {"id": "mo_resuscitation_apparatus", "label": "10 Resuscitation Apparatus"},
        {"id": "mo_safety_lamps", "label": "11 Safety Lamps"},
        {"id": "mo_oxygen_analyser", "label": "12 Oxygen Analyser"},
        {"id": "mo_portable_gas_detection", "label": "13 Portable Gas Detection Equipment"},
        {"id": "mo_rescue_harness_line", "label": "14 Rescue Harness and Line"},
        {"id": "mo_fire_foam_monitors", "label": "15 Fire/Foam Monitors"},
        {"id": "mo_firemain_isolating_valves", "label": "16 Firemain Isolating Valves"},
        {"id": "mo_foam_isolating_valves", "label": "17 Foam Isolating valves"},
        {"id": "mo_fire_extinguishers", "label": "18 Fire Extinguishers"},
        {"id": "mo_fire_flaps_dampers", "label": "19 Fire Flaps/Dampers"},
        {"id": "mo_alarm_co2", "label": "20 Alarm: CO2"}
      ],
      "columns": [ // Represents the months
        {"id": "jan", "label": "Jan"},
        {"id": "feb", "label": "Feb"},
        {"id": "mar", "label": "Mar"},
        {"id": "apr", "label": "Apr"},
        {"id": "may", "label": "May"},
        {"id": "jun", "label": "Jun"},
        {"id": "jul", "label": "Jul"},
        {"id": "aug", "label": "Aug"},
        {"id": "sep", "label": "Sep"},
        {"id": "oct", "label": "Oct"},
        {"id": "nov", "label": "Nov"},
        {"id": "dec", "label": "Dec"}
      ],
      "cell_input_type": "day_number",
      "additional_fields": [
        {
          "id": "monthly_remarks",
          "label": "Remarks",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_quarterly_items",
      "title": "Quarterly Items",
      "type": "maintenance_log_grid",
      "description": "Insert the day of the month when maintenance is completed.",
      "items": [
        {"id": "qu_sc_breathing_apparatus", "label": "21 S.C. Breathing Apparatus"},
        {"id": "qu_protective_clothing", "label": "22 Protective Clothing"},
        {"id": "qu_fire_hoses_nozzles", "label": "23 Fire Hoses and Nozzles"},
        {"id": "qu_fire_hydrants", "label": "24 Fire Hydrants"},
        {"id": "qu_foam_hose_boxes", "label": "25 Foam Hose and Boxes"},
        {"id": "qu_fixed_foam_installation", "label": "26 Fixed Foam Installation"},
        {"id": "qu_portable_fire_extinguishers", "label": "27 Portable Fire extinguishers"},
        {"id": "qu_emergency_bells_switches", "label": "28 Emergency Bells and Switches"},
        {"id": "qu_fire_door_wt_doors", "label": "29 Fire Door/Water Tight Doors"},
        {"id": "qu_fire_detection_equipment", "label": "30 Fire Detection Equipment"},
        {"id": "qu_em_stops_vent_fans", "label": "31 Em.Stops/Vent Fans"},
        {"id": "qu_funnel_dampers", "label": "32 Funnel Dampers"}
      ],
      "columns": [ // Represents the quarters within the year
        {"id": "q1", "label": "Jan-Mar"},
        {"id": "q2", "label": "Apr-Jun"},
        {"id": "q3", "label": "Jul-Sep"},
        {"id": "q4", "label": "Oct-Dec"}
      ],
      "cell_input_type": "day_number", // Or perhaps date?
      "additional_fields": [
        {
          "id": "quarterly_remarks",
          "label": "Remarks",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_six_monthly_items",
      "title": "Six Monthly Items",
      "type": "maintenance_log_grid",
      "description": "Insert the day of the month when maintenance is completed.",
      "items": [
        {"id": "sm_sc_breathing_apparatus", "label": "33 Self Contained Breathing Apparatus"},
        {"id": "sm_emergency_stops", "label": "34 Emergency Stops"},
        {"id": "sm_fire_blankets", "label": "35 Fire Blankets"},
        {"id": "sm_sand_boxes", "label": "36 Sand Boxes"},
        {"id": "sm_fixed_co2_system", "label": "37 Fixed CO2 System"}
      ],
      "columns": [ // Represents the six-month periods
        {"id": "h1", "label": "Jan-Jun"},
        {"id": "h2", "label": "Jul-Dec"}
      ],
      "cell_input_type": "day_number", // Or date?
      "additional_fields": [
        {
          "id": "six_monthly_remarks",
          "label": "Remarks",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_annual_items",
      "title": "Annual Items",
      "type": "maintenance_log_list",
      "items": [
        {"id": "an_portable_fire_extinguishers", "label": "38 Portable Fire Extinguishers"},
        {"id": "an_sc_air_breathing_apparatus", "label": "39 Self Contained Air Breathing Apparatus"},
        {"id": "an_compressed_air_oxygen_cylinders", "label": "40 Compressed Air / Oxygen B.A. Cylinders"},
        {"id": "an_fire_foam_hoses", "label": "41 Fire/Foam Hoses"}
      ],
      "fields_per_item": [
        {
          "id": "completion_details",
          "label": "Remarks/Description/Date Completed",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_biannual_items",
      "title": "Biannual Items",
      "type": "maintenance_log_list",
      "items": [
        {"id": "bi_fixed_co2_system", "label": "42 Fixed CO2 System"},
        {"id": "bi_foam_sample", "label": "43 Foam Sample"}
      ],
      "fields_per_item": [
        {
          "id": "completion_details",
          "label": "Remarks/Description/Date Completed",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_signatures",
      "title": "Signatures",
      "fields": [
        {
          "id": "requested_by_signature",
          "label": "Requested by (Master)",
          "type": "signature_block",
          "required": false
        },
        {
          "id": "office_use_signature",
          "label": "Office use only (DPA)",
          "type": "signature_block",
          "required": false
        }
      ]
    }
  ]
}
```



#### Form Change Request.json

```json
{
  "title": "Form Change Request",
  "description": "Document change requests can be made by any member of the vessel or shore staff. Changes by vessel staff should be addressed to the Master and shore management. Once approved, the changes will be forwarded to the DPA for review and authorisation. The document or form change will be administered and manuals amended accordingly.",
  "sections": [
    {
      "id": "section_request_details",
      "title": "Request Details",
      "fields": [
        {
          "id": "submission_date",
          "label": "Date of Submission to Master / Office",
          "type": "date",
          "required": true
        },
        {
          "id": "form_title_to_change",
          "label": "Form Title (to be changed)",
          "type": "text", // Could be a select dropdown listing existing forms
          "required": true
        },
        {
          "id": "change_requested",
          "label": "Change requested",
          "type": "textarea",
          "required": true
        },
        {
          "id": "reason_for_change",
          "label": "Reason for change",
          "type": "textarea",
          "required": true
        },
        {
          "id": "originator_name",
          "label": "Name of originator",
          "type": "user_select",
          "required": true
        }
      ]
    },
    {
      "id": "section_approval",
      "title": "Approval / Denial",
      "fields": [
        {
          "id": "approval_status",
          "label": "Status",
          "type": "radio",
          "options": ["Approved", "Denied"],
          "required": true
        },
        {
          "id": "reason_for_denial",
          "label": "Reason for denial",
          "type": "textarea",
          "required": true,
          "condition": {"field": "approval_status", "value": "Denied"}
        },
        {
          "id": "approval_comments",
          "label": "Comments",
          "type": "textarea",
          "required": false
        },
        {
          "id": "approver_signature",
          "label": "Signature (Master / Shore Mgmt / DPA)",
          "type": "signature_block",
          "required": true
        }
        // Note: The PDF shows two signature blocks, one for Approved and one for Denied.
        // It might be better to have one signature block for the approver and use the status field.
        // Alternatively, create two conditional signature blocks:
        // {
        //   "id": "approved_signature",
        //   "label": "Approved By Signature",
        //   "type": "signature_block",
        //   "required": true,
        //   "condition": {"field": "approval_status", "value": "Approved"}
        // },
        // {
        //   "id": "denied_signature",
        //   "label": "Denied By Signature",
        //   "type": "signature_block",
        //   "required": true,
        //   "condition": {"field": "approval_status", "value": "Denied"}
        // }
      ]
    }
  ]
}
```



#### Hazardous Work Safe Entry Form.json

```json
{
  "title": "Hazardous Work Safe Entry Form",
  "description": "Safety Management System - Hazardous Work Safe Entry Form",
  "sections": [
    {
      "id": "section_header_info",
      "title": "Work Details",
      "fields": [
        {
          "id": "ship_name",
          "label": "Ship",
          "type": "text",
          "defaultValue": "Quinta Essentia", // Assuming default
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call Sign",
          "type": "text",
          "required": false
        },
        {
          "id": "imo_no",
          "label": "INMO No", // Typo in PDF? Should be IMO No?
          "type": "text",
          "required": false
        },
        {
          "id": "work_description",
          "label": "Work to be done (Description)",
          "type": "textarea",
          "required": true
        },
        {
          "id": "work_location",
          "label": "Location (Designation of space, machinery etc)",
          "type": "text",
          "required": true
        },
        {
          "id": "crew_details",
          "label": "Crew Details (Names)",
          "type": "textarea", // Or multi-user select
          "required": true
        },
        {
          "id": "authorised_person_name",
          "label": "Authorized Person in Charge: Name",
          "type": "user_select",
          "required": true
        },
        {
          "id": "authorised_person_rank",
          "label": "Authorized Person in Charge: Rank",
          "type": "text",
          "required": false
        },
        {
          "id": "validity_start_datetime",
          "label": "Period of validity of permit: From",
          "type": "datetime",
          "required": true
        },
        {
          "id": "validity_end_datetime",
          "label": "Period of validity of permit: To (Not to exceed 24 hours)",
          "type": "datetime",
          "required": true
          // Add validation for 24hr duration
        }
      ]
    },
    {
      "id": "section_checklist_enclosed_space",
      "title": "Checklist: Entry into enclosed or confined spaces",
      "type": "checklist_group",
      "items": [
        {"id": "enc_space_ventilated", "label": "Space thoroughly ventilated"},
        {"id": "enc_atmosphere_tested_safe", "label": "Atmosphere tested and found safe"},
        {"id": "enc_rescue_equipment_available", "label": "Rescue/resuscitation equipment available at entrance"},
        {"id": "enc_responsible_person_attendance", "label": "Responsible in attendance at entrance"},
        {"id": "enc_communication_arranged", "label": "Communication arrangements made between person at entrance and those entering"},
        {"id": "enc_access_illumination_adequate", "label": "Access and illumination adequate"},
        {"id": "enc_equipment_approved_type", "label": "All equipment to be used is of approved type"},
        {"id": "enc_ba_familiarity_confirmed", "label": "When breathing apparatus is to be used: Familiarity of user with apparatus is confirmed"},
        {"id": "enc_ba_tested_satisfactory", "label": "When breathing apparatus is to be used: Apparatus has been tested and found satisfactory"}
      ],
      "columns": [
        {
          "id": "status",
          "label": "Checked",
          "type": "checkbox", // Assuming check means 'Yes'
          "required": false
        }
      ]
    },
    {
      "id": "section_checklist_machinery",
      "title": "Checklist: Machinery or equipment",
      "type": "checklist_group",
      "items": [
        {"id": "mach_removed_isolated", "label": "Removed from service/isolated from sources of power/heat"},
        {"id": "mach_personnel_informed", "label": "All relevant personnel informed"},
        {"id": "mach_warning_notices_displayed", "label": "Warning notices displayed"}
      ],
      "columns": [
        {
          "id": "status",
          "label": "Checked",
          "type": "checkbox",
          "required": false
        }
      ]
    },
    {
      "id": "section_checklist_hot_work_simple", // Simple checklist from first part
      "title": "Checklist: Hot Work (Initial)",
      "type": "checklist_group",
      "items": [
        {"id": "hot_area_clear_gas_free", "label": "Area clear of dangerous material and gas-free"},
        {"id": "hot_ventilation_adequate", "label": "Ventilation adequate"},
        {"id": "hot_equipment_good_order", "label": "Equipment in good order"},
        {"id": "hot_fire_appliances_good_order", "label": "Fire appliances in good order"}
      ],
      "columns": [
        {
          "id": "status",
          "label": "Checked",
          "type": "checkbox",
          "required": false
        }
      ]
    },
    {
      "id": "section_certificates_signatures",
      "title": "Certificates and Signatures",
      "fields": [
        {
          "id": "cert_checks_statement",
          "label": "Certificate of checks",
          "type": "markdown",
          "content": "I am satisfied that all precautions have been taken and that safety arrangements will be maintained for duration of the work."
        },
        {
          "id": "cert_checks_signature",
          "label": "Signature of Authorized Person in Charge (Checks)",
          "type": "signature_block",
          "required": true
        },
        {
          "id": "cert_completion_statement",
          "label": "Certificate of completion",
          "type": "markdown",
          "content": "The work has been completed and all persons under my supervision, material and equipment have been withdrawn."
        },
        {
          "id": "cert_completion_signature",
          "label": "Signature of Authorized Person in Charge (Completion)",
          "type": "signature_block",
          "required": false // Only required on completion
        }
      ]
    },
    // --- Sections below relate to the detailed Hot Work / Enclosed Space Permits at the end of the PDF --- 
    {
      "id": "section_hot_work_permit_detailed",
      "title": "Hot Work Permit (Detailed Section)",
      "description": "This permit relates to any work involving temperature conditions which are likely to be of sufficient intensity to cause ignition...",
      "fields": [
        {
          "id": "hot_permit_valid_from", "label": "Valid From", "type": "datetime", "required": false
        },
        {
          "id": "hot_permit_valid_to", "label": "Valid To", "type": "datetime", "required": false
        },
        {
          "id": "hot_permit_location", "label": "Location of hot work", "type": "text", "required": false
        },
        {
          "id": "hot_permit_enclosed_permit_issued", "label": "Has Enclosed Spaces Permit been issued?", "type": "radio", "options": ["YES", "NO"], "required": false
        },
        {
          "id": "hot_permit_enclosed_permit_reason_no", "label": "Reason if 'No'", "type": "textarea", "required": false, "condition": {"field": "hot_permit_enclosed_permit_issued", "value": "NO"}}
        ,
        {
          "id": "hot_permit_description", "label": "Description of hot work", "type": "textarea", "required": false
        },
        {
          "id": "hot_permit_person_carrying_out", "label": "Person carrying out hot work", "type": "user_select", "required": false
        },
        {
          "id": "hot_permit_person_responsible_work", "label": "Person responsible for hot work", "type": "user_select", "required": false
        },
        {
          "id": "hot_permit_person_responsible_safety", "label": "Person responsible for safety", "type": "user_select", "required": false
        }
      ]
    },
    {
      "id": "section_hot_work_permit_checks_1",
      "title": "Hot Work Permit - Section 1 Checks",
      "fields": [
        {
          "id": "hot_check1_gas_indicator", "label": "1.1 Has the hot work area been checked with a combustible gas indicator for hydrocarbon vapors?", "type": "radio", "options": ["YES", "NO"], "required": false
        },
        {
          "id": "hot_check1_gas_indicator_time", "label": "Time", "type": "time", "required": false, "condition": {"field": "hot_check1_gas_indicator", "value": "YES"}}
        ,
        {
          "id": "hot_check1_surrounding_safe", "label": "1.2 Has the surrounding area been made safe?", "type": "radio", "options": ["YES", "NO"], "required": false
        },
        {
          "id": "hot_check1_surrounding_safe_time", "label": "Time", "type": "time", "required": false, "condition": {"field": "hot_check1_surrounding_safe", "value": "YES"}}
        
      ]
    },
    {
      "id": "section_hot_work_permit_checks_2",
      "title": "Hot Work Permit - Section 2 Checks",
      "type": "checklist_group",
      "items": [
        {"id": "hot_check2_gas_indicator_work_area", "label": "2.1 Has the work area been checked with a combustible gas indicator for hydrocarbon vapors?"},
        {"id": "hot_check2_equipment_gas_freed", "label": "2.2 Has the equipment or pipeline been gas freed?"},
        {"id": "hot_check2_equipment_blanked", "label": "2.3 Has the equipment or pipeline been blanked?"},
        {"id": "hot_check2_equipment_free_liquid", "label": "2.4 Is this equipment or pipeline free of liquid?"},
        {"id": "hot_check2_equipment_isolated_electrically", "label": "2.5 Is the equipment isolated electrically?"},
        {"id": "hot_check2_surrounding_area_safe", "label": "2.6 Is the surrounding area safe?"},
        {"id": "hot_check2_fire_protection_available", "label": "2.7 Is additional fire protection available?"}
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["YES", "NO"],
          "required": false
        }
      ],
      "additional_fields": [
        {
          "id": "hot_check2_special_conditions", "label": "2.8 Special conditions/precautions", "type": "textarea", "required": false
        }
      ]
    },
    {
      "id": "section_hot_work_permit_signatures",
      "title": "Hot Work Permit - Signatures",
      "fields": [
        {
          "id": "hot_permit_proceed_statement", "label": "Proceed Statement", "type": "markdown", "content": "In the circumstances noted it is considered safe to proceed with this work."
        },
        {
          "id": "hot_permit_sig_resp_officer", "label": "Signed: Responsible Officer", "type": "signature_block", "required": false
        },
        {
          "id": "hot_permit_sig_team_leader", "label": "Signed: Person in charge of work team", "type": "signature_block", "required": false
        },
        {
          "id": "hot_permit_sig_master", "label": "Signed: Master", "type": "signature_block", "required": false
        }
      ]
    },
    {
      "id": "section_hot_work_permit_completion",
      "title": "Hot Work Permit - Section 3 Completion",
      "fields": [
        {
          "id": "hot_permit_completion_statement", "label": "Completion Statement", "type": "markdown", "content": "The work has been completed and all persons under my supervision, materials and equipment have been withdrawn."
        },
        {
          "id": "hot_permit_completion_sig_auth_person", "label": "Authorized person in charge", "type": "signature_block", "required": false
        }
      ]
    },
    // --- Enclosed Space Permit (Detailed Section) ---
    {
      "id": "section_enclosed_permit_detailed",
      "title": "Enclosed Space Entry Permit (Detailed Section)",
      "fields": [
        {
          "id": "enc_permit_location", "label": "Location/name of enclosed space", "type": "text", "required": false
        },
        {
          "id": "enc_permit_reason", "label": "Reason for entry", "type": "textarea", "required": false
        },
        {
          "id": "enc_permit_valid_from", "label": "Valid From", "type": "datetime", "required": false
        },
        {
          "id": "enc_permit_valid_to", "label": "Valid To (See note 1)", "type": "datetime", "required": false
        }
      ]
    },
    {
      "id": "section_enclosed_permit_checks_1",
      "title": "Enclosed Space Permit - Section 1 Pre-entry Preparation",
      "description": "(To be checked by the Master or responsible officer)",
      "type": "checklist_group",
      "items": [
        {"id": "enc_check1_space_segregated", "label": "Has the space been segregated by blanking off or securing all connecting pipelines?"},
        {"id": "enc_check1_valves_secured", "label": "Have valves on all pipelines serving the space been secured to prevent their accidental opening?"},
        {"id": "enc_check1_space_ventilated", "label": "Has the space been thoroughly ventilated?"},
        {"id": "enc_check1_space_cleaned", "label": "Has the space been cleaned?"},
        // Atmosphere tests are separate fields below
        {"id": "enc_check1_freq_checks_arranged", "label": "Have arrangements been made for frequent atmosphere checks to be made while the space is occupied and after work breaks?"},
        {"id": "enc_check1_illumination_adequate", "label": "Is adequate illumination provided?"},
        {"id": "enc_check1_rescue_equip_available", "label": "Is rescue and resuscitation equipment available for immediate use by the entrance to the space?"},
        {"id": "enc_check1_standby_person_designated", "label": "Has a responsible person been designated to stand by the entrance to the space?"},
        {"id": "enc_check1_oow_advised", "label": "Has the Officer of the Watch (bridge, engine room, cargo control room) been advised of the planned entry?"},
        {"id": "enc_check1_comm_system_tested", "label": "Has a system of communication between the person at the entrance and those entering the space been agreed and tested?"},
        {"id": "enc_check1_emergency_procedures_understood", "label": "Are emergency and evacuation procedures established and understood?"},
        {"id": "enc_check1_recording_system", "label": "Is there a system for recording who is in the space?"},
        {"id": "enc_check1_equipment_approved", "label": "Is all equipment used of an approved type?"}
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["YES", "NO"],
          "required": false
        }
      ],
      "additional_fields": [
        {
          "id": "enc_check1_atmo_oxygen", "label": "Pre-entry atmosphere tests: Oxygen % vol (21%)", "type": "number", "required": false
        },
        {
          "id": "enc_check1_atmo_hydrocarbon", "label": "Pre-entry atmosphere tests: Hydrocarbon % LFL (Less than 1%)", "type": "number", "required": false
        },
        {
          "id": "enc_check1_atmo_toxic_gas_type", "label": "Pre-entry atmosphere tests: Toxic Gas Type", "type": "text", "required": false
        },
        {
          "id": "enc_check1_atmo_toxic_gas_reading", "label": "Pre-entry atmosphere tests: Toxic Gas Reading ppm (% PEL)", "type": "number", "required": false
        }
      ]
    },
    {
      "id": "section_enclosed_permit_checks_2",
      "title": "Enclosed Space Permit - Section 2 Pre-entry Checks",
      "description": "(to be completed by the person authorized as leader of the team entering the space)",
      "fields": [
        {
          "id": "enc_check2_section1_complete", "label": "Section 1 of this permit has been completed fully", "type": "checkbox", "required": false
        },
        {
          "id": "enc_check2_aware_vacate", "label": "I am aware that the space must be vacated immediately in the event of ventilation failure or if the atmosphere tests change from agreed criteria", "type": "checkbox", "required": false
        },
        {
          "id": "enc_check2_comm_procedure_agreed", "label": "I have agreed the communication procedure", "type": "checkbox", "required": false
        },
        {
          "id": "enc_check2_reporting_interval", "label": "I have agreed the reporting interval", "type": "text", "required": false
        },
        {
          "id": "enc_check2_emergency_procedures_agreed", "label": "Emergency procedures have been agreed and are understood", "type": "checkbox", "required": false
        }
      ]
    },
    {
      "id": "section_enclosed_permit_signatures",
      "title": "Enclosed Space Permit - Signatures",
      "fields": [
        {
          "id": "enc_permit_sig_resp_officer", "label": "Signed: Responsible Officer", "type": "signature_block", "required": false
        },
        {
          "id": "enc_permit_sig_team_leader", "label": "Signed: Person authorized as leader of the team entering the space", "type": "signature_block", "required": false
        },
        {
          "id": "enc_permit_sig_standby_person", "label": "Signed: Person standing by", "type": "signature_block", "required": false
        }
      ]
    },
    {
      "id": "section_enclosed_permit_completion",
      "title": "Enclosed Space Permit - Section 3 Completion",
      "fields": [
        {
          "id": "enc_permit_completion_statement", "label": "Completion Statement", "type": "markdown", "content": "The work/inspection has been completed and all persons under my supervision, materials and equipment have been withdrawn."
        },
        {
          "id": "enc_permit_completion_sig_team_leader", "label": "Signed: Person authorized as leader of the team entering the space", "type": "signature_block", "required": false
        }
      ]
    }
  ]
}
```



#### Hot Work Notice.json

```json
{
  "title": "Hot Work Notice",
  "description": "To ensure an adequate level of safety and planning in the execution of hot work on board the ship.",
  "sections": [
    {
      "id": "section_notice_details",
      "title": "Notice Details",
      "fields": [
        {
          "id": "vessel_name",
          "label": "Vessel name",
          "type": "text",
          "defaultValue": "Quinta Essentia", // Assuming default
          "required": true
        },
        {
          "id": "notifying_company",
          "label": "Name of company notifying of Hot Work",
          "type": "text",
          "required": false
        },
        {
          "id": "notice_date",
          "label": "Date",
          "type": "date",
          "required": true
        },
        {
          "id": "notice_time",
          "label": "Time",
          "type": "time",
          "required": true
        },
        {
          "id": "location_of_work",
          "label": "Location of Work",
          "type": "text",
          "required": true
        },
        {
          "id": "person_in_charge",
          "label": "Person in Charge",
          "type": "user_select",
          "required": true
        }
      ]
    },
    {
      "id": "section_hot_work_info",
      "title": "Hot Work Information",
      "fields": [
        {
          "id": "statement_of_work",
          "label": "Statement of Work to be done",
          "type": "textarea",
          "required": true
        }
      ]
    },
    {
      "id": "section_risk_assessment",
      "title": "Risk Assessment",
      "type": "checklist_group",
      "items": [
        {"id": "risk_area_clear", "label": "Area clear of dangerous materials"},
        {"id": "risk_fire_extinguishers_ready", "label": "Fire Extinguishers ready and available?"},
        {"id": "risk_protective_equipment_used", "label": "Protective equipment used?"},
        {"id": "risk_watchman_on_site", "label": "Will watchman be on site?"}
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks (if No)",
          "type": "textarea",
          "required": false
        }
      ],
      "additional_fields": [
        {
          "id": "risk_other_factors",
          "label": "What other factors on the job present any risks?",
          "type": "textarea",
          "required": false
        },
        {
          "id": "risk_material_disposal",
          "label": "How will the hot work materials be disposed of?",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_precautions",
      "title": "Precautions",
      "fields": [
        {
          "id": "precautions_details",
          "label": "Based on the above risk assessment, what precautions if any, will be put in place?",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_certification",
      "title": "Certification",
      "fields": [
        {
          "id": "certification_statement",
          "label": "Certification Statement",
          "type": "markdown",
          "content": "I certify that all necessary precautions have been put in place"
        },
        {
          "id": "certification_signature",
          "label": "Signature",
          "type": "signature_block", // Person in Charge?
          "required": true
        }
      ]
    },
    {
      "id": "section_cancellation",
      "title": "Cancellation / Non-Approval",
      "fields": [
        {
          "id": "cancellation_status",
          "label": "Hot work not approved/cancelled",
          "type": "checkbox",
          "required": false
        },
        {
          "id": "cancellation_signature",
          "label": "Signature (if cancelled/not approved)",
          "type": "signature_block",
          "required": false,
          "condition": {"field": "cancellation_status", "value": true}
        },
        {
          "id": "cancellation_reason",
          "label": "Reason for cancellation/non-approval",
          "type": "textarea",
          "required": false,
          "condition": {"field": "cancellation_status", "value": true}
        }
      ]
    }
  ]
}
```



#### Life Saving Appliances Checklist.json

```json
{
  "title": "Life Saving Appliances Checklist",
  "sections": [
    {
      "id": "section_certificates",
      "title": "Are Following Certificates Current?",
      "type": "checklist_group",
      "items": [
        {
          "id": "cert_safety_equip",
          "label": "Ship Safety Equipment Certificate"
        },
        {
          "id": "cert_safety_radio",
          "label": "Ship Safety Radio Certificate"
        },
        {
          "id": "cert_epirb",
          "label": "Emergency Position Indicating Radio Beacon (EPIRB) Certificate"
        },
        {
          "id": "cert_rescue_boat",
          "label": "Rescue Boat Certificate"
        },
        {
          "id": "cert_liferaft",
          "label": "Life raft Certificates"
        },
        {
          "id": "cert_sart",
          "label": "Search and Rescue Transporter (SART)"
        },
        {
          "id": "cert_load_line",
          "label": "Load Line Certificate"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No", "N/A"],
          "required": true
        },
        {
          "id": "expiry",
          "label": "Expiry",
          "type": "date",
          "required": false // Only applicable if 'Yes'? Needs clarification, making optional for now.
        }
      ],
      "fields": [
        {
          "id": "cert_corrective_action",
          "label": "Corrective Action for items marked No",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_documents",
      "title": "Are Following Documents Current and Onboard?",
      "type": "checklist_group",
      "items": [
        {
          "id": "doc_pms",
          "label": "Onboard Planned Maintenance Program"
        },
        {
          "id": "doc_solas_manual",
          "label": "SOLAS Training Manual"
        },
        {
          "id": "doc_emergency_instructions",
          "label": "Emergency Instructions"
        },
        {
          "id": "doc_radio_license",
          "label": "Radio station License"
        },
        {
          "id": "doc_safety_records",
          "label": "Records of safety maintenance, inspection and step by step drills"
        },
        {
          "id": "doc_crew_familiarization",
          "label": "Crew Safety Work Familiarization"
        },
        {
          "id": "doc_imo_signs",
          "label": "IMO Safety Signs"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No", "N/A"],
          "required": true
        }
      ],
      "fields": [
        {
          "id": "doc_corrective_action",
          "label": "Corrective Action for items marked No",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_lsa_testing",
      "title": "Life Saving Appliances Testing and Inspection?",
      "type": "checklist_group",
      "items": [
        {
          "id": "lsa_inflatable_lj_test",
          "label": "Inflatable Life Rafts/Life Jacket/Buoys: Periodic testing of inflatable Life jacket, not damaged, fitted and marked correctly"
        },
        {
          "id": "lsa_lj_condition",
          "label": "Inflatable Life Rafts/Life Jacket/Buoys: Life Jackets not knotted, not rotted"
        },
        {
          "id": "lsa_inflatable_lr_test",
          "label": "Inflatable Life Rafts/Life Jacket/Buoys: Periodic testing of inflatable life raft"
        },
        {
          "id": "lsa_lr_fall_wires",
          "label": "Inflatable Life Rafts/Life Jacket/Buoys: Life Raft fall wires maintained"
        },
        {
          "id": "lsa_lba_scba_test",
          "label": "Inflatable Life Rafts/Life Jacket/Buoys: Testing for Life Breathing Apparatus, SCBA"
        },
        {
          "id": "lsa_lifebuoys_check",
          "label": "Lifebuoys correct numbers stored in correct locations with correct markings"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No", "N/A"],
          "required": true
        }
      ],
      "fields": [
        {
          "id": "lsa_corrective_action",
          "label": "Corrective Action for items marked No",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_rescue_boat",
      "title": "Rescue Boat",
      "type": "checklist_group",
      "items": [
        {
          "id": "rb_serviced",
          "label": "Rescue boat serviced"
        },
        {
          "id": "rb_inventory",
          "label": "Inventory correct and up to date"
        },
        {
          "id": "rb_stowed",
          "label": "Rescue boat stowed and positioned correctly"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No", "N/A"],
          "required": true
        }
      ],
      "fields": [
        {
          "id": "rb_corrective_action",
          "label": "Corrective Action for items marked No",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_fire_safety",
      "title": "Fire Safety",
      "type": "checklist_group",
      "items": [
        {
          "id": "fire_emergency_alarm",
          "label": "Inspection of emergency alarm"
        },
        {
          "id": "fire_extinguishers",
          "label": "Fire Extinguishers are operable and available with inspection tags"
        },
        {
          "id": "fire_pumps",
          "label": "Check Fire Pumps"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No", "N/A"],
          "required": true
        }
      ],
      "fields": [
        {
          "id": "fire_corrective_action",
          "label": "Corrective Action for items marked No",
          "type": "textarea",
          "required": false
        }
      ]
    }
    // Signature section is missing from the text, assume it's handled by the overall task submission/user context
  ]
}
```



#### Main Engine - Monthly Report.json

```json
{
  "title": "Main Engine - Monthly Report",
  "sections": [
    {
      "id": "section_header",
      "title": "Engine Details",
      "fields": [
        {
          "id": "ship_name",
          "label": "Ship",
          "type": "text",
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call Sign",
          "type": "text",
          "required": false
        },
        {
          "id": "inmo_no",
          "label": "INMO No",
          "type": "text",
          "required": false
        },
        {
          "id": "main_engine_no",
          "label": "Main Engine No.",
          "type": "text", // Could be number
          "required": false
        },
        {
          "id": "engine_type_model_serial",
          "label": "Type / Model / Serial No.",
          "type": "text",
          "required": false
        }
      ]
    },
    {
      "id": "section_running_hours",
      "title": "Running Hours",
      "fields": [
        {
          "id": "total_hours_last_month",
          "label": "Total running hours at end of last month",
          "type": "number",
          "required": false
        },
        {
          "id": "hours_this_month",
          "label": "Running hours this month",
          "type": "number",
          "required": false
        },
        {
          "id": "total_hours_this_month",
          "label": "Total running hours at end of this month",
          "type": "number",
          "required": false
        }
      ]
    },
    {
      "id": "section_maintenance_log",
      "title": "Maintenance Log (Unit Number: insert hours since overhaul or date last done)",
      "type": "repeating_group",
      "items": [
        // Define each row from the Description column as an item
        // Each item will have fields for units 1-12
        {
          "id": "cyl_head",
          "label": "Cylinder Head",
          "fields": [
            {"id": "unit_1", "label": "1", "type": "text"}, {"id": "unit_2", "label": "2", "type": "text"}, {"id": "unit_3", "label": "3", "type": "text"}, {"id": "unit_4", "label": "4", "type": "text"},
            {"id": "unit_5", "label": "5", "type": "text"}, {"id": "unit_6", "label": "6", "type": "text"}, {"id": "unit_7", "label": "7", "type": "text"}, {"id": "unit_8", "label": "8", "type": "text"},
            {"id": "unit_9", "label": "9", "type": "text"}, {"id": "unit_10", "label": "10", "type": "text"}, {"id": "unit_11", "label": "11", "type": "text"}, {"id": "unit_12", "label": "12", "type": "text"}
          ]
        },
        {
          "id": "piston",
          "label": "Piston",
          "fields": [
            {"id": "unit_1", "label": "1", "type": "text"}, {"id": "unit_2", "label": "2", "type": "text"}, {"id": "unit_3", "label": "3", "type": "text"}, {"id": "unit_4", "label": "4", "type": "text"},
            {"id": "unit_5", "label": "5", "type": "text"}, {"id": "unit_6", "label": "6", "type": "text"}, {"id": "unit_7", "label": "7", "type": "text"}, {"id": "unit_8", "label": "8", "type": "text"},
            {"id": "unit_9", "label": "9", "type": "text"}, {"id": "unit_10", "label": "10", "type": "text"}, {"id": "unit_11", "label": "11", "type": "text"}, {"id": "unit_12", "label": "12", "type": "text"}
          ]
        },
        {
          "id": "liner",
          "label": "Liner",
          "fields": [
            {"id": "unit_1", "label": "1", "type": "text"}, {"id": "unit_2", "label": "2", "type": "text"}, {"id": "unit_3", "label": "3", "type": "text"}, {"id": "unit_4", "label": "4", "type": "text"},
            {"id": "unit_5", "label": "5", "type": "text"}, {"id": "unit_6", "label": "6", "type": "text"}, {"id": "unit_7", "label": "7", "type": "text"}, {"id": "unit_8", "label": "8", "type": "text"},
            {"id": "unit_9", "label": "9", "type": "text"}, {"id": "unit_10", "label": "10", "type": "text"}, {"id": "unit_11", "label": "11", "type": "text"}, {"id": "unit_12", "label": "12", "type": "text"}
          ]
        },
        {
          "id": "tappet_clearances",
          "label": "Tappet Clearances",
          "fields": [
            {"id": "unit_1", "label": "1", "type": "text"}, {"id": "unit_2", "label": "2", "type": "text"}, {"id": "unit_3", "label": "3", "type": "text"}, {"id": "unit_4", "label": "4", "type": "text"},
            {"id": "unit_5", "label": "5", "type": "text"}, {"id": "unit_6", "label": "6", "type": "text"}, {"id": "unit_7", "label": "7", "type": "text"}, {"id": "unit_8", "label": "8", "type": "text"},
            {"id": "unit_9", "label": "9", "type": "text"}, {"id": "unit_10", "label": "10", "type": "text"}, {"id": "unit_11", "label": "11", "type": "text"}, {"id": "unit_12", "label": "12", "type": "text"}
          ]
        },
        {
          "id": "exhaust_valves",
          "label": "Exhaust valves",
          "fields": [
            {"id": "unit_1", "label": "1", "type": "text"}, {"id": "unit_2", "label": "2", "type": "text"}, {"id": "unit_3", "label": "3", "type": "text"}, {"id": "unit_4", "label": "4", "type": "text"},
            {"id": "unit_5", "label": "5", "type": "text"}, {"id": "unit_6", "label": "6", "type": "text"}, {"id": "unit_7", "label": "7", "type": "text"}, {"id": "unit_8", "label": "8", "type": "text"},
            {"id": "unit_9", "label": "9", "type": "text"}, {"id": "unit_10", "label": "10", "type": "text"}, {"id": "unit_11", "label": "11", "type": "text"}, {"id": "unit_12", "label": "12", "type": "text"}
          ]
        },
        {
          "id": "inlet_valves",
          "label": "Inlet valves",
          "fields": [
            {"id": "unit_1", "label": "1", "type": "text"}, {"id": "unit_2", "label": "2", "type": "text"}, {"id": "unit_3", "label": "3", "type": "text"}, {"id": "unit_4", "label": "4", "type": "text"},
            {"id": "unit_5", "label": "5", "type": "text"}, {"id": "unit_6", "label": "6", "type": "text"}, {"id": "unit_7", "label": "7", "type": "text"}, {"id": "unit_8", "label": "8", "type": "text"},
            {"id": "unit_9", "label": "9", "type": "text"}, {"id": "unit_10", "label": "10", "type": "text"}, {"id": "unit_11", "label": "11", "type": "text"}, {"id": "unit_12", "label": "12", "type": "text"}
          ]
        },
        {
          "id": "fuel_valve",
          "label": "Fuel valve",
          "fields": [
            {"id": "unit_1", "label": "1", "type": "text"}, {"id": "unit_2", "label": "2", "type": "text"}, {"id": "unit_3", "label": "3", "type": "text"}, {"id": "unit_4", "label": "4", "type": "text"},
            {"id": "unit_5", "label": "5", "type": "text"}, {"id": "unit_6", "label": "6", "type": "text"}, {"id": "unit_7", "label": "7", "type": "text"}, {"id": "unit_8", "label": "8", "type": "text"},
            {"id": "unit_9", "label": "9", "type": "text"}, {"id": "unit_10", "label": "10", "type": "text"}, {"id": "unit_11", "label": "11", "type": "text"}, {"id": "unit_12", "label": "12", "type": "text"}
          ]
        },
        {
          "id": "air_start_valves",
          "label": "Air start valves",
          "fields": [
            {"id": "unit_1", "label": "1", "type": "text"}, {"id": "unit_2", "label": "2", "type": "text"}, {"id": "unit_3", "label": "3", "type": "text"}, {"id": "unit_4", "label": "4", "type": "text"},
            {"id": "unit_5", "label": "5", "type": "text"}, {"id": "unit_6", "label": "6", "type": "text"}, {"id": "unit_7", "label": "7", "type": "text"}, {"id": "unit_8", "label": "8", "type": "text"},
            {"id": "unit_9", "label": "9", "type": "text"}, {"id": "unit_10", "label": "10", "type": "text"}, {"id": "unit_11", "label": "11", "type": "text"}, {"id": "unit_12", "label": "12", "type": "text"}
          ]
        },
        {
          "id": "main_bearings",
          "label": "Main bearings",
          "fields": [
            {"id": "unit_1", "label": "1", "type": "text"}, {"id": "unit_2", "label": "2", "type": "text"}, {"id": "unit_3", "label": "3", "type": "text"}, {"id": "unit_4", "label": "4", "type": "text"},
            {"id": "unit_5", "label": "5", "type": "text"}, {"id": "unit_6", "label": "6", "type": "text"}, {"id": "unit_7", "label": "7", "type": "text"}, {"id": "unit_8", "label": "8", "type": "text"},
            {"id": "unit_9", "label": "9", "type": "text"}, {"id": "unit_10", "label": "10", "type": "text"}, {"id": "unit_11", "label": "11", "type": "text"}, {"id": "unit_12", "label": "12", "type": "text"}
          ]
        },
        {
          "id": "bottom_end_bearings",
          "label": "Bottom end bearings",
          "fields": [
            {"id": "unit_1", "label": "1", "type": "text"}, {"id": "unit_2", "label": "2", "type": "text"}, {"id": "unit_3", "label": "3", "type": "text"}, {"id": "unit_4", "label": "4", "type": "text"},
            {"id": "unit_5", "label": "5", "type": "text"}, {"id": "unit_6", "label": "6", "type": "text"}, {"id": "unit_7", "label": "7", "type": "text"}, {"id": "unit_8", "label": "8", "type": "text"},
            {"id": "unit_9", "label": "9", "type": "text"}, {"id": "unit_10", "label": "10", "type": "text"}, {"id": "unit_11", "label": "11", "type": "text"}, {"id": "unit_12", "label": "12", "type": "text"}
          ]
        },
        {
          "id": "crankcase_deflections",
          "label": "Crankcase / entablature: Deflections",
          "fields": [
            {"id": "unit_1", "label": "1", "type": "text"}, {"id": "unit_2", "label": "2", "type": "text"}, {"id": "unit_3", "label": "3", "type": "text"}, {"id": "unit_4", "label": "4", "type": "text"},
            {"id": "unit_5", "label": "5", "type": "text"}, {"id": "unit_6", "label": "6", "type": "text"}, {"id": "unit_7", "label": "7", "type": "text"}, {"id": "unit_8", "label": "8", "type": "text"},
            {"id": "unit_9", "label": "9", "type": "text"}, {"id": "unit_10", "label": "10", "type": "text"}, {"id": "unit_11", "label": "11", "type": "text"}, {"id": "unit_12", "label": "12", "type": "text"}
          ]
        },
        {
          "id": "crankcase_inspection",
          "label": "Crankcase / entablature: Inspection",
          "fields": [
            {"id": "unit_1", "label": "1", "type": "text"}, {"id": "unit_2", "label": "2", "type": "text"}, {"id": "unit_3", "label": "3", "type": "text"}, {"id": "unit_4", "label": "4", "type": "text"},
            {"id": "unit_5", "label": "5", "type": "text"}, {"id": "unit_6", "label": "6", "type": "text"}, {"id": "unit_7", "label": "7", "type": "text"}, {"id": "unit_8", "label": "8", "type": "text"},
            {"id": "unit_9", "label": "9", "type": "text"}, {"id": "unit_10", "label": "10", "type": "text"}, {"id": "unit_11", "label": "11", "type": "text"}, {"id": "unit_12", "label": "12", "type": "text"}
          ]
        },
        {
          "id": "crankcase_holding_down",
          "label": "Crankcase / entablature: Holding down",
          "fields": [
            {"id": "unit_1", "label": "1", "type": "text"}, {"id": "unit_2", "label": "2", "type": "text"}, {"id": "unit_3", "label": "3", "type": "text"}, {"id": "unit_4", "label": "4", "type": "text"},
            {"id": "unit_5", "label": "5", "type": "text"}, {"id": "unit_6", "label": "6", "type": "text"}, {"id": "unit_7", "label": "7", "type": "text"}, {"id": "unit_8", "label": "8", "type": "text"},
            {"id": "unit_9", "label": "9", "type": "text"}, {"id": "unit_10", "label": "10", "type": "text"}, {"id": "unit_11", "label": "11", "type": "text"}, {"id": "unit_12", "label": "12", "type": "text"}
          ]
        },
        {
          "id": "turbo_oil_change",
          "label": "Turbocharger: Oil change",
          "fields": [
            {"id": "unit_1", "label": "1", "type": "text"}, {"id": "unit_2", "label": "2", "type": "text"}, {"id": "unit_3", "label": "3", "type": "text"}, {"id": "unit_4", "label": "4", "type": "text"},
            {"id": "unit_5", "label": "5", "type": "text"}, {"id": "unit_6", "label": "6", "type": "text"}, {"id": "unit_7", "label": "7", "type": "text"}, {"id": "unit_8", "label": "8", "type": "text"},
            {"id": "unit_9", "label": "9", "type": "text"}, {"id": "unit_10", "label": "10", "type": "text"}, {"id": "unit_11", "label": "11", "type": "text"}, {"id": "unit_12", "label": "12", "type": "text"}
          ]
        },
        {
          "id": "turbo_bearings",
          "label": "Turbocharger: Bearings",
          "fields": [
            {"id": "unit_1", "label": "1", "type": "text"}, {"id": "unit_2", "label": "2", "type": "text"}, {"id": "unit_3", "label": "3", "type": "text"}, {"id": "unit_4", "label": "4", "type": "text"},
            {"id": "unit_5", "label": "5", "type": "text"}, {"id": "unit_6", "label": "6", "type": "text"}, {"id": "unit_7", "label": "7", "type": "text"}, {"id": "unit_8", "label": "8", "type": "text"},
            {"id": "unit_9", "label": "9", "type": "text"}, {"id": "unit_10", "label": "10", "type": "text"}, {"id": "unit_11", "label": "11", "type": "text"}, {"id": "unit_12", "label": "12", "type": "text"}
          ]
        },
        {
          "id": "turbo_full_ohaul",
          "label": "Turbocharger: Full o\\'haul",
          "fields": [
            {"id": "unit_1", "label": "1", "type": "text"}, {"id": "unit_2", "label": "2", "type": "text"}, {"id": "unit_3", "label": "3", "type": "text"}, {"id": "unit_4", "label": "4", "type": "text"},
            {"id": "unit_5", "label": "5", "type": "text"}, {"id": "unit_6", "label": "6", "type": "text"}, {"id": "unit_7", "label": "7", "type": "text"}, {"id": "unit_8", "label": "8", "type": "text"},
            {"id": "unit_9", "label": "9", "type": "text"}, {"id": "unit_10", "label": "10", "type": "text"}, {"id": "unit_11", "label": "11", "type": "text"}, {"id": "unit_12", "label": "12", "type": "text"}
          ]
        },
        {
          "id": "aircooler_filter",
          "label": "Air cooler: Filter",
          "fields": [
            {"id": "unit_1", "label": "1", "type": "text"}, {"id": "unit_2", "label": "2", "type": "text"}, {"id": "unit_3", "label": "3", "type": "text"}, {"id": "unit_4", "label": "4", "type": "text"},
            {"id": "unit_5", "label": "5", "type": "text"}, {"id": "unit_6", "label": "6", "type": "text"}, {"id": "unit_7", "label": "7", "type": "text"}, {"id": "unit_8", "label": "8", "type": "text"},
            {"id": "unit_9", "label": "9", "type": "text"}, {"id": "unit_10", "label": "10", "type": "text"}, {"id": "unit_11", "label": "11", "type": "text"}, {"id": "unit_12", "label": "12", "type": "text"}
          ]
        },
        {
          "id": "aircooler_airside",
          "label": "Air cooler: Airside",
          "fields": [
            {"id": "unit_1", "label": "1", "type": "text"}, {"id": "unit_2", "label": "2", "type": "text"}, {"id": "unit_3", "label": "3", "type": "text"}, {"id": "unit_4", "label": "4", "type": "text"},
            {"id": "unit_5", "label": "5", "type": "text"}, {"id": "unit_6", "label": "6", "type": "text"}, {"id": "unit_7", "label": "7", "type": "text"}, {"id": "unit_8", "label": "8", "type": "text"},
            {"id": "unit_9", "label": "9", "type": "text"}, {"id": "unit_10", "label": "10", "type": "text"}, {"id": "unit_11", "label": "11", "type": "text"}, {"id": "unit_12", "label": "12", "type": "text"}
          ]
        },
        {
          "id": "aircooler_waterside",
          "label": "Air cooler: Waterside",
          "fields": [
            {"id": "unit_1", "label": "1", "type": "text"}, {"id": "unit_2", "label": "2", "type": "text"}, {"id": "unit_3", "label": "3", "type": "text"}, {"id": "unit_4", "label": "4", "type": "text"},
            {"id": "unit_5", "label": "5", "type": "text"}, {"id": "unit_6", "label": "6", "type": "text"}, {"id": "unit_7", "label": "7", "type": "text"}, {"id": "unit_8", "label": "8", "type": "text"},
            {"id": "unit_9", "label": "9", "type": "text"}, {"id": "unit_10", "label": "10", "type": "text"}, {"id": "unit_11", "label": "11", "type": "text"}, {"id": "unit_12", "label": "12", "type": "text"}
          ]
        }
      ]
    },
    {
      "id": "section_remarks",
      "title": "Remarks",
      "fields": [
        {
          "id": "remarks_text",
          "label": "Remarks",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_signatures",
      "title": "Signatures",
      "fields": [
        {
          "id": "chief_engineer_signature",
          "label": "Chief Engineer",
          "type": "signature_block",
          "required": true
        },
        {
          "id": "master_signature",
          "label": "Master",
          "type": "signature_block",
          "required": true
        }
      ]
    }
  ]
}
```



#### Masters Hand Over Report.json

```json
{
  "title": "Masters Hand Over Report",
  "sections": [
    {
      "id": "section_header",
      "title": "Handover Details",
      "fields": [
        {
          "id": "vessel_name",
          "label": "Vessel",
          "type": "text",
          "required": true,
          "defaultValue": "Quinta Essentia" // Pre-filled based on PDF
        },
        {
          "id": "outgoing_captain",
          "label": "From Captain",
          "type": "user_select", // Assuming selection of user
          "required": true
        },
        {
          "id": "incoming_captain",
          "label": "To Captain",
          "type": "user_select", // Assuming selection of user
          "required": true
        },
        {
          "id": "handover_date",
          "label": "Was handed over on (Date)",
          "type": "date",
          "required": true
        }
      ]
    },
    {
      "id": "section_checklist",
      "title": "Status Checklist",
      "type": "checklist_group",
      "items": [
        {
          "id": "chk_record_book",
          "label": "Vessel Record Book up to date"
        },
        {
          "id": "chk_crew_certs",
          "label": "Crew Certification up to date"
        },
        {
          "id": "chk_charts_pubs",
          "label": "Charts and Publications up to date"
        },
        {
          "id": "chk_safety_meetings",
          "label": "Safety and Environmental meetings up to date"
        },
        {
          "id": "chk_drills_conducted",
          "label": "Drills conducted as required"
        },
        {
          "id": "chk_itinerary_pending",
          "label": "Itinerary/Pending items (Reviewed?)" // Clarified label
        },
        {
          "id": "chk_pubs_missing",
          "label": "Publications Missing (if yes please list the name of missing publication)" // This is a Yes/No, list is separate
        },
        {
          "id": "chk_sms_docs",
          "label": "SMS and related documents (Reviewed?)" // Clarified label
        },
        {
          "id": "chk_lsa_operational",
          "label": "LSA equipment fully operational"
        },
        {
          "id": "chk_radio_operational",
          "label": "Radio equipment fully operational"
        },
        {
          "id": "chk_critical_equip_operational",
          "label": "Critical Equipment fully operational"
        },
        {
          "id": "chk_accident_report",
          "label": "Vessel Accident Report (Reviewed?)" // Clarified label
        },
        {
          "id": "chk_nonconformities_report",
          "label": "Non Conformities Report (Reviewed?)" // Clarified label
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        }
      ],
      "fields": [
        {
          "id": "checklist_remarks",
          "label": "Remarks (If No is answered for any of the above)",
          "type": "textarea",
          "required": false // Conditional requirement
        }
      ]
    },
    {
      "id": "section_details",
      "title": "Detailed Status",
      "fields": [
        {
          "id": "general_condition",
          "label": "General Condition of Vessel",
          "type": "textarea",
          "required": false
        },
        {
          "id": "work_in_progress",
          "label": "Work in Progress",
          "type": "textarea",
          "required": false
        },
        {
          "id": "missing_publications_list",
          "label": "Missing Publications, if any",
          "type": "textarea",
          "required": false,
          "condition": { // Conditional based on checklist item
            "field": "chk_pubs_missing",
            "value": "Yes"
          }
        },
        {
          "id": "outstanding_repairs",
          "label": "Outstanding Repairs/Defective Items",
          "type": "textarea",
          "required": false
        },
        {
          "id": "repairs_action_taken",
          "label": "Action Taken (for Repairs)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "outstanding_nonconformities",
          "label": "Outstanding Nonconformities",
          "type": "textarea",
          "required": false
        },
        {
          "id": "nonconformities_action_taken",
          "label": "Action Taken (for Nonconformities)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "general_remarks",
          "label": "General",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_signatures",
      "title": "Signatures",
      "fields": [
        {
          "id": "incoming_master_signature",
          "label": "Incoming Master Signature",
          "type": "signature",
          "required": true
        },
        {
          "id": "outgoing_master_signature",
          "label": "Outgoing Master Signature",
          "type": "signature",
          "required": true
        }
        // Names are covered by header fields
      ]
    }
  ]
}
```



#### Masters Monthly Review.json

```json
{
  "title": "Masters Monthly Review",
  "sections": [
    {
      "id": "section_header",
      "title": "Review Period",
      "fields": [
        {
          "id": "review_date",
          "label": "Date",
          "type": "date",
          "required": true
        },
        {
          "id": "review_time",
          "label": "Time",
          "type": "time",
          "required": false
        },
        {
          "id": "review_month",
          "label": "Month",
          "type": "month", // Or text
          "required": true
        },
        {
          "id": "intro_text",
          "label": "Introduction",
          "type": "markdown",
          "content": "This form is to ensure the yacht is up to date with rules and regulations of authorities as well as to ensure yacht is maintained per company procedures."
        }
      ]
    },
    {
      "id": "section_documentation",
      "title": "Documentation",
      "description": "Check your alerts for any missing, expired or soon to expire documentation and certificates.",
      "type": "checklist_group",
      "items": [
        {"id": "doc_sms_updated", "label": "SMS is up to date?"},
        {"id": "doc_sopep_updated", "label": "SOPEP Manual up to date?"},
        {"id": "doc_ship_certs_updated", "label": "Ship Certificates/documents up to date?"},
        {"id": "doc_crew_certs_updated", "label": "Crew is up to date on Certification?"},
        {"id": "doc_logbook_updated", "label": "Vessel Log book entries are up to date?"},
        {"id": "doc_charts_pubs_updated", "label": "Nautical Charts and Publications up to date?"}
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_safety",
      "title": "Safety",
      "description": "Check your alerts for any missing, expired or soon to expire documentation and certificates.", // Note: PDF repeats this text, kept for fidelity
      "type": "checklist_group",
      "items": [
        {"id": "safety_training_manual_provided", "label": "Each crew member provided with training manual?"},
        {"id": "safety_drills_completed", "label": "All Safety Drills completed?"},
        {"id": "safety_lsa_tested", "label": "Life Saving Appliances tested?"},
        {"id": "safety_ffe_tested", "label": "Fire Fighting Equipment tested?"},
        {"id": "safety_crew_muster_duties", "label": "Crew issued Muster Duties?"},
        {"id": "safety_emergency_contact_updated", "label": "Emergency Contact up to date?"},
        {"id": "safety_ship_security_plan_updated", "label": "Ship Security plan updated?"},
        {"id": "safety_alarm_systems_checked", "label": "Alarm Systems checked?"},
        {"id": "safety_comms_systems_checked", "label": "Communications systems checked?"},
        {"id": "safety_circulars_received", "label": "Circulars received?"}
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_maintenance",
      "title": "Maintenance",
      "description": "Check your critical equipment list or tasks and issues for any missed or upcoming maintenance due.",
      "type": "checklist_group",
      "items": [
        {"id": "maint_critical_equip_checked", "label": "Critical equipment checked as per schedule?"},
        {"id": "maint_missed_overdue_tasks", "label": "Any missed/overdue planned maintenance tasks?"},
        {"id": "maint_unplanned_occurred", "label": "Any unplanned maintenance occurred since last review?"}
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_final_remarks",
      "title": "Final Remarks",
      "fields": [
        {
          "id": "final_remarks_details",
          "label": "Remarks",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_signature",
      "title": "Master Signature",
      "fields": [
        {
          "id": "master_signature",
          "label": "Signature",
          "type": "signature_block",
          "required": true
        }
      ]
    }
  ]
}
```



#### Medical Log.json

```json
{
  "title": "Medical Log",
  "sections": [
    {
      "id": "section_header",
      "title": "Vessel Information",
      "fields": [
        {
          "id": "ship_name",
          "label": "Ship",
          "type": "text",
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call Sign",
          "type": "text",
          "required": false
        },
        {
          "id": "inmo_no",
          "label": "INMO No",
          "type": "text",
          "required": false
        }
      ]
    },
    {
      "id": "section_log_entries",
      "title": "Medical Log Entries",
      "type": "array",
      "item_label": "Log Entry",
      "item_structure": {
        "type": "object", // Each item in the array is an object with these fields
        "fields": [
          {
            "id": "entry_date",
            "label": "Date",
            "type": "date",
            "required": true
          },
          {
            "id": "crew_name",
            "label": "Name of Crewmember",
            "type": "text", // Could be user_select if crew list is available
            "required": true
          },
          {
            "id": "crew_rank",
            "label": "Rank",
            "type": "text",
            "required": false
          },
          {
            "id": "symptoms",
            "label": "Symptoms",
            "type": "textarea",
            "required": true
          },
          {
            "id": "diagnosis",
            "label": "Diagnosis (*Include any radio medical advice received)",
            "type": "textarea",
            "required": false
          },
          {
            "id": "treatment_drugs",
            "label": "Treatment / Drugs / Medicines used",
            "type": "textarea",
            "required": false
          }
        ]
      }
    },
    {
      "id": "section_signatures",
      "title": "Signatures",
      "fields": [
        {
          "id": "master_signature",
          "label": "Master (Signature / Name / Date)",
          "type": "signature_block", // Custom type for combined signature/name/date
          "required": true
        },
        {
          "id": "dpa_signature",
          "label": "DPA (Signature / Name / Date)",
          "type": "signature_block",
          "required": false // Assuming DPA signature is for office use
        }
      ]
    }
  ]
}
```



#### Misc Machinery - Monthly Report.json

```json
{
  "title": "Misc Machinery - Monthly Report",
  "sections": [
    {
      "id": "section_header",
      "title": "Vessel Information",
      "fields": [
        {
          "id": "ship_name",
          "label": "Ship",
          "type": "text",
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call Sign",
          "type": "text",
          "required": false
        },
        {
          "id": "inmo_no",
          "label": "INMO No",
          "type": "text",
          "required": false
        }
      ]
    },
    {
      "id": "section_machinery_log",
      "title": "Machinery Running Hours",
      "type": "array",
      "item_label": "Machinery Item",
      "item_structure": {
        "type": "object",
        "fields": [
          {
            "id": "machinery_name",
            "label": "Machinery or Equipment",
            "type": "text",
            "readOnly": true, // Name is fixed per row
            "required": true
          },
          {
            "id": "running_hrs_month",
            "label": "Running hrs this month",
            "type": "number",
            "required": false
          },
          {
            "id": "total_running_hrs",
            "label": "Total running hrs",
            "type": "number",
            "required": false
          },
          {
            "id": "remarks",
            "label": "Remarks",
            "type": "textarea",
            "required": false
          }
        ]
      },
      "defaultItems": [ // Pre-populate the rows based on the PDF
        {"machinery_name": "M/E L.O. Pump No. 1"},
        {"machinery_name": "M/E L.O. Pump No. 2"},
        {"machinery_name": "M/E Camshaft L.O. Pump No. 1"},
        {"machinery_name": "M/E Camshaft L.O. Pump No. 2"},
        {"machinery_name": "M/E Camshaft Cooling Water Pump"},
        {"machinery_name": "M/E Injection Valves Cooling Pump"},
        {"machinery_name": "M/E F.W. Cooling Pump No. 1"},
        {"machinery_name": "M/E F.W. Cooling Pump No. 2"},
        {"machinery_name": "F.O. Booster Pump No. 1"},
        {"machinery_name": "F.O. Booster Pump No. 2"},
        {"machinery_name": "F.O. Transfer Pump No. 1"},
        {"machinery_name": "F.O. Transfer Pump No. 2"}, // Corrected duplicate name from text
        {"machinery_name": "M.D.O. Transfer Pump No. 1"},
        {"machinery_name": "M.D.O. Transfer Pump No. 2"},
        {"machinery_name": "F.O. Purifier"},
        {"machinery_name": "M.D.O. Purifier"},
        {"machinery_name": "L.O. Purifier"},
        {"machinery_name": "Air Compressor No. 1"},
        {"machinery_name": "Air Compressor No. 2"},
        {"machinery_name": "Air Compressor No. 3"},
        {"machinery_name": "F.W. Service Pump"},
        {"machinery_name": "Boiler F.O. Pump"},
        {"machinery_name": "Boiler M.D.O. Pump"},
        {"machinery_name": "Boiler Feed Water Pump No. 1"},
        {"machinery_name": "Boiler Feed Water Pump No. 2"},
        {"machinery_name": "Oil Water Separator"},
        {"machinery_name": "Bilge Pump No. 1"},
        {"machinery_name": "Bilge Pump No. 2"},
        {"machinery_name": "Steering Gear Hydraulic Pump No. 1"},
        {"machinery_name": "Steering Gear Hydraulic Pump No. 2"},
        {"machinery_name": "Aux. Steering Gear Hydraulic Pump No. 1"},
        {"machinery_name": "Aux. Steering Gear Hydraulic Pump No. 2"},
        {"machinery_name": "General Service Pump No. 1"},
        {"machinery_name": "General Service Pump No. 2"},
        {"machinery_name": "General Service Pump"}, // Third GS Pump?
        {"machinery_name": "Ballast Pump No. 1"},
        {"machinery_name": "Ballast Pump No. 2"},
        {"machinery_name": "Main Fire Pump"},
        {"machinery_name": "Aux. Fire Pump"},
        {"machinery_name": "Air Condition Unit"},
        {"machinery_name": "Bow Thruster"}
      ]
    },
    {
      "id": "section_signatures",
      "title": "Signatures",
      "fields": [
        {
          "id": "master_ce_signature",
          "label": "Master / Chief Engineer (Signature / Name / Date)",
          "type": "signature_block",
          "required": true
        },
        {
          "id": "dpa_signature",
          "label": "DPA (Signature / Name / Date)",
          "type": "signature_block",
          "required": false // Office use
        }
      ]
    }
  ]
}
```



#### Near Miss Report.json

```json
{
  "title": "Accident / Near Miss Report", // Title adjusted based on PDF content
  "sections": [
    {
      "id": "section_general_info",
      "title": "Report General Information",
      "fields": [
        {
          "id": "vessel_name",
          "label": "Vessel name",
          "type": "text",
          "required": true
        },
        {
          "id": "reporting_by",
          "label": "Reporting By",
          "type": "user_select",
          "required": true
        },
        {
          "id": "incident_date",
          "label": "Date of Incident",
          "type": "date",
          "required": true
        },
        {
          "id": "incident_time",
          "label": "Time of Incident",
          "type": "time",
          "required": true
        },
        {
          "id": "incident_location_general", // Renamed to distinguish from specific location below
          "label": "Location of Incident",
          "type": "text",
          "required": true
        }
      ]
    },
    {
      "id": "section_incident_info",
      "title": "Incident Information",
      "fields": [
        {
          "id": "persons_involved",
          "label": "Names of persons involved",
          "type": "textarea", // Allows multiple names
          "required": false
        },
        {
          "id": "witnesses",
          "label": "Name of Witnesses",
          "type": "textarea", // Allows multiple names
          "required": false
        },
        {
          "id": "incident_location_specific", // Renamed for clarity
          "label": "Incident location (Specific area/details)",
          "type": "text",
          "required": false
        },
        {
          "id": "incident_type",
          "label": "Incident Type",
          "type": "select", // Dropdown might be suitable, or text
          "options": [
            "Accident",
            "Near Miss",
            "Hazardous Occurrence",
            "Other"
          ],
          "required": true
        },
        {
          "id": "incident_description",
          "label": "Incident Description",
          "type": "textarea",
          "required": true
        },
        {
          "id": "incident_cause",
          "label": "Cause of accident",
          "type": "textarea",
          "required": false
        },
        {
          "id": "equipment_involved",
          "label": "Equipment involved if any",
          "type": "textarea",
          "required": false
        },
        {
          "id": "action_taken_immediate",
          "label": "Action taken (Immediate)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "cost_associated",
          "label": "Any cost associated?",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": false
        },
        {
          "id": "cost_details", // Added field for cost details if Yes
          "label": "Cost Details (if Yes)",
          "type": "textarea",
          "required": false,
          "condition": {
            "field": "cost_associated",
            "value": "Yes"
          }
        }
      ]
    },
    {
      "id": "section_captain_review",
      "title": "Captain Review",
      "fields": [
        {
          "id": "captain_signature",
          "label": "Captain's Signature",
          "type": "signature",
          "required": true
        },
        {
          "id": "captain_signature_date",
          "label": "Date (Captain Signature)",
          "type": "date",
          "required": true
        }
      ]
    },
    {
      "id": "section_management_review",
      "title": "Management Review",
      "fields": [
        {
          "id": "corrective_action_taken",
          "label": "Corrective action taken",
          "type": "textarea",
          "required": false
        },
        {
          "id": "management_signature",
          "label": "Management Signature",
          "type": "signature",
          "required": false // Assuming management review is a separate step
        },
        {
          "id": "management_signature_date",
          "label": "Date (Management Signature)",
          "type": "date",
          "required": false
        }
      ]
    }
  ]
}
```



#### Non-conformity Report.json

```json
{
  "title": "Non-conformity Report", // Title adjusted from PDF text
  "sections": [
    {
      "id": "section_reporting",
      "title": "Discrepancy Reporting",
      "fields": [
        {
          "id": "vessel_name",
          "label": "Vessel",
          "type": "text",
          "required": true
        },
        {
          "id": "reporter_name",
          "label": "Name of Person Reporting the Discrepancy",
          "type": "user_select", // Assuming selection of the user
          "required": true
        },
        {
          "id": "report_date",
          "label": "Date of Report",
          "type": "date",
          "required": true
        },
        {
          "id": "discrepancy_details",
          "label": "State the discrepancy",
          "type": "textarea",
          "required": true
        }
      ]
    },
    {
      "id": "section_corrective_action",
      "title": "Corrective Action",
      "fields": [
        {
          "id": "proposed_corrective_action",
          "label": "What is the proposed corrective action(s)",
          "type": "textarea",
          "required": true
        },
        {
          "id": "immediate_actions",
          "label": "Immediate action(s)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "immediate_action_personnel",
          "label": "Name(s) of Person(s) to Correct the Discrepancy (Immediate)",
          "type": "text", // Could be multi-user select
          "required": false
        },
        {
          "id": "immediate_action_date", // Assuming date relates to immediate action report
          "label": "Date of Report (Immediate Action)",
          "type": "date",
          "required": false
        },
        {
          "id": "further_actions",
          "label": "Further Action(s)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "further_action_personnel",
          "label": "Name of Person to Correct the Discrepancy (Further)",
          "type": "text", // Could be multi-user select
          "required": false
        }
        // No date field explicitly linked to further actions in the text
      ]
    },
    {
      "id": "section_verification",
      "title": "Verification of Corrective Action(s)",
      "fields": [
        {
          "id": "follow_up_details",
          "label": "Follow Up Details (Explain how the corrective action was verified.)",
          "type": "textarea",
          "required": true
        },
        {
          "id": "verification_personnel",
          "label": "Person(s) Verifying Corrective Action(s)",
          "type": "text", // Could be multi-user select
          "required": true
        },
        {
          "id": "verification_date", // Assuming date relates to verification report
          "label": "Date of Report (Verification)",
          "type": "date",
          "required": true
        }
      ]
    },
    {
      "id": "section_closeout",
      "title": "Corrective Action(s) Closed Out",
      "fields": [
        {
          "id": "closeout_signature",
          "label": "Signature (Verifier)",
          "type": "signature",
          "required": true
        }
        // The name is covered by verification_personnel
      ]
    }
  ]
}
```



#### Noon Report.json

```json
{
  "title": "Noon Report",
  "sections": [
    {
      "id": "section_header",
      "title": "Report Details",
      "fields": [
        {
          "id": "reported_by",
          "label": "Reported By",
          "type": "user_select",
          "required": true
        },
        {
          "id": "vessel_name",
          "label": "VESSEL'S NAME",
          "type": "text",
          "required": true
        },
        {
          "id": "report_date",
          "label": "DATE",
          "type": "date",
          "required": true
        }
      ]
    },
    {
      "id": "section_voyage_position",
      "title": "Voyage and Position",
      "fields": [
        {
          "id": "voyage_from",
          "label": "VOYAGE FROM",
          "type": "text",
          "required": true
        },
        {
          "id": "voyage_to",
          "label": "VOYAGE TO",
          "type": "text",
          "required": true
        },
        {
          "id": "latitude_noon",
          "label": "LATITUDE AT NOON (DEG MIN N/S)",
          "type": "text", // Specific format, text might be easier
          "required": true
        },
        {
          "id": "longitude_noon",
          "label": "LONGITUDE AT NOON (DEG MIN E/W)",
          "type": "text", // Specific format, text might be easier
          "required": true
        },
        {
          "id": "distance_to_go",
          "label": "DISTANCE TO GO",
          "type": "text", // Assuming distance unit included
          "required": false
        },
        {
          "id": "eta_port_time",
          "label": "ETA : PORT/ TIME",
          "type": "text", // Combined info
          "required": false
        }
      ]
    },
    {
      "id": "section_performance",
      "title": "Performance Data",
      "fields": [
        {
          "id": "avg_speed_last_noon",
          "label": "AVERAGE SPEED DONE SINCE LAST NOON REPORT",
          "type": "number",
          "step": 0.1,
          "unit": "knots", // Assuming unit
          "required": false
        },
        {
          "id": "avg_rpm",
          "label": "AVERAGE RPM",
          "type": "number",
          "required": false
        },
        {
          "id": "ring_full_away",
          "label": "RING FULL AWAY (DD HH MN)", // Unclear meaning, using text
          "type": "text",
          "required": false
        }
      ]
    },
    {
      "id": "section_weather_sea",
      "title": "Weather and Sea",
      "fields": [
        {
          "id": "wind_direction_force",
          "label": "WIND DIRECTION AND FORCE",
          "type": "text",
          "required": false
        },
        {
          "id": "sea_swell_condition",
          "label": "SEA AND SWELL CONDITION",
          "type": "text",
          "required": false
        }
      ]
    },
    {
      "id": "section_remains_on_board",
      "title": "Remains on Board (ROB)",
      "fields": [
        {
          "id": "rob_fresh_water_mt",
          "label": "FRESH WATER (MT)",
          "type": "number",
          "step": "any",
          "required": false
        },
        {
          "id": "rob_fuel_oil_mt",
          "label": "FUEL OIL (MT)",
          "type": "number",
          "step": "any",
          "required": false
        },
        {
          "id": "rob_diesel_oil_mt",
          "label": "DIESEL OIL (MT)",
          "type": "number",
          "step": "any",
          "required": false
        },
        {
          "id": "rob_lub_oil_me_mt",
          "label": "LUB OIL (M/E) (MT)",
          "type": "number",
          "step": "any",
          "required": false
        },
        {
          "id": "rob_lub_oil_ae_mt",
          "label": "LUB OIL (A/E) (MT)",
          "type": "number",
          "step": "any",
          "required": false
        },
        {
          "id": "rob_lub_oil_hyd_mt",
          "label": "LUB OIL (HYD) (MT)",
          "type": "number",
          "step": "any",
          "required": false
        }
      ]
    },
    {
      "id": "section_remarks",
      "title": "Remarks",
      "fields": [
        {
          "id": "estimated_time_completion",
          "label": "Estimated Time of Completion", // Assuming this relates to the voyage/task
          "type": "datetime",
          "required": false
        },
        {
          "id": "remarks",
          "label": "REMARKS",
          "type": "textarea",
          "required": false
        }
      ]
    }
  ]
}
```



#### Note of Protest.json

```json
{
  "title": "Note of Protest",
  "sections": [
    {
      "id": "section_header",
      "title": "Protest Details",
      "fields": [
        {
          "id": "vessel_name",
          "label": "Vessel Name",
          "type": "text",
          "required": true
        },
        {
          "id": "protest_date",
          "label": "Date",
          "type": "date",
          "required": true
        },
        {
          "id": "protest_time",
          "label": "Time",
          "type": "time",
          "required": true
        },
        {
          "id": "protester_name",
          "label": "Name",
          "type": "user_select", // Assuming selection of the user filling the form
          "required": true
        },
        {
          "id": "protester_position",
          "label": "Position",
          "type": "text", // Could be pre-filled based on user selection
          "required": true
        },
        {
          "id": "port_location",
          "label": "Port location",
          "type": "text",
          "required": true
        }
      ]
    },
    {
      "id": "section_protest_type",
      "title": "Check the Protest Type",
      "fields": [
        {
          "id": "protest_type",
          "label": "Protest Type",
          "type": "checkbox_group", // Allows selecting multiple if applicable, or radio if only one
          "options": [
            {"id": "type_wrong_fuel", "label": "Wrong Fuel"},
            {"id": "type_violation_regs", "label": "Violation of Regulations"},
            {"id": "type_berths_unclear", "label": "Berths Unclear"},
            {"id": "type_cargo_mishandling", "label": "Cargo Mishandling"},
            {"id": "type_equip_malfunction", "label": "Equipment Malfunction"},
            {"id": "type_other", "label": "Other"}
          ],
          "required": true
        },
        {
          "id": "protest_type_other_details",
          "label": "If Other, please specify",
          "type": "text",
          "required": false,
          "condition": { // Example of conditional display
            "field": "protest_type",
            "value": "type_other"
          }
        }
      ]
    },
    {
      "id": "section_claim",
      "title": "Claim Details",
      "description": "Serving as Master on the vessel I solemnly declare that the below situation is in violation of regulations. In describing the situation, I declare my note of protest against all losses, damages, etc. associated with this situation.",
      "fields": [
        {
          "id": "claim_details",
          "label": "List claim here",
          "type": "textarea",
          "required": true
        }
      ]
    }
    // Signature section is implied by the 'Name' field and submission context
  ]
}
```



#### Passage Plan.json

```json
{
  "title": "Passage Plan",
  "sections": [
    {
      "id": "section_trip_link",
      "title": "Trip Link",
      "fields": [
        {
          "id": "trip_link_info",
          "label": "Trip Association",
          "type": "markdown",
          "content": "This form is related to a trip. If you want to create this form as part of a trip data, it is better to do it from the trip detail view."
          // Consider adding a trip selection field here if direct association is needed
        }
      ]
    },
    {
      "id": "section_plan_details",
      "title": "Plan Details",
      "fields": [
        {
          "id": "plan_date",
          "label": "Date",
          "type": "date",
          "required": true
        },
        {
          "id": "departure_port",
          "label": "From",
          "type": "text",
          "required": true
        },
        {
          "id": "arrival_port",
          "label": "To",
          "type": "text",
          "required": true
        },
        {
          "id": "departure_local_time",
          "label": "Departure Local Time",
          "type": "time",
          "required": false
        },
        {
          "id": "departure_timezone",
          "label": "Departure Time Zone",
          "type": "text", // Could be select
          "required": false
        },
        {
          "id": "arrival_local_time",
          "label": "Arrival Local Time",
          "type": "time",
          "required": false
        },
        {
          "id": "arrival_timezone",
          "label": "Arrival Time Zone",
          "type": "text", // Could be select
          "required": false
        },
        {
          "id": "distance",
          "label": "Distance (NM)",
          "type": "number",
          "required": false
        },
        {
          "id": "average_speed",
          "label": "Average Speed (knots)",
          "type": "number",
          "required": false
        },
        {
          "id": "departure_draught",
          "label": "Departure Draught",
          "type": "number", // Specify units (e.g., meters)
          "required": false
        },
        {
          "id": "arrival_draught",
          "label": "Arrival Draught",
          "type": "number", // Specify units
          "required": false
        }
      ]
    },
    {
      "id": "section_charts",
      "title": "Charts to be Used",
      "fields": [
        {
          "id": "charts_list",
          "label": "Chart Numbers",
          "type": "textarea", // Or a repeating text field
          "required": false
        },
        {
          "id": "charts_current",
          "label": "Charts Current?",
          "type": "radio",
          "options": ["YES", "NO"],
          "required": false
        }
      ]
    },
    {
      "id": "section_publications",
      "title": "Publications",
      "fields": [
        {
          "id": "pubs_checklist",
          "label": "Publications Used",
          "type": "checkbox_group",
          "options": [
            {"id": "pub_light_lists", "label": "Light Lists"},
            {"id": "pub_port_guides", "label": "Port Guides"},
            {"id": "pub_sailing_directions", "label": "Sailing Directions"},
            {"id": "pub_tidal_tables", "label": "Tidal Tables"},
            {"id": "pub_radio_signals", "label": "List of Radio Signals"},
            {"id": "pub_ships_routing", "label": "Ships Routing"},
            {"id": "pub_almanac", "label": "Almanac"},
            {"id": "pub_other", "label": "Other"}
          ],
          "required": false
        },
        {
          "id": "pubs_other_details",
          "label": "Other Publication Details",
          "type": "text",
          "required": false,
          "condition": {"field": "pubs_checklist", "value": "pub_other"}
        },
        {
          "id": "pubs_current",
          "label": "Publications Current?",
          "type": "radio",
          "options": ["YES", "NO"],
          "required": false
        }
      ]
    },
    {
      "id": "section_waypoints",
      "title": "Waypoints",
      "description": "(Attach PDF file as required)",
      "type": "repeating_group",
      "fields": [
        {"id": "wp_number", "label": "Number", "type": "number", "required": false},
        {"id": "wp_latitude", "label": "Latitude", "type": "text", "required": false},
        {"id": "wp_longitude", "label": "Longitude", "type": "text", "required": false},
        {"id": "wp_speed", "label": "Speed", "type": "number", "required": false},
        {"id": "wp_distance", "label": "Distance", "type": "number", "required": false},
        {"id": "wp_course", "label": "Course", "type": "number", "required": false},
        {"id": "wp_time", "label": "Time", "type": "time", "required": false},
        {"id": "wp_eta", "label": "ETA", "type": "datetime", "required": false}
      ]
    },
    {
      "id": "section_hazards",
      "title": "Hazards between Waypoints",
      "fields": [
        {
          "id": "hazards_details",
          "label": "Details",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_warnings",
      "title": "Warnings",
      "type": "repeating_group",
      "fields": [
        {"id": "warn_date", "label": "Date", "type": "date", "required": false},
        {"id": "warn_type", "label": "Type", "type": "text", "required": false},
        {"id": "warn_position", "label": "Position", "type": "text", "required": false},
        {"id": "warn_advice", "label": "Advice", "type": "textarea", "required": false}
      ]
    },
    {
      "id": "section_call_points",
      "title": "Call Points and VHF Monitoring",
      "type": "repeating_group",
      "fields": [
        {"id": "call_place", "label": "Places", "type": "text", "required": false},
        {"id": "call_vhf", "label": "VHF", "type": "text", "required": false},
        {"id": "call_details", "label": "Details", "type": "textarea", "required": false}
      ]
    },
    {
      "id": "section_tidal_prediction",
      "title": "Tidal Prediction",
      "type": "repeating_group",
      "fields": [
        {"id": "tidal_location", "label": "Location", "type": "text", "required": false},
        {"id": "tidal_hw_height", "label": "High Water Height", "type": "number", "required": false},
        {"id": "tidal_hw_time", "label": "High Water Time", "type": "time", "required": false},
        {"id": "tidal_lw_height", "label": "Low Water Height", "type": "number", "required": false},
        {"id": "tidal_lw_time", "label": "Low Water Time", "type": "time", "required": false}
      ]
    },
    {
      "id": "section_weather_info",
      "title": "Weather Information",
      "fields": [
        {
          "id": "weather_details",
          "label": "Details",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_notes",
      "title": "Notes",
      "fields": [
        {
          "id": "notes_details",
          "label": "Details",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_signatures",
      "title": "Signatures",
      "fields": [
        {
          "id": "prepared_by_officer",
          "label": "Plan prepared by (Officer)",
          "type": "user_select",
          "required": true
        },
        {
          "id": "officer_signature",
          "label": "Officer Signature",
          "type": "signature_block",
          "required": true
        },
        {
          "id": "checked_by_master",
          "label": "Plans checked by Master?",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "master_signature",
          "label": "Signed By Master",
          "type": "signature_block",
          "required": true,
          "condition": {"field": "checked_by_master", "value": "Yes"}
        }
      ]
    }
  ]
}
```



#### Permit to Work - Diving Operations.json

```json
{
  "title": "Permit to Work for Diving Operations",
  "sections": [
    {
      "id": "section_permit_info",
      "title": "Permit Information",
      "fields": [
        {
          "id": "location",
          "label": "Location",
          "type": "text",
          "required": true
        },
        {
          "id": "permit_date",
          "label": "Date",
          "type": "date",
          "required": true
        },
        {
          "id": "start_time",
          "label": "Start Time",
          "type": "time",
          "required": true
        },
        {
          "id": "end_time",
          "label": "End Time",
          "type": "time",
          "required": true
        },
        {
          "id": "vessel_name",
          "label": "Vessel",
          "type": "text",
          "defaultValue": "Quinta Essentia", // Assuming default
          "required": true
        },
        {
          "id": "persons_carrying_out_work",
          "label": "Name of person(s) carrying out work",
          "type": "textarea", // Or multi-user select
          "required": true
        },
        {
          "id": "description_of_work",
          "label": "Description of work to be performed",
          "type": "textarea",
          "required": true
        }
      ]
    },
    {
      "id": "section_precautions_checklist",
      "title": "Precautions Checklist",
      "description": "The following precautions must be checked before work is approved",
      "type": "checklist_group",
      "items": [
        {
          "id": "chk_persons_fit_able",
          "label": "Persons fit and able for duty?"
        },
        {
          "id": "chk_sufficient_training",
          "label": "Has sufficient training for the specific duty been given?"
        },
        {
          "id": "chk_dive_equipment_checked",
          "label": "Has the dive equipment been checked and confirmed as safe for use?"
        },
        {
          "id": "chk_main_engines_isolated",
          "label": "Are the main engines isolated?"
        },
        {
          "id": "chk_steering_gear_isolated",
          "label": "Is the steering gear isolated?"
        },
        {
          "id": "chk_stern_thruster_isolated",
          "label": "Is the stern thruster isolated?"
        },
        {
          "id": "chk_bow_thruster_isolated",
          "label": "Is the bow thruster isolated?"
        },
        {
          "id": "chk_stabilisers_isolated",
          "label": "Are the forward and aft stabilisers isolated?"
        },
        {
          "id": "chk_cathodic_protection_isolated",
          "label": "Has the cathodic protection been isolated?"
        },
        {
          "id": "chk_tender_launched_ready",
          "label": "Is the Tender launched and ready to provide assistance if needed?"
        },
        {
          "id": "chk_alfa_flag_hoisted",
          "label": "Is the Alfa flag hoisted?"
        },
        {
          "id": "chk_wind_weather_noted",
          "label": "Has the wind speed and weather conditions been noted?"
        },
        {
          "id": "chk_current_noted_considered",
          "label": "Has the current been noted and considered?"
        },
        {
          "id": "chk_grey_water_discharge_inboard",
          "label": "Grey water discharge inboard?"
        },
        {
          "id": "chk_black_water_discharge_inboard",
          "label": "Black water discharge inboard?"
        },
        {
          "id": "chk_emergency_procedures_understood",
          "label": "Are emergency procedures established and understood in the event of an accident?"
        },
        {
          "id": "chk_oic_informed",
          "label": "Has the Officer In Charge been informed?"
        },
        {
          "id": "chk_signs_posted_bridge",
          "label": "Have signs been posted on the Bridge?"
        },
        {
          "id": "chk_engineers_informed",
          "label": "Have the Engineers been informed?"
        },
        {
          "id": "chk_communication_system_tested",
          "label": "Has a system of communication been established and tested?"
        },
        {
          "id": "chk_watchman_posted",
          "label": "Is watchman posted?"
        },
        {
          "id": "chk_dive_procedures_established",
          "label": "Have all dive procedures been established?"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_approval_acceptance",
      "title": "Approval and Acceptance",
      "fields": [
        {
          "id": "approval_statement",
          "label": "Approval Statement",
          "type": "markdown",
          "content": "These checks and precautions have been carried out to the satisfaction of the Officer In Charge (OIC)"
        },
        {
          "id": "oic_signature",
          "label": "Officer In Charge",
          "type": "signature_block",
          "required": true
        },
        {
          "id": "chief_engineer_signature",
          "label": "Chief Engineer",
          "type": "signature_block",
          "required": true
        },
        {
          "id": "person_work_acceptance_signature",
          "label": "Accepted by: (person(s) performing work)",
          "type": "signature_block", // Needs to handle multiple signatures if applicable
          "required": true
        }
      ]
    },
    {
      "id": "section_completion",
      "title": "Completion of Work",
      "fields": [
        {
          "id": "completion_signature",
          "label": "Approval Signature for completion of work and closing of permit",
          "type": "signature_block", // Likely OIC or Master
          "required": true
        }
      ]
    }
  ]
}
```



#### Permit to Work - Electrical.json

```json
{
  "title": "Permit to Work - Electrical",
  "sections": [
    {
      "id": "section_permit_details",
      "title": "Permit Details",
      "fields": [
        {
          "id": "yacht_name",
          "label": "Yacht",
          "type": "text",
          "defaultValue": "Quinta Essentia",
          "required": true
        },
        {
          "id": "location_of_work",
          "label": "Location of Work",
          "type": "text",
          "required": true
        },
        {
          "id": "authorised_person_name",
          "label": "(*) Authorised Person in Charge (Name)",
          "type": "user_select",
          "required": true
        },
        {
          "id": "authorised_person_role",
          "label": "Authorised Person Role",
          "type": "select",
          "options": ["Master", "Chief Engineer", "Chief Officer"],
          "required": true
        },
        {
          "id": "crew_assisting",
          "label": "Crew detailed / Persons Assisting / Contractor",
          "type": "textarea",
          "required": false
        },
        {
          "id": "work_circuits_isolated",
          "label": "Work to be Done/Circuits to be Isolated",
          "type": "textarea",
          "required": true
        },
        {
          "id": "validity_start_date",
          "label": "Start of Period of Validity (Date)",
          "type": "date",
          "required": true
        },
        {
          "id": "validity_start_time",
          "label": "Start of Period of Validity (Time)",
          "type": "time",
          "required": true
        },
        {
          "id": "validity_end_date",
          "label": "End of Period of Validity (Date)",
          "type": "date",
          "required": true
        },
        {
          "id": "validity_end_time",
          "label": "End of Period of Validity (Time - not to exceed 10 hrs)",
          "type": "time",
          "required": true
          // Add validation for 10hr duration
        }
      ]
    },
    {
      "id": "section_general_precautions",
      "title": "General Precautions",
      "type": "checklist_group",
      "items": [
        {"id": "gen_test_equipment_suitable", "label": "Test equipment suitable and tested"},
        {"id": "gen_jewellery_removed", "label": "Jewellery removed and Loose items removed from pockets"},
        {"id": "gen_eow_informed", "label": "EOW informed"},
        {"id": "gen_ppe_in_use", "label": "Required PPE in Use"}
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks (if No)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_isolated_circuits",
      "title": "Work on Isolated Circuits",
      "type": "checklist_group",
      "items": [
        {"id": "iso_breakers_locked", "label": "Circuit breakers locked or tagged off and key held by competent person"},
        {"id": "iso_no_adjacent_live", "label": "No adjacent live circuits"},
        {"id": "iso_warning_signs_posted", "label": "Warning signs posted"},
        {"id": "iso_circuit_tested_dead", "label": "Circuit tested dead"},
        {"id": "iso_voltage_detector_proved", "label": "Voltage detector proved functional after circuit test"}
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks (if No)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_live_circuits",
      "title": "Work on Live Circuits",
      "fields": [
        {
          "id": "live_work_party_briefed",
          "label": "Work party assembled in sufficient numbers and briefed as to the following (EOW to be included in the brief but not to be a member of work party):",
          "type": "checkbox_group",
          "options": [
            {"id": "brief_hazards", "label": "Hazards involved including arcing, flash over and electric shock"},
            {"id": "brief_work_completed", "label": "Work to be completed"},
            {"id": "brief_precautions", "label": "Precautions to be taken"},
            {"id": "brief_isolation_procedure", "label": "How to isolate the circuit involved in the event of an accident"},
            {"id": "brief_summon_assistance", "label": "How to summon assistance in the event of an accident"},
            {"id": "brief_casualty_removal", "label": "How to safely remove a casualty from danger"},
            {"id": "brief_resuscitation", "label": "How to administer resuscitation"}
          ],
          "required": false // Required if live work is performed
        },
        {
          "id": "live_fire_equipment_available",
          "label": "Fire fighting equipment available",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": false // Required if live work is performed
        },
        {
          "id": "live_unattended_note",
          "label": "Note",
          "type": "markdown",
          "content": "**OPEN LIVE EQUIPMENT IS NEVER TO BE LEFT UNATTENDED**"
        }
      ]
    },
    {
      "id": "section_affected_parties",
      "title": "Other Affected Parties Informed",
      "fields": [
        {
          "id": "affected_eoow",
          "label": "EOOW Informed?",
          "type": "radio",
          "options": ["Yes", "No", "N/A"],
          "required": false
        },
        {
          "id": "affected_oow",
          "label": "OOW Informed?",
          "type": "radio",
          "options": ["Yes", "No", "N/A"],
          "required": false
        },
        {
          "id": "affected_other",
          "label": "OTHER (Specify & Informed?)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_certificate_checks",
      "title": "Certificate of Checks",
      "fields": [
        {
          "id": "auth_person_satisfaction",
          "label": "I am satisfied that all precautions have been taken and that safety arrangements will be maintained for the duration of the work",
          "type": "markdown",
          "content": "I am satisfied that all precautions have been taken and that safety arrangements will be maintained for the duration of the work"
        },
        {
          "id": "auth_person_signature_checks",
          "label": "Signed: Authorised Person in Charge (as named in *)",
          "type": "signature_block",
          "required": true
        }
      ]
    },
    {
      "id": "section_cancellation",
      "title": "Cancellation",
      "fields": [
        {
          "id": "cancellation_statement",
          "label": "The work has been completed / cancelled and all persons under my supervision, material & equipment has been withdrawn.",
          "type": "markdown",
          "content": "The work has been completed / cancelled and all persons under my supervision, material & equipment has been withdrawn."
        },
        {
          "id": "auth_person_signature_cancellation",
          "label": "Signed: Authorised Person in Charge (as named in *)",
          "type": "signature_block",
          "required": true
        }
      ]
    }
  ]
}
```



#### Permit to Work - Enclosed Space Entry.json

```json
{
  "title": "Enclosed Space Work Permit",
  "sections": [
    {
      "id": "section_permit_info",
      "title": "Permit Information",
      "fields": [
        {
          "id": "port",
          "label": "Port",
          "type": "text",
          "required": false
        },
        {
          "id": "permit_date",
          "label": "Date",
          "type": "date",
          "required": true
        },
        {
          "id": "vessel_name",
          "label": "Vessel",
          "type": "text",
          "defaultValue": "Quinta Essentia", // Assuming default
          "required": true
        },
        {
          "id": "location_of_work",
          "label": "Location of work",
          "type": "text",
          "required": true
        },
        {
          "id": "authorised_person_name",
          "label": "(*) Name of Authorised Person In Charge",
          "type": "user_select",
          "required": true
        },
        {
          "id": "person_carrying_out_work",
          "label": "Name of person carrying out work",
          "type": "user_select", // Or multi-user select
          "required": true
        }
      ]
    },
    {
      "id": "section_pre_entry_precautions",
      "title": "Pre-entry Precautions",
      "description": "The following pre-entry precautions must be checked before work is approved",
      "type": "checklist_group",
      "items": [
        {
          "id": "chk_valves_secured",
          "label": "Have valves on all pipelines serving the space been secured to prevent their accidental opening?"
        },
        {
          "id": "chk_space_ventilated",
          "label": "Has the space been thoroughly ventilated?"
        },
        {
          "id": "chk_atmosphere_checks_arranged",
          "label": "Have arrangements been made for frequent atmosphere checks during occupation and work breaks?"
        },
        {
          "id": "chk_lighting_enough",
          "label": "Is there enough lighting?"
        },
        {
          "id": "chk_rescue_equipment_available",
          "label": "Is rescue and resuscitation equipment available and nearby?"
        },
        {
          "id": "chk_continuous_ventilation_arranged",
          "label": "Have arrangements been made for continuous ventilation during work and breaks?"
        },
        {
          "id": "chk_standby_person_designated",
          "label": "Has a responsible person been designated to standby the entrance of the space?"
        },
        {
          "id": "chk_officer_on_watch_advised",
          "label": "Has the officer on watch been advised of the planned entry?"
        },
        {
          "id": "chk_emergency_procedures_understood",
          "label": "Are emergency and evacuation procedures established and understood?"
        },
        {
          "id": "chk_communication_system_tested",
          "label": "Has a system of communication between established and tested?"
        },
        {
          "id": "chk_equipment_safe_tested",
          "label": "Is all equipment safe, tested and approved?"
        },
        {
          "id": "chk_watchman_posted",
          "label": "Is watchman posted?"
        },
        {
          "id": "chk_ladders_set_correctly",
          "label": "If using portable ladders, have they been set correctly?"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_certification",
      "title": "Certification",
      "fields": [
        {
          "id": "certification_statement",
          "label": "Certification Statement",
          "type": "markdown",
          "content": "I certify that all above pre-entry precautions have been taken. I am aware that the space must be evacuated immediately in case of ventilation or atmosphere test failure. Emergency and evacuation procedures have been agreed and are understood."
        },
        {
          "id": "person_work_signature",
          "label": "Person carrying out work signature",
          "type": "signature_block",
          "required": true
        },
        {
          "id": "auth_person_signature",
          "label": "Signed: Authorised Person in Charge - as named in (*)",
          "type": "signature_block",
          "required": true
        }
      ]
    },
    {
      "id": "section_completion_cancellation",
      "title": "Completion / Cancellation Confirmation",
      "fields": [
        {
          "id": "completion_statement",
          "label": "Completion Statement",
          "type": "markdown",
          "content": "The work has been completed / cancelled and all persons under my supervision, material & equipment has been withdrawn."
        },
        {
          "id": "auth_person_completion_signature",
          "label": "Signed: Authorised Person in Charge - as named in (*)",
          "type": "signature_block",
          "required": true
        }
      ]
    }
  ]
}
```



#### Permit to work - Hot work.json

```json
{
  "title": "Permit to Work - Hot Work",
  "sections": [
    {
      "id": "section_permit_details",
      "title": "Permit Details",
      "fields": [
        {
          "id": "yacht_name",
          "label": "Yacht",
          "type": "text",
          "defaultValue": "Quinta Essentia",
          "required": true
        },
        {
          "id": "location_of_work",
          "label": "Location of Work",
          "type": "text",
          "required": true
        },
        {
          "id": "authorised_person_name",
          "label": "(*) Authorised Person in Charge (Name)",
          "type": "user_select",
          "required": true
        },
        {
          "id": "authorised_person_role",
          "label": "Authorised Person Role",
          "type": "select",
          "options": ["Master", "Chief Engineer", "Chief Officer"],
          "required": true
        },
        {
          "id": "crew_assisting",
          "label": "Crew detailed / Persons Assisting / Contractor",
          "type": "textarea",
          "required": false
        },
        {
          "id": "work_to_be_done",
          "label": "Work to be Done",
          "type": "textarea",
          "required": true
        },
        {
          "id": "validity_start_date",
          "label": "Start of Period of Validity (Date)",
          "type": "date",
          "required": true
        },
        {
          "id": "validity_start_time",
          "label": "Start of Period of Validity (Time)",
          "type": "time",
          "required": true
        },
        {
          "id": "validity_end_date",
          "label": "End of Period of Validity (Date)",
          "type": "date",
          "required": true
        },
        {
          "id": "validity_end_time",
          "label": "End of Period of Validity (Time - not to exceed 24 hrs)",
          "type": "time",
          "required": true
          // Add validation for 24hr duration
        }
      ]
    },
    {
      "id": "section_checklist_hot_work",
      "title": "Hot Work Checklist",
      "type": "checklist_group",
      "items": [
        {"id": "hotwork_area_clear_gas_free", "label": "Area clear of dangerous materials and gas – free"},
        {"id": "hotwork_adjacent_areas_checked", "label": "Adjacent areas checked"},
        {"id": "hotwork_ventilation_adequate", "label": "Ventilation adequate"},
        {"id": "hotwork_fire_watchman_posted", "label": "Fire watchman posted/ instructed"},
        {"id": "hotwork_equipment_good_order", "label": "Equipment in good order"},
        {"id": "hotwork_fire_appliances_accessible", "label": "Fire appliances in good order and accessible"},
        {"id": "hotwork_ppe_used", "label": "Personal protective equipment used"}
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks (if No)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_certificate_checks",
      "title": "Certificate of Checks",
      "fields": [
        {
          "id": "auth_person_satisfaction",
          "label": "I am satisfied that all precautions have been taken and that safety arrangements will be maintained for the duration of the work",
          "type": "markdown",
          "content": "I am satisfied that all precautions have been taken and that safety arrangements will be maintained for the duration of the work"
        },
        {
          "id": "auth_person_signature_checks",
          "label": "Signed: Authorised Person in Charge (as named in *)",
          "type": "signature_block",
          "required": true
        }
      ]
    },
    {
      "id": "section_cancellation",
      "title": "Cancellation",
      "fields": [
        {
          "id": "cancellation_statement",
          "label": "The work has been completed / cancelled and all persons under my supervision, material & equipment has been withdrawn.",
          "type": "markdown",
          "content": "The work has been completed / cancelled and all persons under my supervision, material & equipment has been withdrawn."
        },
        {
          "id": "auth_person_signature_cancellation",
          "label": "Signed: Authorised Person in Charge (as named in *)",
          "type": "signature_block",
          "required": true
        }
      ]
    }
  ]
}
```



#### Permit to Work - Work Aloft.json

```json
{
  "title": "Permit to Work - Work Aloft",
  "sections": [
    {
      "id": "section_permit_details",
      "title": "Permit Details",
      "fields": [
        {
          "id": "yacht_name",
          "label": "Yacht",
          "type": "text",
          "defaultValue": "Quinta Essentia",
          "required": true
        },
        {
          "id": "location_of_work",
          "label": "Location of Work",
          "type": "text",
          "required": true
        },
        {
          "id": "authorised_person_name",
          "label": "(*) Authorised Person in Charge (Name)",
          "type": "user_select", // Assuming selection
          "required": true
        },
        {
          "id": "authorised_person_role",
          "label": "Authorised Person Role",
          "type": "select",
          "options": ["Master", "Chief Engineer", "Chief Officer"],
          "required": true
        },
        {
          "id": "crew_assisting",
          "label": "Crew detailed / Persons Assisting / Contractor",
          "type": "textarea", // Could be multi-user select
          "required": false
        },
        {
          "id": "work_to_be_done",
          "label": "Work to be Done/Circuits to be Isolated",
          "type": "textarea",
          "required": true
        },
        {
          "id": "validity_start_date",
          "label": "Start of Period of Validity (Date)",
          "type": "date",
          "required": true
        },
        {
          "id": "validity_start_time",
          "label": "Start of Period of Validity (Time)",
          "type": "time",
          "required": true
        },
        {
          "id": "validity_end_date",
          "label": "End of Period of Validity (Date)",
          "type": "date",
          "required": true
        },
        {
          "id": "validity_end_time",
          "label": "End of Period of Validity (Time - not to exceed 10 hrs)",
          "type": "time",
          "required": true
          // Add validation for 10hr duration
        }
      ]
    },
    {
      "id": "section_checklist_aloft",
      "title": "Work Aloft Checklist",
      "type": "checklist_group",
      "items": [
        {"id": "aloft_safety_lines_rigged", "label": "Safety Lines rigged"},
        {"id": "aloft_safety_harness_worn", "label": "Safety Harness to be worn at all times"},
        {"id": "aloft_ladder_pitch", "label": "Ladder pitched at 60 or 75 degrees from horizontal"},
        {"id": "aloft_whistle_isolated", "label": "Whistle isolated"},
        {"id": "aloft_funnel_emissions_limited", "label": "Funnel emissions limited"},
        {"id": "aloft_transmitting_aerials_off", "label": "Transmitting aerials off"},
        {"id": "aloft_radars_isolated", "label": "Radars isolated"},
        {"id": "aloft_work_tools_secured", "label": "Work tools secured from dropping"},
        {"id": "aloft_personnel_informed", "label": "All relevant personnel informed"},
        {"id": "aloft_assistant_posted", "label": "Assistant at Deck level posted"},
        {"id": "aloft_stage_bosun_chair_order", "label": "Stage/Bosun’s Chair in good order"}
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks (if No)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_checklist_outboard",
      "title": "Work Outboard Checklist",
      "type": "checklist_group",
      "items": [
        {"id": "outboard_harness_pfd_worn", "label": "Harness and PFD to be worn"},
        {"id": "outboard_safety_line_rigged", "label": "Safety line rigged"},
        {"id": "outboard_personnel_informed", "label": "All relevant personal informed"}
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks (if No)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_certificate_checks",
      "title": "Certificate of Checks",
      "fields": [
        {
          "id": "auth_person_satisfaction",
          "label": "I am satisfied that all precautions have been taken and that safety arrangements will be maintained for the duration of the work",
          "type": "markdown", // Display text
          "content": "I am satisfied that all precautions have been taken and that safety arrangements will be maintained for the duration of the work"
        },
        {
          "id": "auth_person_signature_checks",
          "label": "Signed: Authorised Person in Charge (as named in *)",
          "type": "signature_block", // Signature of person named in authorised_person_name
          "required": true
        }
      ]
    },
    {
      "id": "section_cancellation",
      "title": "Cancellation",
      "fields": [
        {
          "id": "cancellation_statement",
          "label": "The work has been completed / cancelled and all persons under my supervision, material & equipment has been withdrawn.",
          "type": "markdown",
          "content": "The work has been completed / cancelled and all persons under my supervision, material & equipment has been withdrawn."
        },
        {
          "id": "auth_person_signature_cancellation",
          "label": "Signed: Authorised Person in Charge (as named in *)",
          "type": "signature_block", // Signature of person named in authorised_person_name
          "required": true
        }
      ]
    }
  ]
}
```



#### Pre-Arrival Checklist.json

```json
{
  "title": "Pre-Arrival Checklist",
  "sections": [
    {
      "id": "section_trip_link",
      "title": "Trip Link",
      "fields": [
        {
          "id": "trip_link_info",
          "label": "Trip Association",
          "type": "markdown",
          "content": "This form is related to a trip. If you want to create this form as part of a trip data, it is better to do it from the trip detail view."
          // Consider adding a trip selection field here
        }
      ]
    },
    {
      "id": "section_header",
      "title": "Arrival Details",
      "fields": [
        {
          "id": "arrival_date",
          "label": "Date",
          "type": "date",
          "required": true
        },
        {
          "id": "arrival_time",
          "label": "Time",
          "type": "time",
          "required": true
        },
        {
          "id": "arrival_port",
          "label": "Port",
          "type": "text",
          "required": true
        }
      ]
    },
    {
      "id": "section_checklist_arrival",
      "title": "Arrival Checklist",
      "description": "For each item check the appropriate box. For no answers provide detailed comments.",
      "type": "checklist_group",
      "items": [
        {"id": "arr_brief_crew_passengers", "label": "Brief Crew, passengers on arrival procedures"},
        {"id": "arr_lines_fenders_place", "label": "Lines pulled, fenders in place"},
        {"id": "arr_lines_fast", "label": "Lines fast to Dock/Mooring"},
        {"id": "arr_anchor_cleared_ready", "label": "Anchor cleared and Ready"},
        {"id": "arr_hull_portholes_secured", "label": "Hull, Portholes, hatches secured and closed"},
        {"id": "arr_nav_equipment_checked", "label": "Navigation equipment checked"},
        {"id": "arr_logs_completed", "label": "All required logs completed"},
        {"id": "arr_charts_posters_updated", "label": "Charts/posters up to date"},
        {"id": "arr_equip_vhf", "label": "Is equipment fully operational, in good working order and in compliance? VHF"},
        {"id": "arr_equip_radar_ais", "label": "Is equipment fully operational, in good working order and in compliance? Radar and AIS"},
        {"id": "arr_equip_main_propulsion", "label": "Is equipment fully operational, in good working order and in compliance? Main Propulsion"},
        {"id": "arr_equip_steering_gear", "label": "Is equipment fully operational, in good working order and in compliance? Steering Gear"},
        {"id": "arr_equip_mooring_lines", "label": "Is equipment fully operational, in good working order and in compliance? Mooring Lines"},
        {"id": "arr_equip_pilot_ladder", "label": "Is equipment fully operational, in good working order and in compliance? Pilot Ladder"},
        {"id": "arr_equip_gps_reading", "label": "Is equipment fully operational, in good working order and in compliance? GPS has correct reading"},
        {"id": "arr_equip_nav_lights", "label": "Is equipment fully operational, in good working order and in compliance? Navigation lights working"},
        {"id": "arr_equip_thrusters", "label": "Is equipment fully operational, in good working order and in compliance? Stern and bow thrusters operational"},
        {"id": "arr_equip_horn", "label": "Is equipment fully operational, in good working order and in compliance? Horn operational"},
        {"id": "arr_equip_epirb", "label": "Is equipment fully operational, in good working order and in compliance? Locate EPIRB, check battery expiration date is good"},
        {"id": "arr_equip_gangways", "label": "Is equipment fully operational, in good working order and in compliance? Check Gangways"}
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No", "N/A"],
          "required": true
        }
      ]
    },
    {
      "id": "section_comments_arrival",
      "title": "Arrival Comments",
      "fields": [
        {
          "id": "arrival_comments",
          "label": "Comments (for 'No' answers in Arrival section)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_checklist_engine_power",
      "title": "Engine/Power Checklist",
      "type": "checklist_group",
      "items": [
        {"id": "eng_fuel_pumps_inspected", "label": "All fuel pumps inspected"},
        {"id": "eng_check_oil_leaks", "label": "Check for oil leaks"},
        {"id": "eng_test_main_engines", "label": "Test main engines ahead and astern"},
        {"id": "eng_oil_system_clear", "label": "Oil system clear and clean"},
        {"id": "eng_inspect_feed_water_pumps", "label": "Inspect feed water pumps"},
        {"id": "eng_check_gauges", "label": "Check Gauges"},
        {"id": "eng_check_cleanliness_er", "label": "Check cleanliness of engine room"},
        {"id": "eng_check_engine_temp", "label": "Check Engine temperature"},
        {"id": "eng_check_water_circulation", "label": "Check water circulation"},
        {"id": "eng_close_seacocks", "label": "Close seacocks"}
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No", "N/A"],
          "required": true
        }
      ]
    },
    {
      "id": "section_comments_engine_power",
      "title": "Engine/Power Comments",
      "fields": [
        {
          "id": "engine_power_comments",
          "label": "Comments (for 'No' answers in Engine/Power section)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_checklist_vessel_closeup",
      "title": "Vessel Close-up Checklist",
      "type": "checklist_group",
      "items": [
        {"id": "close_stow_pfd_survival", "label": "Stow PFD survival equipment"},
        {"id": "close_remove_stow_drain_plug", "label": "Remove and stow drain Plug"},
        {"id": "close_lock_cabin_compartments", "label": "Lock cabin, other compartments"},
        {"id": "close_set_canvas_vinyl", "label": "Set Canvas, Vinyl"},
        {"id": "close_stow_portable_electronics", "label": "Stow portable electronics"},
        {"id": "close_remove_trash", "label": "Remove Trash"},
        {"id": "close_stow_charts_nav_tools", "label": "Stow charts, navigation tools"},
        {"id": "close_lsa_checked_stored", "label": "All LSA checked and properly stored"},
        {"id": "close_overall_condition_vessel", "label": "Overall condition of vessel. Any visible erosion or rust?"}
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No", "N/A"],
          "required": true
        }
      ]
    },
    {
      "id": "section_comments_vessel_closeup",
      "title": "Vessel Close-up Comments",
      "fields": [
        {
          "id": "vessel_closeup_comments",
          "label": "Comments (for 'No' answers in Vessel Close-up section)",
          "type": "textarea",
          "required": false
        }
      ]
    }
    // Note: No signature block present in the PDF text for this checklist.
  ]
}
```



#### Pre-Departure Checklist.json

```json
{
  "title": "Pre-Departure Checklist",
  "sections": [
    {
      "id": "section_header",
      "title": "Checklist Details",
      "fields": [
        {
          "id": "checklist_date",
          "label": "Date",
          "type": "date",
          "required": true
        },
        {
          "id": "checklist_time",
          "label": "Time",
          "type": "time", // Assuming time input is needed
          "required": true
        }
        // Note: The trip selection link is likely part of the app logic, not the form itself.
      ]
    },
    {
      "id": "section_engine_room",
      "title": "Engine Room",
      "type": "checklist_group",
      "items": [
        {
          "id": "me_oil_level",
          "label": "Main Engines: Check oil level"
        },
        {
          "id": "me_coolant_level",
          "label": "Main Engines: Check fresh water coolant level"
        },
        {
          "id": "me_belt_tension",
          "label": "Main Engines: Check water pump and alternator belt tension"
        },
        {
          "id": "me_sea_strainer",
          "label": "Main Engines: Check sea strainer"
        },
        {
          "id": "me_fuel_leaks",
          "label": "Main Engines: Check for any fuel leaks from the tank, fuel lines, and carburetor"
        },
        {
          "id": "gen_oil_level",
          "label": "Generators: Check oil level"
        },
        {
          "id": "gen_coolant_level",
          "label": "Generators: Check fresh water coolant level"
        },
        {
          "id": "gen_belt_tension",
          "label": "Generators: Check water pump and alternator belt tension"
        },
        {
          "id": "gen_sea_strainer",
          "label": "Generators: Check sea strainer"
        },
        {
          "id": "fuel_level",
          "label": "Fuel System: Check fuel level"
        },
        {
          "id": "fuel_leaks",
          "label": "Fuel System: Check for oil leaks" // Assuming this means fuel leaks, based on context
        },
        {
          "id": "extra_fuel_oil",
          "label": "Extra Fuel and Oil" // This seems like a check if available, needs clarification
        },
        {
          "id": "bilge_water_level",
          "label": "Bilge System: Check water level"
        },
        {
          "id": "bilge_dryness_pumps",
          "label": "Bilge System: Check bilges are reasonably dry and that pumps are not running excessively"
        },
        {
          "id": "steering_test",
          "label": "Test Steering (free movement)"
        },
        {
          "id": "gauges_check",
          "label": "Check Gauges"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No", "N/A"],
          "required": true
        }
      ],
      "fields": [ // Added for the section comment
        {
          "id": "engine_comments",
          "label": "Comments",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_navigation",
      "title": "Navigation",
      "type": "checklist_group",
      "items": [
        {
          "id": "nav_passage_plan",
          "label": "Passage Plan Ready"
        },
        {
          "id": "nav_charts_updated",
          "label": "Navigation charts available and updated"
        },
        {
          "id": "nav_contact_list",
          "label": "Emergency contact list updated"
        },
        {
          "id": "nav_weather_forecast",
          "label": "Check the Weather Forecast"
        },
        {
          "id": "nav_rules_onboard",
          "label": "Navigation rules onboard"
        },
        {
          "id": "nav_lights_ready",
          "label": "Navigation lights ready"
        },
        {
          "id": "nav_ventilation",
          "label": "Proper Ventilation"
        },
        {
          "id": "nav_distress_signals",
          "label": "Visual Distress Signals ready"
        },
        {
          "id": "nav_vhf_ssb",
          "label": "Navigation Electronics: All VHF, SSB Radios are receiving and transmitting"
        },
        {
          "id": "nav_horn",
          "label": "Navigation Electronics: Horn working"
        },
        {
          "id": "nav_epirb",
          "label": "Navigation Electronics: Locate EPIRB, check battery expiration date is good"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No", "N/A"],
          "required": true
        }
      ],
      "fields": [
        {
          "id": "navigation_comments",
          "label": "Comments",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_vessel_safety",
      "title": "Vessel Safety",
      "type": "checklist_group",
      "items": [
        {
          "id": "safety_liferaft_capacity",
          "label": "Life raft(s) capacity correct for everyone on board"
        },
        {
          "id": "safety_radios_located",
          "label": "Locate radios"
        },
        {
          "id": "safety_flares_checked",
          "label": "Emergency signal flares expiration dates checked"
        },
        {
          "id": "safety_fire_extinguishers",
          "label": "Fire extinguishers fully charged and ready"
        },
        {
          "id": "safety_first_aid",
          "label": "First Aid supplies on board"
        },
        {
          "id": "safety_life_rings",
          "label": "Locate life rings"
        },
        {
          "id": "safety_drills_done",
          "label": "Safety drills done"
        },
        {
          "id": "safety_certs_updated",
          "label": "All Vessel registrations, certifications updated onboard"
        },
        {
          "id": "safety_food_water",
          "label": "Enough Food and water for crew and passengers"
        },
        {
          "id": "safety_flashlights",
          "label": "Flashlights and spare batteries"
        },
        {
          "id": "safety_abandon_ship_kit",
          "label": "Location of abandon ship kit"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No", "N/A"],
          "required": true
        }
      ]
      // No separate comment field mentioned for this section in the text
    },
    {
      "id": "section_equipment",
      "title": "Equipment",
      "type": "checklist_group",
      "items": [
        {
          "id": "equip_hull_secured",
          "label": "Hull, portholes, stern hatches all secured or closed"
        },
        {
          "id": "equip_anchor_ready",
          "label": "Ensure Anchor is ready for use"
        },
        {
          "id": "equip_gps_ready",
          "label": "GPS ready, giving correct reading"
        },
        {
          "id": "equip_wing_stations",
          "label": "Wing stations ready"
        },
        {
          "id": "equip_radars_operational",
          "label": "Radars signals operational"
        },
        {
          "id": "equip_docking_lines",
          "label": "Docking lines in sufficient quantity, length and size"
        },
        {
          "id": "equip_mooring_heaving_lines",
          "label": "Mooring Lines and Heaving line"
        },
        {
          "id": "equip_toolbox",
          "label": "Toolbox of tools and spare parts for emergency boat repairs"
        },
        {
          "id": "equip_magnetic_compass",
          "label": "Magnetic Compass working"
        },
        {
          "id": "equip_vessel_plug",
          "label": "Ensure vessel Plug is properly installed"
        },
        {
          "id": "equip_backup_propulsion",
          "label": "Back-up propulsion source (spare engine, sail, paddles or oars)"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No", "N/A"],
          "required": true
        }
      ],
      "fields": [
        {
          "id": "equipment_comments",
          "label": "Comments",
          "type": "textarea",
          "required": false
        }
      ]
    }
    // Signature section is missing from the text, assume it's handled by the overall task submission/user context
  ]
}
```



#### Preparation for Arrival - Engine Room.json

```json
{
  "title": "Preparation for Arrival – Engine Room",
  "sections": [
    {
      "id": "section_header",
      "title": "Voyage Information",
      "fields": [
        {
          "id": "ship_name",
          "label": "Ship",
          "type": "text",
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call Sign",
          "type": "text",
          "required": false
        },
        {
          "id": "inmo_no",
          "label": "INMO No",
          "type": "text",
          "required": false
        },
        {
          "id": "voyage_no",
          "label": "Voyage No.",
          "type": "text",
          "required": false
        },
        {
          "id": "checklist_date",
          "label": "Date",
          "type": "date",
          "required": true
        },
        {
          "id": "port_departure", // Still relevant contextually
          "label": "Port of departure",
          "type": "text",
          "required": false
        },
        {
          "id": "next_port_call", // Port of arrival
          "label": "Next port of call (Arrival Port)",
          "type": "text",
          "required": true
        }
      ]
    },
    {
      "id": "section_checklist_checked_ready",
      "title": "Checked and Made Ready for Arrival", // Adjusted title
      "type": "checklist_group",
      "items": [
        {
          "id": "chk_running_generator_op",
          "label": "Running generator checked for normal operation"
        },
        {
          "id": "chk_standby_generator_parallel",
          "label": "Stand-by generator checked and paralleled to switchboard"
        },
        {
          "id": "chk_main_engine_lube_oil_levels",
          "label": "Main engine lube. Oil sump and service tank levels including governors, turbochargers"
        },
        {
          "id": "chk_main_engine_cooling_water_levels",
          "label": "Main engine cooling water header tanks"
        },
        {
          "id": "chk_main_engine_speed_reduced",
          "label": "Main engine speed/power reduced according to Manufacturer’s recommendations in preparation for maneuvering"
        },
        {
          "id": "chk_main_engine_maneuvering_tested",
          "label": "Maneuvering of the main engine tested ahead and astern"
        },
        {
          "id": "chk_changeover_diesel_oil_prep",
          "label": "Preparations made to change over to diesel oil as required"
        },
        {
          "id": "chk_standby_pumps_ready_auto",
          "label": "Stand-by pumps ready, all valves open and in auto-start mode"
        },
        {
          "id": "chk_ballast_conditions_1", // Duplicated in PDF, kept separate for fidelity
          "label": "Ballast conditions"
        },
        {
          "id": "chk_air_bottles_filled_valves_open",
          "label": "Air bottles filled and relevant valves opened"
        },
        {
          "id": "chk_daily_service_tanks_topped",
          "label": "Daily service tanks topped up as required"
        },
        {
          "id": "chk_steering_gear_checked_tested",
          "label": "Steering gear checked and tested including operation of pumps, oil levels, etc."
        },
        {
          "id": "chk_ballast_conditions_2", // Duplicated in PDF
          "label": "Ballast conditions"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks (if No)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_checklist_tested_synchronized",
      "title": "Tested, Synchronized and Found Ready for Use",
      "type": "checklist_group",
      "items": [
        {
          "id": "chk_test_bridge_engine_telegraphs",
          "label": "Bridge and engine room telegraphs"
        },
        {
          "id": "chk_test_rpm_indicators",
          "label": "Rpm indicators"
        },
        {
          "id": "chk_test_emergency_engine_stops",
          "label": "Emergency engine stops"
        },
        {
          "id": "chk_test_thruster_controls",
          "label": "Thruster controls and indicators, if fitted"
        },
        {
          "id": "chk_test_cpp_controls",
          "label": "Controllable pitch propeller controls and indicators, if fitted"
        },
        {
          "id": "chk_test_communication_facilities",
          "label": "Communication facilities, including bridge/engine room/steering gear telephones, radios"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks (if No)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_checklist_carried_out",
      "title": "Carried Out",
      "type": "checklist_group",
      "items": [
        {
          "id": "chk_ce_standby_called",
          "label": "Chief Engineer and stand-by watch-keepers called"
        },
        {
          "id": "chk_power_supplied_deck_machinery",
          "label": "Power supplied to windlasses/winches/capstans"
        },
        {
          "id": "chk_bilge_overboards_secured_1", // Duplicated in PDF
          "label": "Bilge over boards secured"
        },
        {
          "id": "chk_bilge_overboards_secured_2", // Duplicated in PDF
          "label": "Bilge over boards secured"
        },
        {
          "id": "chk_fw_generator_shutdown",
          "label": "Fresh water generator shut-down"
        },
        {
          "id": "chk_log_tubes_stabilizers_housed",
          "label": "Log tubes and stabilizers housed, if fitted"
        },
        {
          "id": "chk_sewage_discharge_transferred",
          "label": "Sewage treatment discharge transferred accordingly"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks (if No)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_other_checks",
      "title": "Other Checks",
      "fields": [
        {
          "id": "other_checks_details",
          "label": "Details of other checks performed",
          "type": "textarea",
          "required": false
        }
      ]
    }
    // Note: No signature block present in the PDF text for this checklist.
  ]
}
```



#### Preparation for Sea - Engine Room.json

```json
{
  "title": "Preparation for Sea – Engine Room",
  "sections": [
    {
      "id": "section_header",
      "title": "Voyage Information",
      "fields": [
        {
          "id": "ship_name",
          "label": "Ship",
          "type": "text",
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call Sign",
          "type": "text",
          "required": false
        },
        {
          "id": "inmo_no",
          "label": "INMO No",
          "type": "text",
          "required": false
        },
        {
          "id": "voyage_no",
          "label": "Voyage No.",
          "type": "text",
          "required": false
        },
        {
          "id": "checklist_date",
          "label": "Date",
          "type": "date",
          "required": true
        },
        {
          "id": "port_departure",
          "label": "Port of departure",
          "type": "text",
          "required": true
        },
        {
          "id": "next_port_call",
          "label": "Next port of call",
          "type": "text",
          "required": true
        }
      ]
    },
    {
      "id": "section_checklist_checked_ready",
      "title": "Checked and Made Ready for Departure",
      "type": "checklist_group",
      "items": [
        {
          "id": "chk_running_generator_op",
          "label": "Running generator checked for normal operation"
        },
        {
          "id": "chk_standby_generator_parallel",
          "label": "Stand-by generator checked and paralleled to switchboard"
        },
        {
          "id": "chk_main_engine_lube_oil_levels",
          "label": "Main engine lube. Oil sump and service tank levels including governors, turbochargers"
        },
        {
          "id": "chk_main_engine_cooling_water_levels",
          "label": "Main engine cooling water header tanks"
        },
        {
          "id": "chk_main_engine_prepared_manufacturer",
          "label": "Main engine prepared according to Manufacturer’s recommendations regarding Warming through, priming fuel valves, lubricating, turning, turning on air (check with bridge prior to), etc."
        },
        {
          "id": "chk_air_bottles_filled_valves_open",
          "label": "Air bottles filled and relevant valves opened"
        },
        {
          "id": "chk_daily_service_tanks_topped",
          "label": "Daily service tanks topped up as required"
        },
        {
          "id": "chk_steering_gear_checked_tested",
          "label": "Steering gear checked and tested including operation of pumps, oil levels, etc"
        },
        {
          "id": "chk_ballast_conditions",
          "label": "Ballast conditions"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks (if No)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_checklist_tested_synchronized",
      "title": "Tested, Synchronized and Found Ready for Use",
      "type": "checklist_group",
      "items": [
        {
          "id": "chk_test_bridge_engine_telegraphs",
          "label": "Bridge and engine room telegraphs"
        },
        {
          "id": "chk_test_rpm_indicators",
          "label": "RPM indicators"
        },
        {
          "id": "chk_test_emergency_engine_stops",
          "label": "Emergency engine stops"
        },
        {
          "id": "chk_test_thruster_controls",
          "label": "Thruster controls and indicators, if fitted"
        },
        {
          "id": "chk_test_cpp_controls",
          "label": "Controllable pitch propeller controls and indicators, if fitted"
        },
        {
          "id": "chk_test_communication_facilities",
          "label": "Communication facilities, including bridge/engine room/steering gear telephones, radios"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks (if No)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_checklist_carried_out",
      "title": "Carried Out",
      "type": "checklist_group",
      "items": [
        {
          "id": "chk_ce_standby_called",
          "label": "Chief Engineer and stand-by watch-keepers called"
        },
        {
          "id": "chk_spares_stores_stowed",
          "label": "All spares, stores, loose equipment, etc. properly stowed"
        },
        {
          "id": "chk_er_hatches_wt_doors_secured",
          "label": "Engine room hatches and watertight doors secured"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks (if No)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_checklist_sufficient_voyage",
      "title": "Checked and Found Sufficient for Intended Voyage",
      "type": "checklist_group",
      "items": [
        {
          "id": "chk_sufficient_bunkers",
          "label": "Bunkers"
        },
        {
          "id": "chk_sufficient_water",
          "label": "Water"
        },
        {
          "id": "chk_sufficient_lube_oil",
          "label": "Lube. Oil"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks (if No)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_other_checks",
      "title": "Other Checks",
      "fields": [
        {
          "id": "other_checks_details",
          "label": "Details of other checks performed",
          "type": "textarea",
          "required": false
        }
      ]
    }
    // Note: No signature block present in the PDF text for this checklist.
  ]
}
```



#### Preparation for Sea.json

```json
{
  "title": "Preparation for Sea",
  "sections": [
    {
      "id": "section_header",
      "title": "Voyage Information",
      "fields": [
        {
          "id": "ship_name",
          "label": "Ship",
          "type": "text",
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call Sign",
          "type": "text",
          "required": false
        },
        {
          "id": "inmo_no",
          "label": "INMO No",
          "type": "text",
          "required": false
        },
        {
          "id": "voyage_no",
          "label": "Voyage No.",
          "type": "text",
          "required": false
        },
        {
          "id": "checklist_date",
          "label": "Date",
          "type": "date",
          "required": true
        },
        {
          "id": "port_departure",
          "label": "Port of departure",
          "type": "text",
          "required": true
        },
        {
          "id": "next_port_call",
          "label": "Next port of call",
          "type": "text",
          "required": true
        }
      ]
    },
    {
      "id": "section_checklist",
      "title": "Items to Check",
      "type": "checklist_group",
      "items": [
        {
          "id": "chk_passage_plan",
          "label": "Has a passage plan for the intended voyage been prepared? (see section 2)"
        },
        {
          "id": "chk_equip_anchors",
          "label": "Has the following equipment been checked and found ready for use? Anchors"
        },
        {
          "id": "chk_equip_bridge_movement_book",
          "label": "Has the following equipment been checked and found ready for use? Bridge movement book/course and engine movement recorder"
        },
        {
          "id": "chk_equip_echo_sounder",
          "label": "Has the following equipment been checked and found ready for use? Echo sounder"
        },
        {
          "id": "chk_equip_electronic_nav_systems",
          "label": "Has the following equipment been checked and found ready for use? Electronic navigational position fixing systems"
        },
        {
          "id": "chk_equip_gyro_magnetic_compass",
          "label": "Has the following equipment been checked and found ready for use? Gyro/magnetic compass and repeaters"
        },
        {
          "id": "chk_equip_radars",
          "label": "Has the following equipment been checked and found ready for use? Radar(s)"
        },
        {
          "id": "chk_equip_speed_distance_recorder",
          "label": "Has the following equipment been checked and found ready for use? Speed/distance recorder"
        },
        {
          "id": "chk_equip_clocks",
          "label": "Has the following equipment been checked and found ready for use? Clocks"
        },
        {
          "id": "chk_test_bridge_engine_telegraphs",
          "label": "Has the following equipment been tested, synchronized and found ready for use? Bridge and engine room telegraphs"
        },
        {
          "id": "chk_test_rpm_indicators",
          "label": "Has the following equipment been tested, synchronized and found ready for use? Rpm indicators"
        },
        {
          "id": "chk_test_emergency_engine_stops",
          "label": "Has the following equipment been tested, synchronized and found ready for use? Emergency engine stops"
        },
        {
          "id": "chk_test_thruster_controls",
          "label": "Has the following equipment been tested, synchronized and found ready for use? Thruster controls and indicators, if fitted"
        },
        {
          "id": "chk_test_comms_bridge_er_mooring",
          "label": "Has the following equipment been tested, synchronized and found ready for use? Communications facilities, including Bridge to engine room/mooring station communications"
        },
        {
          "id": "chk_test_comms_vhf_port",
          "label": "Has the following equipment been tested, synchronized and found ready for use? Communications facilities, including VHF radio communications with Port Authority"
        },
        {
          "id": "chk_test_nav_signal_lights",
          "label": "Has the following equipment been tested, synchronized and found ready for use? Navigation and signal lights, including Searchlights, signaling lamp, morse light"
        },
        {
          "id": "chk_test_sound_signaling",
          "label": "Has the following equipment been tested, synchronized and found ready for use? Sound signaling apparatus, including Whistles, Fog bell and gong system"
        },
        {
          "id": "chk_test_steering_gear",
          "label": "Has the following equipment been tested, synchronized and found ready for use? Steering gear including manual, auto-pilot and emergency changeover arrangements and rudder indicators (see annex 7)"
        },
        {
          "id": "chk_test_window_wiper_clear_view",
          "label": "Has the following equipment been tested, synchronized and found ready for use? Window wiper/clear view screen arrangements"
        },
        {
          "id": "chk_secure_cargo_equipment",
          "label": "Is the vessel secure for sea? Cargo and cargo handling equipment secure"
        },
        {
          "id": "chk_secure_hull_openings",
          "label": "Is the vessel secure for sea? All hull openings secure and watertight"
        },
        {
          "id": "chk_secure_ramps_closed",
          "label": "Is the vessel secure for sea? Bow / Side / Aft Ramps have been closed and watertight"
        },
        {
          "id": "chk_secure_cargo_passenger_details",
          "label": "Is the vessel secure for sea? Cargo/passenger details available"
        },
        {
          "id": "chk_secure_stability_draught_info",
          "label": "Is the vessel secure for sea? Stability and draught information available"
        },
        {
          "id": "chk_all_crew_onboard",
          "label": "Are all the crew on board and all shore personnel ashore?"
        },
        {
          "id": "chk_pilot_disembarkation",
          "label": "Are the pilot disembarkation arrangements in place? (see annex 5)"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks (if No)",
          "type": "textarea",
          "required": false // Conditionally required if No
        }
      ]
    },
    {
      "id": "section_signatures",
      "title": "Signatures",
      "fields": [
        {
          "id": "master_signature",
          "label": "Requested by: Master (Signature / Name / Date)",
          "type": "signature_block",
          "required": true
        },
        {
          "id": "dpa_signature",
          "label": "Office use only: DPA (Signature / Name / Date)",
          "type": "signature_block",
          "required": false
        }
      ]
    }
  ]
}
```



#### Risk Assessment.json

```json
{
  "title": "Risk Assessment",
  "sections": [
    {
      "id": "section_general_info",
      "title": "Report General Information",
      "fields": [
        {
          "id": "vessel_name",
          "label": "Vessel name",
          "type": "text",
          "required": true
        },
        {
          "id": "reporting_by",
          "label": "Reporting By",
          "type": "user_select",
          "required": true
        },
        {
          "id": "assessment_date",
          "label": "Date",
          "type": "date",
          "required": true
        },
        {
          "id": "assessment_time",
          "label": "Time",
          "type": "time",
          "required": true
        },
        {
          "id": "assessment_location",
          "label": "Location of Assessment",
          "type": "text",
          "required": true
        }
      ]
    },
    {
      "id": "section_assessment_info",
      "title": "Assessment Information",
      "fields": [
        {
          "id": "risk_level",
          "label": "Risk level",
          "type": "radio",
          "options": ["None", "Low", "Medium", "High"],
          "required": true
        },
        {
          "id": "risk_identification",
          "label": "Identify the risk in detail",
          "type": "textarea",
          "required": true
        },
        {
          "id": "existing_control_measures",
          "label": "What existing control measures are in place to reduce the risk",
          "type": "textarea",
          "required": false
        },
        {
          "id": "further_recommendations",
          "label": "What further recommendations are required to reduce the risk",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_signature",
      "title": "Management Signature",
      "fields": [
        {
          "id": "management_signature",
          "label": "Management Signature & Date",
          "type": "signature_block",
          "required": true
        }
      ]
    }
  ]
}
```



#### Safety Alarms Monthly Check.json

```json
{
  "title": "Safety Alarms Monthly Check",
  "sections": [
    {
      "id": "section_header",
      "title": "Vessel Information",
      "fields": [
        {
          "id": "ship_name",
          "label": "Ship",
          "type": "text",
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call Sign",
          "type": "text",
          "required": false
        },
        {
          "id": "inmo_no",
          "label": "INMO No",
          "type": "text",
          "required": false
        }
      ]
    },
    {
      "id": "section_main_engine",
      "title": "Main Engine Alarms",
      "type": "repeating_group", // Represents a set of related alarm checks
      "items": [
        {
          "id": "me_lub_oil_alarm",
          "label": "Lub Oil Alarm",
          "fields": [
            {"id": "setting", "label": "Setting", "type": "text"},
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        },
        {
          "id": "me_lub_oil_trip",
          "label": "Lub Oil Trip",
          "fields": [
            {"id": "setting", "label": "Setting", "type": "text"},
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        },
        {
          "id": "me_jacket_cw_alarm",
          "label": "Jacket CW Alarm",
          "fields": [
            {"id": "setting", "label": "Setting", "type": "text"},
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        },
        {
          "id": "me_jacket_cw_trip",
          "label": "Jacket CW Trip",
          "fields": [
            {"id": "setting", "label": "Setting", "type": "text"},
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        },
        {
          "id": "me_piston_cw_alarm",
          "label": "Piston CW Alarm",
          "fields": [
            {"id": "setting", "label": "Setting", "type": "text"},
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        },
        {
          "id": "me_piston_cw_trip",
          "label": "Piston CW Trip",
          "fields": [
            {"id": "setting", "label": "Setting", "type": "text"},
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        }
      ]
    },
    {
      "id": "section_boiler",
      "title": "Boiler Alarms",
      "type": "repeating_group",
      "items": [
        {
          "id": "boiler_low_level_alarm",
          "label": "Low Level Alarm",
          "fields": [
            {"id": "setting", "label": "Setting", "type": "text"},
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        },
        {
          "id": "boiler_low_level_trip",
          "label": "Low Level Trip",
          "fields": [
            {"id": "setting", "label": "Setting", "type": "text"},
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        },
        {
          "id": "boiler_hi_level_alarm",
          "label": "Hi Level Alarm",
          "fields": [
            {"id": "setting", "label": "Setting", "type": "text"},
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        },
        {
          "id": "boiler_hi_level_trip",
          "label": "Hi Level Trip",
          "fields": [
            {"id": "setting", "label": "Setting", "type": "text"},
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        },
        {
          "id": "boiler_flame_fail_alarm",
          "label": "Flame Failure Alarm",
          "fields": [
            {"id": "setting", "label": "Setting", "type": "text"},
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        },
        {
          "id": "boiler_flame_fail_trip",
          "label": "Flame Failure Trip",
          "fields": [
            {"id": "setting", "label": "Setting", "type": "text"},
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        }
      ]
    },
    {
      "id": "section_diesel_generators",
      "title": "Diesel Generator Alarms",
      "type": "array", // Represents multiple instances of the same group
      "max_items": 4,
      "item_label": "Generator",
      "item_structure": {
        "type": "repeating_group",
        "items": [
          {
            "id": "dg_lub_oil_alarm",
            "label": "Lub Oil Alarm",
            "fields": [
              {"id": "date_tested", "label": "Date Tested", "type": "date"},
              {"id": "results", "label": "Results", "type": "textarea"}
            ]
          },
          {
            "id": "dg_lub_oil_trip",
            "label": "Lub Oil Trip",
            "fields": [
              {"id": "date_tested", "label": "Date Tested", "type": "date"},
              {"id": "results", "label": "Results", "type": "textarea"}
            ]
          },
          {
            "id": "dg_cw_alarm",
            "label": "CW Alarm",
            "fields": [
              {"id": "date_tested", "label": "Date Tested", "type": "date"},
              {"id": "results", "label": "Results", "type": "textarea"}
            ]
          },
          {
            "id": "dg_cw_trip",
            "label": "CW Trip",
            "fields": [
              {"id": "date_tested", "label": "Date Tested", "type": "date"},
              {"id": "results", "label": "Results", "type": "textarea"}
            ]
          },
          {
            "id": "dg_overspeed_trip",
            "label": "Over Speed Trip",
            "fields": [
              {"id": "date_tested", "label": "Date Tested", "type": "date"},
              {"id": "results", "label": "Results", "type": "textarea"}
            ]
          }
        ]
      }
    },
    {
      "id": "section_turbo_generator",
      "title": "Turbo Generator Alarms",
      "type": "repeating_group",
      "items": [
        {
          "id": "tg_lub_oil_alarm",
          "label": "Lub Oil Alarm",
          "fields": [
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        },
        {
          "id": "tg_lub_oil_trip",
          "label": "Lub Oil Trip",
          "fields": [
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        },
        {
          "id": "tg_overspeed_trip",
          "label": "Over Speed Trip",
          "fields": [
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        }
      ]
    },
    {
      "id": "section_cargo_pump_turbines",
      "title": "Cargo Pump Turbine Alarms",
      "type": "array",
      "max_items": 4,
      "item_label": "Turbine",
      "item_structure": {
        "type": "repeating_group",
        "items": [
          {
            "id": "cpt_lub_oil_alarm",
            "label": "Lub Oil Alarm",
            "fields": [
              {"id": "date_tested", "label": "Date Tested", "type": "date"},
              {"id": "results", "label": "Results", "type": "textarea"}
            ]
          },
          {
            "id": "cpt_lub_oil_trip",
            "label": "Lub Oil Trip",
            "fields": [
              {"id": "date_tested", "label": "Date Tested", "type": "date"},
              {"id": "results", "label": "Results", "type": "textarea"}
            ]
          },
          {
            "id": "cpt_remote_trip",
            "label": "Remote Trip",
            "fields": [
              {"id": "date_tested", "label": "Date Tested", "type": "date"},
              {"id": "results", "label": "Results", "type": "textarea"}
            ]
          }
        ]
      }
    },
    {
      "id": "section_bilge_alarm",
      "title": "Bilge Alarm",
      "type": "repeating_group", // Single item group for consistency
      "items": [
        {
          "id": "bilge_alarm",
          "label": "Bilge Alarm",
          "fields": [
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        }
      ]
    },
    {
      "id": "section_signatures",
      "title": "Signatures",
      "fields": [
        {
          "id": "ch_eng_signature",
          "label": "Ch.Eng (Signature / Name / Date)",
          "type": "signature_block",
          "required": true
        },
        {
          "id": "dpa_signature",
          "label": "DPA (Signature / Name / Date)",
          "type": "signature_block",
          "required": false // Assuming DPA signature is for office use
        }
      ]
    }
  ]
}
```



#### Safety Checklist Monthly - Mooring Lines Working Conditions and Environment.json

```json
{
  "title": "Safety Checklist Monthly - Mooring Lines, Working Conditions and Environment",
  "sections": [
    {
      "id": "section_header",
      "title": "Inspection Details",
      "fields": [
        {
          "id": "ship_name",
          "label": "Ship",
          "type": "text",
          "required": true
        },
        {
          "id": "area_inspected",
          "label": "AREA INSPECTED",
          "type": "text",
          "required": true
        },
        {
          "id": "inspection_date", // Added based on common practice, though not explicit
          "label": "Date of Inspection",
          "type": "date",
          "required": true
        }
      ]
    },
    {
      "id": "section_safe_movement",
      "title": "SAFE MOVEMENT",
      "type": "checklist_group",
      "items": [
        {
          "id": "chk_access_safe",
          "label": "Are means of access, if any, to the area under inspection (particularly ladders and stairs), in a safe condition, well lighted and unobstructed?"
        },
        {
          "id": "chk_danger_blocked",
          "label": "If any means of access is in a dangerous condition, for instance when a ladder has been removed, is the danger suitably blocked off and warning notices posted?"
        },
        {
          "id": "chk_hazards_marked",
          "label": "Are fixtures and fittings over which seamen might trip or otherwise represent a potential hazards, suitably painted and marked?"
        },
        {
          "id": "chk_access_clear",
          "label": "Is access through the area under inspection both for transit and working purposes clearly marked, well lighted, unobstructed and safe?"
        },
        {
          "id": "chk_gear_secured",
          "label": "Is any gear, which has to be stowed within the area, suitably secured?"
        },
        {
          "id": "chk_guardrails_ok",
          "label": "Are all guard-rails in place, secured and in good condition?"
        },
        {
          "id": "chk_openings_fenced",
          "label": "Are all openings through which a person could fall, suitably fenced?"
        },
        {
          "id": "chk_ladders_secured",
          "label": "If portable ladders are in use, are they properly secured and at safe angle?"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        }
        // No remarks column explicitly shown for this section in the text
      ]
    },
    {
      "id": "section_mooring_lines",
      "title": "MOORING LINES CHECKS",
      "description": "Flake mooring lines on deck and walk the entire length and document its overall condition.",
      "type": "checklist_group",
      "items": [
        {
          "id": "chk_abrasions_cuts",
          "label": "Any abrasions or cuts observed?"
        },
        {
          "id": "chk_kinks_deformation",
          "label": "Any kinks/twisting/deformation sighted in the mooring lines?"
        },
        {
          "id": "chk_diameter_consistent",
          "label": "Is the diameter of the mooring lines consistent?"
        },
        {
          "id": "chk_lines_tied_off",
          "label": "Are all mooring lines currently in use to secure the vessel suitably tied off on mooring cleats/bitts?"
        },
        {
          "id": "chk_discoloration_breakages",
          "label": "Is there any discoloration, compression, strand breakages, chafing observed?"
        },
        {
          "id": "chk_chafing_material",
          "label": "Is chafing material available and utilised to protect mooring lines in use?"
        },
        {
          "id": "chk_other_damage",
          "label": "Any other types of mechanical damage such as strong wear or general disaggregation observed?"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        }
      ]
    },
    {
      "id": "section_environment",
      "title": "ENVIRONMENT",
      "type": "checklist_group",
      "items": [
        {
          "id": "chk_lighting_adequate",
          "label": "Are lighting levels adequate?"
        },
        {
          "id": "chk_area_clear",
          "label": "Is the area clear of rubbish, combustible material, spilled oil etc?"
        },
        {
          "id": "chk_noise_protection",
          "label": "Are crew members adequately protected from exposure to noise when necessary?"
        },
        {
          "id": "chk_no_loose_tools",
          "label": "Are loose tools, stores and similar items left lying around unnecessarily?"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        }
      ]
    },
    {
      "id": "section_working_conditions",
      "title": "WORKING CONDITIONS",
      "type": "checklist_group",
      "items": [
        {
          "id": "chk_machinery_guarded",
          "label": "Is machinery adequately guarded where necessary?"
        },
        {
          "id": "chk_instructions_displayed",
          "label": "Are any necessary safe operating instructions clearly displayed?"
        },
        {
          "id": "chk_safety_signs_displayed",
          "label": "Are any necessary safety signs clearly displayed?"
        },
        {
          "id": "chk_permits_used",
          "label": "Are permits-to-work (MMS 507) used when necessary?"
        },
        {
          "id": "chk_ppe_worn",
          "label": "Are crew working in the area wearing any necessary protective clothing and equipment?"
        },
        {
          "id": "chk_ppe_condition",
          "label": "Are protective clothing and equipment in good condition and being correctly used?"
        },
        {
          "id": "chk_defective_plant",
          "label": "Is there any evidence of defective plant or equipment, and if so, what is being done to rectify?"
        },
        {
          "id": "chk_supervision_adequate",
          "label": "Is the level of supervision adequate, particularly for inexperienced crew?"
        },
        {
          "id": "chk_safety_improvements",
          "label": "Can any practicable occupational safety improvements be made?*"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        }
      ]
    },
    {
      "id": "section_other",
      "title": "OTHER",
      "type": "checklist_group",
      "items": [
        {
          "id": "chk_regs_complied",
          "label": "Are all statutory regulations and Company Safety Procedures being complied with?"
        },
        {
          "id": "chk_safety_advice_followed",
          "label": "Is the safety advice in publications such as the CODE OF SAFE WORKING PRACTICES FOR MERCHANT SEAMEN, M. NOTICES ETC. being followed where possible?"
        },
        {
          "id": "chk_crew_suggestions",
          "label": "Have the crew in the area any suggestions to make?*"
        },
        {
          "id": "chk_faults_rectified",
          "label": "Have any faults identified in previous inspections been rectified?"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        }
      ]
    },
    {
      "id": "section_signatures",
      "title": "Signatures",
      "fields": [
        {
          "id": "master_ce_signature",
          "label": "Master / Chief Engineer (Signature / Name / Date)",
          "type": "signature_block" // Custom type for combined signature/name/date
        },
        {
          "id": "dpa_signature",
          "label": "DPA (Signature / Name / Date)",
          "type": "signature_block"
        }
      ]
    }
  ]
}
```



#### Safety Meeting Minutes.json

```json
{
  "title": "Monthly Safety, Environmental Protection and Security Meeting Minutes",
  "sections": [
    {
      "id": "section_meeting_details",
      "title": "Meeting Details",
      "fields": [
        {
          "id": "vessel_name",
          "label": "VESSEL NAME",
          "type": "text",
          "required": true
        },
        {
          "id": "meeting_date",
          "label": "DATE OF MEETING",
          "type": "date",
          "required": true
        },
        {
          "id": "time_started",
          "label": "TIME STARTED",
          "type": "time",
          "required": false
        },
        {
          "id": "time_ended",
          "label": "TIME ENDED",
          "type": "time",
          "required": false
        },
        {
          "id": "meeting_topic",
          "label": "MEETING TOPIC",
          "type": "text",
          "required": true
        }
      ]
    },
    {
      "id": "section_follow_up",
      "title": "Safety Meeting Follow-up",
      "fields": [
        {
          "id": "followup_q1_timely",
          "label": "1. WAS THE MEETING TOPIC TIMELY/HELPFUL?",
          "type": "radio",
          "options": ["YES", "NO"],
          "required": true
        },
        {
          "id": "followup_q2_participation",
          "label": "2. DID THE CREW PARTICIPATE IN THE MEETING?",
          "type": "radio",
          "options": ["YES", "NO"],
          "required": true
        },
        {
          "id": "followup_q3_factual",
          "label": "3. INFORMATION FOR THE MEETING WAS FACTUAL?",
          "type": "radio",
          "options": ["YES", "NO"],
          "required": true
        },
        {
          "id": "followup_q4_log_entry",
          "label": "4. DID YOU MAKE AN ENTRY IN THE VESSEL LOG DESCRIBING DATE, TIME AND TOPIC OF MEETING?",
          "type": "radio",
          "options": ["YES", "NO"],
          "required": true
        }
      ]
    },
    {
      "id": "section_attendees",
      "title": "Attendees",
      "description": "EVERYONE ATTENDING THE MEETING MUST SIGN BELOW:",
      "fields": [
        {
          "id": "attendee_signatures",
          "label": "Attendee Signatures",
          "type": "repeating_signature_block", // Custom type to handle multiple signatures
          "required": true
        }
      ]
    },
    {
      "id": "section_conductor",
      "title": "Meeting Conductor",
      "fields": [
        {
          "id": "conductor_signature",
          "label": "MEETING CONDUCTED BY (Signature / Name / Date)",
          "type": "signature_block",
          "required": true
        }
      ]
    },
    {
      "id": "section_minutes_comments",
      "title": "Meeting Minutes and Comments",
      "fields": [
        {
          "id": "minutes_prev_meeting",
          "label": "1. Minutes from Previous Meeting.",
          "type": "textarea",
          "required": false
        },
        {
          "id": "minutes_non_conformances",
          "label": "2. Non-Conformances.",
          "type": "textarea",
          "required": false
        },
        {
          "id": "minutes_hazard_analysis",
          "label": "3. Analysis of Hazardous Occurrences and Accidents.",
          "type": "textarea",
          "required": false
        },
        {
          "id": "minutes_drill_review",
          "label": "4. Review of Drills Carried Out.",
          "type": "textarea",
          "required": false
        },
        {
          "id": "minutes_security_issues",
          "label": "5. Security Issues.",
          "type": "textarea",
          "required": false
        },
        {
          "id": "minutes_sms_improvements",
          "label": "6. Suggested improvements to the SMS.",
          "type": "textarea",
          "required": false
        },
        {
          "id": "minutes_other_issues",
          "label": "7. Any Other Issues.",
          "type": "textarea",
          "required": false
        },
        {
          "id": "further_actions_required",
          "label": "Further Actions Required?",
          "type": "textarea", // Changed from Yes/No to allow description
          "required": false
        }
      ]
    },
    {
      "id": "section_office_use",
      "title": "Office Use Only",
      "fields": [
        {
          "id": "master_signature",
          "label": "Master (Signature / Name / Date)",
          "type": "signature_block",
          "required": false
        },
        {
          "id": "dpa_signature",
          "label": "DPA (Signature / Name / Date)",
          "type": "signature_block",
          "required": false
        }
      ]
    }
  ]
}
```



#### Security Familiarization.json

```json
{
  "title": "Security Familiarization",
  "sections": [
    {
      "id": "section_header",
      "title": "Seafarer & Vessel Information",
      "fields": [
        {
          "id": "ship_name",
          "label": "Ship",
          "type": "text",
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call Sign",
          "type": "text",
          "required": false
        },
        {
          "id": "inmo_no",
          "label": "INMO No",
          "type": "text",
          "required": false
        },
        {
          "id": "seafarer_name",
          "label": "Seafarer's Name",
          "type": "user_select", // Assuming selection of the crew member
          "required": true
        },
        {
          "id": "seafarer_position",
          "label": "Position",
          "type": "text",
          "required": false
        },
        {
          "id": "place_joining",
          "label": "Place of Joining",
          "type": "text",
          "required": false
        },
        {
          "id": "date_joining",
          "label": "Date of Joining",
          "type": "date",
          "required": true
        }
      ]
    },
    {
      "id": "section_familiarization_checklist",
      "title": "Security Awareness Training and Familiarization by SSO",
      "description": "Sufficient knowledge and ability to perform his/her assigned security duties on board, i.e.",
      "type": "checklist_group",
      "items": [
        {
          "id": "chk_knowledge_threats_patterns",
          "label": "Knowledge of current security threats and patterns."
        },
        {
          "id": "chk_recognition_weapons_substances",
          "label": "Recognition and detection of weapons, dangerous substances and devices."
        },
        {
          "id": "chk_recognition_persons_threaten",
          "label": "Recognition, on a non-discriminatory basis, of characteristics and behavioral patterns of persons who are likely to threaten security."
        },
        {
          "id": "chk_crowd_management_circumvention",
          "label": "Crowd-management and control techniques, techniques to circumvent security measures and security related communications."
        },
        {
          "id": "chk_knowledge_emergency_procedures",
          "label": "Knowledge of emergency procedures and contingency plans."
        },
        {
          "id": "chk_operations_security_equipment",
          "label": "Operations of security equipment and systems."
        },
        {
          "id": "chk_inspections_control_monitoring",
          "label": "Inspections, control and monitoring techniques."
        },
        {
          "id": "chk_methods_physical_searches",
          "label": "Methods of physical searches of persons, personal effects, baggage, cargo and ship’s stores."
        },
        {
          "id": "chk_meaning_security_levels",
          "label": "The meaning and consequential requirements of the different security levels."
        }
      ],
      "columns": [
        {
          "id": "seafarer_initials",
          "label": "Seafarer's Initials",
          "type": "text",
          "required": false // Required per item confirmed
        },
        {
          "id": "training_officer_initials",
          "label": "Training Officer Initials",
          "type": "text",
          "required": false // Required per item confirmed
        }
      ]
    },
    {
      "id": "section_signatures",
      "title": "Signatures",
      "fields": [
        {
          "id": "seafarer_signature",
          "label": "On-Signing Seafarer (Signature / Name / Date)",
          "type": "signature_block",
          "required": true
        },
        {
          "id": "sso_signature",
          "label": "SSO (Signature / Name / Date)",
          "type": "signature_block",
          "required": true
        },
        {
          "id": "master_signature",
          "label": "Master (Signature / Name / Date)",
          "type": "signature_block",
          "required": false // Office use?
        },
        {
          "id": "dpa_signature",
          "label": "DPA (Signature / Name / Date)",
          "type": "signature_block",
          "required": false // Office use
        }
      ]
    }
  ]
}
```




### 7. Form Structure Definitions (`structure_definition` JSON)

Below are the generated JSON structure definitions for each form. These should be stored in the `structure_definition` field of the `form_template_versions` table. Each structure corresponds to one of the provided PDF forms.

---



#### Checklists




```json
{
  "title": "Working Aloft Checklist",
  "sections": [
    {
      "id": "section_header",
      "title": "Header Information", // Added a title for clarity
      "fields": [
        {
          "id": "port",
          "label": "Port",
          "type": "text",
          "required": false // Assuming not always required based on PDF layout
        },
        {
          "id": "vessel_name",
          "label": "Vessel",
          "type": "text",
          "required": true
        },
        {
          "id": "person_name",
          "label": "Name of person carrying out work",
          "type": "text",
          "required": true
        }
      ]
    },
    {
      "id": "section_checklist",
      "title": "The following must be checked before work is approved",
      "type": "checklist_group", 
      "items": [
        {
          "id": "chk_physically_fit",
          "label": "Is the person responsible for work in a physically fit condition for the work?"
        },
        {
          "id": "chk_appropriate_clothing",
          "label": "Is the person wearing appropriate clothing for the work?"
        },
        {
          "id": "chk_ppe_provided",
          "label": "Has the person been provided with adequate personal protective equipment?"
        },
        {
          "id": "chk_equipment_suitable",
          "label": "Are bosun chairs, stage boards, scaffoldings, ladders and any required equipment suitable for use?"
        },
        {
          "id": "chk_ropes_lifelines_checked",
          "label": "Has the condition and strength of ropes and lifelines been checked?"
        },
        {
          "id": "chk_equipment_damage_prevented",
          "label": "Has equipment been correctly and properly checked and measures taken to prevent damage?"
        },
        {
          "id": "chk_anti_falling_measures",
          "label": "Are there anti-falling measures in place?"
        },
        {
          "id": "chk_wind_speed_accounted",
          "label": "Has wind speed been accounted for, can the work be carried out safely?"
        },
        {
          "id": "chk_traffic_blocked",
          "label": "Has traffic under the working site been blocked?"
        },
        {
          "id": "chk_persons_notified",
          "label": "Before working in vicinity of radar scanner, funnel and whistle, have proper persons been notified?"
        },
        {
          "id": "chk_warning_notices_posted",
          "label": "Are warning notices posted?"
        },
        {
          "id": "chk_watchman_posted",
          "label": "Is watchman posted?"
        },
        {
          "id": "chk_ladders_set_correctly",
          "label": "If using portable ladders, have they been set correctly at suitable places?"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_signature",
      "title": "Confirmation",
      "fields": [
        {
          "id": "crew_signature",
          "label": "Crew member signature",
          "type": "signature",
          "required": true
        },
        {
          "id": "signature_date",
          "label": "Date",
          "type": "date",
          "required": true
        }
      ]
    }
  ]
}
```

---



```json
{
  "title": "Safety Checklist Monthly - Mooring Lines, Working Conditions and Environment",
  "sections": [
    {
      "id": "section_header",
      "title": "Inspection Details",
      "fields": [
        {
          "id": "ship_name",
          "label": "Ship",
          "type": "text",
          "required": true
        },
        {
          "id": "area_inspected",
          "label": "AREA INSPECTED",
          "type": "text",
          "required": true
        },
        {
          "id": "inspection_date", // Added based on common practice, though not explicit
          "label": "Date of Inspection",
          "type": "date",
          "required": true
        }
      ]
    },
    {
      "id": "section_safe_movement",
      "title": "SAFE MOVEMENT",
      "type": "checklist_group",
      "items": [
        {
          "id": "chk_access_safe",
          "label": "Are means of access, if any, to the area under inspection (particularly ladders and stairs), in a safe condition, well lighted and unobstructed?"
        },
        {
          "id": "chk_danger_blocked",
          "label": "If any means of access is in a dangerous condition, for instance when a ladder has been removed, is the danger suitably blocked off and warning notices posted?"
        },
        {
          "id": "chk_hazards_marked",
          "label": "Are fixtures and fittings over which seamen might trip or otherwise represent a potential hazards, suitably painted and marked?"
        },
        {
          "id": "chk_access_clear",
          "label": "Is access through the area under inspection both for transit and working purposes clearly marked, well lighted, unobstructed and safe?"
        },
        {
          "id": "chk_gear_secured",
          "label": "Is any gear, which has to be stowed within the area, suitably secured?"
        },
        {
          "id": "chk_guardrails_ok",
          "label": "Are all guard-rails in place, secured and in good condition?"
        },
        {
          "id": "chk_openings_fenced",
          "label": "Are all openings through which a person could fall, suitably fenced?"
        },
        {
          "id": "chk_ladders_secured",
          "label": "If portable ladders are in use, are they properly secured and at safe angle?"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        }
        // No remarks column explicitly shown for this section in the text
      ]
    },
    {
      "id": "section_mooring_lines",
      "title": "MOORING LINES CHECKS",
      "description": "Flake mooring lines on deck and walk the entire length and document its overall condition.",
      "type": "checklist_group",
      "items": [
        {
          "id": "chk_abrasions_cuts",
          "label": "Any abrasions or cuts observed?"
        },
        {
          "id": "chk_kinks_deformation",
          "label": "Any kinks/twisting/deformation sighted in the mooring lines?"
        },
        {
          "id": "chk_diameter_consistent",
          "label": "Is the diameter of the mooring lines consistent?"
        },
        {
          "id": "chk_lines_tied_off",
          "label": "Are all mooring lines currently in use to secure the vessel suitably tied off on mooring cleats/bitts?"
        },
        {
          "id": "chk_discoloration_breakages",
          "label": "Is there any discoloration, compression, strand breakages, chafing observed?"
        },
        {
          "id": "chk_chafing_material",
          "label": "Is chafing material available and utilised to protect mooring lines in use?"
        },
        {
          "id": "chk_other_damage",
          "label": "Any other types of mechanical damage such as strong wear or general disaggregation observed?"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        }
      ]
    },
    {
      "id": "section_environment",
      "title": "ENVIRONMENT",
      "type": "checklist_group",
      "items": [
        {
          "id": "chk_lighting_adequate",
          "label": "Are lighting levels adequate?"
        },
        {
          "id": "chk_area_clear",
          "label": "Is the area clear of rubbish, combustible material, spilled oil etc?"
        },
        {
          "id": "chk_noise_protection",
          "label": "Are crew members adequately protected from exposure to noise when necessary?"
        },
        {
          "id": "chk_no_loose_tools",
          "label": "Are loose tools, stores and similar items left lying around unnecessarily?"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        }
      ]
    },
    {
      "id": "section_working_conditions",
      "title": "WORKING CONDITIONS",
      "type": "checklist_group",
      "items": [
        {
          "id": "chk_machinery_guarded",
          "label": "Is machinery adequately guarded where necessary?"
        },
        {
          "id": "chk_instructions_displayed",
          "label": "Are any necessary safe operating instructions clearly displayed?"
        },
        {
          "id": "chk_safety_signs_displayed",
          "label": "Are any necessary safety signs clearly displayed?"
        },
        {
          "id": "chk_permits_used",
          "label": "Are permits-to-work (MMS 507) used when necessary?"
        },
        {
          "id": "chk_ppe_worn",
          "label": "Are crew working in the area wearing any necessary protective clothing and equipment?"
        },
        {
          "id": "chk_ppe_condition",
          "label": "Are protective clothing and equipment in good condition and being correctly used?"
        },
        {
          "id": "chk_defective_plant",
          "label": "Is there any evidence of defective plant or equipment, and if so, what is being done to rectify?"
        },
        {
          "id": "chk_supervision_adequate",
          "label": "Is the level of supervision adequate, particularly for inexperienced crew?"
        },
        {
          "id": "chk_safety_improvements",
          "label": "Can any practicable occupational safety improvements be made?*"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        }
      ]
    },
    {
      "id": "section_other",
      "title": "OTHER",
      "type": "checklist_group",
      "items": [
        {
          "id": "chk_regs_complied",
          "label": "Are all statutory regulations and Company Safety Procedures being complied with?"
        },
        {
          "id": "chk_safety_advice_followed",
          "label": "Is the safety advice in publications such as the CODE OF SAFE WORKING PRACTICES FOR MERCHANT SEAMEN, M. NOTICES ETC. being followed where possible?"
        },
        {
          "id": "chk_crew_suggestions",
          "label": "Have the crew in the area any suggestions to make?*"
        },
        {
          "id": "chk_faults_rectified",
          "label": "Have any faults identified in previous inspections been rectified?"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        }
      ]
    },
    {
      "id": "section_signatures",
      "title": "Signatures",
      "fields": [
        {
          "id": "master_ce_signature",
          "label": "Master / Chief Engineer (Signature / Name / Date)",
          "type": "signature_block" // Custom type for combined signature/name/date
        },
        {
          "id": "dpa_signature",
          "label": "DPA (Signature / Name / Date)",
          "type": "signature_block"
        }
      ]
    }
  ]
}
```

---



```json
{
  "title": "Safety Alarms Monthly Check",
  "sections": [
    {
      "id": "section_header",
      "title": "Vessel Information",
      "fields": [
        {
          "id": "ship_name",
          "label": "Ship",
          "type": "text",
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call Sign",
          "type": "text",
          "required": false
        },
        {
          "id": "inmo_no",
          "label": "INMO No",
          "type": "text",
          "required": false
        }
      ]
    },
    {
      "id": "section_main_engine",
      "title": "Main Engine Alarms",
      "type": "repeating_group", // Represents a set of related alarm checks
      "items": [
        {
          "id": "me_lub_oil_alarm",
          "label": "Lub Oil Alarm",
          "fields": [
            {"id": "setting", "label": "Setting", "type": "text"},
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        },
        {
          "id": "me_lub_oil_trip",
          "label": "Lub Oil Trip",
          "fields": [
            {"id": "setting", "label": "Setting", "type": "text"},
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        },
        {
          "id": "me_jacket_cw_alarm",
          "label": "Jacket CW Alarm",
          "fields": [
            {"id": "setting", "label": "Setting", "type": "text"},
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        },
        {
          "id": "me_jacket_cw_trip",
          "label": "Jacket CW Trip",
          "fields": [
            {"id": "setting", "label": "Setting", "type": "text"},
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        },
        {
          "id": "me_piston_cw_alarm",
          "label": "Piston CW Alarm",
          "fields": [
            {"id": "setting", "label": "Setting", "type": "text"},
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        },
        {
          "id": "me_piston_cw_trip",
          "label": "Piston CW Trip",
          "fields": [
            {"id": "setting", "label": "Setting", "type": "text"},
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        }
      ]
    },
    {
      "id": "section_boiler",
      "title": "Boiler Alarms",
      "type": "repeating_group",
      "items": [
        {
          "id": "boiler_low_level_alarm",
          "label": "Low Level Alarm",
          "fields": [
            {"id": "setting", "label": "Setting", "type": "text"},
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        },
        {
          "id": "boiler_low_level_trip",
          "label": "Low Level Trip",
          "fields": [
            {"id": "setting", "label": "Setting", "type": "text"},
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        },
        {
          "id": "boiler_hi_level_alarm",
          "label": "Hi Level Alarm",
          "fields": [
            {"id": "setting", "label": "Setting", "type": "text"},
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        },
        {
          "id": "boiler_hi_level_trip",
          "label": "Hi Level Trip",
          "fields": [
            {"id": "setting", "label": "Setting", "type": "text"},
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        },
        {
          "id": "boiler_flame_fail_alarm",
          "label": "Flame Failure Alarm",
          "fields": [
            {"id": "setting", "label": "Setting", "type": "text"},
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        },
        {
          "id": "boiler_flame_fail_trip",
          "label": "Flame Failure Trip",
          "fields": [
            {"id": "setting", "label": "Setting", "type": "text"},
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        }
      ]
    },
    {
      "id": "section_diesel_generators",
      "title": "Diesel Generator Alarms",
      "type": "array", // Represents multiple instances of the same group
      "max_items": 4,
      "item_label": "Generator",
      "item_structure": {
        "type": "repeating_group",
        "items": [
          {
            "id": "dg_lub_oil_alarm",
            "label": "Lub Oil Alarm",
            "fields": [
              {"id": "date_tested", "label": "Date Tested", "type": "date"},
              {"id": "results", "label": "Results", "type": "textarea"}
            ]
          },
          {
            "id": "dg_lub_oil_trip",
            "label": "Lub Oil Trip",
            "fields": [
              {"id": "date_tested", "label": "Date Tested", "type": "date"},
              {"id": "results", "label": "Results", "type": "textarea"}
            ]
          },
          {
            "id": "dg_cw_alarm",
            "label": "CW Alarm",
            "fields": [
              {"id": "date_tested", "label": "Date Tested", "type": "date"},
              {"id": "results", "label": "Results", "type": "textarea"}
            ]
          },
          {
            "id": "dg_cw_trip",
            "label": "CW Trip",
            "fields": [
              {"id": "date_tested", "label": "Date Tested", "type": "date"},
              {"id": "results", "label": "Results", "type": "textarea"}
            ]
          },
          {
            "id": "dg_overspeed_trip",
            "label": "Over Speed Trip",
            "fields": [
              {"id": "date_tested", "label": "Date Tested", "type": "date"},
              {"id": "results", "label": "Results", "type": "textarea"}
            ]
          }
        ]
      }
    },
    {
      "id": "section_turbo_generator",
      "title": "Turbo Generator Alarms",
      "type": "repeating_group",
      "items": [
        {
          "id": "tg_lub_oil_alarm",
          "label": "Lub Oil Alarm",
          "fields": [
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        },
        {
          "id": "tg_lub_oil_trip",
          "label": "Lub Oil Trip",
          "fields": [
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        },
        {
          "id": "tg_overspeed_trip",
          "label": "Over Speed Trip",
          "fields": [
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        }
      ]
    },
    {
      "id": "section_cargo_pump_turbines",
      "title": "Cargo Pump Turbine Alarms",
      "type": "array",
      "max_items": 4,
      "item_label": "Turbine",
      "item_structure": {
        "type": "repeating_group",
        "items": [
          {
            "id": "cpt_lub_oil_alarm",
            "label": "Lub Oil Alarm",
            "fields": [
              {"id": "date_tested", "label": "Date Tested", "type": "date"},
              {"id": "results", "label": "Results", "type": "textarea"}
            ]
          },
          {
            "id": "cpt_lub_oil_trip",
            "label": "Lub Oil Trip",
            "fields": [
              {"id": "date_tested", "label": "Date Tested", "type": "date"},
              {"id": "results", "label": "Results", "type": "textarea"}
            ]
          },
          {
            "id": "cpt_remote_trip",
            "label": "Remote Trip",
            "fields": [
              {"id": "date_tested", "label": "Date Tested", "type": "date"},
              {"id": "results", "label": "Results", "type": "textarea"}
            ]
          }
        ]
      }
    },
    {
      "id": "section_bilge_alarm",
      "title": "Bilge Alarm",
      "type": "repeating_group", // Single item group for consistency
      "items": [
        {
          "id": "bilge_alarm",
          "label": "Bilge Alarm",
          "fields": [
            {"id": "date_tested", "label": "Date Tested", "type": "date"},
            {"id": "results", "label": "Results", "type": "textarea"}
          ]
        }
      ]
    },
    {
      "id": "section_signatures",
      "title": "Signatures",
      "fields": [
        {
          "id": "ch_eng_signature",
          "label": "Ch.Eng (Signature / Name / Date)",
          "type": "signature_block",
          "required": true
        },
        {
          "id": "dpa_signature",
          "label": "DPA (Signature / Name / Date)",
          "type": "signature_block",
          "required": false // Assuming DPA signature is for office use
        }
      ]
    }
  ]
}
```

---



```json
{
  "title": "Pre-Departure Checklist",
  "sections": [
    {
      "id": "section_header",
      "title": "Checklist Details",
      "fields": [
        {
          "id": "checklist_date",
          "label": "Date",
          "type": "date",
          "required": true
        },
        {
          "id": "checklist_time",
          "label": "Time",
          "type": "time", // Assuming time input is needed
          "required": true
        }
        // Note: The trip selection link is likely part of the app logic, not the form itself.
      ]
    },
    {
      "id": "section_engine_room",
      "title": "Engine Room",
      "type": "checklist_group",
      "items": [
        {
          "id": "me_oil_level",
          "label": "Main Engines: Check oil level"
        },
        {
          "id": "me_coolant_level",
          "label": "Main Engines: Check fresh water coolant level"
        },
        {
          "id": "me_belt_tension",
          "label": "Main Engines: Check water pump and alternator belt tension"
        },
        {
          "id": "me_sea_strainer",
          "label": "Main Engines: Check sea strainer"
        },
        {
          "id": "me_fuel_leaks",
          "label": "Main Engines: Check for any fuel leaks from the tank, fuel lines, and carburetor"
        },
        {
          "id": "gen_oil_level",
          "label": "Generators: Check oil level"
        },
        {
          "id": "gen_coolant_level",
          "label": "Generators: Check fresh water coolant level"
        },
        {
          "id": "gen_belt_tension",
          "label": "Generators: Check water pump and alternator belt tension"
        },
        {
          "id": "gen_sea_strainer",
          "label": "Generators: Check sea strainer"
        },
        {
          "id": "fuel_level",
          "label": "Fuel System: Check fuel level"
        },
        {
          "id": "fuel_leaks",
          "label": "Fuel System: Check for oil leaks" // Assuming this means fuel leaks, based on context
        },
        {
          "id": "extra_fuel_oil",
          "label": "Extra Fuel and Oil" // This seems like a check if available, needs clarification
        },
        {
          "id": "bilge_water_level",
          "label": "Bilge System: Check water level"
        },
        {
          "id": "bilge_dryness_pumps",
          "label": "Bilge System: Check bilges are reasonably dry and that pumps are not running excessively"
        },
        {
          "id": "steering_test",
          "label": "Test Steering (free movement)"
        },
        {
          "id": "gauges_check",
          "label": "Check Gauges"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No", "N/A"],
          "required": true
        }
      ],
      "fields": [ // Added for the section comment
        {
          "id": "engine_comments",
          "label": "Comments",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_navigation",
      "title": "Navigation",
      "type": "checklist_group",
      "items": [
        {
          "id": "nav_passage_plan",
          "label": "Passage Plan Ready"
        },
        {
          "id": "nav_charts_updated",
          "label": "Navigation charts available and updated"
        },
        {
          "id": "nav_contact_list",
          "label": "Emergency contact list updated"
        },
        {
          "id": "nav_weather_forecast",
          "label": "Check the Weather Forecast"
        },
        {
          "id": "nav_rules_onboard",
          "label": "Navigation rules onboard"
        },
        {
          "id": "nav_lights_ready",
          "label": "Navigation lights ready"
        },
        {
          "id": "nav_ventilation",
          "label": "Proper Ventilation"
        },
        {
          "id": "nav_distress_signals",
          "label": "Visual Distress Signals ready"
        },
        {
          "id": "nav_vhf_ssb",
          "label": "Navigation Electronics: All VHF, SSB Radios are receiving and transmitting"
        },
        {
          "id": "nav_horn",
          "label": "Navigation Electronics: Horn working"
        },
        {
          "id": "nav_epirb",
          "label": "Navigation Electronics: Locate EPIRB, check battery expiration date is good"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No", "N/A"],
          "required": true
        }
      ],
      "fields": [
        {
          "id": "navigation_comments",
          "label": "Comments",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_vessel_safety",
      "title": "Vessel Safety",
      "type": "checklist_group",
      "items": [
        {
          "id": "safety_liferaft_capacity",
          "label": "Life raft(s) capacity correct for everyone on board"
        },
        {
          "id": "safety_radios_located",
          "label": "Locate radios"
        },
        {
          "id": "safety_flares_checked",
          "label": "Emergency signal flares expiration dates checked"
        },
        {
          "id": "safety_fire_extinguishers",
          "label": "Fire extinguishers fully charged and ready"
        },
        {
          "id": "safety_first_aid",
          "label": "First Aid supplies on board"
        },
        {
          "id": "safety_life_rings",
          "label": "Locate life rings"
        },
        {
          "id": "safety_drills_done",
          "label": "Safety drills done"
        },
        {
          "id": "safety_certs_updated",
          "label": "All Vessel registrations, certifications updated onboard"
        },
        {
          "id": "safety_food_water",
          "label": "Enough Food and water for crew and passengers"
        },
        {
          "id": "safety_flashlights",
          "label": "Flashlights and spare batteries"
        },
        {
          "id": "safety_abandon_ship_kit",
          "label": "Location of abandon ship kit"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No", "N/A"],
          "required": true
        }
      ]
      // No separate comment field mentioned for this section in the text
    },
    {
      "id": "section_equipment",
      "title": "Equipment",
      "type": "checklist_group",
      "items": [
        {
          "id": "equip_hull_secured",
          "label": "Hull, portholes, stern hatches all secured or closed"
        },
        {
          "id": "equip_anchor_ready",
          "label": "Ensure Anchor is ready for use"
        },
        {
          "id": "equip_gps_ready",
          "label": "GPS ready, giving correct reading"
        },
        {
          "id": "equip_wing_stations",
          "label": "Wing stations ready"
        },
        {
          "id": "equip_radars_operational",
          "label": "Radars signals operational"
        },
        {
          "id": "equip_docking_lines",
          "label": "Docking lines in sufficient quantity, length and size"
        },
        {
          "id": "equip_mooring_heaving_lines",
          "label": "Mooring Lines and Heaving line"
        },
        {
          "id": "equip_toolbox",
          "label": "Toolbox of tools and spare parts for emergency boat repairs"
        },
        {
          "id": "equip_magnetic_compass",
          "label": "Magnetic Compass working"
        },
        {
          "id": "equip_vessel_plug",
          "label": "Ensure vessel Plug is properly installed"
        },
        {
          "id": "equip_backup_propulsion",
          "label": "Back-up propulsion source (spare engine, sail, paddles or oars)"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No", "N/A"],
          "required": true
        }
      ],
      "fields": [
        {
          "id": "equipment_comments",
          "label": "Comments",
          "type": "textarea",
          "required": false
        }
      ]
    }
    // Signature section is missing from the text, assume it's handled by the overall task submission/user context
  ]
}
```

---



```json
{
  "title": "Pre-Arrival Checklist",
  "sections": [
    {
      "id": "section_trip_link",
      "title": "Trip Link",
      "fields": [
        {
          "id": "trip_link_info",
          "label": "Trip Association",
          "type": "markdown",
          "content": "This form is related to a trip. If you want to create this form as part of a trip data, it is better to do it from the trip detail view."
          // Consider adding a trip selection field here
        }
      ]
    },
    {
      "id": "section_header",
      "title": "Arrival Details",
      "fields": [
        {
          "id": "arrival_date",
          "label": "Date",
          "type": "date",
          "required": true
        },
        {
          "id": "arrival_time",
          "label": "Time",
          "type": "time",
          "required": true
        },
        {
          "id": "arrival_port",
          "label": "Port",
          "type": "text",
          "required": true
        }
      ]
    },
    {
      "id": "section_checklist_arrival",
      "title": "Arrival Checklist",
      "description": "For each item check the appropriate box. For no answers provide detailed comments.",
      "type": "checklist_group",
      "items": [
        {"id": "arr_brief_crew_passengers", "label": "Brief Crew, passengers on arrival procedures"},
        {"id": "arr_lines_fenders_place", "label": "Lines pulled, fenders in place"},
        {"id": "arr_lines_fast", "label": "Lines fast to Dock/Mooring"},
        {"id": "arr_anchor_cleared_ready", "label": "Anchor cleared and Ready"},
        {"id": "arr_hull_portholes_secured", "label": "Hull, Portholes, hatches secured and closed"},
        {"id": "arr_nav_equipment_checked", "label": "Navigation equipment checked"},
        {"id": "arr_logs_completed", "label": "All required logs completed"},
        {"id": "arr_charts_posters_updated", "label": "Charts/posters up to date"},
        {"id": "arr_equip_vhf", "label": "Is equipment fully operational, in good working order and in compliance? VHF"},
        {"id": "arr_equip_radar_ais", "label": "Is equipment fully operational, in good working order and in compliance? Radar and AIS"},
        {"id": "arr_equip_main_propulsion", "label": "Is equipment fully operational, in good working order and in compliance? Main Propulsion"},
        {"id": "arr_equip_steering_gear", "label": "Is equipment fully operational, in good working order and in compliance? Steering Gear"},
        {"id": "arr_equip_mooring_lines", "label": "Is equipment fully operational, in good working order and in compliance? Mooring Lines"},
        {"id": "arr_equip_pilot_ladder", "label": "Is equipment fully operational, in good working order and in compliance? Pilot Ladder"},
        {"id": "arr_equip_gps_reading", "label": "Is equipment fully operational, in good working order and in compliance? GPS has correct reading"},
        {"id": "arr_equip_nav_lights", "label": "Is equipment fully operational, in good working order and in compliance? Navigation lights working"},
        {"id": "arr_equip_thrusters", "label": "Is equipment fully operational, in good working order and in compliance? Stern and bow thrusters operational"},
        {"id": "arr_equip_horn", "label": "Is equipment fully operational, in good working order and in compliance? Horn operational"},
        {"id": "arr_equip_epirb", "label": "Is equipment fully operational, in good working order and in compliance? Locate EPIRB, check battery expiration date is good"},
        {"id": "arr_equip_gangways", "label": "Is equipment fully operational, in good working order and in compliance? Check Gangways"}
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No", "N/A"],
          "required": true
        }
      ]
    },
    {
      "id": "section_comments_arrival",
      "title": "Arrival Comments",
      "fields": [
        {
          "id": "arrival_comments",
          "label": "Comments (for 'No' answers in Arrival section)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_checklist_engine_power",
      "title": "Engine/Power Checklist",
      "type": "checklist_group",
      "items": [
        {"id": "eng_fuel_pumps_inspected", "label": "All fuel pumps inspected"},
        {"id": "eng_check_oil_leaks", "label": "Check for oil leaks"},
        {"id": "eng_test_main_engines", "label": "Test main engines ahead and astern"},
        {"id": "eng_oil_system_clear", "label": "Oil system clear and clean"},
        {"id": "eng_inspect_feed_water_pumps", "label": "Inspect feed water pumps"},
        {"id": "eng_check_gauges", "label": "Check Gauges"},
        {"id": "eng_check_cleanliness_er", "label": "Check cleanliness of engine room"},
        {"id": "eng_check_engine_temp", "label": "Check Engine temperature"},
        {"id": "eng_check_water_circulation", "label": "Check water circulation"},
        {"id": "eng_close_seacocks", "label": "Close seacocks"}
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No", "N/A"],
          "required": true
        }
      ]
    },
    {
      "id": "section_comments_engine_power",
      "title": "Engine/Power Comments",
      "fields": [
        {
          "id": "engine_power_comments",
          "label": "Comments (for 'No' answers in Engine/Power section)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_checklist_vessel_closeup",
      "title": "Vessel Close-up Checklist",
      "type": "checklist_group",
      "items": [
        {"id": "close_stow_pfd_survival", "label": "Stow PFD survival equipment"},
        {"id": "close_remove_stow_drain_plug", "label": "Remove and stow drain Plug"},
        {"id": "close_lock_cabin_compartments", "label": "Lock cabin, other compartments"},
        {"id": "close_set_canvas_vinyl", "label": "Set Canvas, Vinyl"},
        {"id": "close_stow_portable_electronics", "label": "Stow portable electronics"},
        {"id": "close_remove_trash", "label": "Remove Trash"},
        {"id": "close_stow_charts_nav_tools", "label": "Stow charts, navigation tools"},
        {"id": "close_lsa_checked_stored", "label": "All LSA checked and properly stored"},
        {"id": "close_overall_condition_vessel", "label": "Overall condition of vessel. Any visible erosion or rust?"}
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No", "N/A"],
          "required": true
        }
      ]
    },
    {
      "id": "section_comments_vessel_closeup",
      "title": "Vessel Close-up Comments",
      "fields": [
        {
          "id": "vessel_closeup_comments",
          "label": "Comments (for 'No' answers in Vessel Close-up section)",
          "type": "textarea",
          "required": false
        }
      ]
    }
    // Note: No signature block present in the PDF text for this checklist.
  ]
}
```

---



```json
{
  "title": "Life Saving Appliances Checklist",
  "sections": [
    {
      "id": "section_certificates",
      "title": "Are Following Certificates Current?",
      "type": "checklist_group",
      "items": [
        {
          "id": "cert_safety_equip",
          "label": "Ship Safety Equipment Certificate"
        },
        {
          "id": "cert_safety_radio",
          "label": "Ship Safety Radio Certificate"
        },
        {
          "id": "cert_epirb",
          "label": "Emergency Position Indicating Radio Beacon (EPIRB) Certificate"
        },
        {
          "id": "cert_rescue_boat",
          "label": "Rescue Boat Certificate"
        },
        {
          "id": "cert_liferaft",
          "label": "Life raft Certificates"
        },
        {
          "id": "cert_sart",
          "label": "Search and Rescue Transporter (SART)"
        },
        {
          "id": "cert_load_line",
          "label": "Load Line Certificate"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No", "N/A"],
          "required": true
        },
        {
          "id": "expiry",
          "label": "Expiry",
          "type": "date",
          "required": false // Only applicable if 'Yes'? Needs clarification, making optional for now.
        }
      ],
      "fields": [
        {
          "id": "cert_corrective_action",
          "label": "Corrective Action for items marked No",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_documents",
      "title": "Are Following Documents Current and Onboard?",
      "type": "checklist_group",
      "items": [
        {
          "id": "doc_pms",
          "label": "Onboard Planned Maintenance Program"
        },
        {
          "id": "doc_solas_manual",
          "label": "SOLAS Training Manual"
        },
        {
          "id": "doc_emergency_instructions",
          "label": "Emergency Instructions"
        },
        {
          "id": "doc_radio_license",
          "label": "Radio station License"
        },
        {
          "id": "doc_safety_records",
          "label": "Records of safety maintenance, inspection and step by step drills"
        },
        {
          "id": "doc_crew_familiarization",
          "label": "Crew Safety Work Familiarization"
        },
        {
          "id": "doc_imo_signs",
          "label": "IMO Safety Signs"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No", "N/A"],
          "required": true
        }
      ],
      "fields": [
        {
          "id": "doc_corrective_action",
          "label": "Corrective Action for items marked No",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_lsa_testing",
      "title": "Life Saving Appliances Testing and Inspection?",
      "type": "checklist_group",
      "items": [
        {
          "id": "lsa_inflatable_lj_test",
          "label": "Inflatable Life Rafts/Life Jacket/Buoys: Periodic testing of inflatable Life jacket, not damaged, fitted and marked correctly"
        },
        {
          "id": "lsa_lj_condition",
          "label": "Inflatable Life Rafts/Life Jacket/Buoys: Life Jackets not knotted, not rotted"
        },
        {
          "id": "lsa_inflatable_lr_test",
          "label": "Inflatable Life Rafts/Life Jacket/Buoys: Periodic testing of inflatable life raft"
        },
        {
          "id": "lsa_lr_fall_wires",
          "label": "Inflatable Life Rafts/Life Jacket/Buoys: Life Raft fall wires maintained"
        },
        {
          "id": "lsa_lba_scba_test",
          "label": "Inflatable Life Rafts/Life Jacket/Buoys: Testing for Life Breathing Apparatus, SCBA"
        },
        {
          "id": "lsa_lifebuoys_check",
          "label": "Lifebuoys correct numbers stored in correct locations with correct markings"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No", "N/A"],
          "required": true
        }
      ],
      "fields": [
        {
          "id": "lsa_corrective_action",
          "label": "Corrective Action for items marked No",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_rescue_boat",
      "title": "Rescue Boat",
      "type": "checklist_group",
      "items": [
        {
          "id": "rb_serviced",
          "label": "Rescue boat serviced"
        },
        {
          "id": "rb_inventory",
          "label": "Inventory correct and up to date"
        },
        {
          "id": "rb_stowed",
          "label": "Rescue boat stowed and positioned correctly"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No", "N/A"],
          "required": true
        }
      ],
      "fields": [
        {
          "id": "rb_corrective_action",
          "label": "Corrective Action for items marked No",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_fire_safety",
      "title": "Fire Safety",
      "type": "checklist_group",
      "items": [
        {
          "id": "fire_emergency_alarm",
          "label": "Inspection of emergency alarm"
        },
        {
          "id": "fire_extinguishers",
          "label": "Fire Extinguishers are operable and available with inspection tags"
        },
        {
          "id": "fire_pumps",
          "label": "Check Fire Pumps"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No", "N/A"],
          "required": true
        }
      ],
      "fields": [
        {
          "id": "fire_corrective_action",
          "label": "Corrective Action for items marked No",
          "type": "textarea",
          "required": false
        }
      ]
    }
    // Signature section is missing from the text, assume it's handled by the overall task submission/user context
  ]
}
```

---



```json
{
  "title": "Bunkering Safety Checklist",
  "sections": [
    {
      "id": "section_header",
      "title": "Bunkering Details",
      "fields": [
        {
          "id": "port_of_supply",
          "label": "Port Of Supply",
          "type": "text",
          "required": true
        },
        {
          "id": "receiving_vessel_name",
          "label": "Receiving Vessel Name",
          "type": "text",
          "required": true,
          "defaultValue": "Quinta Essentia" // Pre-filled based on PDF
        },
        {
          "id": "oil_type",
          "label": "Oil Type",
          "type": "text",
          "required": true
        },
        {
          "id": "oil_quantity",
          "label": "Oil Quantity",
          "type": "text", // Could be number + unit, using text for flexibility
          "required": true
        },
        {
          "id": "bunkering_time_place",
          "label": "Time and Place of Bunkering Operation",
          "type": "textarea",
          "required": true
        }
      ]
    },
    {
      "id": "section_pre_bunkering",
      "title": "Pre-Bunkering",
      "type": "checklist_group",
      "items": [
        {
          "id": "pre_vessel_secured",
          "label": "1. Is the Vessel properly Secured to Dock?"
        },
        {
          "id": "pre_hoses_condition",
          "label": "2. Are bunkering hoses in good condition?"
        },
        {
          "id": "pre_hoses_connected",
          "label": "3. Are bunkering hoses correctly connected and the drip trays in position?"
        },
        {
          "id": "pre_receiving_valve_open",
          "label": "4. Is the valve of the receiving tank open?"
        },
        {
          "id": "pre_tank_capacity_checked",
          "label": "5. Has the capacity of the receiving tank been checked?"
        },
        {
          "id": "pre_valves_hull_condition",
          "label": "6. Are the valves opened and the hull in good condition with no leaks?"
        },
        {
          "id": "pre_absorbing_materials",
          "label": "7. Are the necessary absorbing materials available for dealing with accidental oil spills?"
        },
        {
          "id": "pre_comms_signals_ready",
          "label": "8. Are Communications and signals ready?"
        },
        {
          "id": "pre_supply_amounts_established",
          "label": "9. Are Supply amounts established?"
        },
        {
          "id": "pre_transfer_hose_rigged",
          "label": "10. Is the transfer hose properly rigged and flanges fully bolted?"
        },
        {
          "id": "pre_doors_portholes_closed",
          "label": "11. Are exterior doors and portholes closed?"
        },
        {
          "id": "pre_vessel_moored_securely",
          "label": "12. Is the vessel securely moored?"
        },
        {
          "id": "pre_unused_manifolds_blanked",
          "label": "13. Are unused manifold valves closed and connections blanked and fully bolted?"
        },
        {
          "id": "pre_sopep_equipment_checked",
          "label": "14. Has all the equipment in SOPEP been checked?"
        },
        {
          "id": "pre_red_flag_light",
          "label": "15. Red flag/light is presented on masthead"
        },
        {
          "id": "pre_fire_extinguisher_ready",
          "label": "16. Is the portable chemical fire extinguisher near and ready?"
        },
        {
          "id": "pre_no_smoking_signs",
          "label": "17. Are the No Smoking signs visible?"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks (Required if No)",
          "type": "textarea",
          "required": false // Conditional requirement handled by frontend/backend logic
        }
      ],
      "fields": [
        {
          "id": "pre_truck_barge_meters",
          "label": "18. Check Truck/Barge Meters Reading",
          "type": "text", // Or number
          "required": false
        },
        {
          "id": "pre_vessel_meters",
          "label": "19. Check Vessel's Meters Reading",
          "type": "text", // Or number
          "required": false
        }
      ]
    },
    {
      "id": "section_during_bunkering",
      "title": "During-Bunkering",
      "type": "checklist_group",
      "items": [
        {
          "id": "during_monitor_connections",
          "label": "1. Monitor Fuel Connections"
        },
        {
          "id": "during_temp_check",
          "label": "2. Bunker temperature Check"
        },
        {
          "id": "during_take_sample",
          "label": "3. Take Sample during Bunkering"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks (Required if No)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_completion",
      "title": "Bunkering Completion",
      "type": "checklist_group",
      "items": [
        {
          "id": "comp_disconnect_hose",
          "label": "1. Disconnect Hose, Check lines are empty"
        },
        {
          "id": "comp_bunker_valve_closed",
          "label": "2. Is the Bunker valve Closed?"
        },
        {
          "id": "comp_red_flag_removed",
          "label": "5. Red Flag/Signal removed or turned off?"
        },
        {
          "id": "comp_paperwork_completed",
          "label": "6. Sign Bunker receipts, all paper work completed?"
        },
        {
          "id": "comp_master_informed",
          "label": "7. Master informed of Completion?"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks (Required if No)",
          "type": "textarea",
          "required": false
        }
      ],
      "fields": [
        {
          "id": "comp_vessel_meter",
          "label": "3. Check Vessel's Meter Reading",
          "type": "text", // Or number
          "required": false
        },
        {
          "id": "comp_barge_truck_meter",
          "label": "4. Check Barge/Truck Meter Reading",
          "type": "text", // Or number
          "required": false
        }
      ]
    },
    {
      "id": "section_signatures",
      "title": "Signatures",
      "fields": [
        {
          "id": "supplier_name",
          "label": "Person in charge for supplier",
          "type": "text",
          "required": true
        },
        {
          "id": "supplier_position",
          "label": "Position (Supplier)",
          "type": "text",
          "required": true
        },
        {
          "id": "supplier_signature",
          "label": "Signature (Supplier)",
          "type": "signature",
          "required": true
        },
        {
          "id": "supplier_datetime",
          "label": "Date & Time (Supplier)",
          "type": "datetime", // Combined date and time
          "required": true
        },
        {
          "id": "receiver_name",
          "label": "Person in charge for receiver",
          "type": "text",
          "required": true
        },
        {
          "id": "receiver_position",
          "label": "Position (Receiver)",
          "type": "text",
          "required": true
        },
        {
          "id": "receiver_signature",
          "label": "Signature (Receiver)",
          "type": "signature",
          "required": true
        },
        {
          "id": "receiver_datetime",
          "label": "Date & Time (Receiver)",
          "type": "datetime",
          "required": true
        }
      ]
    }
  ]
}
```

---



```json
{
  "title": "Anchoring Checklist",
  "sections": [
    {
      "id": "section_header",
      "title": "Checklist Details",
      "fields": [
        {
          "id": "vessel_name",
          "label": "Vessel Name",
          "type": "text",
          "required": true
        },
        {
          "id": "report_filled_by",
          "label": "Report filled out by",
          "type": "user_select", // Assuming a dropdown to select the user/crew member
          "required": true
        },
        {
          "id": "checklist_date",
          "label": "Date",
          "type": "date",
          "required": true
        }
      ]
    },
    {
      "id": "section_pre_anchoring",
      "title": "Pre-Anchoring",
      "type": "checklist_group",
      "items": [
        {
          "id": "pre_room_swinging",
          "label": "Ensure there is enough room for swinging"
        },
        {
          "id": "pre_speed_reduction",
          "label": "Speed reduction in sufficient time"
        },
        {
          "id": "pre_wind_current_accounted",
          "label": "Direction/strength of wind and current accounted for"
        },
        {
          "id": "pre_chief_eng_crew_ready",
          "label": "Chief engineer, crew on standby ready with instructions"
        },
        {
          "id": "pre_standby_informed",
          "label": "Have the engine room, crew and deck been informed of the time of standby for anchoring?"
        },
        {
          "id": "pre_position_reported",
          "label": "Has the anchor position of the ship been reported to the port authority?"
        },
        {
          "id": "pre_chain_clear",
          "label": "Chain clear to lower"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks",
          "type": "textarea",
          "required": false // Remarks likely needed if 'No'
        }
      ]
    },
    {
      "id": "section_during_anchoring",
      "title": "During-Anchoring",
      "type": "checklist_group",
      "items": [
        {
          "id": "during_plot_position",
          "label": "Determine and plot the ships position on the appropriate chart as soon as practicable"
        },
        {
          "id": "during_check_secure",
          "label": "Check whether the ship is remaining securely at anchor by taking bearings of fixed navigation marks or readily identifiable shore objects"
        },
        {
          "id": "during_maintain_lookout",
          "label": "Ensure that proper look out is maintained"
        },
        {
          "id": "during_notify_dragging",
          "label": "Notify the master and undertake all necessary measures if the ship drags anchor"
        },
        {
          "id": "during_observe_conditions",
          "label": "Observe meteorological and tidal conditions and the state of the sea"
        },
        {
          "id": "during_inspection_rounds",
          "label": "Ensure that inspection rounds of the ship are made periodically"
        },
        {
          "id": "during_notify_visibility",
          "label": "If visibility deteriorates, notify the master of any weather condition changes"
        },
        {
          "id": "during_exhibit_lights_shapes",
          "label": "Ensure that the ship exhibits the appropriate lights and shapes and the appropriate sound signals are made in accordance with all applicable regulations"
        },
        {
          "id": "during_engine_readiness",
          "label": "Ensure that state of readiness of the main engines and other machinery is in accordance with the masters instructions"
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks",
          "type": "textarea",
          "required": false // Remarks likely needed if 'No'
        }
      ]
    }
    // Signature section is missing from the text, assume it's handled by the overall task submission/user context
  ]
}
```

---



```json
{
  "title": "EM01 - Drugs Stowaways and Contraband Checklist",
  "sections": [
    {
      "id": "section_header",
      "title": "Report Header",
      "fields": [
        {
          "id": "ship_name",
          "label": "Ship",
          "type": "text",
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call Sign",
          "type": "text",
          "required": false
        },
        {
          "id": "inmo_no",
          "label": "INMO No",
          "type": "text",
          "required": false
        },
        {
          "id": "voyage_no",
          "label": "Voyage No.",
          "type": "text",
          "required": false
        },
        {
          "id": "report_date",
          "label": "Date",
          "type": "date",
          "required": true
        },
        {
          "id": "port_departure",
          "label": "Port of departure",
          "type": "text",
          "required": false
        },
        {
          "id": "next_port_call",
          "label": "Next port of call",
          "type": "text",
          "required": false
        }
      ]
    },
    {
      "id": "section_deck_dept",
      "title": "Deck Department Checklist",
      "type": "checklist_group",
      "items": [
        {"id": "deck_forecastle", "label": "Forecastle Space"},
        {"id": "deck_bridge", "label": "Bridge"},
        {"id": "deck_radio_room", "label": "Radio Room"},
        {"id": "deck_funnel", "label": "Funnel"},
        {"id": "deck_lifeboats", "label": "Lifeboats"},
        {"id": "deck_paint_store_lockers", "label": "Paint and Store Lockers"},
        {"id": "deck_cargo_control_room", "label": "Cargo Control Room"},
        {"id": "deck_life_jacket_lockers", "label": "Life Jacket Lockers"},
        {"id": "deck_ship_offices", "label": "Ship's Office(s)"},
        {"id": "deck_officer_ratings_quarters", "label": "Officer and Ratings Quarters"},
        {"id": "deck_hospital_medical_locker", "label": "Hospital and Medical Locker"},
        {"id": "deck_gymnasium", "label": "Gymnasium"},
        {"id": "deck_alleyways", "label": "Alleyways"},
        {"id": "deck_rope_store", "label": "Rope Store"},
        {"id": "deck_laundry_room", "label": "Laundry Room"},
        {"id": "deck_tanks_void_spaces", "label": "Tanks and Void Spaces"},
        {"id": "deck_storage_rooms", "label": "Storage Rooms"}
      ],
      "columns": [
        {
          "id": "checked_initials",
          "label": "Checked (Initials)",
          "type": "text",
          "required": false // Required per item checked
        },
        {
          "id": "remarks",
          "label": "Remarks",
          "type": "textarea",
          "required": false
        }
      ],
      "fields": [ // Fields specific to this section
        {
          "id": "deck_reporting_officer",
          "label": "Reporting Officer (Deck)",
          "type": "user_select",
          "required": true
        },
        {
          "id": "deck_datetime_checked",
          "label": "Date and Time Checked (Deck)",
          "type": "datetime",
          "required": true
        }
      ]
    },
    {
      "id": "section_engine_dept",
      "title": "Engine Department Checklist",
      "type": "checklist_group",
      "items": [
        {"id": "eng_bilges", "label": "Bilges"},
        {"id": "eng_shaft_alley", "label": "Shaft Alley"},
        {"id": "eng_control_room", "label": "Control Room"},
        {"id": "eng_steering_gear_room", "label": "Steering Gear Room"},
        {"id": "eng_tanks_void_spaces", "label": "Tanks and Void Spaces"},
        {"id": "eng_stores_lockers", "label": "Stores Lockers"},
        {"id": "eng_machinery_spaces", "label": "Machinery Spaces"},
        {"id": "eng_emergency_gen_room", "label": "Emergency Generator Room"}
      ],
      "columns": [
        {
          "id": "checked_initials",
          "label": "Checked (Initials)",
          "type": "text",
          "required": false
        },
        {
          "id": "remarks",
          "label": "Remarks",
          "type": "textarea",
          "required": false
        }
      ],
      "fields": [
        {
          "id": "eng_reporting_officer",
          "label": "Reporting Officer (Engine)",
          "type": "user_select",
          "required": true
        },
        {
          "id": "eng_datetime_checked",
          "label": "Date and Time Checked (Engine)",
          "type": "datetime",
          "required": true
        }
      ]
    },
    {
      "id": "section_accomodation",
      "title": "Accomodation Spaces Checklist",
      "type": "checklist_group",
      "items": [
        {"id": "acc_galley", "label": "Galley"},
        {"id": "acc_dining_smoking_rooms", "label": "Dining and Smoking Rooms"},
        {"id": "acc_pantries", "label": "Pantries"},
        {"id": "acc_bonded_stores_lockers", "label": "Bonded Stores Lockers"},
        {"id": "acc_linen_storage_lockers", "label": "Linen and Storage Lockers"},
        {"id": "acc_refrigerators", "label": "Refrigerators"},
        {"id": "acc_food_storage_compartments", "label": "Food Storage Compartments"},
        {"id": "acc_butchers_space", "label": "Butcher's Space"}
      ],
      "columns": [
        {
          "id": "checked_initials",
          "label": "Checked (Initials)",
          "type": "text",
          "required": false
        },
        {
          "id": "remarks",
          "label": "Remarks",
          "type": "textarea",
          "required": false
        }
      ],
      "fields": [
        {
          "id": "acc_reporting_officer",
          "label": "Reporting Officer (Accomodation)",
          "type": "user_select",
          "required": true
        },
        {
          "id": "acc_datetime_checked",
          "label": "Date and Time Checked (Accomodation)",
          "type": "datetime",
          "required": true
        }
      ]
    }
    // Note: No overall signature block in the PDF text, signatures are per section.
  ]
}
```

---




#### Reports




```json
{
  "title": "SOPEP Report",
  "sections": [
    {
      "id": "section_basic_info",
      "title": "Basic Information",
      "fields": [
        {
          "id": "ship_name",
          "label": "SHIP NAME (AA)",
          "type": "text",
          "required": true,
          "defaultValue": "Quinta Essentia" // Pre-filled based on PDF
        },
        {
          "id": "call_sign",
          "label": "CALL SIGN",
          "type": "text",
          "required": false
        },
        {
          "id": "flag",
          "label": "FLAG",
          "type": "text",
          "required": false
        },
        {
          "id": "event_datetime_utc",
          "label": "DATE AND TIME OF EVENT, UTC (BB: DD;HH;MM)",
          "type": "datetime",
          "required": true
        }
      ]
    },
    {
      "id": "section_position_movement",
      "title": "Position and Movement",
      "fields": [
        {
          "id": "position_lat_long",
          "label": "POSITION: LAT, LONG (CC: dd; mm N/S - dd; mm W/E)",
          "type": "text", // Could use specific lat/long inputs
          "required": true
        },
        {
          "id": "position_bearing_distance",
          "label": "BEARING, DISTANCE FROM LANDMARK (DD: ddd N Miles)",
          "type": "text",
          "required": false // Alternative to Lat/Long
        },
        {
          "id": "course",
          "label": "COURSE (EE: ddd)",
          "type": "number",
          "min": 0,
          "max": 359,
          "required": false
        },
        {
          "id": "speed_knots",
          "label": "SPEED, KNOTS (FF: Kn. 1/10)",
          "type": "number",
          "step": 0.1,
          "required": false
        },
        {
          "id": "intended_track",
          "label": "INTENDED TRACK (LL)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_communication_reporting",
      "title": "Communication and Reporting",
      "fields": [
        {
          "id": "radio_stations_guarded",
          "label": "RADIO STATIONS(3) GUARDED (MM)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "next_report_datetime_utc",
          "label": "DATE & TIME OF NEXT REPORT UTC (NN)",
          "type": "datetime",
          "required": false
        }
      ]
    },
    {
      "id": "section_incident_details",
      "title": "Incident Details",
      "fields": [
        {
          "id": "bunkers_onboard",
          "label": "TYPE & QUANTITY OF BUNKERS ON BOARD (PP)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "defects_deficiencies_damage",
          "label": "BRIEF DETAILS OF DEFECTS / DEFICIENCIES / DAMAGE (QQ)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "pollution_details_quantity",
          "label": "BRIEF DETAILS OF POLLUTION, INCLUDING ESTIMATE OF QUANTITY LOST (RR)",
          "type": "textarea",
          "required": true // Core part of SOPEP
        },
        {
          "id": "incident_brief",
          "label": "BRIEF DETAILS OF INCIDENT",
          "type": "textarea",
          "required": true
        },
        {
          "id": "assistance_needed",
          "label": "NEED FOR OUTSIDE ASSISTANCE",
          "type": "textarea",
          "required": false
        },
        {
          "id": "actions_taken",
          "label": "ACTIONS BEING TAKEN (XX)",
          "type": "textarea",
          "required": true
        },
        {
          "id": "crew_injuries",
          "label": "NUMBER OF CREW & DETAILS OF ANY INJURIES",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_weather_sea",
      "title": "Weather and Sea Conditions",
      "fields": [
        {
          "id": "wind_direction",
          "label": "WIND DIRECTION (SS: ddd)",
          "type": "number",
          "min": 0,
          "max": 359,
          "required": false
        },
        {
          "id": "wind_speed_beaufort",
          "label": "WIND SPEED (SS: Beaufort)",
          "type": "number", // Beaufort scale
          "min": 0,
          "max": 12,
          "required": false
        },
        {
          "id": "swell_height_m",
          "label": "SWELL HEIGHT (TT: m)",
          "type": "number",
          "min": 0,
          "step": 0.1,
          "required": false
        },
        {
          "id": "swell_direction",
          "label": "SWELL DIRECTION (TT: ddd)",
          "type": "number",
          "min": 0,
          "max": 359,
          "required": false
        },
        {
          "id": "cloud_cover_eighths",
          "label": "CLOUD COVER (TT: 1/8 ths)",
          "type": "number",
          "min": 0,
          "max": 8,
          "required": false
        }
      ]
    },
    {
      "id": "section_vessel_details",
      "title": "Ship Size and Type",
      "fields": [
        {
          "id": "ship_length_m",
          "label": "LENGTH (UU: m)",
          "type": "number",
          "min": 0,
          "required": false
        },
        {
          "id": "ship_breadth_m",
          "label": "BREADTH (UU: m)",
          "type": "number",
          "min": 0,
          "required": false
        },
        {
          "id": "ship_draught_m",
          "label": "DRAUGHT (UU: m)",
          "type": "number",
          "min": 0,
          "step": 0.1,
          "required": false
        },
        {
          "id": "ship_type",
          "label": "TYPE (UU)",
          "type": "text",
          "required": false
        }
      ]
    },
    {
      "id": "section_contact_additional",
      "title": "Contact and Additional Information",
      "fields": [
        {
          "id": "manager_contact_details",
          "label": "CONTACT DETAILS OF YACHT'S MANAGERS",
          "type": "textarea",
          "required": false
        },
        {
          "id": "additional_information",
          "label": "ADDITIONAL INFORMATION (OTHERS)",
          "type": "textarea",
          "required": false
        }
      ]
    }
    // Signature section is missing from the text, assume it's handled by the overall task submission/user context
  ]
}
```

---



```json
{
  "title": "Note of Protest",
  "sections": [
    {
      "id": "section_header",
      "title": "Protest Details",
      "fields": [
        {
          "id": "vessel_name",
          "label": "Vessel Name",
          "type": "text",
          "required": true
        },
        {
          "id": "protest_date",
          "label": "Date",
          "type": "date",
          "required": true
        },
        {
          "id": "protest_time",
          "label": "Time",
          "type": "time",
          "required": true
        },
        {
          "id": "protester_name",
          "label": "Name",
          "type": "user_select", // Assuming selection of the user filling the form
          "required": true
        },
        {
          "id": "protester_position",
          "label": "Position",
          "type": "text", // Could be pre-filled based on user selection
          "required": true
        },
        {
          "id": "port_location",
          "label": "Port location",
          "type": "text",
          "required": true
        }
      ]
    },
    {
      "id": "section_protest_type",
      "title": "Check the Protest Type",
      "fields": [
        {
          "id": "protest_type",
          "label": "Protest Type",
          "type": "checkbox_group", // Allows selecting multiple if applicable, or radio if only one
          "options": [
            {"id": "type_wrong_fuel", "label": "Wrong Fuel"},
            {"id": "type_violation_regs", "label": "Violation of Regulations"},
            {"id": "type_berths_unclear", "label": "Berths Unclear"},
            {"id": "type_cargo_mishandling", "label": "Cargo Mishandling"},
            {"id": "type_equip_malfunction", "label": "Equipment Malfunction"},
            {"id": "type_other", "label": "Other"}
          ],
          "required": true
        },
        {
          "id": "protest_type_other_details",
          "label": "If Other, please specify",
          "type": "text",
          "required": false,
          "condition": { // Example of conditional display
            "field": "protest_type",
            "value": "type_other"
          }
        }
      ]
    },
    {
      "id": "section_claim",
      "title": "Claim Details",
      "description": "Serving as Master on the vessel I solemnly declare that the below situation is in violation of regulations. In describing the situation, I declare my note of protest against all losses, damages, etc. associated with this situation.",
      "fields": [
        {
          "id": "claim_details",
          "label": "List claim here",
          "type": "textarea",
          "required": true
        }
      ]
    }
    // Signature section is implied by the \'Name\' field and submission context
  ]
}
```

---



```json
{
  "title": "Noon Report",
  "sections": [
    {
      "id": "section_header",
      "title": "Report Details",
      "fields": [
        {
          "id": "reported_by",
          "label": "Reported By",
          "type": "user_select",
          "required": true
        },
        {
          "id": "vessel_name",
          "label": "VESSEL'S NAME",
          "type": "text",
          "required": true
        },
        {
          "id": "report_date",
          "label": "DATE",
          "type": "date",
          "required": true
        }
      ]
    },
    {
      "id": "section_voyage_position",
      "title": "Voyage and Position",
      "fields": [
        {
          "id": "voyage_from",
          "label": "VOYAGE FROM",
          "type": "text",
          "required": true
        },
        {
          "id": "voyage_to",
          "label": "VOYAGE TO",
          "type": "text",
          "required": true
        },
        {
          "id": "latitude_noon",
          "label": "LATITUDE AT NOON (DEG MIN N/S)",
          "type": "text", // Specific format, text might be easier
          "required": true
        },
        {
          "id": "longitude_noon",
          "label": "LONGITUDE AT NOON (DEG MIN E/W)",
          "type": "text", // Specific format, text might be easier
          "required": true
        },
        {
          "id": "distance_to_go",
          "label": "DISTANCE TO GO",
          "type": "text", // Assuming distance unit included
          "required": false
        },
        {
          "id": "eta_port_time",
          "label": "ETA : PORT/ TIME",
          "type": "text", // Combined info
          "required": false
        }
      ]
    },
    {
      "id": "section_performance",
      "title": "Performance Data",
      "fields": [
        {
          "id": "avg_speed_last_noon",
          "label": "AVERAGE SPEED DONE SINCE LAST NOON REPORT",
          "type": "number",
          "step": 0.1,
          "unit": "knots", // Assuming unit
          "required": false
        },
        {
          "id": "avg_rpm",
          "label": "AVERAGE RPM",
          "type": "number",
          "required": false
        },
        {
          "id": "ring_full_away",
          "label": "RING FULL AWAY (DD HH MN)", // Unclear meaning, using text
          "type": "text",
          "required": false
        }
      ]
    },
    {
      "id": "section_weather_sea",
      "title": "Weather and Sea",
      "fields": [
        {
          "id": "wind_direction_force",
          "label": "WIND DIRECTION AND FORCE",
          "type": "text",
          "required": false
        },
        {
          "id": "sea_swell_condition",
          "label": "SEA AND SWELL CONDITION",
          "type": "text",
          "required": false
        }
      ]
    },
    {
      "id": "section_remains_on_board",
      "title": "Remains on Board (ROB)",
      "fields": [
        {
          "id": "rob_fresh_water_mt",
          "label": "FRESH WATER (MT)",
          "type": "number",
          "step": "any",
          "required": false
        },
        {
          "id": "rob_fuel_oil_mt",
          "label": "FUEL OIL (MT)",
          "type": "number",
          "step": "any",
          "required": false
        },
        {
          "id": "rob_diesel_oil_mt",
          "label": "DIESEL OIL (MT)",
          "type": "number",
          "step": "any",
          "required": false
        },
        {
          "id": "rob_lub_oil_me_mt",
          "label": "LUB OIL (M/E) (MT)",
          "type": "number",
          "step": "any",
          "required": false
        },
        {
          "id": "rob_lub_oil_ae_mt",
          "label": "LUB OIL (A/E) (MT)",
          "type": "number",
          "step": "any",
          "required": false
        },
        {
          "id": "rob_lub_oil_hyd_mt",
          "label": "LUB OIL (HYD) (MT)",
          "type": "number",
          "step": "any",
          "required": false
        }
      ]
    },
    {
      "id": "section_remarks",
      "title": "Remarks",
      "fields": [
        {
          "id": "estimated_time_completion",
          "label": "Estimated Time of Completion", // Assuming this relates to the voyage/task
          "type": "datetime",
          "required": false
        },
        {
          "id": "remarks",
          "label": "REMARKS",
          "type": "textarea",
          "required": false
        }
      ]
    }
  ]
}
```

---



```json
{
  "title": "Non-conformity Report", // Title adjusted from PDF text
  "sections": [
    {
      "id": "section_reporting",
      "title": "Discrepancy Reporting",
      "fields": [
        {
          "id": "vessel_name",
          "label": "Vessel",
          "type": "text",
          "required": true
        },
        {
          "id": "reporter_name",
          "label": "Name of Person Reporting the Discrepancy",
          "type": "user_select", // Assuming selection of the user
          "required": true
        },
        {
          "id": "report_date",
          "label": "Date of Report",
          "type": "date",
          "required": true
        },
        {
          "id": "discrepancy_details",
          "label": "State the discrepancy",
          "type": "textarea",
          "required": true
        }
      ]
    },
    {
      "id": "section_corrective_action",
      "title": "Corrective Action",
      "fields": [
        {
          "id": "proposed_corrective_action",
          "label": "What is the proposed corrective action(s)",
          "type": "textarea",
          "required": true
        },
        {
          "id": "immediate_actions",
          "label": "Immediate action(s)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "immediate_action_personnel",
          "label": "Name(s) of Person(s) to Correct the Discrepancy (Immediate)",
          "type": "text", // Could be multi-user select
          "required": false
        },
        {
          "id": "immediate_action_date", // Assuming date relates to immediate action report
          "label": "Date of Report (Immediate Action)",
          "type": "date",
          "required": false
        },
        {
          "id": "further_actions",
          "label": "Further Action(s)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "further_action_personnel",
          "label": "Name of Person to Correct the Discrepancy (Further)",
          "type": "text", // Could be multi-user select
          "required": false
        }
        // No date field explicitly linked to further actions in the text
      ]
    },
    {
      "id": "section_verification",
      "title": "Verification of Corrective Action(s)",
      "fields": [
        {
          "id": "follow_up_details",
          "label": "Follow Up Details (Explain how the corrective action was verified.)",
          "type": "textarea",
          "required": true
        },
        {
          "id": "verification_personnel",
          "label": "Person(s) Verifying Corrective Action(s)",
          "type": "text", // Could be multi-user select
          "required": true
        },
        {
          "id": "verification_date", // Assuming date relates to verification report
          "label": "Date of Report (Verification)",
          "type": "date",
          "required": true
        }
      ]
    },
    {
      "id": "section_closeout",
      "title": "Corrective Action(s) Closed Out",
      "fields": [
        {
          "id": "closeout_signature",
          "label": "Signature (Verifier)",
          "type": "signature",
          "required": true
        }
        // The name is covered by verification_personnel
      ]
    }
  ]
}
```

---



```json
{
  "title": "Accident / Near Miss Report", // Title adjusted based on PDF content
  "sections": [
    {
      "id": "section_general_info",
      "title": "Report General Information",
      "fields": [
        {
          "id": "vessel_name",
          "label": "Vessel name",
          "type": "text",
          "required": true
        },
        {
          "id": "reporting_by",
          "label": "Reporting By",
          "type": "user_select",
          "required": true
        },
        {
          "id": "incident_date",
          "label": "Date of Incident",
          "type": "date",
          "required": true
        },
        {
          "id": "incident_time",
          "label": "Time of Incident",
          "type": "time",
          "required": true
        },
        {
          "id": "incident_location_general", // Renamed to distinguish from specific location below
          "label": "Location of Incident",
          "type": "text",
          "required": true
        }
      ]
    },
    {
      "id": "section_incident_info",
      "title": "Incident Information",
      "fields": [
        {
          "id": "persons_involved",
          "label": "Names of persons involved",
          "type": "textarea", // Allows multiple names
          "required": false
        },
        {
          "id": "witnesses",
          "label": "Name of Witnesses",
          "type": "textarea", // Allows multiple names
          "required": false
        },
        {
          "id": "incident_location_specific", // Renamed for clarity
          "label": "Incident location (Specific area/details)",
          "type": "text",
          "required": false
        },
        {
          "id": "incident_type",
          "label": "Incident Type",
          "type": "select", // Dropdown might be suitable, or text
          "options": [
            "Accident",
            "Near Miss",
            "Hazardous Occurrence",
            "Other"
          ],
          "required": true
        },
        {
          "id": "incident_description",
          "label": "Incident Description",
          "type": "textarea",
          "required": true
        },
        {
          "id": "incident_cause",
          "label": "Cause of accident",
          "type": "textarea",
          "required": false
        },
        {
          "id": "equipment_involved",
          "label": "Equipment involved if any",
          "type": "textarea",
          "required": false
        },
        {
          "id": "action_taken_immediate",
          "label": "Action taken (Immediate)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "cost_associated",
          "label": "Any cost associated?",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": false
        },
        {
          "id": "cost_details", // Added field for cost details if Yes
          "label": "Cost Details (if Yes)",
          "type": "textarea",
          "required": false,
          "condition": {
            "field": "cost_associated",
            "value": "Yes"
          }
        }
      ]
    },
    {
      "id": "section_captain_review",
      "title": "Captain Review",
      "fields": [
        {
          "id": "captain_signature",
          "label": "Captain\\'s Signature",
          "type": "signature",
          "required": true
        },
        {
          "id": "captain_signature_date",
          "label": "Date (Captain Signature)",
          "type": "date",
          "required": true
        }
      ]
    },
    {
      "id": "section_management_review",
      "title": "Management Review",
      "fields": [
        {
          "id": "corrective_action_taken",
          "label": "Corrective action taken",
          "type": "textarea",
          "required": false
        },
        {
          "id": "management_signature",
          "label": "Management Signature",
          "type": "signature",
          "required": false // Assuming management review is a separate step
        },
        {
          "id": "management_signature_date",
          "label": "Date (Management Signature)",
          "type": "date",
          "required": false
        }
      ]
    }
  ]
}
```

---



```json
{
  "title": "Misc Machinery - Monthly Report",
  "sections": [
    {
      "id": "section_header",
      "title": "Vessel Information",
      "fields": [
        {
          "id": "ship_name",
          "label": "Ship",
          "type": "text",
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call Sign",
          "type": "text",
          "required": false
        },
        {
          "id": "inmo_no",
          "label": "INMO No",
          "type": "text",
          "required": false
        }
      ]
    },
    {
      "id": "section_machinery_log",
      "title": "Machinery Running Hours",
      "type": "array",
      "item_label": "Machinery Item",
      "item_structure": {
        "type": "object",
        "fields": [
          {
            "id": "machinery_name",
            "label": "Machinery or Equipment",
            "type": "text",
            "readOnly": true, // Name is fixed per row
            "required": true
          },
          {
            "id": "running_hrs_month",
            "label": "Running hrs this month",
            "type": "number",
            "required": false
          },
          {
            "id": "total_running_hrs",
            "label": "Total running hrs",
            "type": "number",
            "required": false
          },
          {
            "id": "remarks",
            "label": "Remarks",
            "type": "textarea",
            "required": false
          }
        ]
      },
      "defaultItems": [ // Pre-populate the rows based on the PDF
        {"machinery_name": "M/E L.O. Pump No. 1"},
        {"machinery_name": "M/E L.O. Pump No. 2"},
        {"machinery_name": "M/E Camshaft L.O. Pump No. 1"},
        {"machinery_name": "M/E Camshaft L.O. Pump No. 2"},
        {"machinery_name": "M/E Camshaft Cooling Water Pump"},
        {"machinery_name": "M/E Injection Valves Cooling Pump"},
        {"machinery_name": "M/E F.W. Cooling Pump No. 1"},
        {"machinery_name": "M/E F.W. Cooling Pump No. 2"},
        {"machinery_name": "F.O. Booster Pump No. 1"},
        {"machinery_name": "F.O. Booster Pump No. 2"},
        {"machinery_name": "F.O. Transfer Pump No. 1"},
        {"machinery_name": "F.O. Transfer Pump No. 2"}, // Corrected duplicate name from text
        {"machinery_name": "M.D.O. Transfer Pump No. 1"},
        {"machinery_name": "M.D.O. Transfer Pump No. 2"},
        {"machinery_name": "F.O. Purifier"},
        {"machinery_name": "M.D.O. Purifier"},
        {"machinery_name": "L.O. Purifier"},
        {"machinery_name": "Air Compressor No. 1"},
        {"machinery_name": "Air Compressor No. 2"},
        {"machinery_name": "Air Compressor No. 3"},
        {"machinery_name": "F.W. Service Pump"},
        {"machinery_name": "Boiler F.O. Pump"},
        {"machinery_name": "Boiler M.D.O. Pump"},
        {"machinery_name": "Boiler Feed Water Pump No. 1"},
        {"machinery_name": "Boiler Feed Water Pump No. 2"},
        {"machinery_name": "Oil Water Separator"},
        {"machinery_name": "Bilge Pump No. 1"},
        {"machinery_name": "Bilge Pump No. 2"},
        {"machinery_name": "Steering Gear Hydraulic Pump No. 1"},
        {"machinery_name": "Steering Gear Hydraulic Pump No. 2"},
        {"machinery_name": "Aux. Steering Gear Hydraulic Pump No. 1"},
        {"machinery_name": "Aux. Steering Gear Hydraulic Pump No. 2"},
        {"machinery_name": "General Service Pump No. 1"},
        {"machinery_name": "General Service Pump No. 2"},
        {"machinery_name": "General Service Pump"}, // Third GS Pump?
        {"machinery_name": "Ballast Pump No. 1"},
        {"machinery_name": "Ballast Pump No. 2"},
        {"machinery_name": "Main Fire Pump"},
        {"machinery_name": "Aux. Fire Pump"},
        {"machinery_name": "Air Condition Unit"},
        {"machinery_name": "Bow Thruster"}
      ]
    },
    {
      "id": "section_signatures",
      "title": "Signatures",
      "fields": [
        {
          "id": "master_ce_signature",
          "label": "Master / Chief Engineer (Signature / Name / Date)",
          "type": "signature_block",
          "required": true
        },
        {
          "id": "dpa_signature",
          "label": "DPA (Signature / Name / Date)",
          "type": "signature_block",
          "required": false // Office use
        }
      ]
    }
  ]
}
```

---



```json
{
  "title": "Masters Monthly Review",
  "sections": [
    {
      "id": "section_header",
      "title": "Review Period",
      "fields": [
        {
          "id": "review_date",
          "label": "Date",
          "type": "date",
          "required": true
        },
        {
          "id": "review_time",
          "label": "Time",
          "type": "time",
          "required": false
        },
        {
          "id": "review_month",
          "label": "Month",
          "type": "month", // Or text
          "required": true
        },
        {
          "id": "intro_text",
          "label": "Introduction",
          "type": "markdown",
          "content": "This form is to ensure the yacht is up to date with rules and regulations of authorities as well as to ensure yacht is maintained per company procedures."
        }
      ]
    },
    {
      "id": "section_documentation",
      "title": "Documentation",
      "description": "Check your alerts for any missing, expired or soon to expire documentation and certificates.",
      "type": "checklist_group",
      "items": [
        {"id": "doc_sms_updated", "label": "SMS is up to date?"},
        {"id": "doc_sopep_updated", "label": "SOPEP Manual up to date?"},
        {"id": "doc_ship_certs_updated", "label": "Ship Certificates/documents up to date?"},
        {"id": "doc_crew_certs_updated", "label": "Crew is up to date on Certification?"},
        {"id": "doc_logbook_updated", "label": "Vessel Log book entries are up to date?"},
        {"id": "doc_charts_pubs_updated", "label": "Nautical Charts and Publications up to date?"}
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_safety",
      "title": "Safety",
      "description": "Check your alerts for any missing, expired or soon to expire documentation and certificates.", // Note: PDF repeats this text, kept for fidelity
      "type": "checklist_group",
      "items": [
        {"id": "safety_training_manual_provided", "label": "Each crew member provided with training manual?"},
        {"id": "safety_drills_completed", "label": "All Safety Drills completed?"},
        {"id": "safety_lsa_tested", "label": "Life Saving Appliances tested?"},
        {"id": "safety_ffe_tested", "label": "Fire Fighting Equipment tested?"},
        {"id": "safety_crew_muster_duties", "label": "Crew issued Muster Duties?"},
        {"id": "safety_emergency_contact_updated", "label": "Emergency Contact up to date?"},
        {"id": "safety_ship_security_plan_updated", "label": "Ship Security plan updated?"},
        {"id": "safety_alarm_systems_checked", "label": "Alarm Systems checked?"},
        {"id": "safety_comms_systems_checked", "label": "Communications systems checked?"},
        {"id": "safety_circulars_received", "label": "Circulars received?"}
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_maintenance",
      "title": "Maintenance",
      "description": "Check your critical equipment list or tasks and issues for any missed or upcoming maintenance due.",
      "type": "checklist_group",
      "items": [
        {"id": "maint_critical_equip_checked", "label": "Critical equipment checked as per schedule?"},
        {"id": "maint_missed_overdue_tasks", "label": "Any missed/overdue planned maintenance tasks?"},
        {"id": "maint_unplanned_occurred", "label": "Any unplanned maintenance occurred since last review?"}
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        },
        {
          "id": "remarks",
          "label": "Remarks",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_final_remarks",
      "title": "Final Remarks",
      "fields": [
        {
          "id": "final_remarks_details",
          "label": "Remarks",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_signature",
      "title": "Master Signature",
      "fields": [
        {
          "id": "master_signature",
          "label": "Signature",
          "type": "signature_block",
          "required": true
        }
      ]
    }
  ]
}
```

---



```json
{
  "title": "Masters Hand Over Report",
  "sections": [
    {
      "id": "section_header",
      "title": "Handover Details",
      "fields": [
        {
          "id": "vessel_name",
          "label": "Vessel",
          "type": "text",
          "required": true,
          "defaultValue": "Quinta Essentia" // Pre-filled based on PDF
        },
        {
          "id": "outgoing_captain",
          "label": "From Captain",
          "type": "user_select", // Assuming selection of user
          "required": true
        },
        {
          "id": "incoming_captain",
          "label": "To Captain",
          "type": "user_select", // Assuming selection of user
          "required": true
        },
        {
          "id": "handover_date",
          "label": "Was handed over on (Date)",
          "type": "date",
          "required": true
        }
      ]
    },
    {
      "id": "section_checklist",
      "title": "Status Checklist",
      "type": "checklist_group",
      "items": [
        {
          "id": "chk_record_book",
          "label": "Vessel Record Book up to date"
        },
        {
          "id": "chk_crew_certs",
          "label": "Crew Certification up to date"
        },
        {
          "id": "chk_charts_pubs",
          "label": "Charts and Publications up to date"
        },
        {
          "id": "chk_safety_meetings",
          "label": "Safety and Environmental meetings up to date"
        },
        {
          "id": "chk_drills_conducted",
          "label": "Drills conducted as required"
        },
        {
          "id": "chk_itinerary_pending",
          "label": "Itinerary/Pending items (Reviewed?)" // Clarified label
        },
        {
          "id": "chk_pubs_missing",
          "label": "Publications Missing (if yes please list the name of missing publication)" // This is a Yes/No, list is separate
        },
        {
          "id": "chk_sms_docs",
          "label": "SMS and related documents (Reviewed?)" // Clarified label
        },
        {
          "id": "chk_lsa_operational",
          "label": "LSA equipment fully operational"
        },
        {
          "id": "chk_radio_operational",
          "label": "Radio equipment fully operational"
        },
        {
          "id": "chk_critical_equip_operational",
          "label": "Critical Equipment fully operational"
        },
        {
          "id": "chk_accident_report",
          "label": "Vessel Accident Report (Reviewed?)" // Clarified label
        },
        {
          "id": "chk_nonconformities_report",
          "label": "Non Conformities Report (Reviewed?)" // Clarified label
        }
      ],
      "columns": [
        {
          "id": "status",
          "label": "Status",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": true
        }
      ],
      "fields": [
        {
          "id": "checklist_remarks",
          "label": "Remarks (If No is answered for any of the above)",
          "type": "textarea",
          "required": false // Conditional requirement
        }
      ]
    },
    {
      "id": "section_details",
      "title": "Detailed Status",
      "fields": [
        {
          "id": "general_condition",
          "label": "General Condition of Vessel",
          "type": "textarea",
          "required": false
        },
        {
          "id": "work_in_progress",
          "label": "Work in Progress",
          "type": "textarea",
          "required": false
        },
        {
          "id": "missing_publications_list",
          "label": "Missing Publications, if any",
          "type": "textarea",
          "required": false,
          "condition": { // Conditional based on checklist item
            "field": "chk_pubs_missing",
            "value": "Yes"
          }
        },
        {
          "id": "outstanding_repairs",
          "label": "Outstanding Repairs/Defective Items",
          "type": "textarea",
          "required": false
        },
        {
          "id": "repairs_action_taken",
          "label": "Action Taken (for Repairs)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "outstanding_nonconformities",
          "label": "Outstanding Nonconformities",
          "type": "textarea",
          "required": false
        },
        {
          "id": "nonconformities_action_taken",
          "label": "Action Taken (for Nonconformities)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "general_remarks",
          "label": "General",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_signatures",
      "title": "Signatures",
      "fields": [
        {
          "id": "incoming_master_signature",
          "label": "Incoming Master Signature",
          "type": "signature",
          "required": true
        },
        {
          "id": "outgoing_master_signature",
          "label": "Outgoing Master Signature",
          "type": "signature",
          "required": true
        }
        // Names are covered by header fields
      ]
    }
  ]
}
```

---



```json
{
  "title": "Main Engine - Monthly Report",
  "sections": [
    {
      "id": "section_header",
      "title": "Engine Details",
      "fields": [
        {
          "id": "ship_name",
          "label": "Ship",
          "type": "text",
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call Sign",
          "type": "text",
          "required": false
        },
        {
          "id": "inmo_no",
          "label": "INMO No",
          "type": "text",
          "required": false
        },
        {
          "id": "main_engine_no",
          "label": "Main Engine No.",
          "type": "text", // Could be number
          "required": false
        },
        {
          "id": "engine_type_model_serial",
          "label": "Type / Model / Serial No.",
          "type": "text",
          "required": false
        }
      ]
    },
    {
      "id": "section_running_hours",
      "title": "Running Hours",
      "fields": [
        {
          "id": "total_hours_last_month",
          "label": "Total running hours at end of last month",
          "type": "number",
          "required": false
        },
        {
          "id": "hours_this_month",
          "label": "Running hours this month",
          "type": "number",
          "required": false
        },
        {
          "id": "total_hours_this_month",
          "label": "Total running hours at end of this month",
          "type": "number",
          "required": false
        }
      ]
    },
    {
      "id": "section_maintenance_log",
      "title": "Maintenance Log (Unit Number: insert hours since overhaul or date last done)",
      "type": "grid", // Using grid for better layout
      "columns": [
        {"id": "description", "label": "Description", "type": "text", "readOnly": true},
        {"id": "unit_1", "label": "1", "type": "text"}, {"id": "unit_2", "label": "2", "type": "text"}, {"id": "unit_3", "label": "3", "type": "text"}, {"id": "unit_4", "label": "4", "type": "text"},
        {"id": "unit_5", "label": "5", "type": "text"}, {"id": "unit_6", "label": "6", "type": "text"}, {"id": "unit_7", "label": "7", "type": "text"}, {"id": "unit_8", "label": "8", "type": "text"},
        {"id": "unit_9", "label": "9", "type": "text"}, {"id": "unit_10", "label": "10", "type": "text"}, {"id": "unit_11", "label": "11", "type": "text"}, {"id": "unit_12", "label": "12", "type": "text"}
      ],
      "rows": [
        {"description": "Cylinder Head"},
        {"description": "Piston"},
        {"description": "Liner"},
        {"description": "Tappet Clearances"},
        {"description": "Exhaust valves"},
        {"description": "Inlet valves"},
        {"description": "Fuel valve"},
        {"description": "Air start valves"},
        {"description": "Main bearings"},
        {"description": "Bottom end bearings"},
        {"description": "Crankcase / entablature: Deflections"},
        {"description": "Crankcase / entablature: Inspection"},
        {"description": "Crankcase / entablature: Holding down"},
        {"description": "Turbocharger: Oil change"},
        {"description": "Turbocharger: Bearings"},
        {"description": "Turbocharger: Full o\\'haul"},
        {"description": "Air cooler: Filter"},
        {"description": "Air cooler: Airside"},
        {"description": "Air cooler: Waterside"},
        {"description": "L.O. Filter"},
        {"description": "F.O. Filter"},
        {"description": "Governor"},
        {"description": "Safety Devices"}
      ]
    },
    {
      "id": "section_remarks",
      "title": "Remarks",
      "fields": [
        {
          "id": "remarks_details",
          "label": "Remarks",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_signatures",
      "title": "Signatures",
      "fields": [
        {
          "id": "master_ce_signature",
          "label": "Master / Chief Engineer (Signature / Name / Date)",
          "type": "signature_block",
          "required": true
        },
        {
          "id": "dpa_signature",
          "label": "DPA (Signature / Name / Date)",
          "type": "signature_block",
          "required": false // Office use
        }
      ]
    }
  ]
}
```

---



```json
{
  "title": "Aux Engines - Monthly Report",
  "sections": [
    {
      "id": "section_header",
      "title": "Vessel Information",
      "fields": [
        {
          "id": "ship_name",
          "label": "Ship",
          "type": "text",
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call Sign",
          "type": "text",
          "required": false
        },
        {
          "id": "inmo_no",
          "label": "INMO No",
          "type": "text",
          "required": false
        }
      ]
    },
    {
      "id": "section_engines",
      "title": "Engine Reports",
      "type": "array",
      "item_label": "Engine",
      "max_items": 4, // Assuming up to 3 Aux + 1 Emergency based on layout
      "item_structure": {
        "type": "object",
        "fields": [
          {
            "id": "engine_identifier",
            "label": "Engine Identifier (e.g., Aux 1, Emergency Gen)",
            "type": "text",
            "required": true
          },
          {
            "id": "engine_type",
            "label": "Type",
            "type": "text",
            "required": false
          },
          {
            "id": "total_hours_last_month",
            "label": "Total running hours at end of last month",
            "type": "number",
            "required": false
          },
          {
            "id": "hours_this_month",
            "label": "Running hours this month",
            "type": "number",
            "required": false
          },
          {
            "id": "total_hours_this_month",
            "label": "Total running hours at end of this month",
            "type": "number",
            "required": false
          },
          {
            "id": "maintenance_log",
            "label": "Maintenance Log (Hours/Date Last Done)",
            "type": "repeating_group",
            "items": [
              {
                "id": "cyl_heads",
                "label": "Cylinder Heads (12,000 hrs*)",
                "fields": [{"id": "last_done", "label": "Last Done", "type": "text"}]
              },
              {
                "id": "pistons",
                "label": "Pistons (12,000 hrs*)",
                "fields": [{"id": "last_done", "label": "Last Done", "type": "text"}]
              },
              {
                "id": "liners",
                "label": "Liners (12,000 hrs*)",
                "fields": [{"id": "last_done", "label": "Last Done", "type": "text"}]
              },
              {
                "id": "fuel_valves",
                "label": "Fuel valves (3,000 hrs*)",
                "fields": [{"id": "last_done", "label": "Last Done", "type": "text"}]
              },
              {
                "id": "main_bearings",
                "label": "Main bearings (12,000 hrs*)",
                "fields": [{"id": "last_done", "label": "Last Done", "type": "text"}]
              },
              {
                "id": "bottom_end_bearings",
                "label": "Bottom end bearings (12,000 hrs*)",
                "fields": [{"id": "last_done", "label": "Last Done", "type": "text"}]
              },
              {
                "id": "alarms_test",
                "label": "Alarms, Overspeed, Emergency Shut Down – Test (1 mth*)",
                "fields": [{"id": "last_done", "label": "Last Done", "type": "text"}]
              },
              {
                "id": "cooling_water_test",
                "label": "Cooling Water Treatment – Test (1 mth*)",
                "fields": [{"id": "last_done", "label": "Last Done", "type": "text"}]
              },
              {
                "id": "lub_oil_change",
                "label": "Lub Oil Change (600 hrs*)",
                "fields": [{"id": "last_done", "label": "Last Done", "type": "text"}]
              },
              {
                 "id": "turbocharger", // Specific to Emergency Gen in PDF layout
                 "label": "Turbocharger",
                 "fields": [{"id": "last_done", "label": "Last Done", "type": "text"}]
              }
            ]
          }
        ]
      }
    },
    {
      "id": "section_remarks",
      "title": "Remarks",
      "fields": [
        {
          "id": "remarks",
          "label": "Remarks",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_signatures",
      "title": "Signatures",
      "fields": [
        {
          "id": "ch_eng_signature",
          "label": "Ch.Eng (Signature / Name / Date)",
          "type": "signature_block",
          "required": true
        },
        {
          "id": "dpa_signature",
          "label": "DPA (Signature / Name / Date)",
          "type": "signature_block",
          "required": false // Office use
        }
      ]
    }
  ]
}
```

---



```json
{
  "title": "Chief Engineers Monthly Report Form",
  "sections": [
    {
      "id": "section_header",
      "title": "Report Header",
      "fields": [
        {
          "id": "yacht_name",
          "label": "YACHT",
          "type": "text",
          "required": true
        },
        {
          "id": "report_month",
          "label": "REPORT MONTH",
          "type": "month", // Assuming month/year input
          "required": true
        },
        {
          "id": "completed_date",
          "label": "COMPLETED DATE",
          "type": "date",
          "required": true
        }
      ]
    },
    {
      "id": "section_general_ops",
      "title": "GENERAL OPERATIONAL DETAILS",
      "fields": [
        {
          "id": "current_location",
          "label": "Current Location",
          "type": "text",
          "required": false
        },
        {
          "id": "summary_activities",
          "label": "Summary of Activities",
          "type": "textarea",
          "required": false
        },
        {
          "id": "future_activities",
          "label": "Future Activities",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_main_propulsion",
      "title": "MAIN PROPULSION ENGINES AND GEAR BOXES",
      "fields": [
        {
          "id": "main_hours_prt",
          "label": "Current Operating Hours: PRT",
          "type": "number",
          "required": false
        },
        {
          "id": "main_hours_stbd",
          "label": "Current Operating Hours: STBD",
          "type": "number",
          "required": false
        },
        {
          "id": "main_general_condition",
          "label": "General Condition",
          "type": "textarea",
          "required": false
        },
        {
          "id": "main_planned_maintenance",
          "label": "Planned Maintenance Conducted (enter details or attach report)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "main_unplanned_maintenance",
          "label": "Unplanned Maintenance Conducted (enter details or attach report)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_generators",
      "title": "GENERATORS AND POWER MANAGEMENT EQUIPMENT",
      "fields": [
        {
          "id": "gen_hours_1",
          "label": "Current Operating Hours: Number 1",
          "type": "number",
          "required": false
        },
        {
          "id": "gen_hours_2",
          "label": "Current Operating Hours: Number 2",
          "type": "number",
          "required": false
        },
        {
          "id": "gen_hours_3",
          "label": "Current Operating Hours: Number 3",
          "type": "number",
          "required": false
        },
        {
          "id": "gen_general_condition",
          "label": "General Condition",
          "type": "textarea",
          "required": false
        },
        {
          "id": "gen_planned_maintenance",
          "label": "Planned Maintenance Conducted (enter details or attach report)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "gen_unplanned_maintenance",
          "label": "Unplanned Maintenance Conducted (enter details or attach report)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "emergency_gen_hours",
          "label": "Emergency Power Generator Operating Hours",
          "type": "number",
          "required": false
        }
      ]
    },
    {
      "id": "section_controls_steering",
      "title": "CONTROLS AND STEERING",
      "fields": [
        {
          "id": "controls_bridge_wing",
          "label": "BRIDGE And Wing Controls (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "steering_principle_emergency",
          "label": "Principle And Emergency Steering Gear (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_bridge_nav",
      "title": "BRIDGE AND NAVIGATION EQUIPMENT",
      "fields": [
        {
          "id": "bridge_nav_notes",
          "label": "Including AutoPilot, Plotter, GPS, Radar, Depth Sounder, Navigation Lights, AIS (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_fire_bilge",
      "title": "FIRE FIGHTING EQUIPT AND BILGE PUMPING",
      "fields": [
        {
          "id": "fire_bilge_pumps",
          "label": "Fire And Bilge Pumps (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "fire_sprinkler_fixed",
          "label": "Sprinkler or Fixed System (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "fire_smoke_sensors",
          "label": "Fire / Smoke Sensors (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "fire_bilge_alarms",
          "label": "Bilge Alarms (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "fire_emergency_pump",
          "label": "Emergency Pump (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "fire_watertight_doors",
          "label": "Watertight / Fire Doors And Openings (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_lsa",
      "title": "LIFE SAVING EQUIPMENT",
      "fields": [
        {
          "id": "lsa_davits_cranes",
          "label": "Davits And Cranes (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "lsa_rescue_boat",
          "label": "Rescue Boat (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_auxiliary",
      "title": "ADDITIONAL AUXILLARY EQUIPMENT",
      "fields": [
        {
          "id": "aux_hydraulics_pneumatics",
          "label": "Hydraulics And Pneumatics (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "aux_electrical_electronics",
          "label": "Electrical And Electronics (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "aux_pumps_plumbing",
          "label": "Pumps And Plumbing (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        },
        {
          "id": "aux_tenders_toys_other",
          "label": "Tenders And Toys And Other (Note any faults and/or maintenance done)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_other_maintenance",
      "title": "OTHER NON CRITICAL EQUIPMENT MAINTENANCE",
      "fields": [
        {
          "id": "other_maintenance_details",
          "label": "Maintenance done this month (with reason)",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_compliance_spares",
      "title": "Compliance and Spares",
      "fields": [
        {
          "id": "oil_record_book_maintained",
          "label": "OIL RECORD BOOK MAINTAINED AS PER MARPOL AND COMPLETED PAGES SIGNED BY MASTER",
          "type": "radio",
          "options": ["Yes", "No", "N/A"],
          "required": false
        },
        {
          "id": "spares_replaced",
          "label": "HAVE SPARES PARTS, CONSUMABLES ,COMPONENTS USED BEEN REPLACED?",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": false
        },
        {
          "id": "spares_reason_not_replaced",
          "label": "If NO, specify reason",
          "type": "textarea",
          "required": false,
          "condition": {
            "field": "spares_replaced",
            "value": "No"
          }
        }
      ]
    },
    {
      "id": "section_defect_reports",
      "title": "DEFECT REPORTS (NUMBER OF REPORTS, INCLUDING NEW, OUTSTANDING AND CLOSED)",
      "fields": [
        {
          "id": "defects_new",
          "label": "NEW",
          "type": "number",
          "required": false
        },
        {
          "id": "defects_ongoing",
          "label": "ONGOING",
          "type": "number",
          "required": false
        },
        {
          "id": "defects_closed",
          "label": "CLOSED",
          "type": "number",
          "required": false
        },
        {
          "id": "essential_equip_failure_reported",
          "label": "Attention! Essential Equipment Failure is required to be reported to flag. Confirm Flag Has Been Informed.",
          "type": "radio",
          "options": ["Yes", "No"],
          "required": false
        }
      ]
    },
    {
      "id": "section_additional_comments",
      "title": "ADDITIONAL COMMENTS",
      "fields": [
        {
          "id": "additional_comments",
          "label": "Additional Comments",
          "type": "textarea",
          "required": false
        }
      ]
    },
    {
      "id": "section_signatures",
      "title": "Signatures",
      "fields": [
        {
          "id": "chief_engineer_signature",
          "label": "Completed By (Chief Engineer Signature / Name / Date)",
          "type": "signature_block",
          "required": true
        },
        {
          "id": "dpa_signature",
          "label": "DPA Signature (Signature / Name / Date)",
          "type": "signature_block",
          "required": false // Office use
        }
      ]
    }
  ]
}
```

---



```json
{
  "title": "Chief Engineer's Handover Checklist",
  "sections": [
    {
      "id": "section_header",
      "title": "Vessel Information",
      "fields": [
        {
          "id": "ship_name",
          "label": "Ship",
          "type": "text",
          "required": true
        },
        {
          "id": "call_sign",
          "label": "Call Sign",
          "type": "text",
          "required": false
        },
        {
          "id": "inmo_no",
          "label": "INMO No",
          "type": "text",
          "required": false
        }
        // Handover participants (Outgoing/Incoming) likely handled by task assignment/user context
      ]
    },
    {
      "id": "section_checklist",
      "title": "Handover Items Checklist",
      "description": "Description of items handed over and accepted. Both Chief Engineers are to tick each section. Any items found un-acceptable to be marked with an “X” and remarks made for reasons.",
      "type": "checklist_group",
      "items": [
        {
          "id": "chk_engine_logbook",
          "label": "Engine room log book (up to date with correct entries, etc)"
        },
        {
          "id": "chk_oil_record_book",
          "label": "Oil record book (up to date with correct entries, etc)"
        },
        {
          "id": "chk_company_manuals",
          "label": "Company manuals and instructions (location)"
        },
        {
          "id": "chk_company_forms",
          "label": "Company forms (location of blanks, instructions, completed forms)"
        },
        {
          "id": "chk_bunker_robs",
          "label": "Bunker ROBS agreed and any immediate requirements advised. Typical consumptions advised."
        },
        {
          "id": "chk_luboil_robs",
          "label": "Lub oil ROBS agreed and any immediate requirements advised. Typical consumptions advised."
        },
        {
          "id": "chk_main_engine_status",
          "label": "Main engine status and operation"
        },
        {
          "id": "chk_aux_engine_status",
          "label": "Auxiliary engine status and operation"
        },
        {
          "id": "chk_boilers_aux_status",
          "label": "Boilers, auxiliary machinery, critical components, status and operation"
        },
        {
          "id": "chk_class_survey_status",
          "label": "Classification survey status including any overdue or imminent items"
        },
        {
          "id": "chk_major_works",
          "label": "Any major works in hand or imminent"
        },
        {
          "id": "chk_outstanding_spares",
          "label": "Status of any outstanding spares and stores that are on order or will be needed imminently"
        },
        {
          "id": "chk_passwords_keys",
          "label": "Passwords for computer, location of keys for safe, CO2, etc."
        },
        {
          "id": "chk_other_items",
          "label": "Any other items"
        }
      ],
      "columns": [
        {
          "id": "outgoing_status",
          "label": "Outgoing Ch.Eng (Tick/X)",
          "type": "radio",
          "options": ["Tick", "X"],
          "required": true
        },
        {
          "id": "incoming_status",
          "label": "Incoming Ch.Eng (Tick/X)",
          "type": "radio",
          "options": ["Tick", "X"],
          "required": true
        }
      ]
    },
    {
      "id": "section_remarks",
      "title": "Remarks",
      "fields": [
        {
          "id": "unacceptable_remarks",
          "label": "Remarks regarding any items found unacceptable and marked with “X”",
          "type": "textarea",
          "required": false // Required only if any 'X' is selected
        }
      ]
    },
    {
      "id": "section_signatures",
      "title": "Signatures",
      "fields": [
        {
          "id": "outgoing_ce_signature", // Assuming Master/CE refers to Outgoing CE here
          "label": "Outgoing Chief Engineer (Signature / Name / Date)",
          "type": "signature_block",
          "required": true
        },
        {
          "id": "incoming_ce_signature", // Assuming DPA refers to Incoming CE here, based on context
          "label": "Incoming Chief Engineer (Signature / Name / Date)",
          "type": "signature_block",
          "required": true
        }
      ]
    }
  ]
}
```

---

