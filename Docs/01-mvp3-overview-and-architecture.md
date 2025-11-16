# MVP 3.0 - System Overview & Architecture
**Rental Property Management System - Complete Documentation Part 1 of 6**

---

## Executive Summary

MVP 3.0 represents a **complete, production-ready rental property management system** with full automation capabilities. This version integrates automated monthly invoice generation, comprehensive financial administration, ROE analytics, and intelligent scheduling—all while maintaining the simplicity and focus of the original MVP vision.

### What's New in MVP 3.0

**🚀 Automated Invoice Scheduling**
- Azure Function Timer Trigger (25th of every month at 9:00 AM)
- Automatic PDF generation and email delivery
- Landlord CC on all communications
- Error handling with instant alerts
- Manual override capability

**📊 Enhanced Administration**
- Complete payment tracking workflow
- Maintenance request management
- Annual financial reporting
- ROE (Return on Equity) calculator
- Expense categorization and tax preparation

**☁️ Cloud-Native Architecture**
- Azure Functions for serverless automation
- Azure Blob Storage for document management
- SendGrid for reliable email delivery
- Application Insights for monitoring
- Scalable infrastructure design

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  iOS App (SwiftUI)          │     Web App (React + TS)      │
│  - Dashboard                │     - Admin Dashboard          │
│  - Payment Tracking         │     - Invoice Management       │
│  - Quick Actions            │     - Reconciliation           │
│  - Notifications            │     - Reports & Analytics      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                       │
├─────────────────────────────────────────────────────────────┤
│              Node.js + Express REST API                      │
│  - Authentication & Authorization                            │
│  - Request Validation                                        │
│  - Rate Limiting                                             │
│  - API Documentation (Swagger)                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                      │
├─────────────────────────────────────────────────────────────┤
│  Invoice Service  │  Payment Service  │  Report Service      │
│  Email Service    │  Storage Service  │  Analytics Service   │
│  ROE Calculator   │  Expense Tracker  │  Maintenance Mgmt    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    AUTOMATION LAYER                          │
├─────────────────────────────────────────────────────────────┤
│           Azure Functions (Serverless)                       │
│  - Monthly Invoice Generator (Timer: 25th @ 9:00 AM)        │
│  - Payment Reminder Service (Daily check)                   │
│  - Overdue Alert Service (Weekly)                           │
│  - Monthly Report Generator (1st of month)                  │
│  - Data Backup Service (Daily)                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA & STORAGE LAYER                     │
├─────────────────────────────────────────────────────────────┤
│  Azure SQL Database    │    Azure Blob Storage              │
│  - Tenants             │    - Invoice PDFs                  │
│  - Invoices            │    - Receipts                      │
│  - Payments            │    - Contracts                     │
│  - Expenses            │    - Annual Reports                │
│  - Maintenance         │    - Bank Statements               │
│  - Properties          │    - Photos                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                          │
├─────────────────────────────────────────────────────────────┤
│  SendGrid Email        │  Azure Application Insights        │
│  - Invoice Delivery    │  - Performance Monitoring          │
│  - Reminders           │  - Error Tracking                  │
│  - Alerts              │  - Usage Analytics                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend - iOS App
- **Language**: Swift 5.9+
- **Framework**: SwiftUI
- **Local Storage**: CoreData
- **Networking**: URLSession + Combine
- **Azure SDK**: Azure Storage iOS SDK
- **Minimum iOS**: 16.0

### Frontend - Web App
- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS 3.3+
- **Forms**: React Hook Form
- **State Management**: React Context + Hooks
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Build Tool**: Vite

### Backend - API
- **Runtime**: Node.js 18 LTS
- **Framework**: Express.js 4.18+
- **Database ORM**: Prisma (for type safety)
- **Validation**: Zod
- **PDF Generation**: PDFKit
- **Excel Export**: ExcelJS
- **Authentication**: JWT

### Backend - Automation
- **Platform**: Azure Functions (Node.js)
- **Triggers**: Timer, HTTP, Queue
- **Runtime**: Node.js 18

