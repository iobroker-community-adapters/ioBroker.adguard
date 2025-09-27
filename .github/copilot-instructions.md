# ioBroker Adapter Development with GitHub Copilot

**Version:** 0.4.0
**Template Source:** https://github.com/DrozmotiX/ioBroker-Copilot-Instructions

This file contains instructions and best practices for GitHub Copilot when working on ioBroker adapter development.

## Project Context

You are working on an ioBroker adapter. ioBroker is an integration platform for the Internet of Things, focused on building smart home and industrial IoT solutions. Adapters are plugins that connect ioBroker to external systems, devices, or services.

## Adapter-Specific Context: AdGuard Home Integration

This adapter integrates **AdGuard Home**, a network-wide ad and tracker-blocking DNS server with parental control capabilities. The adapter provides:

- **Primary Function**: Monitor and control AdGuard Home DNS server instances
- **Key Features**: 
  - Real-time status monitoring of DNS filtering
  - Control filtering rules and parental controls  
  - Statistics collection (blocked queries, top clients, etc.)
  - Network protection status tracking
- **API Integration**: Uses AdGuard Home's REST API with authentication
- **Configuration Requirements**:
  - Server address (HTTP/HTTPS endpoint)
  - Username/password authentication
  - Configurable polling interval for status updates
- **Target Environment**: Home networks and small business DNS infrastructure
- **Security Considerations**: Handles sensitive DNS server credentials and network configuration

## Testing

### Unit Testing
- Use Jest as the primary testing framework for ioBroker adapters
- Create tests for all adapter main functions and helper methods
- Test error handling scenarios and edge cases
- Mock external API calls and hardware dependencies
- For adapters connecting to APIs/devices not reachable by internet, provide example data files to allow testing of functionality without live connections
- Example test structure:
  ```javascript
  describe('AdapterName', () => {
    let adapter;
    
    beforeEach(() => {
      // Setup test adapter instance
    });
    
    test('should initialize correctly', () => {
      // Test adapter initialization
    });
  });
  ```

### Integration Testing

**IMPORTANT**: Use the official `@iobroker/testing` framework for all integration tests. This is the ONLY correct way to test ioBroker adapters.

**Official Documentation**: https://github.com/ioBroker/testing

#### Framework Structure
Integration tests MUST follow this exact pattern:

```javascript
const path = require('path');
const { tests } = require('@iobroker/testing');

// Define test coordinates or configuration
const TEST_COORDINATES = '52.520008,13.404954'; // Berlin
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// Use tests.integration() with defineAdditionalTests
tests.integration(path.join(__dirname, '..'), {
    defineAdditionalTests({ suite }) {
        suite('Test adapter with specific configuration', (getHarness) => {
            let harness;

            before(() => {
                harness = getHarness();
            });

            it('should configure and start adapter', function () {
                return new Promise(async (resolve, reject) => {
                    try {
                        harness = getHarness();
                        
                        // Get adapter object using promisified pattern
                        const obj = await new Promise((res, rej) => {
                            harness.objects.getObject('system.adapter.your-adapter.0', (err, o) => {
                                if (err) return rej(err);
                                res(o);
                            });
                        });
                        
                        if (!obj) {
                            return reject(new Error('Adapter object not found'));
                        }

                        // Configure adapter properties
                        Object.assign(obj.native, {
                            position: TEST_COORDINATES,
                            createCurrently: true,
                            createHourly: true,
                            createDaily: true,
                            // Add other configuration as needed
                        });

                        // Set the updated configuration
                        harness.objects.setObject(obj._id, obj);

                        console.log('✅ Step 1: Configuration written, starting adapter...');
                        
                        // Start adapter and wait
                        await harness.startAdapterAndWait();
                        
                        console.log('✅ Step 2: Adapter started');

                        // Wait for adapter to process data
                        const waitMs = 15000;
                        await wait(waitMs);

                        console.log('🔍 Step 3: Checking states after adapter run...');
                        
                        // Check that expected states were created
                        const states = await harness.objects.getObjectViewAsync('system', 'state', {
                            startkey: `${harness.adapterName}.0.`,
                            endkey: `${harness.adapterName}.0.\u9999`
                        });
                        
                        console.log(`✅ Found ${states.rows.length} states created by adapter`);
                        
                        // Check specific states exist
                        const connectionState = await harness.states.getStateAsync(`${harness.adapterName}.0.info.connection`);
                        
                        if (connectionState) {
                            console.log(`✅ Step 4: Connection state exists with value: ${connectionState.val}`);
                        } else {
                            console.log(`⚠️ Step 4: Connection state not found - this may be normal for some adapters`);
                        }
                        
                        console.log('✅ All checks passed!');
                        resolve();
                        
                    } catch (error) {
                        console.error(`❌ Test failed: ${error.message}`);
                        reject(error);
                    }
                });
            });
        });
    }
});
```

