# MVP 3.0 - User Guide & Operations
**Rental Property Management System - Complete Documentation Part 6 of 6**

---

## Quick Start Guide

### For Landlords - Your First Week

**Day 1: Setup** (30 minutes)
1. Receive welcome email with credentials
2. Download iOS app from App Store
3. Login to web dashboard at https://app.yourapp.com
4. Complete profile setup
5. Add property details

**Day 2: Add Tenant** (15 minutes)
1. Navigate to Tenants > Add New
2. Enter tenant information
3. Set monthly rent and charges
4. Upload signed contract (optional)
5. Verify tenant email

**Day 3: Create First Invoice** (10 minutes)
1. Go to Invoices > Create New
2. Select tenant
3. Review amount calculation
4. Click "Generate & Send"
5. Check your email (you're CC'd!)

**Day 4: Record Payment** (5 minutes)
1. When tenant pays, go to Invoices
2. Find the invoice
3. Click "Mark as Paid"
4. Enter payment date and reference
5. Save

**Day 5: Explore Dashboard** (20 minutes)
- Review payment stats
- Check YTD income
- Explore ROE calculator
- Set up payment reminders
- Download first monthly report

---

## iOS App User Guide

### Installation

1. **Download from App Store**
   - Search "Rental Property MVP"
   - Or use direct link (provided by admin)
   - Tap "Get" and authenticate with Face ID/Touch ID

2. **First Launch**
   - Open app
   - Tap "Sign In"
   - Enter email and password
   - Grant notification permissions (recommended)

### Main Features

#### Dashboard

**What You See**:
- Current month invoice status
- Year-to-date collected amount
- Outstanding payments
- Quick action buttons

**Quick Actions**:
- 📧 Send reminder to tenant
- ✅ Mark invoice as paid
- 📊 View monthly report
- 🔄 Refresh data

**Pull to Refresh**:
- Swipe down on any screen to sync latest data

#### Invoices Tab

**View Invoices**:
- All invoices listed by month
- Color-coded status badges:
  - 🟢 Green = Paid
  - 🔵 Blue = Sent
  - 🟡 Yellow = Generated (not sent)
  - 🔴 Red = Overdue

**Invoice Details**:
- Tap any invoice to see full details
- View PDF invoice
- Check payment history
- See email delivery status

**Quick Swipe Actions**:
- Swipe left on invoice:
  - "Send" - Email to tenant
  - "PDF" - View invoice PDF
- Swipe right on unpaid invoice:
  - "Mark Paid" - Quick payment recording

#### Payments Tab

**Record Payment**:
1. Tap "Record Payment"
2. Select invoice from list
3. Enter payment date (defaults to today)
4. Confirm amount
5. Add payment reference
6. Tap "Save"

**View Payment History**:
- Filter by month/year
- Search by amount or reference
- Export to CSV

#### Settings Tab

**Profile**:
- Update contact information
- Change password
- Notification preferences

**Property Settings**:
- Edit property address
- Update rent amount
- Modify service charges

**Email Templates**:
- Customize invoice email
- Edit reminder templates
- Set email signature

### Offline Mode

**Works Offline**:
- View invoices and payments
- Read invoice PDFs (previously downloaded)
- Browse dashboard stats

**Requires Connection**:
- Send invoices
- Record payments
- Generate new invoices
- Sync latest data

**Auto-Sync**:
- Opens app → Syncs automatically
- Pull to refresh → Manual sync
- Background sync → Every 30 minutes

### Notifications

**You'll Receive Notifications For**:
- ✅ Invoice sent successfully
- 💰 Payment recorded
- ⚠️ Invoice overdue (7 days)
- 🚨 Payment 14+ days overdue
- 📊 Monthly report ready

**Managing Notifications**:
- Settings > Notifications
- Toggle each type on/off
- Set quiet hours (9pm-8am default)

---

## Web Dashboard User Guide

### Login & Navigation

**Login**:
1. Go to https://app.yourapp.com
2. Enter email and password
3. Click "Sign In"
4. Optional: Check "Remember me" for 30 days

**Main Navigation**:
- 🏠 Dashboard - Overview and stats
- 📄 Invoices - Invoice management
- 💳 Payments - Payment tracking
- 🔧 Maintenance - Requests and vendors
- 💰 Expenses - Expense tracking
- 📊 Reports - Financial reports
- ⚙️ Settings - Configuration

### Dashboard Features

**Stats Cards**:
- YTD Collected: Total rent received this year
- Outstanding: Unpaid invoices
- Overdue Count: Invoices past due date
- Success Rate: % of on-time payments

**Payment Trends Chart**:
- 12-month rolling view
- Hover for exact amounts
- Click legend to toggle series
- Export as PNG