### Database
- **Primary**: Azure SQL Database (Standard S0)
- **Connection Pooling**: Yes (30 connections)
- **Backup**: Daily automated backups (7-day retention)

### Cloud Infrastructure
- **Platform**: Microsoft Azure
- **Region**: West Europe (Amsterdam)
- **Services**:
  - Azure App Service (Web + API hosting)
  - Azure Functions (Serverless automation)
  - Azure SQL Database
  - Azure Blob Storage (Hot tier)
  - Azure Application Insights
  - SendGrid (Email delivery)

### DevOps
- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions
- **Testing**: Jest (unit) + Playwright (e2e)
- **Code Quality**: ESLint + Prettier
- **Monitoring**: Azure Application Insights

---

## Core Features Overview

### Feature Matrix

| Feature | MVP 1.0 | MVP 2.0 | MVP 3.0 | Priority |
|---------|---------|---------|---------|----------|
| **Invoice Management** | | | | |
| Manual invoice generation | ✅ | ✅ | ✅ | Must Have |
| Automated monthly invoices | ❌ | ❌ | ✅ | Must Have |
| PDF generation | ✅ | ✅ | ✅ | Must Have |
| Email delivery | ✅ | ✅ | ✅ | Must Have |
| CC to landlord | ❌ | ❌ | ✅ | Must Have |
| Azure Blob storage | ✅ | ✅ | ✅ | Must Have |
| Invoice templates | Basic | Custom | Multi-template | Should Have |
| **Payment Tracking** | | | | |
| Manual payment recording | ✅ | ✅ | ✅ | Must Have |
| Payment status dashboard | ✅ | ✅ | ✅ | Must Have |
| Payment reminders | Manual | Auto (7d) | Auto (configurable) | Should Have |
| Late fee calculation | ❌ | ✅ | ✅ | Should Have |
| Bank reconciliation | Manual | Semi-auto | Smart matching | Nice to Have |
| **Administration** | | | | |
| Tenant management | ✅ | ✅ | ✅ | Must Have |
| Expense tracking | Basic | ✅ | ✅ | Should Have |
| Maintenance requests | ❌ | ✅ | ✅ | Should Have |
| Vendor management | ❌ | ✅ | ✅ | Should Have |
| Document storage | ✅ | ✅ | ✅ | Must Have |
| **Reporting** | | | | |
| Monthly summaries | ✅ | ✅ | ✅ | Must Have |
| Annual reports | Basic | ✅ | ✅ | Should Have |
| Tax preparation | ❌ | ✅ | ✅ | Should Have |
| ROE calculator | ❌ | ✅ | ✅ | Should Have |
| Custom reports | ❌ | ❌ | ✅ | Nice to Have |
| **Automation** | | | | |
| Scheduled tasks | ❌ | Basic | ✅ | Must Have |
| Email automation | ❌ | ✅ | ✅ | Must Have |
| Backup automation | ❌ | ✅ | ✅ | Should Have |
| Alert system | ❌ | Basic | ✅ | Should Have |
| **Apps** | | | | |
| iOS native app | ✅ | ✅ | ✅ | Must Have |
| Web dashboard | ✅ | ✅ | ✅ | Must Have |
| Responsive design | ✅ | ✅ | ✅ | Must Have |
| Offline capability | Basic | ✅ | ✅ | Should Have |

---

## Project Scope & Deliverables

### In Scope (MVP 3.0)

**✅ Automated Invoice System**
- Monthly automated generation on 25th
- Professional Dutch PDF invoices
- Email delivery with landlord CC
- Azure Blob Storage integration
- Error handling and monitoring

**✅ Payment Management**
- Payment recording (manual & automated)
- Bank statement import (CSV)
- Payment reconciliation
- Overdue tracking
- Reminder automation

**✅ Property Administration**
- Tenant management
- Maintenance request tracking
- Expense categorization
- Vendor database
- Document storage

