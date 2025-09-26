/**
 * Enhanced Test Results Storage Manager
 * Uses localStorage with IndexedDB fallback for persistent browser storage
 */

class PersistentTestStorage {
    constructor() {
        this.storageKey = 'testPortalDatabase';
        this.backupKey = 'testPortalBackup';
        this.init();
    }

    // Initialize storage
    async init() {
        // Check if IndexedDB is available
        this.hasIndexedDB = typeof window !== 'undefined' && 'indexedDB' in window;
        
        // Load existing data
        await this.loadData();
        
        // Set up auto-backup
        this.setupAutoBackup();
    }

    // Load data from storage
    async loadData() {
        try {
            // Try localStorage first
            const localData = localStorage.getItem(this.storageKey);
            if (localData) {
                this.data = JSON.parse(localData);
                console.log('Loaded data from localStorage');
                return this.data;
            }

            // If no localStorage, initialize empty structure
            this.data = this.createEmptyDatabase();
            this.saveData();
            console.log('Initialized empty database');
            return this.data;
        } catch (error) {
            console.error('Error loading data:', error);
            this.data = this.createEmptyDatabase();
            return this.data;
        }
    }

    // Create empty database structure
    createEmptyDatabase() {
        return {
            metadata: {
                created: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                totalTests: 0,
                version: "2.0"
            },
            statistics: {
                B1: { totalTests: 0, averageScore: 0, passRate: 0 },
                B2: { totalTests: 0, averageScore: 0, passRate: 0 },
                C1: { totalTests: 0, averageScore: 0, passRate: 0 }
            },
            results: []
        };
    }

