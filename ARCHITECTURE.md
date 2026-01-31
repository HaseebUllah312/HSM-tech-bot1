# 🏗️ HSM TECH BOT v3.0 - Architecture Documentation

Technical architecture and system design documentation.

## System Overview

HSM TECH BOT is built using a modular, layered architecture with clear separation of concerns. The system uses the Baileys library to interface with WhatsApp Web and implements enterprise-grade security, logging, and monitoring.

```
┌─────────────────────────────────────────────────────────────┐
│                     WhatsApp Users                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  WhatsApp Servers                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Baileys Library (WebSocket)                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    bot.js (Main)                            │
│  - Connection Management                                    │
│  - QR Code Authentication                                   │
│  - Event Handling                                           │
│  - Graceful Shutdown                                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬─────────────┐
        ▼             ▼             ▼             ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│   Message    │ │ Security │ │  Email   │ │    File      │
│   Handler    │ │  Module  │ │ Service  │ │   Manager    │
└──────┬───────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘
       │              │            │               │
       └──────┬───────┴────────────┴───────────────┘
              ▼
      ┌──────────────┐
      │   Config &   │
      │   Logger     │
      └──────────────┘
```

## Module Breakdown

### 1. Core Application (`bot.js`)

**Responsibilities**:
- Initialize Baileys WhatsApp socket
- Handle authentication (QR code, session persistence)
- Manage connection state (connect, disconnect, reconnect)
- Route incoming messages to message handler
- Schedule daily email reports
- Implement graceful shutdown

**Key Functions**:
- `startBot()` - Main entry point
- `getReconnectDelay()` - Exponential backoff calculation
- Event listeners for: `connection.update`, `messages.upsert`, `group-participants.update`

**Dependencies**: All core modules

**State Management**:
- Connection retry counter
- Auth state (stored in `auth/` directory)

### 2. Configuration Module (`src/config.js`)

**Responsibilities**:
- Load environment variables from `.env`
- Validate configuration using Joi schema
- Provide typed configuration object
- Parse comma-separated lists
- Set sensible defaults

**Key Functions**:
- `loadConfig()` - Load and validate configuration
- `parseBoolean()` - Convert string to boolean

**Validation Rules**:
- Email format validation
- Number ranges (rate limits, retention days)
- Required vs optional fields
- Type checking (boolean, string, number)

**Output**: Singleton config object exported to all modules

### 3. Logger Module (`src/logger.js`)

**Responsibilities**:
- Multi-level logging (debug, info, warn, error)
- Console output with colors
- File logging with timestamps
- Log rotation and retention
- Stack trace formatting

**Log Levels**:
- **DEBUG**: Development debugging (cyan)
- **INFO**: General information (white)
- **WARN**: Warning messages (yellow)
- **ERROR**: Error messages with stack traces (red)

**Features**:
- Automatic log file creation
- Configurable retention policy
- Structured logging with context
- Color-coded console output

**Storage**: `logs/app.log`

### 4. Security Module (`src/security.js`)

**Responsibilities**:
- Input sanitization
- Rate limiting (per-user sliding window)
- User blocking/unblocking
- Path validation (prevent directory traversal)
- Admin permission checking
- Group whitelist validation
- Safe error message generation

**Security Layers**:

1. **Input Sanitization**:
   - Remove null bytes
   - Trim whitespace
   - Enforce length limits
   - Prevent injection attacks

2. **Rate Limiting**:
   - Sliding window algorithm
   - Per-user message tracking
   - Configurable limits
   - Automatic cleanup of old entries

3. **Access Control**:
   - Admin-only commands
   - User blocking system
   - Group whitelisting
   - Sender validation

4. **Path Security**:
   - Prevent `../` traversal
   - Block absolute paths
   - Validate file operations

**Data Structures**:
- `rateLimitMap`: Map<userId, timestamp[]>
- `blockedUsersSet`: Set<userId>