**Recent Invoices Table**:
- Last 10 invoices
- Click row for details
- Quick actions in last column
- Filter and search capabilities

### Invoice Management

**Generate Invoice**:
1. Click "Create Invoice" button
2. Select tenant (dropdown)
3. Choose month and year
4. Amounts auto-fill from tenant settings
5. Adjust if needed (one-time charges, discounts)
6. Set due date (default: 5th of next month)
7. Add optional notes
8. Click "Generate"

**Send Invoice**:
1. Find generated invoice
2. Click "Send" button
3. Confirm recipient email
4. Email preview shown
5. Click "Send Email"
6. You receive CC automatically

**Bulk Operations**:
- Select multiple invoices (checkboxes)
- Bulk actions appear:
  - Send all selected
  - Download all PDFs
  - Export to Excel
  - Delete selected

**Invoice Filters**:
- Status: All, Generated, Sent, Paid, Overdue
- Date range: Custom, This month, Last 3 months, Year
- Tenant: Select from dropdown
- Amount: Min/max range

### Payment Reconciliation

**Manual Recording**:
1. Navigate to Payments tab
2. Click "Record Payment"
3. Select invoice
4. Enter details:
   - Payment date
   - Amount
   - Method (Bank Transfer/Cash/iDEAL)
   - Reference
5. Save

**Import Bank Statement**:
1. Click "Import Bank Statement"
2. Upload CSV file
3. Map columns if needed:
   - Date → Transaction Date
   - Amount → Amount
   - Description → Reference
4. Click "Import"
5. Review matches (green = auto-matched)
6. Manually match remaining:
   - Drag transaction to invoice
   - Or click "Match" button
7. Click "Confirm All Matches"

**Unmatched Transactions**:
- Shown in yellow highlight
- Possible reasons:
  - Different amount
  - No matching invoice
  - Unclear reference
- Actions:
  - Create invoice retroactively
  - Mark as "Other Income"
  - Flag for review

### Maintenance Management

**Create Request**:
1. Click "New Maintenance Request"
2. Fill form:
   - Title (short description)
   - Category (Plumbing, Electrical, etc.)
   - Priority (Emergency, High, Medium, Low)
   - Detailed description
   - Upload photos (optional)
3. Save

**Assign Vendor**:
1. Open maintenance request
2. Click "Assign Vendor"
3. Select from vendor list
4. Enter estimated cost
5. Add notes
6. Change status to "In Progress"

**Track Progress**:
- Status workflow: Open → In Progress → Completed
- Add notes at each stage
- Upload before/after photos
- Record actual cost when done

**Vendor Management**:
- Add new vendors: Name, Contact, Specialization
- Rate vendors: 1-5 stars after job
- Track performance: Avg cost, completion time
- Preferred vendors highlighted

### Expense Tracking

**Record Expense**:
1. Click "Add Expense"
2. Select category:
   - Maintenance & Repairs
   - Insurance
   - Property Tax
   - Management Fees
   - Utilities
   - Other
3. Enter details:
   - Date
   - Amount
   - Description
   - Vendor
4. Upload receipt (PDF/image)
5. Mark tax deductible (Y/N)
6. Save

**Link to Maintenance**:
- When recording expense
- Check "Link to maintenance request"
- Select request from dropdown
- Actual cost updates automatically

**Monthly Expense View**:
- Grouped by category
- Running totals
- Compare to budget (if set)
- Export for tax prep

### Financial Reports

**Monthly Summary**:
1. Select Reports > Monthly
2. Choose month and year
3. View summary:
   - Total income
   - Total expenses
   - Net income
   - Invoice stats
   - Payment metrics
4. Download PDF or Excel

**Annual Report**:
1. Select Reports > Annual
2. Choose year
3. Comprehensive report includes:
   - Income breakdown
   - Expense by category
   - Tax deductible summary
   - Deposit accounting
   - ROE calculation
4. Export options:
   - PDF (printable)
   - Excel (for accountant)
   - CSV (raw data)

**ROE Calculator**:
1. Navigate to Reports > ROE
2. View current ROE percentage
3. See breakdown:
   - Property value
   - Mortgage balance
   - Equity
   - Net operating income
4. Historical trend chart (12 months)
5. Projections based on current performance

**Custom Reports**:
1. Click "Custom Report"
2. Select parameters:
   - Date range
   - Metrics to include
   - Group by (month/quarter/year)
   - Filter criteria
3. Preview report
4. Save template for reuse
5. Schedule automatic generation

---

## Administrative Operations

### Monthly Automated Invoice Process

**How It Works**:
- Runs automatically on 25th @ 9:00 AM
- Generates invoice for next month
- Creates PDF
- Uploads to Azure storage
- Sends email to tenant
- CCs you (landlord)
- Updates database

