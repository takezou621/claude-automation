const IntelligentScheduleManager = require('../src/intelligent-schedule-manager');
const moment = require('moment-timezone');

// Mock ConfigManager
jest.mock('../src/config-manager', () => {
    return jest.fn().mockImplementation(() => ({
        get: jest.fn((path, defaultValue) => {
            if (path === 'automation.resourceThresholds') {
                return {};
            }
            return defaultValue;
        }),
        set: jest.fn(),
        saveConfig: jest.fn()
    }));
});

describe('IntelligentScheduleManager', () => {
    let scheduleManager;
    let mockConfigManager;

    beforeEach(() => {
        mockConfigManager = {
            get: jest.fn((path, defaultValue) => {
                if (path === 'automation.resourceThresholds') {
                    return {};
                }
                return defaultValue;
            }),
            set: jest.fn(),
            saveConfig: jest.fn(),
            getTierConfig: jest.fn((tier) => {
                const tierConfigs = {
                    ultimate: {
                        enabled: true,
                        schedule: '* * * * *',
                        maxExecutionTime: 45000,
                        priority: 100,
                        fallbackTier: 'rapid',
                        cooldownMinutes: 0
                    },
                    rapid: {
                        enabled: true,
                        schedule: '*/5 * * * *',
                        maxExecutionTime: 240000,
                        priority: 80,
                        fallbackTier: 'smart',
                        cooldownMinutes: 5
                    },
                    smart: {
                        enabled: true,
                        schedule: {
                            weekdays: ['0 14 * * 1-5', '0 17 * * 1-5', '0 20 * * 1-5'],
                            weekends: ['0 1 * * 0,6', '0 5 * * 0,6', '0 9 * * 0,6', '0 13 * * 0,6']
                        },
                        maxExecutionTime: 900000,
                        priority: 60,
                        fallbackTier: null,
                        cooldownMinutes: 180
                    }
                };
                return tierConfigs[tier] || null;
            }),
            getPerformanceMetrics: jest.fn(() => []),
            storePerformanceMetrics: jest.fn()
        };
        
        scheduleManager = new IntelligentScheduleManager(mockConfigManager, {
            timezone: 'UTC',
            activityAnalysisWindow: 30
        });
    });

    describe('constructor', () => {
        it('should initialize with default options', () => {
            const manager = new IntelligentScheduleManager(mockConfigManager);
            expect(manager.timezone).toBe('UTC');
            expect(manager.activityAnalysisWindow).toBe(30);
        });

        it('should initialize with custom options', () => {
            const manager = new IntelligentScheduleManager(mockConfigManager, {
                timezone: 'America/New_York',
                activityAnalysisWindow: 60
            });
            expect(manager.timezone).toBe('America/New_York');
            expect(manager.activityAnalysisWindow).toBe(60);
        });
    });

    describe('getOptimalSchedule', () => {
        it('should return ultimate tier schedule', () => {
            const schedule = scheduleManager.getOptimalSchedule('ultimate');
            expect(schedule.type).toBe('ultimate');
            expect(schedule.cron).toBe('* * * * *');
            expect(schedule.maxExecutionTime).toBe(45000);
            expect(schedule.priority).toBe(100);
        });

        it('should return rapid tier schedule', () => {
            const schedule = scheduleManager.getOptimalSchedule('rapid');
            expect(schedule.type).toBe('rapid');
            // Cron may be optimized based on activity patterns (*/5 or */3)
            expect(schedule.cron).toMatch(/^\*\/[35] \* \* \* \*$/);
            expect(schedule.maxExecutionTime).toBe(240000);
            expect(schedule.priority).toBe(80);
        });

        it('should return smart tier schedule', () => {
            const schedule = scheduleManager.getOptimalSchedule('smart');
            expect(schedule.type).toBe('smart');
            expect(schedule.cron).toHaveProperty('weekdays');
            expect(schedule.cron).toHaveProperty('weekends');
            expect(schedule.maxExecutionTime).toBe(900000);
            expect(schedule.priority).toBe(60);
        });

        it('should include metadata', () => {
            const schedule = scheduleManager.getOptimalSchedule('ultimate');
            expect(schedule.metadata).toHaveProperty('optimizedFor');
            expect(schedule.metadata).toHaveProperty('activityConfidence');
            expect(schedule.metadata).toHaveProperty('resourceStatus');
            expect(schedule.metadata).toHaveProperty('generatedAt');
        });
    });

    describe('getRepositoryActivityAnalysis', () => {
        it('should return activity analysis with patterns', () => {
            const analysis = scheduleManager.getRepositoryActivityAnalysis();
            expect(analysis).toHaveProperty('patterns');
            expect(analysis).toHaveProperty('peakHours');
            expect(analysis).toHaveProperty('quietPeriods');
            expect(analysis).toHaveProperty('developerTimezones');
            expect(analysis).toHaveProperty('confidence');
        });

        it('should return cached analysis on subsequent calls', () => {
            const analysis1 = scheduleManager.getRepositoryActivityAnalysis();
            const analysis2 = scheduleManager.getRepositoryActivityAnalysis();
            expect(analysis1).toBe(analysis2);
        });
    });

    describe('detectActivityPatterns', () => {
        it('should return weekly and daily patterns', () => {
            const patterns = scheduleManager.detectActivityPatterns();
            expect(patterns).toHaveProperty('weeklyPattern');
            expect(patterns).toHaveProperty('dailyPattern');
            expect(patterns).toHaveProperty('seasonality');
            
            expect(patterns.weeklyPattern).toHaveProperty('monday');
            expect(patterns.weeklyPattern).toHaveProperty('tuesday');
            expect(patterns.dailyPattern).toHaveProperty('morning');
            expect(patterns.dailyPattern).toHaveProperty('afternoon');
        });
    });

    describe('getResourceAnalysis', () => {
        it('should return resource analysis', () => {
            const analysis = scheduleManager.getResourceAnalysis();
            expect(analysis).toHaveProperty('github');
            expect(analysis).toHaveProperty('system');
            expect(analysis).toHaveProperty('contention');
            expect(analysis).toHaveProperty('status');
        });

        it('should determine status based on contention', () => {
            const analysis = scheduleManager.getResourceAnalysis();
            expect(['normal', 'moderate_contention', 'high_contention']).toContain(analysis.status);
        });
    });

    describe('shouldExecute', () => {
        it('should return execution decision for ultimate tier', () => {
            const decision = scheduleManager.shouldExecute('ultimate');
            expect(decision).toHaveProperty('shouldExecute');
            expect(decision).toHaveProperty('checks');
            expect(decision).toHaveProperty('reasoning');
            expect(decision).toHaveProperty('schedule');
        });

        it('should allow override execution', () => {
            const decision = scheduleManager.shouldExecute('smart', { forceExecution: true });
            expect(decision.shouldExecute).toBe(true);
            expect(decision.checks.override).toBe(true);
        });
    });

    describe('isInOptimalTimeWindow', () => {
        it('should always return true for ultimate tier', () => {
            const result = scheduleManager.isInOptimalTimeWindow('ultimate', new Date());
            expect(result).toBe(true);
        });

        it('should check time window for rapid tier', () => {
            const result = scheduleManager.isInOptimalTimeWindow('rapid', new Date());
            expect(typeof result).toBe('boolean');
        });

        it('should check specific hours for smart tier', () => {
            const weekdayMorning = new Date('2024-01-15T14:00:00Z'); // Monday 2PM UTC
            const weekdayEvening = new Date('2024-01-15T20:00:00Z'); // Monday 8PM UTC
            const weekend = new Date('2024-01-13T09:00:00Z'); // Saturday 9AM UTC
            
            expect(scheduleManager.isInOptimalTimeWindow('smart', weekdayMorning)).toBe(true);
            expect(scheduleManager.isInOptimalTimeWindow('smart', weekdayEvening)).toBe(true);
            expect(scheduleManager.isInOptimalTimeWindow('smart', weekend)).toBe(true);
        });
    });

    describe('areResourcesAvailable', () => {
        it('should check resource availability for different tiers', () => {
            const resourceAnalysis = scheduleManager.getResourceAnalysis();
            
            const ultimateCheck = scheduleManager.areResourcesAvailable('ultimate', resourceAnalysis);
            const rapidCheck = scheduleManager.areResourcesAvailable('rapid', resourceAnalysis);
            const smartCheck = scheduleManager.areResourcesAvailable('smart', resourceAnalysis);
            
            expect(typeof ultimateCheck).toBe('boolean');
            expect(typeof rapidCheck).toBe('boolean');
            expect(typeof smartCheck).toBe('boolean');
        });
    });

    describe('isCooldownExpired', () => {
        it('should return true for ultimate tier (no cooldown)', () => {
            const result = scheduleManager.isCooldownExpired('ultimate');
            expect(result).toBe(true);
        });

        it('should check cooldown for rapid tier', () => {
            const result = scheduleManager.isCooldownExpired('rapid');
            expect(typeof result).toBe('boolean');
        });

        it('should check cooldown for smart tier', () => {
            const result = scheduleManager.isCooldownExpired('smart');
            expect(typeof result).toBe('boolean');
        });
    });

    describe('timezone handling', () => {
        it('should get timezone offset using moment-timezone', () => {
            const utcOffset = scheduleManager.getTimezoneOffset('UTC');
            const nyOffset = scheduleManager.getTimezoneOffset('America/New_York');
            const tokyoOffset = scheduleManager.getTimezoneOffset('Asia/Tokyo');
            
            expect(utcOffset).toBe(0);
            expect(typeof nyOffset).toBe('number');
            expect(typeof tokyoOffset).toBe('number');
        });

        it('should handle invalid timezone gracefully', () => {
            const invalidOffset = scheduleManager.getTimezoneOffset('Invalid/Timezone');
            expect(invalidOffset).toBe(0);
        });

        it('should adjust cron expression for timezone', () => {
            const cronExpr = '0 14 * * 1-5'; // 2PM UTC weekdays
            const adjusted = scheduleManager.adjustCronForTimezone(cronExpr, -5); // EST
            
            expect(adjusted).toBe('0 9 * * 1-5'); // 9AM EST weekdays
        });
    });

    describe('applyTimezoneOptimization', () => {
        it('should optimize smart tier schedule for timezone', () => {
            const baseSchedule = scheduleManager.getBaseSchedules().smart;
            const optimized = scheduleManager.applyTimezoneOptimization(baseSchedule, 'America/New_York');
            
            expect(optimized.timezoneOptimized).toBe(true);
            expect(optimized.targetTimezone).toBe('America/New_York');
        });
    });

    describe('getScheduleRecommendations', () => {
        it('should return comprehensive recommendations for all tiers', () => {
            const recommendations = scheduleManager.getScheduleRecommendations();
            
            expect(recommendations).toHaveProperty('recommendations');
            expect(recommendations).toHaveProperty('globalOptimizations');
            expect(recommendations).toHaveProperty('summary');
            expect(recommendations).toHaveProperty('generatedAt');
            
            expect(recommendations.recommendations).toHaveProperty('ultimate');
            expect(recommendations.recommendations).toHaveProperty('rapid');
            expect(recommendations.recommendations).toHaveProperty('smart');
        });
    });

    describe('analyzeSchedulePerformance', () => {
        it('should return performance metrics for each tier', () => {
            const ultimatePerf = scheduleManager.analyzeSchedulePerformance('ultimate');
            const rapidPerf = scheduleManager.analyzeSchedulePerformance('rapid');
            const smartPerf = scheduleManager.analyzeSchedulePerformance('smart');
            
            expect(ultimatePerf).toHaveProperty('averageExecutionTime');
            expect(ultimatePerf).toHaveProperty('successRate');
            expect(ultimatePerf).toHaveProperty('resourceEfficiency');
            expect(ultimatePerf).toHaveProperty('lastWeekExecutions');
            
            expect(ultimatePerf.averageExecutionTime).toBe(35000);
            expect(rapidPerf.averageExecutionTime).toBe(180000);
            expect(smartPerf.averageExecutionTime).toBe(600000);
        });
    });

    describe('getOptimizationSuggestions', () => {
        it('should provide optimization suggestions', () => {
            const schedule = scheduleManager.getOptimalSchedule('ultimate');
            const suggestions = scheduleManager.getOptimizationSuggestions('ultimate', schedule);
            
            expect(Array.isArray(suggestions)).toBe(true);
        });
    });

    describe('cache management', () => {
        it('should cache and retrieve data correctly', () => {
            const testData = { test: 'value' };
            scheduleManager.setCachedData('test-key', testData);
            
            const cached = scheduleManager.getCachedData('test-key');
            expect(cached).toEqual(testData);
        });

        it('should return null for expired cache', () => {
            const testData = { test: 'value' };
            scheduleManager.setCachedData('test-key', testData);
            
            // Mock expired cache
            const cached = scheduleManager.activityCache.get('test-key');
            cached.timestamp = Date.now() - (scheduleManager.cacheTimeout + 1000);
            
            const result = scheduleManager.getCachedData('test-key');
            expect(result).toBeNull();
        });
    });

    describe('getNextOptimalTime', () => {
        it('should calculate next optimal time for ultimate tier', () => {
            const nextTime = scheduleManager.getNextOptimalTime('ultimate');
            expect(nextTime).toBeInstanceOf(Date);
            expect(nextTime.getTime()).toBeGreaterThan(Date.now());
        });

        it('should calculate next optimal time for rapid tier', () => {
            const nextTime = scheduleManager.getNextOptimalTime('rapid');
            expect(nextTime).toBeInstanceOf(Date);
            expect(nextTime.getTime()).toBeGreaterThan(Date.now());
        });

        it('should calculate next smart window', () => {
            const nextTime = scheduleManager.getNextOptimalTime('smart');
            expect(nextTime).toBeInstanceOf(Date);
            expect(nextTime.getTime()).toBeGreaterThan(Date.now());
        });
    });

    describe('generateScheduleSummary', () => {
        it('should generate executive summary', () => {
            const recommendations = scheduleManager.getScheduleRecommendations();
            const summary = scheduleManager.generateScheduleSummary(recommendations.recommendations);
            
            expect(summary).toHaveProperty('activeSchedules');
            expect(summary).toHaveProperty('averageSuccessRate');
            expect(summary).toHaveProperty('status');
            expect(summary).toHaveProperty('criticalIssues');
            expect(summary).toHaveProperty('nextMaintenanceWindow');
        });
    });

    describe('identifyCriticalIssues', () => {
        it('should identify critical issues', () => {
            const recommendations = scheduleManager.getScheduleRecommendations();
            const issues = scheduleManager.identifyCriticalIssues(recommendations.recommendations);
            
            expect(Array.isArray(issues)).toBe(true);
        });
    });

    describe('getNextMaintenanceWindow', () => {
        it('should return next maintenance window', () => {
            const nextMaintenance = scheduleManager.getNextMaintenanceWindow();
            expect(typeof nextMaintenance).toBe('string');
            expect(new Date(nextMaintenance).getTime()).toBeGreaterThan(Date.now());
        });
    });
});