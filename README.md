# AI-Powered CRM Assistant

A small AI-powered CRM application that allows users to manage customer and deal information through a web-based CRM dashboard and interact with the CRM using natural language.

The project was developed as part of the AI-Powered CRM Assistant interview task.

## Overview

The application combines a simple CRM system with an AI assistant.

Users can:

- View CRM dashboard information
- Manage customers
- View and manage deals
- Add notes to customers
- Ask natural-language questions about CRM data
- Perform CRM actions using natural language
- Get responses grounded in the actual CRM data

The AI assistant is designed to retrieve relevant CRM information and select appropriate actions/tools based on the user's request.

---

## Features

### 1. CRM Dashboard

The dashboard displays key CRM metrics such as:

- Total customers
- Total deals
- Won deals
- Contacted leads
- Total deal value

### 2. Customer Management

The CRM contains a mock customer dataset with information such as:

- Customer name
- Company
- Contact information
- Associated deals
- Notes

### 3. Deal Management

Deals contain information such as:

- Deal name
- Customer
- Deal value
- Status
- Last updated date
- Assigned salesperson

Supported statuses include:

- New
- Contacted
- Won
- Lost

### 4. Natural Language Q&A

The AI assistant can answer questions about CRM data.

Examples:

> How many customers are there?

> How many leads are currently in Contacted status?

> What is the status of the AI Solution deal?

> Show me all deals worth over $10,000 that haven't been updated in 2 weeks.

> Summarize my conversation history with Priya Sharma.

### 5. AI Agent Actions

The assistant can also perform CRM actions using natural language.

Examples:

> Move AI Solution's deal to Contacted.

> Add a note to Priya Sharma: follow up next Monday.

> Assign the CRM Implementation deal to David.

The assistant identifies the requested action and calls the corresponding CRM operation.

### 6. Grounding and Safety

The assistant is designed to work with the actual CRM dataset rather than inventing customer or deal information.

For example, if a requested customer does not exist, the assistant returns a clear message instead of creating or assuming a customer.

Before modifying CRM data, the application validates the target customer/deal and the requested operation.

---

## Architecture

The application follows a simple frontend/backend architecture.

```text
                    User
                     |
                     v
              React Frontend
                     |
                     | REST API
                     v
              Node.js Backend
                     |
             +-------+-------+
             |               |
             v               v
        CRM Data        AI Agent
                             |
                             v
                       Gemini API
                             |
                             v
                    Tool / Action Selection
                             |
                             v
                     CRM Operations
