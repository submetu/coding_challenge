# Backend Coding Challenge

## Getting Started

1. Fork the Project:
   ![There is a button on the top right of you codesandbox environment after signing in](public/image.png)
2. Start Coding

This repository demonstrates a backend architecture that handles asynchronous tasks, workflows, and job execution using TypeScript, Express.js, and TypeORM. The project showcases how to:

- Define and manage entities such as `Task` and `Workflow`.
- Use a `WorkflowFactory` to create workflows from YAML configurations.
- Implement a `TaskRunner` that executes jobs associated with tasks and manages task and workflow states.
- Run tasks asynchronously using a background worker.

## Key Features

1. **Entity Modeling with TypeORM**

   - **Task Entity:** Represents an individual unit of work with attributes like `taskType`, `status`, `progress`, and references to a `Workflow`.
   - **Workflow Entity:** Groups multiple tasks into a defined sequence or steps, allowing complex multi-step processes.

2. **Workflow Creation from YAML**

   - Use `WorkflowFactory` to load workflow definitions from a YAML file.
   - Dynamically create workflows and tasks without code changes by updating YAML files.

3. **Asynchronous Task Execution**

   - A background worker (`taskWorker`) continuously polls for `queued` tasks.
   - The `TaskRunner` runs the appropriate job based on a task’s `taskType`.

4. **Robust Status Management**

   - `TaskRunner` updates the status of tasks (from `queued` to `in_progress`, `completed`, or `failed`).
   - Workflow status is evaluated after each task completes, ensuring you know when the entire workflow is `completed` or `failed`.

5. **Dependency Injection and Decoupling**
   - `TaskRunner` takes in only the `Task` and determines the correct job internally.
   - `TaskRunner` handles task state transitions, leaving the background worker clean and focused on orchestration.

## Project Structure

```
src
├─ models/
│   ├─ world_data.json  # Contains world data for analysis
│
├─ models/
│   ├─ Result.ts        # Defines the Result entity
│   ├─ Task.ts          # Defines the Task entity
│   ├─ Workflow.ts      # Defines the Workflow entity
│
├─ jobs/
│   ├─ Job.ts           # Job interface
│   ├─ JobFactory.ts    # getJobForTaskType function for mapping taskType to a Job
│   ├─ TaskRunner.ts    # Handles job execution & task/workflow state transitions
│   ├─ DataAnalysisJob.ts (example)
│   ├─ EmailNotificationJob.ts (example)
│
├─ workflows/
│   ├─ WorkflowFactory.ts  # Creates workflows & tasks from a YAML definition
│
├─ workers/
│   ├─ taskWorker.ts    # Background worker that fetches queued tasks & runs them
│
├─ routes/
│   ├─ analysisRoutes.ts # POST /analysis endpoint to create workflows
│
├─ data-source.ts       # TypeORM DataSource configuration
└─ index.ts             # Express.js server initialization & starting the worker
```

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm or yarn
- SQLite or another supported database

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/backend-coding-challenge.git
   cd backend-coding-challenge
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure TypeORM:**

   - Edit `data-source.ts` to ensure the `entities` array includes `Task` and `Workflow` entities.
   - Confirm database settings (e.g. SQLite file path).

4. **Create or Update the Workflow YAML:**
   - Place a YAML file (e.g. `example_workflow.yml`) in a `workflows/` directory.
   - Define steps, for example:
     ```yaml
     name: "example_workflow"
     steps:
       - taskType: "analysis"
         stepNumber: 1
       - taskType: "notification"
         stepNumber: 2
     ```

### Running the Application

1. **Compile TypeScript (optional if using `ts-node`):**

   ```bash
   npx tsc
   ```

2. **Start the server:**

   ```bash
   npm start
   ```

   If using `ts-node`, this will start the Express.js server and the background worker after database initialization.

