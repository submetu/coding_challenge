import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Workflow } from '../models/Workflow';
import { TaskStatus } from '../workers/enums';
import { WorkflowStatus } from '../workflows/enums';

const router = Router();

router.get('/:id/status', async (req, res) => {
    try {
        const workflowRepo = AppDataSource.getRepository(Workflow);
        const workflow = await workflowRepo.findOne({
            where: { workflowId: req.params.id },
            relations: ['tasks']
        });

        if (!workflow) {
            res.status(404).json({ message: 'Workflow not found' });
            return;
        }

        const completedTasks = workflow.tasks.filter(task => task.status === TaskStatus.Completed).length;

        res.json({
            workflowId: workflow.workflowId,
            status: workflow.status,
            completedTasks,
            totalTasks: workflow.tasks.length
        });
    } catch (error) {
        console.error('Error fetching workflow status:', error);
        res.status(500).json({ message: 'Failed to fetch workflow status' });
    }
});

router.get('/:id/results', async (req, res) => {
    try {
        const workflowRepo = AppDataSource.getRepository(Workflow);
        const workflow = await workflowRepo.findOne({
            where: { workflowId: req.params.id }
        });

        if (!workflow) {
            res.status(404).json({ message: 'Workflow not found' });
            return;
        }

        const isTerminal = [WorkflowStatus.Completed, WorkflowStatus.Failed].includes(workflow.status);

        if (!isTerminal) {
            res.status(400).json({ message: 'Workflow is not yet completed' });
            return;
        }

        const finalResult = workflow.finalResult ? JSON.parse(workflow.finalResult) : null;

        res.json({
            workflowId: workflow.workflowId,
            status: workflow.status,
            finalResult
        });
    } catch (error) {
        console.error('Error fetching workflow results:', error);
        res.status(500).json({ message: 'Failed to fetch workflow results' });
    }
});

export default router;