### 5. File Manager Module (`src/fileManager.js`)

**Responsibilities**:
- List files in VU_Files directory
- Search and filter files
- Format file metadata
- Secure file access
- File size formatting

**Key Functions**:
- `listFiles()` - Get all files with metadata
- `searchFiles(query)` - Search by filename
- `getFile(fileName)` - Get specific file
- `getFormattedFileList()` - Format for WhatsApp display
- `formatFileSize(bytes)` - Human-readable sizes

**Security**:
- Path validation before access
- Sandboxed to VU_Files directory only
- No arbitrary file access

### 6. Message Handler Module (`src/messageHandler.js`)

**Responsibilities**:
- Process incoming messages
- Parse and route commands
- Detect greetings (multi-language)
- Execute command handlers
- Track statistics
- Generate auto-replies

**Command Registry**:
```javascript
commands = {
  help: Handler for !help
  status: Handler for !status
  ping: Handler for !ping
  files: Handler for !files
  contact: Handler for !contact
  paid: Handler for !paid
  toggle: Handler for !toggle (admin)
  block: Handler for !block (admin)
  unblock: Handler for !unblock (admin)
}
```

**Message Flow**:
```
Message Received
  ↓
Sanitize Input
  ↓
Check if Blocked
  ↓
Check Rate Limit
  ↓
Check Bot Enabled
  ↓
Command? → Yes → Parse → Execute → Response
  ↓ No
Greeting? → Yes → Auto-Reply
  ↓ No
Auto-Reply Enabled? → Yes → Generic Reply
```

**Statistics Tracking**:
- Messages received
- Commands executed
- Errors
- Recent commands (last 10)
- Recent errors (last 10)
- Uptime

### 7. Email Service Module (`src/emailService.js`)

**Responsibilities**:
- Gmail SMTP integration
- Send daily reports
- Send error alerts
- Send startup notifications
- HTML email formatting

**Email Types**:

1. **Daily Reports**:
   - Activity summary
   - Statistics
   - Feature status
   - Recent commands/errors
   - Scheduled daily

2. **Error Alerts**:
   - Error message
   - Stack trace
   - Timestamp
   - Sent immediately on critical errors

3. **Startup Notifications**:
   - Bot version
   - Startup time
   - Sent on bot start

**Configuration**:
- Gmail App Password required
- Configurable recipient
- HTML templates with CSS

## Data Flow

### Incoming Message Flow

```
1. WhatsApp → Baileys → bot.js (messages.upsert event)
2. bot.js → messageHandler.handleMessage()
3. messageHandler → security.sanitizeInput()
4. messageHandler → security.checkRateLimit()
5. messageHandler → security.isUserBlocked()
6. messageHandler → Parse command
7. messageHandler → Execute command handler
8. Command handler → External modules (fileManager, etc.)
9. Command handler → bot.js (sendMessage)
10. bot.js → Baileys → WhatsApp → User
```

### Daily Report Flow

```
1. node-schedule triggers at configured time
2. bot.js → messageHandler.getStats()
3. bot.js → emailService.sendDailyReport(stats)
4. emailService → Format HTML email
5. emailService → nodemailer → Gmail SMTP
6. Gmail → Configured recipient inbox
```

## Error Handling Strategy

### Levels of Error Handling

1. **Module Level**:
   - Try-catch in each function
   - Log errors with context
   - Return safe defaults
   - Never crash the process

2. **Message Handler Level**:
   - Wrap all message processing
   - Send safe error messages to users
   - Track errors in statistics
   - Continue processing other messages

3. **Application Level**:
   - Catch connection errors
   - Implement retry logic
   - Send email alerts
   - Graceful degradation

### Retry Logic

**Exponential Backoff**:
```
Attempt 1: 2 seconds
Attempt 2: 4 seconds
Attempt 3: 8 seconds
Attempt 4: 16 seconds
Attempt 5: 32 seconds
Attempt 6+: 60 seconds (max)
```

