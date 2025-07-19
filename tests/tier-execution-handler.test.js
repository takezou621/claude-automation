const TierExecutionHandler = require('../src/tier-execution-handler');

// Mock ConfigManager
jest.mock('../src/config-manager', () => {
    return jest.fn().mockImplementation(() => ({
        get: jest.fn((path, defaultValue) => {
            if (path === 'automation.tiers') {
                return {
                    ultimate: {
                        enabled: true,
                        maxExecutionTime: 45000,
                        fallbackTier: 'rapid',
                        retryAttempts: 3,
                        retryDelay: 1000
                    },
                    rapid: {
                        enabled: true,
                        maxExecutionTime: 240000,
                        fallbackTier: 'smart',
                        retryAttempts: 2,
                        retryDelay: 2000
                    },
                    smart: {
                        enabled: true,
                        maxExecutionTime: 900000,
                        fallbackTier: null,
                        retryAttempts: 1,
                        retryDelay: 5000
                    }
                };
            }
            return defaultValue;
        }),
        set: jest.fn(),
        saveConfig: jest.fn(),
        getTierConfig: jest.fn((tier) => {
            const configs = {
                ultimate: {
                    enabled: true,
                    maxExecutionTime: 45000,
                    fallbackTier: 'rapid',
                    retryAttempts: 3,
                    retryDelay: 1000
                },
                rapid: {
                    enabled: true,
                    maxExecutionTime: 240000,
                    fallbackTier: 'smart',
                    retryAttempts: 2,
                    retryDelay: 2000
                },
                smart: {
                    enabled: true,
                    maxExecutionTime: 900000,
                    fallbackTier: null,
                    retryAttempts: 1,
                    retryDelay: 5000
                }
            };
            return configs[tier] || null;
        })
    }));
});

