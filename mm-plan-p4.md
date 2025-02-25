# Phase 4: Competition and Grade Management

## Overview

This phase extends the existing architecture to handle competitions and their grades. It relies on Appwrite for all authentication, storage, and database operations and uses the Appwrite Node.js server SDK for backend functionality.

## Objectives

1. Provide a CRUD interface for competitions, including:

   - Creating new competitions from:
     - A master list of NZIFSA Grades (stored in “NZIFSA Grades.txt”) to initialize default grades.
     - Copying from existing competitions if preferred.
   - Editing competition details (Year, Name, Category, Segment).
   - Marking competitions as “active” or “inactive.”
   - Deleting competitions, with cascading removal of linked music files.

2. Manage grades linked to each competition:

   - Create and update custom grades derived from the master list.
   - Handle segments and categories for each grade.

3. Integrate data in Phase 5:
   - Use competition details to populate cascaded drop-downs when uploading files.
   - Link uploaded files to a specific competitor and competition.
   - Exclude inactive competitions from selection in the upload form.

## Data Model

- **Competitions Collection**:

  - Fields:
    - year (number)
    - name (string)
    - category (string) – optional if handling categories through a nested structure
    - segment (string) – optional if handling segments through a nested structure
    - grades (list of grade references or embedded sub-documents)
    - active (boolean)
  - Upon deletion, linked files are also removed.

- **Grades**:

  - Root list is “NZIFSA Grades.txt”.
  - Copied into competition for easy customization.
  - Each grade references category, segment, or other relevant metadata.

- **File Uploads**:
  - Linked via references: (competitorID, competitionID).
  - Standard naming format includes: year, competition name, category, segment, and competitor name/ID.

## Implementation Outline

1. **Master Grades Import**:

   - Create a script or function to parse “NZIFSA Grades.txt” into a structured list of categories and segments.
   - Store in memory or a designated collection for potential reference.

2. **Competition Management (Admin)**:

   - **Create**:
     - From default grade list or by copying existing competition data.
     - Initialize competition record with user-specified year, name, etc.
   - **Edit**:
     - Change competition details, toggle active/inactive.
     - Update any custom grade field for that competition.
   - **Read**:
     - List all competitions (with filter by active status if needed).
     - Display relevant details and assigned grades.
   - **Delete**:
     - Remove competition and all associated files.

3. **Grades Management**:

   - After creating a competition, load existing master grades into that competition or copy from a similar competition.
   - Admin can edit or remove individual grades if needed.

4. **File Upload Integration (Phase 5)**:

   - For each upload, competitor selects competition (limited to active) from a dropdown.
   - After competition selection, dynamically load categories and segments for a second/third dropdown.
   - Store references so that deletion of a competition cascades to its files.

5. **Backend Implementation**:

   - Implement Node.js API endpoints with Appwrite server SDK for:
     - Competitions CRUD.
     - Grades insertion, update, and removal.
     - Linking or deleting competition-related files.
   - Ensure referential integrity: on competition deletion, remove files referencing that competition.

6. **Frontend**:
   - Admin UI:
     - Competition Management page for CRUD.
     - Ability to choose from master grades or clone an existing competition.
     - Grade editor embedded within competition form.
   - Competitor UI:
     - Upload page with dynamic selection fields (competition → category → segment).
     - Only active competitions are visible.

## Next Steps

- Implement the above plan incrementally.
- Validate with test data.
- Integrate with Phase 5 to ensure seamless file upload referencing.
