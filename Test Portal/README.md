# Test Portal JSON Database System

## Overview
This system uses JSON files to store all test results for B1, B2, and C1 levels. The data is stored in a structured format that makes it easy to edit, backup, and analyze.

## File Structure
```
Test Portal/
├── data/
│   ├── testResults.json      # Main database file
│   ├── B1-config.json        # B1 test configuration
│   ├── B2-config.json        # B2 test configuration
│   └── C1-config.json        # C1 test configuration
├── js/
│   └── testResultsDB.js      # Database management library
├── admin/
│   └── dashboard.html        # Admin interface
└── B1/
    ├── reading.html          # B1 test interface
    └── results.html          # Results display

```

## How It Works

### 1. Data Storage
- All test results are stored in `data/testResults.json`
- Each test result includes: student info, test level, scores, answers, timestamp
- Data is automatically backed up when new results are added

### 2. Automatic Updates
- When a student completes a test, the result is added to the JSON database
- The system automatically downloads an updated `testResults.json` file
- You need to replace the old file with the new one to keep data persistent

### 3. Admin Dashboard
- Access with password: `admin123`
- View all results across B1, B2, C1 levels
- Filter by test level, search students
- Export data as CSV
- Edit or delete individual results

### 4. Data Structure

#### testResults.json Format:
```json
{
  "metadata": {
    "created": "2025-09-25",
    "lastUpdated": "2025-09-25T10:30:00.000Z",
    "totalTests": 150,
    "version": "1.0"
  },
  "statistics": {
    "B1": { "totalTests": 50, "averageScore": 75, "passRate": 80 },
    "B2": { "totalTests": 70, "averageScore": 68, "passRate": 65 },
    "C1": { "totalTests": 30, "averageScore": 62, "passRate": 55 }
  },
  "results": [
    {
      "id": "unique_id_here",
      "timestamp": "2025-09-25T10:30:00.000Z",
      "testLevel": "B1",
      "studentName": "John Doe",
      "studentEmail": "john@example.com",
      "testDate": "9/25/2025",
      "testTime": "10:30:00 AM",
      "totalScore": 24,
      "totalQuestions": 32,
      "percentage": 75,
      "grade": {
        "grade": "Pass with Merit",
        "description": "Very good performance"
      },
      "answers": { "q1": "B", "q2": "A", ... },
      "correctAnswers": { "q1": "B", "q2": "B", ... },
      "partScores": { "part1": 4, "part2": 3, ... }
    }
  ]
}
```

## Managing the System

### Adding New Test Results
- Students take tests normally
- Results are automatically added to the JSON database
- System downloads updated file - replace the old one

### Editing Data
1. **Via Admin Dashboard**: Edit individual results through the web interface
2. **Direct JSON Editing**: Edit the `testResults.json` file directly
3. **Bulk Import**: Replace the entire results array with new data

### Backup and Restore
- **Backup**: Copy `testResults.json` to a safe location
- **Restore**: Replace the current file with your backup
- **Export**: Use admin dashboard to export CSV files

### Statistics
- Automatically calculated and updated
- Shows totals, averages, and pass rates for each test level
- Updated every time new data is added

## Features

### For Students
- Take tests at B1, B2, or C1 levels
- Get immediate results with detailed feedback
- Results automatically stored in the database

### For Administrators
- Password-protected admin access (`admin123`)
- View all test results in one place
- Filter by test level (B1, B2, C1)
- Search by student name or email
- Export data as CSV files
- Edit or delete individual results
- Real-time statistics dashboard

### Data Management
- JSON format is human-readable and editable
- Easy to backup, restore, and migrate
- Compatible with spreadsheet applications
- No database server required
- Works entirely in the browser

## Technical Notes

### File Updates
When the system saves new data, it downloads an updated JSON file. You must:
1. Save the downloaded file
2. Replace the old `testResults.json` in the `data/` folder
3. Refresh the admin dashboard to see new data

### Browser Storage
The system also uses localStorage as a fallback, but the JSON file is the primary storage method for persistence across devices and sessions.

### Security
- Admin access is password protected
- Data is stored locally, not on external servers
- All processing happens in the browser
- No sensitive data is transmitted

## Future Enhancements
- Automatic file synchronization
- Online database integration
- Advanced analytics and reporting
- Student login system
- Test scheduling and management