3. **Create a Workflow (e.g. via `/analysis`):**

   ```bash
   curl -X POST http://localhost:3000/analysis \
   -H "Content-Type: application/json" \
   -d '{
    "clientId": "client123",
    "geoJson": {
        "type": "Polygon",
        "coordinates": [
            [
                [
                    -63.624885020050996,
                    -10.311050368263523
                ],
                [
                    -63.624885020050996,
                    -10.367865108370523
                ],
                [
                    -63.61278302732815,
                    -10.367865108370523
                ],
                [
                    -63.61278302732815,
                    -10.311050368263523
                ],
                [
                    -63.624885020050996,
                    -10.311050368263523
                ]
            ]
        ]
    }
    }'
   ```

   This will read the configured workflow YAML, create a workflow and tasks, and queue them for processing.

4. **Check Logs:**
   - The worker picks up tasks from `queued` state.
   - `TaskRunner` runs the corresponding job (e.g., data analysis, email notification) and updates states.
   - Once tasks are done, the workflow is marked as `completed`.

### **Coding Challenge Tasks for the Interviewee**

The following tasks must be completed to enhance the backend system:

---

### **1. Add a New Job to Calculate Polygon Area**

**Objective:**  
Create a new job class to calculate the area of a polygon from the GeoJSON provided in the task.

#### **Steps:**

1. Create a new job file `PolygonAreaJob.ts` in the `src/jobs/` directory.
2. Implement the `Job` interface in this new class.
3. Use `@turf/area` to calculate the polygon area from the `geoJson` field in the task.
4. Save the result in the `output` field of the task.

#### **Requirements:**

- The `output` should include the calculated area in square meters.
- Ensure that the job handles invalid GeoJSON gracefully and marks the task as failed.

#### **Testing:**