#### Critical Implementation Notes
1. **Always use `@iobroker/testing`** - Never create custom test harnesses
2. **MUST include timeout**: `}).timeout(120000);` for integration tests
3. **Pattern: promisify callbacks** for async operations within the testing framework
4. **Check adapter states**: Verify adapter creates expected states and objects
5. **Graceful degradation**: Some checks may be optional depending on adapter functionality

#### Adapter-Specific Testing: AdGuard Home
For AdGuard Home adapter integration tests:
- Mock AdGuard Home API responses to avoid external dependencies
- Test authentication flow with invalid credentials
- Verify DNS server status polling functionality
- Test graceful handling of unreachable AdGuard Home server
- Validate state creation for all monitored metrics (blocked queries, clients, etc.)

```javascript
// AdGuard-specific integration test example
suite('AdGuard Home Integration', (getHarness) => {
    it('should handle AdGuard Home API configuration', async function() {
        const harness = getHarness();
        
        // Configure with mock AdGuard Home server
        await harness.changeAdapterConfig('adguard', {
            native: {
                serverAddress: 'http://localhost:3000', // Mock server
                user: 'testuser',
                password: 'testpass',
                pollInterval: 10
            }
        });
        
        // Start adapter and verify states
        await harness.startAdapterAndWait();
        
        // Check for expected AdGuard-specific states
        const connectionState = await harness.states.getStateAsync('adguard.0.info.connection');
        const statusState = await harness.states.getStateAsync('adguard.0.status');
        
        // Verify states were created (may be false due to mock server)
        expect(connectionState).toBeDefined();
        expect(statusState).toBeDefined();
    }).timeout(120000);
});
```

## ioBroker Development Patterns

### Adapter Lifecycle Management
```javascript
class MyAdapter extends utils.Adapter {
    constructor(options = {}) {
        super({
            ...options,
            name: 'my-adapter',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    async onReady() {
        // Initialize adapter
        await this.setStateAsync('info.connection', false, true);
        this.subscribeStates('*');
        
        // Start your main functionality
        await this.connect();
    }

    async onStateChange(id, state) {
        if (state && !state.ack) {
            // Handle state changes from ioBroker admin/scripts
            this.log.debug(`State ${id} changed: ${state.val}`);
        }
    }

    onUnload(callback) {
        try {
            // Clean up resources
            this.clearTimeouts();
            this.closeConnections();
            callback();
        } catch (e) {
            callback();
        }
    }
}
```

### State and Object Management
```javascript
// Create channel and states
await this.setObjectNotExistsAsync('status', {
    type: 'channel',
    common: {
        name: 'Status Information'
    },
    native: {}
});

await this.setObjectNotExistsAsync('status.connected', {
    type: 'state',
    common: {
        name: 'Connected',
        type: 'boolean',
        role: 'indicator.connected',
        read: true,
        write: false,
    },
    native: {}
});

// Update state with acknowledgment
await this.setStateAsync('status.connected', true, true);
```

### Error Handling and Logging
```javascript
try {
    const result = await this.apiCall();
    this.log.debug('API call successful');
} catch (error) {
    this.log.error(`API call failed: ${error.message}`);
    await this.setStateAsync('info.connection', false, true);
}
```

### AdGuard Home API Integration Patterns
For this specific adapter, follow these patterns for AdGuard Home API integration:

```javascript
// Initialize API client with authentication
async onReady() {
    // Validate server address format
    let serverAddress = this.config.serverAddress;
    if (!serverAddress.startsWith('http')) {
        serverAddress = `http://${serverAddress}`;
    }
    
    this.axiosOptions = {
        auth: { 
            username: this.config.user, 
            password: this.config.password 
        },
        httpsAgent: new https.Agent({ 
            rejectUnauthorized: false 
        }) // For self-signed certificates
    };
    
    // Start polling interval
    await this.startPolling();
}