describe('TierExecutionHandler', () => {
    let handler;
    let mockConfigManager;

    beforeEach(() => {
        mockConfigManager = {
            get: jest.fn((path, defaultValue) => {
                if (path === 'automation.tiers') {
                    return {
                        ultimate: { enabled: true, maxExecutionTime: 45000, fallbackTier: 'rapid' },
                        rapid: { enabled: true, maxExecutionTime: 240000, fallbackTier: 'smart' },
                        smart: { enabled: true, maxExecutionTime: 900000, fallbackTier: null }
                    };
                }
                return defaultValue;
            }),
            set: jest.fn(),
            saveConfig: jest.fn(),
            getTierConfig: jest.fn((tier) => {
                const configs = {
                    ultimate: { enabled: true, maxExecutionTime: 45000, fallbackTier: 'rapid' },
                    rapid: { enabled: true, maxExecutionTime: 240000, fallbackTier: 'smart' },
                    smart: { enabled: true, maxExecutionTime: 900000, fallbackTier: null }
                };
                return configs[tier] || null;
            }),
            getTierSelectionConfig: jest.fn(() => ({
                defaultTier: 'rapid',
                autoSelection: true,
                fallbackChain: ['ultimate', 'rapid', 'smart']
            }))
        };
        
        handler = new TierExecutionHandler(mockConfigManager);
    });

    describe('constructor', () => {
        it('should initialize with ConfigManager', () => {
            expect(handler.configManager).toBeDefined();
            expect(handler.executionQueue).toBeDefined();
            expect(handler.activeExecutions).toBeDefined();
        });

        it('should initialize with default options', () => {
            const defaultHandler = new TierExecutionHandler(mockConfigManager);
            expect(defaultHandler.maxConcurrentExecutions).toBe(5);
            expect(defaultHandler.defaultTimeout).toBe(300000);
        });
    });

    describe('executeTier', () => {
        it('should execute ultimate tier successfully', async () => {
            const mockExecution = jest.fn().mockResolvedValue({ success: true, result: 'test' });
            handler.tierExecutors = { ultimate: mockExecution };

            const result = await handler.executeTier('ultimate', { test: 'data' });
            
            expect(result.success).toBe(true);
            expect(mockExecution).toHaveBeenCalledWith({ test: 'data' });
        });

        it('should handle execution timeout', async () => {
            const slowExecution = jest.fn().mockImplementation(() => 
                new Promise(resolve => setTimeout(() => resolve({ success: true }), 50000))
            );
            handler.tierExecutors = { ultimate: slowExecution };

            const result = await handler.executeTier('ultimate', { test: 'data' });
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('timeout');
        });

        it('should trigger fallback on failure', async () => {
            const failingExecution = jest.fn().mockRejectedValue(new Error('Execution failed'));
            const fallbackExecution = jest.fn().mockResolvedValue({ success: true, result: 'fallback' });
            
            handler.tierExecutors = { 
                ultimate: failingExecution,
                rapid: fallbackExecution
            };

            const result = await handler.executeTier('ultimate', { test: 'data' });
            
            expect(result.success).toBe(true);
            expect(result.result).toBe('fallback');
            expect(result.fallbackUsed).toBe('rapid');
        });
    });

    describe('error handling', () => {
        it('should categorize errors correctly', () => {
            const timeoutError = new Error('Request timeout');
            const resourceError = new Error('Out of memory');
            const validationError = new Error('Invalid input');

            expect(handler.categorizeError(timeoutError)).toBe('timeout');
            expect(handler.categorizeError(resourceError)).toBe('resource');
            expect(handler.categorizeError(validationError)).toBe('validation');
        });

        it('should implement retry logic with exponential backoff', async () => {
            const retryingExecution = jest.fn()
                .mockRejectedValueOnce(new Error('Temporary failure'))
                .mockResolvedValueOnce({ success: true, result: 'retry success' });

            handler.tierExecutors = { ultimate: retryingExecution };

            const result = await handler.executeTier('ultimate', { test: 'data' });
            
            expect(result.success).toBe(true);
            expect(retryingExecution).toHaveBeenCalledTimes(2);
        });
    });

    describe('resource management', () => {
        it('should respect concurrent execution limits', async () => {
            handler.maxConcurrentExecutions = 2;
            
            const slowExecution = jest.fn().mockImplementation(() => 
                new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
            );
            handler.tierExecutors = { ultimate: slowExecution };

            // Start 3 executions simultaneously
            const promises = [
                handler.executeTier('ultimate', { id: 1 }),
                handler.executeTier('ultimate', { id: 2 }),
                handler.executeTier('ultimate', { id: 3 })
            ];

            // Only 2 should be active at once
            expect(handler.activeExecutions.size).toBeLessThanOrEqual(2);

            await Promise.all(promises);
        });

        it('should queue executions when at capacity', async () => {
            handler.maxConcurrentExecutions = 1;
            
            const execution = jest.fn().mockResolvedValue({ success: true });
            handler.tierExecutors = { ultimate: execution };

            const promise1 = handler.executeTier('ultimate', { id: 1 });
            const promise2 = handler.executeTier('ultimate', { id: 2 });

            expect(handler.executionQueue.length).toBeGreaterThan(0);

            await Promise.all([promise1, promise2]);
        });
    });

    describe('monitoring and metrics', () => {
        it('should record execution metrics', async () => {
            const execution = jest.fn().mockResolvedValue({ success: true });
            handler.tierExecutors = { ultimate: execution };

            await handler.executeTier('ultimate', { test: 'data' });

            expect(handler.executionHistory.length).toBeGreaterThan(0);
            expect(handler.executionHistory[0]).toMatchObject({
                tier: 'ultimate',
                success: true
            });
        });

        it('should provide execution statistics', () => {
            handler.executionHistory = [
                { tier: 'ultimate', success: true, executionTime: 30000 },
                { tier: 'ultimate', success: false, executionTime: 40000 },
                { tier: 'rapid', success: true, executionTime: 120000 }
            ];

            const stats = handler.getExecutionStatistics('ultimate');
            
            expect(stats.totalExecutions).toBe(2);
            expect(stats.successRate).toBe(0.5);
            expect(stats.averageExecutionTime).toBe(35000);
        });
    });

    describe('configuration management', () => {
        it('should update tier configuration', async () => {
            const newConfig = {
                maxExecutionTime: 60000,
                retryAttempts: 5
            };

            await handler.updateTierConfiguration('ultimate', newConfig);

            expect(mockConfigManager.set).toHaveBeenCalledWith(
                'automation.tiers.ultimate',
                expect.objectContaining(newConfig)
            );
        });

        it('should validate tier configuration', () => {
            const validConfig = {
                enabled: true,
                maxExecutionTime: 45000,
                fallbackTier: 'rapid'
            };

            const invalidConfig = {
                enabled: 'yes', // Should be boolean
                maxExecutionTime: -1000 // Should be positive
            };

            expect(handler.validateTierConfiguration(validConfig)).toBe(true);
            expect(handler.validateTierConfiguration(invalidConfig)).toBe(false);
        });
    });

    describe('cleanup and shutdown', () => {
        it('should cleanup resources on shutdown', async () => {
            await handler.shutdown();

            expect(handler.activeExecutions.size).toBe(0);
            expect(handler.executionQueue.length).toBe(0);
        });

        it('should wait for active executions to complete', async () => {
            const slowExecution = jest.fn().mockImplementation(() => 
                new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
            );
            handler.tierExecutors = { ultimate: slowExecution };

            // Start execution
            const executionPromise = handler.executeTier('ultimate', { test: 'data' });
            
            // Trigger shutdown
            const shutdownPromise = handler.shutdown();

            // Should wait for execution to complete
            await Promise.all([executionPromise, shutdownPromise]);
            
            expect(handler.activeExecutions.size).toBe(0);
        });
    });
});