1. Make sure `example_workflow.yml` includes the `polygonArea` step:
   ```yaml
   name: "example_workflow"
   steps:
     - taskType: "notification"
       stepNumber: 1
     - taskType: "analysis"
       stepNumber: 2
     - taskType: "polygonArea"
       stepNumber: 3
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Send a valid polygon request:
   ```bash
   curl -X POST http://localhost:3000/analysis -H "Content-Type: application/json" -d '{"clientId":"client123","geoJson":{"type":"Polygon","coordinates":[[[-63.624885,-10.311050],[-63.624885,-10.367865],[-63.612783,-10.367865],[-63.612783,-10.311050],[-63.624885,-10.311050]]]}}'
   ```
   Expected: `polygonArea` task completes with area in square meters (e.g. `"8363367.565848464"`).

4. Send an invalid GeoJSON request:
   ```bash
   curl -X POST http://localhost:3000/analysis -H "Content-Type: application/json" -d '{"clientId":"client123","geoJson":{"type":"Point","coordinates":[0,0]}}'
   ```
   Expected: `polygonArea` task is marked `failed`, workflow is marked `failed`.

5. Verify results in the database.

---

### **2. Add a Job to Generate a Report**

**Objective:**  
Create a new job class to generate a report by aggregating the outputs of multiple tasks in the workflow.

#### **Steps:**

1. Create a new job file `ReportGenerationJob.ts` in the `src/jobs/` directory.
2. Implement the `Job` interface in this new class.
3. Aggregate outputs from all preceding tasks in the workflow into a JSON report. For example:
   ```json
   {
     "workflowId": "<workflow-id>",
     "tasks": [
       { "taskId": "<task-1-id>", "type": "polygonArea", "output": "<area>" },
       {
         "taskId": "<task-2-id>",
         "type": "dataAnalysis",
         "output": "<analysis result>"
       }
     ],
     "finalReport": "Aggregated data and results"
   }
   ```
4. Save the report as the `output` of the `ReportGenerationJob`.

#### **Requirements:**

- Ensure the job runs only after all preceding tasks are complete.
- Handle cases where tasks fail, and include error information in the report.

#### **Testing:**

1. Make sure `example_workflow.yml` has the `report` step with `dependsOn`:
   ```yaml
   name: "example_workflow"
   steps:
     - taskType: "notification"
       stepNumber: 1
     - taskType: "analysis"
       stepNumber: 2
     - taskType: "polygonArea"
       stepNumber: 3
     - taskType: "report"
       stepNumber: 4
       dependsOn: [1, 2, 3]
   ```
   > **Why `dependsOn` is required here:** Rather than having the report task magically detect and wait for "all preceding tasks," i used the explicit `dependsOn` system from Task 3. I will explain my reasoning.. `ReportGenerationJob` aggregates only its declared dependencies.. This makes it composable (e.g., a workflow could have multiple report tasks each covering different subsets of steps). For a full aggregation of ALL tasks regardless of dependencies, Task 4's `finalResult` on Workflow should be available for users to get a complete report of all the tasks in the workflow. In a real-life scenario however, if i saw Step 4 as a user story after we delivered step 2 to production, i would have a meeting with the PO to revisit the requirements. For this small project, since i am not able to ask questions atm, this approach seemed like a good tradeoff. 

2. Start the server:
   ```bash
   npm start
   ```

3. Send a valid polygon — all 4 tasks should complete happily:
   ```bash
   curl -X POST http://localhost:3000/analysis -H "Content-Type: application/json" -d '{"clientId":"client123","geoJson":{"type":"Polygon","coordinates":[[[-63.624885,-10.311050],[-63.624885,-10.367865],[-63.612783,-10.367865],[-63.612783,-10.311050],[-63.624885,-10.311050]]]}}'
   ```
   Wait 25 seconds. Tasks 1–3 have no dependencies so they run in whatever order SQLite returns them — the order may vary. Expected database state (verify via `sqlite3`, task order inside `report.output.tasks` may vary):
   ```json
   {
     "workflowStatus": "completed",
     "tasks": [
       { "type": "notification", "status": "completed" },
       { "type": "analysis", "status": "completed" },
       { "type": "polygonArea", "status": "completed" },
       { "type": "report", "status": "completed", "output": {
           "workflowId": "<uuid>",
           "tasks": [
             { "taskId": "<id>", "type": "notification", "output": {} },
             { "taskId": "<id>", "type": "analysis", "output": "Brazil" },
             { "taskId": "<id>", "type": "polygonArea", "output": "8363367.565848464" }
           ],
           "finalReport": "Aggregated data and results"
         }
       }
     ]
   }
   ```

4. Send invalid GeoJSON — the report should still run and capture the failure:
   ```bash
   curl -X POST http://localhost:3000/analysis -H "Content-Type: application/json" -d '{"clientId":"client123","geoJson":{"type":"Point","coordinates":[0,0]}}'
   ```
   Expected database state (verify via `sqlite3`, task order inside `report.output.tasks` may vary):
   ```json
   {
     "workflowStatus": "failed",
     "tasks": [
       { "type": "notification", "status": "completed" },
       { "type": "analysis", "status": "completed" },
       { "type": "polygonArea", "status": "failed" },
       { "type": "report", "status": "completed", "output": {
           "workflowId": "<uuid>",
           "tasks": [
             { "taskId": "<id>", "type": "notification", "output": {} },
             { "taskId": "<id>", "type": "analysis", "output": "No country found" },
             { "taskId": "<id>", "type": "polygonArea", "output": null, "error": "Invalid GeoJSON: expected Polygon or MultiPolygon, got Point" }
           ],
           "finalReport": "Aggregated data and results"
         }
       }
     ]
   }
   ```

5. Check the database to verify all entries.

---

### **3. Support Interdependent Tasks in Workflows**

**Objective:**  
Modify the system to support workflows with tasks that depend on the outputs of earlier tasks.

#### **Steps:**

1. Update the `Task` entity to include a `dependency` field that references another task
2. Modify the `TaskRunner` to wait for dependent tasks to complete and pass their outputs as inputs to the current task.
3. Extend the workflow YAML format to specify task dependencies (e.g., `dependsOn`).
4. Update the `WorkflowFactory` to parse dependencies and create tasks accordingly.

#### **Requirements:**

- Ensure dependent tasks do not execute until their dependencies are completed.
- Test workflows where tasks are chained through dependencies.

#### **Testing:**

1. Make sure `example_workflow.yml` includes `dependsOn` declarations such as follows:
   ```yaml
   name: "example_workflow"
   steps:
     - taskType: "report"
       stepNumber: 1
       dependsOn: [2, 3, 4]
     - taskType: "notification"
       stepNumber: 2
     - taskType: "analysis"
       stepNumber: 3
       dependsOn: [2]
     - taskType: "polygonArea"
       stepNumber: 4
   ```
   Note: This YAML intentionally restructures the workflow from Step 2 to prove that `dependsOn` drives execution order, not step number or YAML order:
   - `report` is step 1 but depends on steps 2, 3, and 4 — so it runs last
   - `analysis` (step 3) now depends on `notification` (step 2) — this adds a chain to verify that blocked tasks wait correctly

2. Start the server:
   ```bash
   npm start
   ```

3. Send a valid polygon request:
   ```bash
   curl -X POST http://localhost:3000/analysis -H "Content-Type: application/json" -d '{"clientId":"client123","geoJson":{"type":"Polygon","coordinates":[[[-63.624885,-10.311050],[-63.624885,-10.367865],[-63.612783,-10.367865],[-63.612783,-10.311050],[-63.624885,-10.311050]]]}}'
   ```
   Wait 25 seconds. Execution order is determined by `dependsOn`, not step number:
   - `notification` (step 2) and `polygonArea` (step 4) are eligible immediately (no deps) — they run in whatever order the worker picks them up
   - `analysis` (step 3) is blocked until `notification` completes
   - `report` (step 1) is blocked until steps 2, 3, and 4 all reach a terminal state — runs last despite being step 1

   Check server logs to confirm the chain: `notification` and `polygonArea` start first, `analysis` starts only after `notification` completes, `report` starts last.

   Expected database state (verify via `sqlite3`, task order inside `report.output.tasks` may vary):
   ```json
   {
     "workflowStatus": "completed",
     "tasks": [
       { "type": "report", "stepNumber": 1, "status": "completed", "output": {
           "workflowId": "<uuid>",
           "tasks": [
             { "taskId": "<id>", "type": "notification", "output": {} },
             { "taskId": "<id>", "type": "analysis", "output": "Brazil" },
             { "taskId": "<id>", "type": "polygonArea", "output": "8363367.565848464" }
           ],
           "finalReport": "Aggregated data and results"
         }
       },
       { "type": "notification", "stepNumber": 2, "status": "completed" },
       { "type": "analysis", "stepNumber": 3, "status": "completed" },
       { "type": "polygonArea", "stepNumber": 4, "status": "completed" }
     ]
   }
   ```

4. Send invalid GeoJSON to verify failure propagation:
   ```bash
   curl -X POST http://localhost:3000/analysis -H "Content-Type: application/json" -d '{"clientId":"client123","geoJson":{"type":"Point","coordinates":[0,0]}}'
   ```
   `analysis` still runs (its only dep is `notification`). `report` (step 1) runs last — after all 3 deps reach terminal state, including the failed `polygonArea`.

   Expected database state (verify via `sqlite3`, task order inside `report.output.tasks` may vary):
   ```json
   {
     "workflowStatus": "failed",
     "tasks": [
       { "type": "report", "stepNumber": 1, "status": "completed", "output": {
           "workflowId": "<uuid>",
           "tasks": [
             { "taskId": "<id>", "type": "notification", "output": {} },
             { "taskId": "<id>", "type": "analysis", "output": "No country found" },
             { "taskId": "<id>", "type": "polygonArea", "output": null, "error": "Invalid GeoJSON: expected Polygon or MultiPolygon, got Point" }
           ],
           "finalReport": "Aggregated data and results"
         }
       },
       { "type": "notification", "stepNumber": 2, "status": "completed" },
       { "type": "analysis", "stepNumber": 3, "status": "completed" },
       { "type": "polygonArea", "stepNumber": 4, "status": "failed" }
     ]
   }
   ```

5. Verify results in the database...

---

### **4. Ensure Final Workflow Results Are Properly Saved**

**Objective:**  
Save the aggregated results of all tasks in the workflow as the `finalResult` field of the `Workflow` entity.

#### **Steps:**

1. Modify the `Workflow` entity to include a `finalResult` field:
2. Aggregate the outputs of all tasks in the workflow after the last task completes.
3. Save the aggregated results in the `finalResult` field.

#### **Requirements:**

- The `finalResult` must include outputs from all completed tasks.
- Handle cases where tasks fail, and include failure information in the final result.

#### **Testing:**

1. Make sure `example_workflow.yml` has the following steps:
   ```yaml
   name: "example_workflow"
   steps:
     - taskType: "notification"
       stepNumber: 1
     - taskType: "analysis"
       stepNumber: 2
       dependsOn: [1]
     - taskType: "polygonArea"
       stepNumber: 3
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Send a valid polygon request:
   ```bash
   curl -X POST http://localhost:3000/analysis -H "Content-Type: application/json" -d '{"clientId":"client123","geoJson":{"type":"Polygon","coordinates":[[[-63.624885,-10.311050],[-63.624885,-10.367865],[-63.612783,-10.367865],[-63.612783,-10.311050],[-63.624885,-10.311050]]]}}'
   ```
   Wait 20 seconds. Expected database state (verify via `sqlite3`, task order inside `finalResult.tasks` may vary):
   ```json
   {
     "workflowStatus": "completed",
     "finalResult": {
       "tasks": [
         { "taskId": "<id>", "type": "notification", "output": {} },
         { "taskId": "<id>", "type": "analysis", "output": "Brazil" },
         { "taskId": "<id>", "type": "polygonArea", "output": "8363367.565848464" }
       ]
     }
   }
   ```

