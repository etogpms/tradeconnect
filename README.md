# TradeConnect 🛠️ — Two-Sided Trade Marketplace Platform

TradeConnect is a modern, premium two-sided service marketplace connecting **Clients** needing trade services (plumbing, electrical work, carpentry, painting, tiling, etc.) with verified local **Tradies** (service providers). 

The platform supports end-to-end marketplace actions: job postings with photo attachments, flexible quotes with inclusions/exclusions, live chat messaging, administrative vetted verifications, active job status tracking with milestones, and rating aggregators.

---

## 🌟 Key Features

*   **Authentication & Role Gates**: Separated routing controls for Clients, Tradies, and Administrators.
*   **Dual Mode Architecture**:
    *   **Demo Sandbox Mode**: Runs locally in-browser using simulated database stores (`localStorage`) if Supabase configuration keys are missing. Offers one-click quick logins for quick evaluations.
    *   **Supabase Database Mode**: Connects to a live Postgres backend once Supabase keys are provided in `.env`.
*   **Realtime Features**: Instant message streaming for ongoing project discussions.
*   **Vetted Verification Portal**: Tradies upload trade licenses/certificates. Administrators inspect and approve or reject submissions.
*   **Database Aggregations**: Automatic Postgres triggers aggregate tradie ratings and review counts on the database level.
*   **Audit Logger**: Automatically logs critical events (signups, quote approvals, disputes) for admin reviews.

---

## 🚀 Local Development Setup

### 1. Prerequisites
Install [Node.js](https://nodejs.org/) (v18 or higher recommended).

### 2. Installation
Navigate to the directory and install dependencies:
```bash
npm install
```

### 3. Running the App
Start the local development server:
```bash
npm run dev
```
By default, the app will run in **Demo Sandbox Mode** with preset user logins (`client@tradeconnect.com.au`, `tradie@tradeconnect.com.au`, `admin@tradeconnect.com.au`).

---

## ☁️ Supabase Production Configuration

To deploy and link the application to a live Supabase backend, follow these three steps:

### 1. Environment Configuration
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-supabase-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anonymous-api-key
```

### 2. Database Schema Execution
Copy the complete SQL setup script located at [supabase/schema.sql](supabase/schema.sql) and execute it inside the **Supabase SQL Editor** to establish all tables, custom triggers, and Row Level Security (RLS) policies.

### 3. Storage Buckets Setup
Configure the following three buckets in your **Supabase Dashboard under Storage**:

#### A. `job-media` (Public Bucket)
*   **Purpose**: Stores images and attachments uploaded by clients when posting new jobs.
*   **Access Type**: Public.
*   **Security Policies**:
    *   **Select**: Allow `public` read access (anyone can view job photos).
    *   **Insert**: Allow `authenticated` users to insert media.
    *   **Delete**: Allow only the user who uploaded the file to delete it (`auth.uid() = owner`).

#### B. `tradie-documents` (Private Bucket)
*   **Purpose**: Stores confidential trade licenses, ABN certificates, and IDs uploaded by tradies for admin verification.
*   **Access Type**: Private (secure downloads).
*   **Security Policies**:
    *   **Select**: Restrict access to the owning tradie (`auth.uid() = owner`) and users with the administrative role (`role = 'admin'` or `role = 'super_admin'`).
    *   **Insert**: Allow the owning tradie to insert files.
    *   **Delete**: Only administrators can remove verification logs.

#### C. `progress-photos` (Public Bucket)
*   **Purpose**: Stores progress and completion photo logs uploaded by tradies as they carry out project milestones.
*   **Access Type**: Public.
*   **Security Policies**:
    *   **Select**: Allow select for the assigned tradie, posting client, and platform administrators.
    *   **Insert**: Allow the assigned tradie to upload images.

---

## 🛠️ Verification & Testing Steps

To test the end-to-end marketplace flow in **Demo Sandbox Mode**:

1.  **Onboarding**: Go to `/register` and create a Client account, then log out and register a Tradie account selecting "Plumbing".
2.  **Job Posting**: Log in as the **Client**, go to "Post a Job", fill out the plumbing details with a budget, and submit it.
3.  **Quoting**: Switch to the **Tradie** (using the quick switcher in the top bar), navigate to "Available Jobs", locate the client's plumbing posting, and submit a quote of `$250`.
4.  **Accepting & Chatting**: Switch back to the **Client**. View the submitted quote on your dashboard and click "Accept". The job status updates to "Assigned". Open the job card and send a message to the tradie.
5.  **Tracking Milestones**: Switch back to the **Tradie**, go to "My Jobs", select the active project, send a reply message in the chat, click "Start Job", and upload a progress log. Once finished, click "Request Completion".
6.  **Reviewing & Completing**: Switch to the **Client**. Confirm the job completion and submit a 5-star review.
7.  **Admin Check**: Switch to the **Admin** account. Inspect the Audit Logs to see the registered transaction history. Navigate to the Verifications panel to inspect and approve the Tradie's documentation.