// Polling pattern for AdGuard status
async startPolling() {
    const pollInterval = this.config.pollInterval * 1000;
    
    const poll = async () => {
        try {
            await this.updateAdGuardStatus();
            this.pollingTimeout = setTimeout(poll, pollInterval);
        } catch (error) {
            this.log.error(`Polling error: ${error.message}`);
            this.pollingTimeout = setTimeout(poll, pollInterval);
        }
    };
    
    await poll();
}

// Clean shutdown
onUnload(callback) {
    try {
        if (this.pollingTimeout) {
            clearTimeout(this.pollingTimeout);
        }
        callback();
    } catch (e) {
        callback();
    }
}
```

### Configuration Handling
```javascript
// Access configuration values
const serverUrl = this.config.serverAddress || 'http://localhost:3000';
const updateInterval = parseInt(this.config.updateInterval) || 30;

// Validate required configuration
if (!this.config.apiKey) {
    this.log.error('API key is required');
    return;
}
```

### Resource Cleanup
```javascript
onUnload(callback) {
  try {
    // Clear all timers
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = undefined;
    }
    if (this.connectionTimer) {
      clearInterval(this.connectionTimer);
      this.connectionTimer = undefined;
    }
    // Close connections, clean up resources
    callback();
  } catch (e) {
    callback();
  }
}
```

## Code Style and Standards

- Follow JavaScript/TypeScript best practices
- Use async/await for asynchronous operations
- Implement proper resource cleanup in `unload()` method
- Use semantic versioning for adapter releases
- Include proper JSDoc comments for public methods

## CI/CD and Testing Integration

### GitHub Actions for API Testing
For adapters with external API dependencies, implement separate CI/CD jobs:

```yaml
# Tests API connectivity with demo credentials (runs separately)
demo-api-tests:
  if: contains(github.event.head_commit.message, '[skip ci]') == false
  
  runs-on: ubuntu-22.04
  
  steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Use Node.js 20.x
      uses: actions/setup-node@v4
      with:
        node-version: 20.x
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run demo API tests
      run: npm run test:integration-demo
```

### CI/CD Best Practices
- Run credential tests separately from main test suite
- Use ubuntu-22.04 for consistency
- Don't make credential tests required for deployment
- Provide clear failure messages for API connectivity issues
- Use appropriate timeouts for external API calls (120+ seconds)

### Package.json Script Integration
Add dedicated script for credential testing:
```json
{
  "scripts": {
    "test:integration-demo": "mocha test/integration-demo --exit"
  }
}
```

### Practical Example: Complete API Testing Implementation
Here's a complete example based on lessons learned from the Discovergy adapter:

#### test/integration-demo.js
```javascript
const path = require("path");
const { tests } = require("@iobroker/testing");

// Helper function to encrypt password using ioBroker's encryption method
async function encryptPassword(harness, password) {
    const systemConfig = await harness.objects.getObjectAsync("system.config");
    
    if (!systemConfig || !systemConfig.native || !systemConfig.native.secret) {
        throw new Error("Could not retrieve system secret for password encryption");
    }
    
    const secret = systemConfig.native.secret;
    let result = '';
    for (let i = 0; i < password.length; ++i) {
        result += String.fromCharCode(secret[i % secret.length].charCodeAt(0) ^ password.charCodeAt(i));
    }
    
    return result;
}

// Run integration tests with demo credentials
tests.integration(path.join(__dirname, ".."), {
    defineAdditionalTests({ suite }) {
        suite("API Testing with Demo Credentials", (getHarness) => {
            let harness;
            
            before(() => {
                harness = getHarness();
            });

            it("Should connect to API and initialize with demo credentials", async () => {
                console.log("Setting up demo credentials...");
                
                if (harness.isAdapterRunning()) {
                    await harness.stopAdapter();
                }
                
                const encryptedPassword = await encryptPassword(harness, "demo_password");
                
                await harness.changeAdapterConfig("your-adapter", {
                    native: {
                        username: "demo@provider.com",
                        password: encryptedPassword,
                        // other config options
                    }
                });

                console.log("Starting adapter with demo credentials...");
                await harness.startAdapter();
                
                // Wait for API calls and initialization
                await new Promise(resolve => setTimeout(resolve, 60000));
                
                const connectionState = await harness.states.getStateAsync("your-adapter.0.info.connection");
                
                if (connectionState && connectionState.val === true) {
                    console.log("✅ SUCCESS: API connection established");
                    return true;
                } else {
                    throw new Error("API Test Failed: Expected API connection to be established with demo credentials. " +
                        "Check logs above for specific API errors (DNS resolution, 401 Unauthorized, network issues, etc.)");
                }
            }).timeout(120000);
        });
    }
});
```

### AdGuard Home Specific CI/CD Considerations
For the AdGuard Home adapter:
- Testing requires a running AdGuard Home instance or mock server
- API endpoints include: `/control/status`, `/control/protection`, `/control/stats`
- Authentication uses basic HTTP auth with username/password
- Test different server configurations (HTTP vs HTTPS, different ports)
- Validate handling of network timeouts and connection failures

## Development Environment Setup

### TypeScript Support
```json
// tsconfig.json
{
  "extends": "@iobroker/adapter-core/tsconfig.json",
  "compilerOptions": {
    "outDir": "./build"
  },
  "include": [
    "src/**/*"
  ]
}
```

### ESLint Configuration
```javascript
// eslint.config.mjs
import config from '@iobroker/eslint-config';