4. Send invalid GeoJSON — `finalResult` should include failure information:
   ```bash
   curl -X POST http://localhost:3000/analysis -H "Content-Type: application/json" -d '{"clientId":"client123","geoJson":{"type":"Point","coordinates":[0,0]}}'
   ```
   Expected database state (verify via `sqlite3`, task order inside `finalResult.tasks` may vary):
   ```json
   {
     "workflowStatus": "failed",
     "finalResult": {
       "tasks": [
         { "taskId": "<id>", "type": "notification", "output": {} },
         { "taskId": "<id>", "type": "analysis", "output": "No country found" },
         { "taskId": "<id>", "type": "polygonArea", "output": null, "error": "Invalid GeoJSON: expected Polygon or MultiPolygon, got Point" }
       ]
     }
   }
   ```

5. Verify results in the database:
   ```bash
   sqlite3 data/database.sqlite "SELECT status, finalResult FROM workflows;"
   ```

---

### **5. Create an Endpoint for Getting Workflow Status**

**Objective:**  
Implement an API endpoint to retrieve the current status of a workflow.

#### **Endpoint Specification:**

- **URL:** `/workflow/:id/status`
- **Method:** `GET`
- **Response Example:**
  ```json
  {
    "workflowId": "3433c76d-f226-4c91-afb5-7dfc7accab24",
    "status": "in_progress",
    "completedTasks": 3,
    "totalTasks": 5
  }
  ```

