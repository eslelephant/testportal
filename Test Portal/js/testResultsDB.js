/**
 * Test Results Database Manager
 * Handles JSON-based storage for B1, B2, and C1 test results
 */

class TestResultsDB {
    constructor() {
        this.dataFile = './data/testResults.json';
        this.cache = null;
        this.loadData();
    }

    // Load data from JSON file
    async loadData() {
        try {
            const response = await fetch(this.dataFile);
            this.cache = await response.json();
            return this.cache;
        } catch (error) {
            console.error('Error loading test results:', error);
            // Initialize with empty structure if file doesn't exist
            this.cache = {
                metadata: {
                    created: new Date().toISOString().split('T')[0],
                    lastUpdated: "",
                    totalTests: 0,
                    version: "1.0"
                },
                statistics: {
                    B1: { totalTests: 0, averageScore: 0, passRate: 0 },
                    B2: { totalTests: 0, averageScore: 0, passRate: 0 },
                    C1: { totalTests: 0, averageScore: 0, passRate: 0 }
                },
                results: []
            };
            return this.cache;
        }
    }

    // Add new test result
    addResult(testResult) {
        const result = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            testLevel: testResult.testLevel || 'B1',
            studentName: testResult.studentName,
            studentEmail: testResult.studentEmail,
            testDate: testResult.testDate,
            testTime: testResult.testTime,
            totalScore: testResult.score,
            totalQuestions: testResult.totalQuestions,
            percentage: testResult.percentage,
            grade: this.calculateGrade(testResult.percentage),
            answers: testResult.answers,
            correctAnswers: testResult.correctAnswers,
            partScores: testResult.partScores || {}
        };

        // Add to results array
        this.cache.results.unshift(result); // Add to beginning (newest first)

        // Update metadata
        this.cache.metadata.lastUpdated = new Date().toISOString();
        this.cache.metadata.totalTests++;

        // Update statistics for the test level
        this.updateStatistics(result.testLevel);

        // Trigger download of updated JSON file
        this.downloadUpdatedFile();

        return result;
    }

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Calculate grade based on percentage
    calculateGrade(percentage) {
        if (percentage >= 85) return { grade: 'Excellent', description: 'Outstanding performance' };
        if (percentage >= 70) return { grade: 'Pass with Merit', description: 'Very good performance' };
        if (percentage >= 60) return { grade: 'Pass', description: 'Good performance' };
        if (percentage >= 45) return { grade: 'Borderline', description: 'Need improvement' };
        return { grade: 'Below Pass', description: 'Requires significant improvement' };
    }

    // Update statistics for a specific test level
    updateStatistics(testLevel) {
        const levelResults = this.cache.results.filter(r => r.testLevel === testLevel);
        const totalTests = levelResults.length;
        
        if (totalTests === 0) return;

        const totalScore = levelResults.reduce((sum, r) => sum + r.percentage, 0);
        const averageScore = Math.round(totalScore / totalTests);
        const passCount = levelResults.filter(r => r.percentage >= 60).length;
        const passRate = Math.round((passCount / totalTests) * 100);

        this.cache.statistics[testLevel] = {
            totalTests,
            averageScore,
            passRate
        };
    }

    // Get all results
    getAllResults() {
        return this.cache ? this.cache.results : [];
    }

    // Get results by test level
    getResultsByLevel(level) {
        return this.getAllResults().filter(r => r.testLevel === level);
    }

    // Get statistics
    getStatistics() {
        return this.cache ? this.cache.statistics : {};
    }

    // Update a result
    updateResult(id, updates) {
        const index = this.cache.results.findIndex(r => r.id === id);
        if (index !== -1) {
            this.cache.results[index] = { ...this.cache.results[index], ...updates };
            this.cache.metadata.lastUpdated = new Date().toISOString();
            
            // Recalculate statistics
            this.updateStatistics(this.cache.results[index].testLevel);
            
            this.downloadUpdatedFile();
            return this.cache.results[index];
        }
        return null;
    }

    // Delete a result
    deleteResult(id) {
        const index = this.cache.results.findIndex(r => r.id === id);
        if (index !== -1) {
            const deleted = this.cache.results.splice(index, 1)[0];
            this.cache.metadata.totalTests--;
            this.cache.metadata.lastUpdated = new Date().toISOString();
            
            // Recalculate statistics
            this.updateStatistics(deleted.testLevel);
            
            this.downloadUpdatedFile();
            return deleted;
        }
        return null;
    }

    // Download updated JSON file
    downloadUpdatedFile() {
        const jsonString = JSON.stringify(this.cache, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'testResults.json';
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        console.log('Updated testResults.json downloaded. Please replace the file in your data folder.');
    }

    // Export results as CSV
    exportToCSV(testLevel = null) {
        const results = testLevel ? this.getResultsByLevel(testLevel) : this.getAllResults();
        
        const headers = [
            'ID', 'Test Level', 'Student Name', 'Email', 'Test Date', 'Test Time',
            'Score', 'Total Questions', 'Percentage', 'Grade', 'Timestamp'
        ];
        
        const rows = results.map(r => [
            r.id,
            r.testLevel,
            r.studentName,
            r.studentEmail,
            r.testDate,
            r.testTime,
            r.totalScore,
            r.totalQuestions,
            r.percentage,
            r.grade.grade,
            r.timestamp
        ]);
        
        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `test-results-${testLevel || 'all'}-${new Date().toISOString().split('T')[0]}.csv`;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    // Search results
    searchResults(query) {
        const lowercaseQuery = query.toLowerCase();
        return this.getAllResults().filter(r => 
            r.studentName.toLowerCase().includes(lowercaseQuery) ||
            r.studentEmail.toLowerCase().includes(lowercaseQuery) ||
            r.testLevel.toLowerCase().includes(lowercaseQuery)
        );
    }
}

// Initialize global instance
window.testDB = new TestResultsDB();

// Export functions for use in other scripts
window.TestResultsDB = TestResultsDB;