**What to Expect**:

**On the 25th @ 9:00 AM**:
1. You receive email: "Invoice sent to [Tenant Name]"
2. PDF attached
3. Email also includes summary

**Within 5 minutes**:
- You receive summary email with results
- Format:
  ```
  Subject: 📊 Monthly Invoice Summary - February 2025
  
  Successfully sent: 1
  Failed: 0
  
  Details:
  ✅ John Doe - INV-2025-02-001 - €1,325.00
  ```

**If Something Fails**:
- Instant email alert
- Details of what failed
- Suggested action
- Invoices stored for manual sending

**Manual Override**:
- Web dashboard: Admin > Trigger Monthly Invoices
- Runs same process on demand
- Useful for:
  - Testing
  - Missed run (server downtime)
  - Off-cycle invoice batch

### Monitoring & Alerts

**System Health Dashboard**:
- Access: Settings > System Status
- Shows:
  - API uptime (last 24 hours, 7 days, 30 days)
  - Database performance
  - Email delivery rate
  - Storage usage
  - Last successful jobs

**Alert Types**:

1. **Critical Alerts** (SMS + Email)
   - System completely down
   - Database connection lost
   - Security breach detected

2. **High Priority** (Email)
   - Monthly invoice generation failed
   - Multiple email delivery failures
   - API response time > 5 seconds

3. **Medium Priority** (Email digest)
   - Single invoice send failure
   - Storage approaching limit
   - Slow API endpoints

4. **Info Notifications** (Weekly email)
   - System performance summary
   - Usage statistics
   - Upcoming renewals

**Alert Configuration**:
- Settings > Alerts & Notifications
- Toggle each alert type
- Set thresholds
- Add/remove recipients
- Test alert delivery

### Backup & Recovery

**Automated Backups**:
- **Database**: Daily @ 2:00 AM
  - Full backup
  - 7-day retention
  - Point-in-time recovery available
  
- **Blob Storage**: Weekly
  - Incremental backups
  - Geo-redundant storage
  - 30-day retention

**Manual Backup**:
1. Settings > Data Management
2. Click "Create Backup Now"
3. Select what to backup:
   - Database only
   - Files only
   - Complete system
4. Download link sent via email

