// src/lib/utils/gradeTemplateUtils.ts

import { Competition, Grade } from '@/types/models';
import { databases } from '@/lib/appwrite/server';
import { ID, Query } from 'node-appwrite';
import masterGradesData from '@/data/master-grades.json';

// Database collection IDs (would be defined in environment variables)
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '';
const COMPETITIONS_COLLECTION_ID = process.env.APPWRITE_COMPETITIONS_COLLECTION_ID || '';
const GRADES_COLLECTION_ID = process.env.APPWRITE_GRADES_COLLECTION_ID || '';

/**
 * Creates a competition document in Appwrite
 * Pure function that takes inputs and returns a Promise of the created Competition
 */
export const createCompetition = async (
  year: number,
  name: string,
  userId: string,
  active: boolean = true
): Promise<Competition> => {
  return databases.createDocument(
    DATABASE_ID,
    COMPETITIONS_COLLECTION_ID,
    ID.unique(),
    {
      year,
      name,
      active,
      createdAt: new Date().toISOString(),
      createdBy: userId,
    }
  ) as Promise<Competition>;
};

/**
 * Creates a grade document in Appwrite
 * Pure function that takes inputs and returns a Promise of the created Grade
 */
export const createGrade = async (gradeData: Omit<Grade, '$id'>): Promise<Grade> => {
  return databases.createDocument(
    DATABASE_ID,
    GRADES_COLLECTION_ID,
    ID.unique(),
    gradeData
  ) as Promise<Grade>;
};

/**
 * Creates a new competition with all grades from the master template
 * Uses composition of pure functions
 */
export const createCompetitionFromTemplate = async (
  year: number,
  name: string,
  userId: string,
  active: boolean = true
): Promise<Competition> => {
  // Create competition first
  const competition = await createCompetition(year, name, userId, active);
  
  // Then add grades using the competition ID
  await addGradesToCompetition(competition.$id);
  
  return competition;
};

/**
 * Maps over the master grades data to generate grade objects
 * Pure function that transforms data without side effects
 */
export const mapMasterGradesToGradeObjects = (
  competitionId: string
): Array<Omit<Grade, '$id'>> => {
  const grades: Array<Omit<Grade, '$id'>> = [];
  
  // Functional approach using map and flatMap
  masterGradesData.categories.forEach(category => {
    const type = category.type;
    
    category.groups.forEach(group => {
      const groupName = group.name;
      
      group.grades.forEach(grade => {
        const categoryName = grade.category;
        
        grade.segments.forEach(segment => {
          grades.push({
            competitionId,
            type,
            groupName,
            category: categoryName,
            segment,
            active: true,
          });
        });
      });
    });
  });
  
  return grades;
};

/**
 * Adds all grades from the master template to a competition
 * Uses functional programming with Promise.all for parallel operations
 */
export const addGradesToCompetition = async (competitionId: string): Promise<void> => {
  try {
    // Generate all grade objects
    const gradeObjects = mapMasterGradesToGradeObjects(competitionId);
    
    // Create all grades in parallel using Promise.all
    await Promise.all(
      gradeObjects.map(gradeData => createGrade(gradeData))
    );
  } catch (error) {
    console.error('Error adding grades to competition:', error);
    throw error;
  }
};

/**
 * Retrieves grades for a specified competition and transforms them into organized structure
 * Uses functional transformation of data
 */
export const getOrganizedGradesForCompetition = async (competitionId: string) => {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      GRADES_COLLECTION_ID,
      [Query.equal('competitionId', competitionId)]
    );
    
    // Use reduce to organize grades by type, group, and category
    return result.documents.reduce((acc: any, grade: any) => {
      // Initialize with empty objects if they don't exist
      if (!acc[grade.type]) acc[grade.type] = {};
      if (!acc[grade.type][grade.groupName]) acc[grade.type][grade.groupName] = {};
      if (!acc[grade.type][grade.groupName][grade.category]) {
        acc[grade.type][grade.groupName][grade.category] = [];
      }
      
      // Add current grade to the appropriate category
      acc[grade.type][grade.groupName][grade.category].push({
        id: grade.$id,
        segment: grade.segment,
        active: grade.active,
        description: grade.description || ''
      });
      
      return acc;
    }, {});
  } catch (error) {
    console.error('Error getting grades for competition:', error);
    throw error;
  }
};

/**
 * Clones a competition and its grades
 * Uses functional composition and Promise.all for efficiency
 */
export const cloneCompetition = async (
  sourceCompetitionId: string,
  year: number,
  name: string,
  userId: string,
  active: boolean = true
): Promise<Competition> => {
  // Create new competition
  const newCompetition = await createCompetition(year, name, userId, active);
  
  // Get source grades
  const sourceGrades = await databases.listDocuments(
    DATABASE_ID,
    GRADES_COLLECTION_ID,
    [Query.equal('competitionId', sourceCompetitionId)]
  );
  
  // Map source grades to new competition
  const newGradePromises = sourceGrades.documents.map(sourceGrade => 
    createGrade({
      competitionId: newCompetition.$id,
      type: sourceGrade.type,
      groupName: sourceGrade.groupName,
      category: sourceGrade.category,
      segment: sourceGrade.segment,
      description: sourceGrade.description || '',
      active: sourceGrade.active,
    })
  );
  
  await Promise.all(newGradePromises);
  
  return newCompetition;
};

/**
 * Deletes a competition and associated grades
 * Uses functional programming with Promise.all for parallel operations
 */
export const deleteCompetitionWithCascade = async (competitionId: string): Promise<void> => {
  try {
    // Get all grades for this competition
    const grades = await databases.listDocuments(
      DATABASE_ID,
      GRADES_COLLECTION_ID,
      [Query.equal('competitionId', competitionId)]
    );
    
    // Delete all grades in parallel
    await Promise.all(
      grades.documents.map(grade => 
        databases.deleteDocument(DATABASE_ID, GRADES_COLLECTION_ID, grade.$id)
      )
    );
    
    // Delete the competition
    await databases.deleteDocument(
      DATABASE_ID, 
      COMPETITIONS_COLLECTION_ID, 
      competitionId
    );
  } catch (error) {
    console.error('Error deleting competition with cascade:', error);
    throw error;
  }
};

/**
 * Updates multiple grades' active status in a single operation
 * Uses functional batch processing
 */
export const updateGradesActiveStatus = async (
  gradeIds: string[],
  active: boolean
): Promise<void> => {
  try {
    await Promise.all(
      gradeIds.map(gradeId => 
        databases.updateDocument(
          DATABASE_ID,
          GRADES_COLLECTION_ID,
          gradeId,
          { active }
        )
      )
    );
  } catch (error) {
    console.error('Error updating grades active status:', error);
    throw error;
  }
};

/**
 * Gets all competitions with optional filtering
 * Uses function parameters for flexibility
 */
export const getCompetitions = async (
  activeOnly: boolean = false,
  sortDirection: 'asc' | 'desc' = 'desc'
): Promise<Competition[]> => {
  try {
    const queries = [
      ...(activeOnly ? [Query.equal('active', true)] : []),
      sortDirection === 'desc' 
        ? Query.orderDesc('year') 
        : Query.orderAsc('year')
    ];
    
    const result = await databases.listDocuments(
      DATABASE_ID,
      COMPETITIONS_COLLECTION_ID,
      queries
    );
    
    return result.documents as unknown as Competition[];
  } catch (error) {
    console.error('Error getting competitions:', error);
    throw error;
  }
};
