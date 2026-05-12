export interface WorkflowStep {
    taskType: string;
    stepNumber: number;
}

export interface WorkflowDefinition {
    name: string;
    steps: WorkflowStep[];
}