**Restore Process**:
1. Contact support or
2. Self-service: Settings > Data Management > Restore
3. Select backup date
4. Choose restore point
5. Confirm (creates new instance, doesn't overwrite)

### Security Best Practices

**Password Management**:
- Use strong, unique password
- Enable 2FA (Settings > Security)
- Change password every 90 days
- Never share credentials

**Access Control**:
- Principle of least privilege
- Regular access audits
- Immediate revocation for departing users

**Data Protection**:
- Don't email sensitive data
- Use secure file sharing
- Enable encryption for backups
- Review access logs monthly

**Compliance**:
- GDPR compliance enabled by default
- Data retention: 7 years for financial
- Right to deletion (contact support)
- Data portability available

---

## Troubleshooting

### Common Issues

#### "Invoice not sent"

**Possible Causes**:
- Invalid email address
- SendGrid service issue
- Network connectivity

**Solutions**:
1. Check tenant email address
2. Verify email in spam folder
3. Resend manually: Invoices > [Invoice] > Send
4. Check System Status for service issues

#### "Payment not matching"

**Causes**:
- Different amount
- Typo in reference
- Wrong date range

**Solutions**:
1. Check bank statement for exact amount
2. Verify reference field
3. Use manual matching
4. Create payment without invoice link

#### "App won't sync"

**Causes**:
- No internet connection
- Server maintenance
- Outdated app version

**Solutions**:
1. Check WiFi/cellular connection
2. Check System Status
3. Update app from App Store
4. Force quit and reopen

#### "Forgot password"

**Solution**:
1. Click "Forgot Password" on login
2. Enter email address
3. Check email for reset link
4. Follow link to set new password
5. Login with new password

### Getting Help

**Self-Service Resources**:
- Knowledge Base: https://docs.yourapp.com
- Video Tutorials: https://tutorials.yourapp.com
- FAQ: https://help.yourapp.com/faq

**Support Channels**:
- Email: support@yourapp.com (24hr response)
- In-app chat: Click support icon
- Phone: [provided for premium support]

**What to Include in Support Request**:
- Your email address
- Detailed description of issue
- Steps to reproduce
- Screenshots (if applicable)
- Error messages
- When it started happening

---

## Best Practices

### Monthly Workflow

**Day 24 of Month**:
- Review next month's rent amount (any changes?)
- Update tenant info if needed
- Check automation is enabled

**Day 25 @ 9:00 AM** (Automated):
- Invoice generated and sent
- You receive confirmation email

**Day 26-27**:
- Verify invoice was sent successfully
- Tenant receives invoice

**Day 1-5 of Next Month**:
- Monitor for incoming payments
- Check bank account daily

**Day 3-4**:
- Ideal payment window
- Most tenants pay by now

**Day 6-7**:
- If not paid, send friendly reminder
- Use app: Invoices > [Invoice] > Send Reminder

**Day 8-14**:
- If still not paid, follow up
- Consider late fee (if in contract)

**Day 15+**:
- Escalate if needed
- Review tenant payment history
- Consider action per lease agreement

### Data Hygiene

**Weekly** (5 minutes):
- Review and match any unmatched payments
- Archive old documents
- Check for duplicate entries

**Monthly** (15 minutes):
- Reconcile all payments
- Review expense categories
- Update property value (if changed)
- Check maintenance requests status

**Quarterly** (30 minutes):
- Review ROE calculations
- Update projections
- Export reports for accountant
- Audit vendor performance

**Annually** (2 hours):
- Generate annual report
- Tax preparation export
- Archive old documents
- Review and renew contracts

### Optimization Tips

**Speed Up Reconciliation**:
- Use consistent payment references
- Train tenant to include invoice number
- Set up automatic matching rules
- Review bank statement weekly, not monthly

**Improve Cash Flow**:
- Send invoices early (25th vs end of month)
- Set up payment reminders
- Consider online payment options (future feature)
- Track and analyze payment patterns

**Maintain Professionalism**:
- Use email templates
- Respond to tenant queries quickly
- Keep accurate records
- Provide receipt on request

**Plan for Growth**:
- Document processes
- Keep vendor list updated
- Build maintenance schedule
- Track all improvements for property value

---

## FAQ

**Q: What happens if I'm on vacation on the 25th?**
A: The automated system runs anyway. You'll receive emails with summaries. You can review and confirm when back.

**Q: Can I change the invoice generation date?**
A: Yes, contact support to adjust the schedule. Requires Azure Function timer update.

**Q: What if my tenant moves out mid-month?**
A: Mark tenant as inactive. System will skip them in next automated run. Generate final prorated invoice manually.

**Q: How do I handle rent increases?**
A: Update tenant record with new monthly rent. Takes effect from next invoice generation.

**Q: Can I customize the invoice template?**
A: Basic customization available in Settings. Full custom design requires development.

**Q: Is my data backed up?**
A: Yes, daily automated backups with 7-day retention. Geo-redundant storage.

**Q: Can I export all my data?**
A: Yes, Settings > Data Management > Export All Data. Sends download link via email.

**Q: What happens if tenant pays wrong amount?**
A: Record the actual amount paid. Note discrepancy. Follow up separately for remainder.

**Q: How do I add a second property?**
A: Currently single-property. Multi-property support in next version (MVP 4.0).

**Q: What if SendGrid goes down?**
A: System retries 3 times. If still fails, you're alerted. Can send manually from app.

---

## Glossary

**ROE (Return on Equity)**: Percentage return on your investment. Formula: (Net Operating Income / Equity) × 100

**Net Operating Income (NOI)**: Total income minus operating expenses, before mortgage interest.

**SAS Token**: Secure Access Signature - temporary URL for accessing stored files.

**Reconciliation**: Process of matching bank payments to invoices.

**Azure Blob Storage**: Cloud storage service for documents and files.

**SendGrid**: Email delivery service used for sending invoices.

**Application Insights**: Monitoring service tracking system performance.

**Prisma**: Database toolkit used for data access.

**JWT (JSON Web Token)**: Secure authentication token.

**CI/CD**: Continuous Integration/Continuous Deployment - automated testing and deployment.

---

## Contact & Support

**Product Website**: https://yourapp.com

**Documentation**: https://docs.yourapp.com

**Support Email**: support@yourapp.com

**Status Page**: https://status.yourapp.com

**GitHub**: https://github.com/yourcompany/rental-mvp (private)

**Version**: 3.0

**Last Updated**: November 15, 2025

---

## Appendix: Keyboard Shortcuts

### Web Dashboard

**Navigation**:
- `G + D`: Go to Dashboard
- `G + I`: Go to Invoices
- `G + P`: Go to Payments
- `G + R`: Go to Reports

**Actions**:
- `N`: New invoice
- `Ctrl/Cmd + S`: Save current form
- `Ctrl/Cmd + F`: Search
- `?`: Show all shortcuts

**Table Navigation**:
- `↑/↓`: Navigate rows
- `Enter`: Open selected item
- `Space`: Select/deselect
- `Esc`: Close modal

---

**END OF DOCUMENTATION**

**Document**: Part 6 of 6  
**Complete Documentation Set**: Parts 1-6  
**Status**: Ready for Use  

**Thank you for choosing Rental Property MVP 3.0!** 🎉