export default [
    ...config,
    {
        ignores: [
            'build/**',
            'admin/words.js'
        ]
    }
];
```

### Package.json Scripts
```json
{
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "watch": "tsc -p tsconfig.build.json --watch",
    "test": "npm run test:ts && npm run test:package",
    "test:ts": "mocha --config test/mocharc.custom.json src/**/*.test.ts",
    "test:package": "mocha test/package --exit",
    "test:unit": "mocha test/unit --exit",
    "test:integration": "mocha test/integration --exit",
    "lint": "eslint -c eslint.config.mjs ."
  }
}
```

## Documentation Standards

### README.md Structure
- Clear installation instructions
- Configuration parameter descriptions
- Changelog with semantic versioning
- License information
- Links to relevant documentation

### Code Documentation
- Use JSDoc for all public methods
- Include parameter types and return values
- Document error conditions and edge cases
- Provide usage examples for complex functionality

## Security Best Practices

### Credential Management
- Use ioBroker's built-in encryption for sensitive data
- Never log passwords or API keys in plain text  
- Implement secure communication (HTTPS) when available
- Validate and sanitize all external inputs

### AdGuard Home Security Considerations
- Validate server certificate when using HTTPS
- Handle authentication failures gracefully
- Protect against DNS spoofing or man-in-the-middle attacks
- Ensure credentials are stored encrypted in ioBroker configuration
- Implement connection timeout and retry logic for network resilience

### Error Handling
```javascript
try {
    const response = await this.makeApiCall();
    // Process successful response
} catch (error) {
    if (error.code === 'ENOTFOUND') {
        this.log.error('AdGuard Home server not reachable');
    } else if (error.response?.status === 401) {
        this.log.error('Authentication failed - check username/password');
    } else {
        this.log.error(`API call failed: ${error.message}`);
    }
    
    await this.setStateAsync('info.connection', false, true);
}
```

## Performance Considerations

### Memory Management
- Avoid memory leaks by properly cleaning up event listeners
- Use appropriate data structures for large datasets
- Implement garbage collection friendly patterns

### API Rate Limiting
- Implement exponential backoff for failed requests
- Cache responses when appropriate
- Use reasonable polling intervals (default: 10 seconds for AdGuard Home status)

### State Updates
- Only update states when values actually change
- Use batch updates for multiple related states
- Implement debouncing for rapidly changing values

## Common Patterns and Anti-Patterns

### ✅ Good Patterns
```javascript
// Proper async/await usage
async function updateData() {
    try {
        const data = await this.fetchData();
        await this.processData(data);
        await this.setStateAsync('lastUpdate', Date.now(), true);
    } catch (error) {
        this.log.error(`Update failed: ${error.message}`);
    }
}

// Resource cleanup
onUnload(callback) {
    try {
        this.clearAllTimers();
        this.closeConnections();
        callback();
    } catch (e) {
        callback();
    }
}
```

### ❌ Anti-Patterns to Avoid
```javascript
// Don't use synchronous operations
const data = fs.readFileSync('config.json'); // ❌

// Don't ignore errors
this.apiCall(); // ❌ No error handling

// Don't forget cleanup
setInterval(() => { /* work */ }, 1000); // ❌ No cleanup reference
```

This file provides comprehensive guidance for GitHub Copilot when working on ioBroker adapter development, with specific focus on AdGuard Home integration patterns and best practices.