    // Save data to storage
    saveData() {
        try {
            // Update metadata
            this.data.metadata.lastUpdated = new Date().toISOString();
            
            // Save to localStorage
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            
            // Create backup copy
            localStorage.setItem(this.backupKey, JSON.stringify(this.data));
            
            console.log('Data saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
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
        this.data.results.unshift(result); // Add to beginning (newest first)
        
        // Update metadata
        this.data.metadata.totalTests++;
        
        // Update statistics
        this.updateStatistics(result.testLevel);
        
        // Save changes
        this.saveData();
        
        console.log('Test result added:', result.studentName);
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

    // Update statistics for a test level
    updateStatistics(testLevel) {
        const levelResults = this.data.results.filter(r => r.testLevel === testLevel);
        const totalTests = levelResults.length;
        
        if (totalTests === 0) {
            this.data.statistics[testLevel] = { totalTests: 0, averageScore: 0, passRate: 0 };
            return;
        }

        const totalScore = levelResults.reduce((sum, r) => sum + r.percentage, 0);
        const averageScore = Math.round(totalScore / totalTests);
        const passCount = levelResults.filter(r => r.percentage >= 60).length;
        const passRate = Math.round((passCount / totalTests) * 100);

        this.data.statistics[testLevel] = {
            totalTests: totalTests,
            averageScore: averageScore,
            passRate: passRate
        };
    }

    // Get all results
    getAllResults() {
        return [...this.data.results];
    }

    // Get results by test level
    getResultsByLevel(level) {
        return this.data.results.filter(r => r.testLevel === level);
    }

    // Get results by date range
    getResultsByDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return this.data.results.filter(r => {
            const resultDate = new Date(r.timestamp);
            return resultDate >= start && resultDate <= end;
        });
    }

    // Export database as JSON
    exportDatabase() {
        const exportData = {
            ...this.data,
            exportInfo: {
                exportDate: new Date().toISOString(),
                exportedBy: 'Test Portal Admin',
                version: this.data.metadata.version
            }
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `testResults_${new Date().toISOString().split('T')[0]}.json`;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        console.log('Database exported successfully');
        return exportData;
    }

    // Import database from JSON
    importDatabase(jsonData) {
        try {
            // Validate structure
            if (!jsonData.results || !Array.isArray(jsonData.results)) {
                throw new Error('Invalid database structure');
            }

            // Merge with existing data
            const existingIds = new Set(this.data.results.map(r => r.id));
            let importedCount = 0;

            jsonData.results.forEach(result => {
                if (!existingIds.has(result.id)) {
                    this.data.results.push(result);
                    importedCount++;
                }
            });

            // Update metadata and statistics
            this.data.metadata.totalTests = this.data.results.length;
            this.data.metadata.lastUpdated = new Date().toISOString();
            
            // Recalculate statistics
            ['B1', 'B2', 'C1'].forEach(level => {
                this.updateStatistics(level);
            });

            // Save changes
            this.saveData();

            console.log(`Successfully imported ${importedCount} new results`);
            return { success: true, imported: importedCount };
        } catch (error) {
            console.error('Error importing database:', error);
            return { success: false, error: error.message };
        }
    }

    // Delete a specific result by ID
    deleteResult(id) {
        try {
            const initialLength = this.data.results.length;
            
            // Remove the result from the main array
            this.data.results = this.data.results.filter(result => result.id !== id);
            
            // Update metadata
            this.data.metadata.lastUpdated = new Date().toISOString();
            
            // Save the updated data
            this.saveData();
            
            // Also remove from legacy localStorage if it exists
            const legacyResults = JSON.parse(localStorage.getItem('allTestResults') || '[]');
            const filteredLegacy = legacyResults.filter(result => result.id !== id);
            localStorage.setItem('allTestResults', JSON.stringify(filteredLegacy));
            
            // Remove individual legacy keys that might match
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('testResult_')) {
                    try {
                        const storedResult = JSON.parse(localStorage.getItem(key));
                        if (storedResult && storedResult.id === id) {
                            localStorage.removeItem(key);
                            break;
                        }
                    } catch (e) {
                        // Ignore parsing errors for individual keys
                    }
                }
            }
            
            const deleted = initialLength > this.data.results.length;
            if (deleted) {
                console.log(`Result ${id} deleted successfully`);
            } else {
                console.log(`Result ${id} not found`);
            }
            
            return { success: deleted, id: id };
        } catch (error) {
            console.error('Error deleting result:', error);
            return { success: false, error: error.message };
        }
    }

    // Clear all data
    clearAllData() {
        this.data = this.createEmptyDatabase();
        this.saveData();
        
        // Also clear legacy localStorage keys
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('testResult_') || key === 'allTestResults' || key === 'testResults')) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        console.log('All test data cleared');
    }

    // Set up automatic backup
    setupAutoBackup() {
        // Save backup every 5 minutes if there are changes
        setInterval(() => {
            if (this.data && this.data.results.length > 0) {
                try {
                    localStorage.setItem(this.backupKey, JSON.stringify(this.data));
                } catch (error) {
                    console.error('Auto-backup failed:', error);
                }
            }
        }, 5 * 60 * 1000); // 5 minutes
    }

    // Recover from backup
    recoverFromBackup() {
        try {
            const backupData = localStorage.getItem(this.backupKey);
            if (backupData) {
                this.data = JSON.parse(backupData);
                this.saveData();
                console.log('Data recovered from backup');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error recovering from backup:', error);
            return false;
        }
    }

    // Get storage info
    getStorageInfo() {
        const dataSize = JSON.stringify(this.data).length;
        const totalLocalStorage = JSON.stringify(localStorage).length;
        
        return {
            totalResults: this.data.results.length,
            dataSize: `${Math.round(dataSize / 1024)} KB`,
            totalStorageUsed: `${Math.round(totalLocalStorage / 1024)} KB`,
            lastUpdated: this.data.metadata.lastUpdated,
            hasBackup: !!localStorage.getItem(this.backupKey)
        };
    }
}

// Global instance
try {
    window.testStorage = new PersistentTestStorage();
    console.log('Persistent storage instance created');
} catch (error) {
    console.error('Error creating persistent storage:', error);
    window.testStorage = null;
}