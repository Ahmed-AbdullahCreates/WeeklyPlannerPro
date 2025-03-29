/**
 * Returns a display-friendly name for a subject type
 * @param type The subject type (standard, art, pe)
 * @returns A display-friendly name
 */
export const getSubjectTypeDisplay = (type: string): string => {
  switch (type) {
    case 'standard':
      return 'Standard';
    case 'art':
      return 'Art';
    case 'pe':
      return 'Physical Education';
    default:
      return 'Unknown';
  }
};

/**
 * Returns the field names that should be shown for a specific subject type
 * @param subjectType The subject type (standard, art, pe)
 * @returns An array of field names
 */
export const getFieldsForSubjectType = (subjectType: string): string[] => {
  switch (subjectType) {
    case 'standard':
      return [
        'topic',
        'booksAndPages',
        'homework',
        'homeworkDueDate',
        'assignments',
        'notes'
      ];
    case 'art':
      return [
        'topic',
        'requiredItems',
        'notes'
      ];
    case 'pe':
      return [
        'skill',
        'activity',
        'notes'
      ];
    default:
      return ['topic', 'notes'];
  }
};

/**
 * Returns display labels for field names
 * @param fieldName The field name
 * @returns The display label
 */
export const getFieldLabel = (fieldName: string): string => {
  switch (fieldName) {
    case 'topic':
      return 'Lessons/Topics';
    case 'booksAndPages':
      return 'Books and Pages';
    case 'homework':
      return 'Homework';
    case 'homeworkDueDate':
      return 'Homework Due Date';
    case 'assignments':
      return 'Assessments';
    case 'notes':
      return 'Notes';
    case 'requiredItems':
      return 'Required Items';
    case 'skill':
      return 'Skill';
    case 'activity':
      return 'Activity';
    default:
      return fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
  }
};

/**
 * Returns the input type for a field
 * @param fieldName The field name
 * @returns The input type
 */
export const getFieldType = (fieldName: string): 'textarea' | 'date' | 'text' => {
  switch (fieldName) {
    case 'homeworkDueDate':
      return 'date';
    case 'topic':
    case 'booksAndPages':
    case 'homework':
    case 'assignments':
    case 'notes':
    case 'requiredItems':
    case 'skill':
    case 'activity':
      return 'textarea';
    default:
      return 'text';
  }
};

/**
 * Returns placeholder text for a field
 * @param fieldName The field name
 * @returns The placeholder text
 */
export const getFieldPlaceholder = (fieldName: string): string => {
  switch (fieldName) {
    case 'topic':
      return 'Enter lesson topics...';
    case 'booksAndPages':
      return 'Specify books and page numbers...';
    case 'homework':
      return 'Describe homework assignment...';
    case 'homeworkDueDate':
      return 'Select due date';
    case 'assignments':
      return 'List assessments or activities...';
    case 'notes':
      return 'Additional notes...';
    case 'requiredItems':
      return 'List required materials...';
    case 'skill':
      return 'Enter skills to develop...';
    case 'activity':
      return 'Describe physical activities...';
    default:
      return `Enter ${fieldName}...`;
  }
};
