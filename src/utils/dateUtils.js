/**
 * Safely determines if an issue record or instrument is overdue
 * @param {Object|string} record - Issue record object or due date string
 * @returns {boolean}
 */
export const isRecordOverdue = (record) => {
  if (!record) return false;

  // Extract date string
  const dueDateStr = typeof record === 'string' ? record : (record.dueDate || record.due_date);
  const state = record.state || record.status;

  // Closed or returned items cannot be overdue
  if (state === 'RETURNED' || state === 'CANCELLED' || state === 'AVAILABLE') {
    return false;
  }

  if (!dueDateStr) return false;

  // Normalize current date to midnight (local time)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parse due date
  let due = new Date(dueDateStr);

  // Handle slash or alternate date string formats if necessary
  if (isNaN(due.getTime())) {
    const parts = dueDateStr.split(/[-/ ]/);
    if (parts.length === 3) {
      // Handles YYYY-MM-DD or DD-MM-YYYY
      due = new Date(parts[0], parts[1] - 1, parts[2]);
    }
  }

  if (isNaN(due.getTime())) return false;

  due.setHours(0, 0, 0, 0);

  // Overdue if the due date is strictly before today
  return due.getTime() < today.getTime();
};