#### **Requirements:**

- Include the number of completed tasks and the total number of tasks in the workflow.
- Return a `404` response if the workflow ID does not exist.

#### **Testing:**

1. Start the server:
   ```bash
   npm start
   ```

2. Create a workflow:
   ```bash
   curl -X POST http://localhost:3000/analysis -H "Content-Type: application/json" -d '{"clientId":"client123","geoJson":{"type":"Polygon","coordinates":[[[-63.624885,-10.311050],[-63.624885,-10.367865],[-63.612783,-10.367865],[-63.612783,-10.311050],[-63.624885,-10.311050]]]}}'
   ```

3. `GET /workflow/:id/status` — while tasks are still running:
   ```bash
   curl http://localhost:3000/workflow/<workflowId>/status
   ```
   ```json
   {
     "workflowId": "<uuid>",
     "status": "in_progress",
     "completedTasks": 1,
     "totalTasks": 3
   }
   ```

4. `GET /workflow/:id/status` — after all tasks complete:
   ```json
   {
     "workflowId": "<uuid>",
     "status": "completed",
     "completedTasks": 3,
     "totalTasks": 3
   }
   ```

5. `GET /workflow/:id/status` — nonexistent ID returns `404`:
   ```json
   { "message": "Workflow not found" }
   ```