**Reset on Success**: Counter resets to 0 on successful connection

## Scalability Considerations

### Current Architecture

- **Single Instance**: One bot per WhatsApp account
- **In-Memory State**: Rate limiting and stats in RAM
- **File-based Logging**: Single log file
- **No Database**: All data ephemeral except config

### Scaling Options

1. **Multiple Instances**:
   - Run multiple bots with different WhatsApp accounts
   - Each instance independent
   - Load balance across accounts

2. **Database Integration**:
   - Add PostgreSQL/MySQL for persistent state
   - Store message history
   - User preferences
   - Analytics

3. **Redis for Rate Limiting**:
   - Distributed rate limiting
   - Shared state across instances
   - Better performance

4. **Message Queue**:
   - RabbitMQ/Redis for message processing
   - Async command execution
   - Better handling of spikes

5. **Monitoring**:
   - Prometheus metrics
   - Grafana dashboards
   - Alert manager integration

## Security Architecture

### Defense in Depth

```
Layer 1: Input Validation (sanitizeInput)
Layer 2: Rate Limiting (checkRateLimit)
Layer 3: User Blocking (isUserBlocked)
Layer 4: Permission Checking (isAdmin)
Layer 5: Group Filtering (isGroupWhitelisted)
Layer 6: Path Validation (isValidFilePath)
Layer 7: Error Masking (getSafeErrorMessage)
Layer 8: Logging & Monitoring (logger)
```

### Threat Model

**Threats Mitigated**:
- ✅ Spam/DoS attacks (rate limiting)
- ✅ Malicious input (sanitization)
- ✅ Unauthorized access (admin checks)
- ✅ Directory traversal (path validation)
- ✅ Information disclosure (error masking)

**Threats Not Mitigated**:
- ❌ WhatsApp account ban (use separate number)
- ❌ Network attacks (use VPS with firewall)
- ❌ Physical access (secure your server)

## Configuration Management

### Environment-based Config

- **Development**: Detailed logging, test mode
- **Production**: Optimized logging, email alerts

### Feature Toggles

Runtime-configurable features:
- Bot enabled/disabled
- Auto-reply
- File sharing
- Email reports
- Welcome messages

No restart required for toggle changes.

## Testing Strategy

### Test Coverage

- **Unit Tests**: Each module tested independently
- **Integration Tests**: Module interactions
- **Edge Cases**: Null inputs, long strings, invalid paths
- **Security Tests**: Injection attempts, path traversal

### Test Execution

```bash
npm test
```

57+ test cases covering:
- Configuration validation
- Input sanitization
- Rate limiting logic
- File operations
- Command parsing
- Email formatting

## Deployment Architecture

### Local Development

```
Developer Machine
  ├── Node.js
  ├── Bot Code
  ├── WhatsApp Connection
  └── Terminal (QR Code)
```

### Production (VPS)

```
Cloud Server (DigitalOcean/AWS)
  ├── Ubuntu/CentOS
  ├── Node.js v18+
  ├── PM2 Process Manager
  ├── Bot Code (git pull)
  ├── Firewall (ufw)
  ├── Nginx (optional reverse proxy)
  └── Monitoring (PM2/Grafana)
```

## Performance Characteristics

### Resource Usage

- **CPU**: Low (< 5% idle, < 20% under load)
- **Memory**: ~100-200 MB
- **Network**: Minimal (WebSocket)
- **Disk**: Log files only (configurable retention)

### Bottlenecks

1. **WhatsApp API Rate Limits**: Baileys handles this
2. **Message Processing**: Single-threaded, async
3. **Email Sending**: Network latency
4. **File I/O**: Log writes

### Optimization Opportunities

- Batch log writes
- Cache file listings
- Database for analytics
- Worker threads for heavy commands

---

**Architecture Version**: 3.0.0  
**Last Updated**: January 2026  
**Status**: Production Ready
