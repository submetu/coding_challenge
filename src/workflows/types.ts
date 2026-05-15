export interface WorkflowStep {
    taskType: string;
    stepNumber: number;
    dependsOn?: number[];
}

export interface WorkflowDefinition {
    name: string;
    steps: WorkflowStep[];
}