/**
 * Email Service Module
 * Send notifications and daily reports via Gmail
 */

const nodemailer = require('nodemailer');
const config = require('./config');
const logger = require('./logger');

let transporter = null;

/**
 * Initialize email transporter
 */
function initializeTransporter() {
  if (!config.EMAIL_ENABLED || !config.EMAIL_USER || !config.EMAIL_PASSWORD) {
    logger.warn('Email service disabled or not configured');
    return false;
  }

  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASSWORD
      }
    });

    logger.info('Email service initialized successfully');
    return true;
  } catch (err) {
    logger.error('Failed to initialize email service', err);
    return false;
  }
}

/**
 * Send email
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 * @returns {Promise<boolean>} Success status
 */
async function sendEmail(subject, html) {
  if (!transporter) {
    if (!initializeTransporter()) {
      return false;
    }
  }

  const mailOptions = {
    from: `${config.BOT_NAME} <${config.EMAIL_USER}>`,
    to: config.EMAIL_RECIPIENT,
    subject: subject,
    html: html
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info('Email sent successfully', { subject });
    return true;
  } catch (err) {
    logger.error('Failed to send email', err, { subject });
    return false;
  }
}

/**
 * Send daily report
 * @param {Object} stats - Bot statistics
 */
async function sendDailyReport(stats) {
  if (!config.FEATURE_EMAIL_REPORTS) {
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                  color: white; padding: 20px; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 20px; }
        .stat-box { background: white; padding: 15px; margin: 10px 0; 
                    border-left: 4px solid #667eea; border-radius: 5px; }
        .footer { background: #333; color: white; padding: 15px; text-align: center; 
                  border-radius: 0 0 10px 10px; }
        h1 { margin: 0; font-size: 24px; }
        h2 { color: #667eea; margin-top: 0; }
        .label { font-weight: bold; color: #555; }
        .value { color: #667eea; font-size: 18px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🤖 ${config.BOT_NAME} - Daily Report</h1>
          <p>Report for ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="content">
          <h2>📊 Activity Summary</h2>
          
          <div class="stat-box">
            <span class="label">Uptime:</span>
            <span class="value">${stats.uptime || 'N/A'}</span>
          </div>
          
          <div class="stat-box">
            <span class="label">Messages Received:</span>
            <span class="value">${stats.messagesReceived || 0}</span>
          </div>
          
          <div class="stat-box">
            <span class="label">Commands Executed:</span>
            <span class="value">${stats.commandsExecuted || 0}</span>
          </div>
          
          <div class="stat-box">
            <span class="label">Active Groups:</span>
            <span class="value">${stats.activeGroups || 0}</span>
          </div>
          
          <div class="stat-box">
            <span class="label">Errors:</span>
            <span class="value">${stats.errors || 0}</span>
          </div>
          
          <h2>🔧 Bot Status</h2>
          <div class="stat-box">
            <p><span class="label">Bot Enabled:</span> ${config.FEATURE_BOT_ENABLED ? '✅' : '❌'}</p>
            <p><span class="label">Auto Reply:</span> ${config.FEATURE_AUTO_REPLY ? '✅' : '❌'}</p>
            <p><span class="label">File Sharing:</span> ${config.FEATURE_FILE_SHARING ? '✅' : '❌'}</p>
            <p><span class="label">Welcome Messages:</span> ${config.FEATURE_WELCOME_MESSAGE ? '✅' : '❌'}</p>
          </div>
          
          ${stats.recentFileShares && stats.recentFileShares.length > 0 ? `
          <h2>📂 Recent File Shares</h2>
          <div class="stat-box" style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr style="background: #eee; text-align: left;">
                <th style="padding: 8px;">Time</th>
                <th style="padding: 8px;">File</th>
                <th style="padding: 8px;">Group</th>
                <th style="padding: 8px;">User</th>
              </tr>
              ${stats.recentFileShares.slice(0, 15).map(share => `
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px;">${new Date(share.time).toLocaleTimeString()}</td>
                <td style="padding: 8px;">${share.fileName}</td>
                <td style="padding: 8px;">${share.group.includes('@g.us') ? 'Group' : 'DM'}</td>
                <td style="padding: 8px;">${share.user}</td>
              </tr>
              `).join('')}
            </table>
          </div>
          ` : '<p>No files shared yet.</p>'}

          ${stats.recentCommands && stats.recentCommands.length > 0 ? `
          <h2>💻 Command Log</h2>
          <div class="stat-box" style="overflow-x: auto;">
             <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr style="background: #eee; text-align: left;">
                <th style="padding: 8px;">Time</th>
                <th style="padding: 8px;">Command</th>
                <th style="padding: 8px;">User</th>
                <th style="padding: 8px;">Args</th>
              </tr>
              ${stats.recentCommands.slice(0, 15).map(cmd => `
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px;">${new Date(cmd.time).toLocaleTimeString()}</td>
                <td style="padding: 8px;"><b>${cmd.command}</b></td>
                <td style="padding: 8px;">${cmd.user}</td>
                <td style="padding: 8px;">${cmd.args}</td>
              </tr>
              `).join('')}
            </table>
          </div>
          ` : ''}
          
          ${stats.recentErrors && stats.recentErrors.length > 0 ? `
          <h2>⚠️ Recent Errors</h2>
          <div class="stat-box">
            <ul style="color: red;">
              ${stats.recentErrors.map(err => `<li>${err.error}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <p>Powered by ${config.BOT_NAME} v${config.BOT_VERSION}</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(`${config.BOT_NAME} - Daily Report`, html);
}

/**
 * Send error alert
 * @param {string} errorMessage - Error message
 * @param {Error} error - Error object
 */
async function sendErrorAlert(errorMessage, error) {
  if (!config.EMAIL_ENABLED) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 20px; }
        .error-box { background: #fff3cd; border-left: 4px solid #dc3545; padding: 15px; margin: 10px 0; }
        pre { background: #f4f4f4; padding: 10px; overflow-x: auto; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Error Alert</h1>
          <p>${new Date().toLocaleString()}</p>
        </div>
        
        <div class="content">
          <div class="error-box">
            <h2>Error Message</h2>
            <p>${errorMessage}</p>
          </div>
          
          ${error ? `
          <div class="error-box">
            <h2>Stack Trace</h2>
            <pre>${error.stack}</pre>
          </div>
          ` : ''}
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(`${config.BOT_NAME} - Error Alert`, html);
}

/**
 * Send startup notification
 */
async function sendStartupNotification() {
  if (!config.EMAIL_ENABLED) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
                  color: white; padding: 20px; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Bot Started Successfully</h1>
          <p>${new Date().toLocaleString()}</p>
        </div>
        
        <div class="content">
          <p>${config.BOT_NAME} v${config.BOT_VERSION} has started and is ready to receive messages.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(`${config.BOT_NAME} - Started`, html);
}

module.exports = {
  initializeTransporter,
  sendEmail,
  sendDailyReport,
  sendErrorAlert,
  sendStartupNotification
};
