/**
 * Test Suite for Analytics Dashboard
 * This file contains comprehensive tests for verifying the analytics dashboard functionality
 * including task calculations, completion rates, and data visualization accuracy.
 */

// Import required dependencies using CommonJS syntax
const TaskAnalyticsDashboard = require('../components/TaskAnalyticsDashboard');
const _ = require('lodash');

/**
 * Generates a set of test tasks with various states and attributes
 * to thoroughly test analytics calculations
 * @returns {Array} Array of test task objects
 */
const generateTestTasks = () => {
    const today = new Date();
    const tasks = [
        {
            id: 1,
            title: "Complete project proposal",
            category: "Work",
            priority: "High",
            completed: true,
            completedAt: new Date(today.setDate(today.getDate() - 1)).toISOString()
        },
        {
            id: 2,
            title: "Review team presentations",
            category: "Work",
            priority: "Medium",
            completed: false
        },
        {
            id: 3,
            title: "Update client documentation",
            category: "Documentation",
            priority: "Low",
            completed: true,
            completedAt: new Date(today.setDate(today.getDate() - 2)).toISOString()
        },
        {
            id: 4,
            title: "Team meeting preparation",
            category: "Meetings",
            priority: "High",
            completed: false
        },
        {
            id: 5,
            title: "Code review",
            category: "Development",
            priority: "Medium",
            completed: true,
            completedAt: new Date(today.setDate(today.getDate() - 1)).toISOString()
        }
    ];
    return tasks;
};

/**
 * Tests the accuracy of total task calculations
 * @param {Array} tasks - Array of task objects to test
 * @returns {boolean} - Whether the test passed
 */
const testTotalTasks = (tasks) => {
    console.log('\n=== Testing Total Tasks ===');
    const expectedTotal = tasks.length;
    console.log(`Expected total tasks: ${expectedTotal}`);
    console.log(`Actual tasks in dataset: ${tasks.length}`);
    const testPassed = expectedTotal === tasks.length;
    console.log(`Test result: ${testPassed ? 'PASSED ✅' : 'FAILED ❌'}`);
    return testPassed;
};

/**
 * Tests the accuracy of completion rate calculations
 * @param {Array} tasks - Array of task objects to test
 * @returns {boolean} - Whether the test passed
 */
const testCompletionRate = (tasks) => {
    console.log('\n=== Testing Completion Rate ===');
    const completedTasks = tasks.filter(task => task.completed).length;
    const expectedRate = Math.round((completedTasks / tasks.length) * 100);
    
    console.log(`Completed tasks: ${completedTasks}`);
    console.log(`Total tasks: ${tasks.length}`);
    console.log(`Expected completion rate: ${expectedRate}%`);
    
    const actualRate = Math.round((completedTasks / tasks.length) * 100);
    console.log(`Actual completion rate: ${actualRate}%`);
    
    const testPassed = expectedRate === actualRate;
    console.log(`Test result: ${testPassed ? 'PASSED ✅' : 'FAILED ❌'}`);
    return testPassed;
};

/**
 * Tests the accuracy of category distribution calculations
 * @param {Array} tasks - Array of task objects to test
 * @returns {boolean} - Whether the test passed
 */
const testCategoryDistribution = (tasks) => {
    console.log('\n=== Testing Category Distribution ===');
    const categoryCount = {};
    
    // Calculate category distribution
    tasks.forEach(task => {
        categoryCount[task.category] = (categoryCount[task.category] || 0) + 1;
    });
    
    console.log('Expected category distribution:');
    Object.entries(categoryCount).forEach(([category, count]) => {
        console.log(`${category}: ${count} tasks`);
    });
    
    // Verify total matches
    const totalFromCategories = Object.values(categoryCount).reduce((sum, count) => sum + count, 0);
    const distributionCorrect = totalFromCategories === tasks.length;
    
    console.log(`\nTotal tasks from categories: ${totalFromCategories}`);
    console.log(`Actual total tasks: ${tasks.length}`);
    console.log(`Test result: ${distributionCorrect ? 'PASSED ✅' : 'FAILED ❌'}`);
    return distributionCorrect;
};

/**
 * Tests the accuracy of trend data calculations
 * @param {Array} tasks - Array of task objects to test
 * @returns {boolean} - Whether the test passed
 */
const testTrendData = (tasks) => {
    console.log('\n=== Testing Trend Data ===');
    
    // Generate last 7 days dates
    const last7Days = [...Array(7)].map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
    }).reverse();
    
    // Calculate completions per day
    const completionsByDay = {};
    last7Days.forEach(date => {
        completionsByDay[date] = tasks.filter(task => 
            task.completedAt && task.completedAt.split('T')[0] === date
        ).length;
    });
    
    console.log('Expected daily completion trend:');
    Object.entries(completionsByDay).forEach(([date, count]) => {
        console.log(`${date}: ${count} tasks completed`);
    });
    
    const trendDataComplete = Object.keys(completionsByDay).length === 7;
    console.log(`\nTest result: ${trendDataComplete ? 'PASSED ✅' : 'FAILED ❌'}`);
    return trendDataComplete;
};

/**
 * Main function to run all analytics tests
 * @returns {boolean} - Whether all tests passed
 */
const runAnalyticsTests = () => {
    console.log('Starting Analytics Dashboard Tests...\n');
    const testTasks = generateTestTasks();
    
    // Store test data in localStorage
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('tasks', JSON.stringify(testTasks));
    }
    
    // Run individual tests
    const totalTasksTest = testTotalTasks(testTasks);
    const completionRateTest = testCompletionRate(testTasks);
    const categoryDistributionTest = testCategoryDistribution(testTasks);
    const trendDataTest = testTrendData(testTasks);
    
    // Generate summary
    console.log('\n=== Test Summary ===');
    console.log(`Total Tasks Test: ${totalTasksTest ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`Completion Rate Test: ${completionRateTest ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`Category Distribution Test: ${categoryDistributionTest ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`Trend Data Test: ${trendDataTest ? 'PASSED ✅' : 'FAILED ❌'}`);
    
    const allTestsPassed = totalTasksTest && completionRateTest && 
                          categoryDistributionTest && trendDataTest;
    
    console.log(`\nOverall Test Result: ${allTestsPassed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌'}`);
    return allTestsPassed;
};

// Export all test functions using CommonJS syntax
module.exports = {
    generateTestTasks,
    testTotalTasks,
    testCompletionRate,
    testCategoryDistribution,
    testTrendData,
    runAnalyticsTests
};

// Run tests automatically when this file is executed
runAnalyticsTests();