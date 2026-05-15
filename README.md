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
   - taskType: "polygonArea"
     stepNumber: 3
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Send a valid polygon request:
   ```bash
   curl -X POST http://localhost:3000/analysis -H "Content-Type: application/json" -d '{"clientId":"client123","geoJson":{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-63.624885,-10.311050],[-63.624885,-10.367865],[-63.612783,-10.367865],[-63.612783,-10.311050],[-63.624885,-10.311050]]]},"properties":{}}}'
   ```
   Expected: `polygonArea` task completes with area in square meters (e.g. `"8363324.27..."`).

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
   Wait around 25 seconds. Expected:
   - `notification`, `analysis`, `polygonArea`, and `report` all hit `completed`
   - `report` result: JSON object with `workflowId`, a `tasks` array containing the output of each dependency, and `"finalReport": "Aggregated data and results"`
   - Workflow status: `completed`

4. Send invalid GeoJSON — the report should still run and capture the failure:
   ```bash
   curl -X POST http://localhost:3000/analysis -H "Content-Type: application/json" -d '{"clientId":"client123","geoJson":{"type":"Point","coordinates":[0,0]}}'
   ```
   Expected:
   - `polygonArea` fails with the error stored in the `progress` field
   - `report` waits for its dependencies to reach a terminal state before running
   - Report result includes `"output": null, "error": "Invalid GeoJSON: expected Polygon or MultiPolygon, got Point"` for the `polygonArea` task
   - Workflow status: `failed`

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
     - taskType: "notification"
       stepNumber: 1
     - taskType: "analysis"
       stepNumber: 2
       dependsOn: [1]
     - taskType: "polygonArea"
       stepNumber: 3
     - taskType: "report"
       stepNumber: 4
       dependsOn: [1, 2, 3]
   ```
   Note: `analysis` (step 2) depends on `notification` (step 1).. This proves that execution order is determined by `dependsOn`, not by step number or SQLite insertion order.

2. Start the server:
   ```bash
   npm start
   ```

3. Send a valid polygon request:
   ```bash
   curl -X POST http://localhost:3000/analysis -H "Content-Type: application/json" -d '{"clientId":"client123","geoJson":{"type":"Polygon","coordinates":[[[-63.624885,-10.311050],[-63.624885,-10.367865],[-63.612783,-10.367865],[-63.612783,-10.311050],[-63.624885,-10.311050]]]}}'
   ```
   Wait around 25 seconds. Expect the following task execution order:
   - `notification` (step 1) — runs immediately (no deps)
   - `polygonArea` (step 3) — runs immediately (no deps)
   - `analysis` (step 2) — runs only after `notification` completes
   - `report` (step 4) — runs only after steps 1, 2, and 3 all reach a terminal state

   All 4 tasks should be `completed` and also workflow status should be `completed`.

4. Send invalid GeoJSON to verify failure propagation:
   ```bash
   curl -X POST http://localhost:3000/analysis -H "Content-Type: application/json" -d '{"clientId":"client123","geoJson":{"type":"Point","coordinates":[0,0]}}'
   ```
   Expected:
   - `polygonArea` fails (invalid geometry type)
   - `analysis` still runs after `notification` completes 
   - `report` runs after all 3 deps are terminal (including the failed `polygonArea`)
   - Report result includes `"output": null, "error": "Invalid GeoJSON: expected Polygon or MultiPolygon, got Point"` for the `polygonArea` entry
   - Workflow status is `failed` since `polygonArea` failed..

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