---

### **6. Create an Endpoint for Retrieving Workflow Results**

**Objective:**  
Implement an API endpoint to retrieve the final results of a completed workflow.

#### **Endpoint Specification:**

- **URL:** `/workflow/:id/results`
- **Method:** `GET`
- **Response Example:**
  ```json
  {
    "workflowId": "3433c76d-f226-4c91-afb5-7dfc7accab24",
    "status": "completed",
    "finalResult": "Aggregated workflow results go here"
  }
  ```

#### **Requirements:**

- Return the `finalResult` field of the workflow if it is completed.
- Return a `404` response if the workflow ID does not exist.
- Return a `400` response if the workflow is not yet completed.

#### **Testing:**

1. `GET /workflow/:id/results` — completed workflow:
   ```bash
   curl http://localhost:3000/workflow/<workflowId>/results
   ```
   ```json
   {
     "workflowId": "<uuid>",
     "status": "completed",
     "finalResult": {
       "tasks": [
         { "taskId": "<id>", "type": "notification", "output": {} },
         { "taskId": "<id>", "type": "analysis", "output": "Brazil" },
         { "taskId": "<id>", "type": "polygonArea", "output": "8363367.565848464" }
       ]
     }
   }
   ```

2. `GET /workflow/:id/results` — failed workflow (also returns `finalResult`):
   ```json
   {
     "workflowId": "<uuid>",
     "status": "failed",
     "finalResult": {
       "tasks": [
         { "taskId": "<id>", "type": "notification", "output": {} },
         { "taskId": "<id>", "type": "analysis", "output": "No country found" },
         { "taskId": "<id>", "type": "polygonArea", "output": null, "error": "Invalid GeoJSON: expected Polygon or MultiPolygon, got Point" }
       ]
     }
   }
   ```

3. `GET /workflow/:id/results` — workflow still in progress returns `400`:
   ```json
   { "message": "Workflow is not yet completed" }
   ```

4. `GET /workflow/:id/results` — nonexistent ID returns `404`:
   ```json
   { "message": "Workflow not found" }
   ```

---

### **Deliverables**

- **Code Implementation:**

  - New jobs: `PolygonAreaJob` and `ReportGenerationJob`.
  - Enhanced workflow support for interdependent tasks.
  - Workflow final results aggregation.
  - New API endpoints for workflow status and results.

- **Documentation:**
  - Update the README file to include instructions for testing the new features.
  - Document the API endpoints with request and response examples.

---

# My notes

### Testing

All testing instructions (with curl commands and expected outputs) live under each step above (1–6). Each step uses a slightly different `example_workflow.yml` — just copy the YAML from that step's testing section into `src/workflows/example_workflow.yml` and restart the server. The DB is wiped on every restart so there's no leftover state to worry about.

### TODOs

I've left `TODO` comments in the codebase where I spotted room for improvement but kept things scoped to the challenge.

### Design Decisions

Some of decisions are explained inline in the Step 2 and 3 testing sections (e.g., why `dependsOn` is explicit). Happy to chat through any of these live.

### Unit Tests

Run with `npm test`. I kept these pretty minimal — just enough to cover the important stuff (state transitions, GeoJSON validation, dependency scheduling, result building). In a real project I'd go a lot deeper...

### Node Version

This project doesn't seem to work with the latest Node. I had to downgrade to Node 20 to get `npm install` to work. A newer version might also be fine, but the latest definitely isn't. I added an `engines` field in `package.json` to flag this.