**✅ Financial Reporting**
- Monthly summaries
- Annual financial reports
- Tax preparation documents
- ROE calculations
- Trend analysis

**✅ Mobile & Web Apps**
- Native iOS app (SwiftUI)
- Responsive web dashboard
- Offline capability
- Real-time synchronization

### Out of Scope (Future Versions)

**❌ Payment Processing Integration**
- SEPA Direct Debit
- iDEAL payment links
- Credit card processing
- Automated bank synchronization

**❌ Multi-Property Portfolio**
- Multiple property management
- Portfolio-wide analytics
- Cross-property reporting

**❌ Tenant Portal**
- Tenant self-service
- Online payment portal
- Maintenance request submission
- Document access for tenants

**❌ Advanced Features**
- AI-powered insights
- Predictive maintenance
- Market value predictions
- Automated rent adjustments

---

## Success Criteria

### Technical Performance

| Metric | Target | Critical? |
|--------|--------|-----------|
| Invoice generation time | < 30 seconds | Yes |
| API response time (p95) | < 500ms | Yes |
| Email delivery success | > 99% | Yes |
| System uptime | > 99.5% | Yes |
| Mobile app crash rate | < 0.1% | Yes |
| Database query avg | < 100ms | No |

### Business Outcomes

| Metric | Target | Timeline |
|--------|--------|----------|
| Time saved vs manual | > 10 hrs/month | Month 2 |
| Invoice automation rate | 100% | Week 2 |
| Payment collection rate | > 95% | Month 3 |
| Average days to payment | < 3 days | Month 3 |
| User satisfaction | > 4.5/5 | Month 6 |

### User Adoption

| Metric | Target | Timeline |
|--------|--------|----------|
| iOS app daily active | 100% | Week 4 |
| Web dashboard weekly | 100% | Week 2 |
| Feature utilization | > 80% | Month 3 |
| Mobile vs Web ratio | 70:30 | Month 2 |

---

## Risk Assessment

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Azure service outage | High | Low | Multi-region backup, documented DR plan |
| Email delivery failure | High | Medium | SendGrid SLA, retry logic, manual override |
| Data loss | Critical | Very Low | Daily backups, geo-redundant storage |
| Security breach | Critical | Low | Encryption, authentication, security audit |
| Performance degradation | Medium | Medium | Load testing, monitoring, auto-scaling |

### Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Scope creep | High | High | Clear requirements, change control process |
| Budget overrun | Medium | Medium | 10% contingency, weekly tracking |
| Timeline delay | Medium | Medium | Buffer in schedule, regular check-ins |
| User adoption failure | High | Low | Training, documentation, support |

---

## Assumptions & Dependencies

### Assumptions
- Single property, single tenant (for MVP 3.0)
- Landlord has basic technical skills
- Stable internet connectivity
- Dutch language and EUR currency only
- Monthly rent amount is fixed

### Dependencies
- Azure account with active subscription
- Apple Developer Program membership (€99/year)
- SendGrid account (free tier sufficient for MVP)
- Domain name for web application
- SSL certificate (Let's Encrypt - free)

---

## Constraints

**Technical Constraints:**
- iOS 16.0+ required for native app
- Modern web browser (Chrome, Safari, Firefox, Edge)
- Minimum 5 Mbps internet connection recommended
- English/Dutch interface only

**Business Constraints:**
- Budget cap: €35,000
- Timeline: 10 weeks maximum
- Team size: 1-2 developers
- Single property focus (MVP 3.0)

**Legal Constraints:**
- GDPR compliance required
- Data residency in EU (Azure West Europe)
- 7-year financial record retention
- Tenant data protection

---

## Next Steps

1. **Approve Budget & Scope** - Confirm €34,987 investment
2. **Assign Resources** - Allocate developer(s) for 10 weeks
3. **Week 0 Preparation** - Set up Azure account, tools, access
4. **Week 1 Kickoff** - Begin development sprint

---

**Document**: Part 1 of 6  
**Next**: Part 2 - Automated Invoice System  
**Status**: Ready for Implementation

