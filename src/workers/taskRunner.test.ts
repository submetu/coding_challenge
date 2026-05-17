import { TaskRunner } from './taskRunner';
import { Task } from '../models/Task';
import { Workflow } from '../models/Workflow';
import { Result } from '../models/Result';
import { TaskStatus } from './enums';
import { WorkflowStatus } from '../workflows/enums';
import { Repository } from 'typeorm';

jest.mock('../jobs/JobFactory', () => ({
    getJobForTaskType: jest.fn()
}));
import { getJobForTaskType } from '../jobs/JobFactory';
const mockGetJob = getJobForTaskType as jest.Mock;

function createMockTaskRepo(workflow?: Workflow) {
    const taskRepo = { save: jest.fn() };
    const workflowRepo = {
        save: jest.fn(),
        findOne: jest.fn().mockResolvedValue(workflow ?? null)
    };
    const resultRepo = {
        save: jest.fn((r: Result) => { r.resultId = 'generated-id'; }),
        findOne: jest.fn()
    };

    const manager: any = {
        getRepository: jest.fn((entity: any) => {
            if (entity === Task) return taskRepo;
            if (entity === Workflow) return workflowRepo;
            if (entity === Result) return resultRepo;
        }),
    };
    manager.transaction = jest.fn(async (cb: any) => cb(manager));

    const repo = {
        save: jest.fn(),
        manager
    } as unknown as Repository<Task>;

    return { repo, resultRepo, workflowRepo };
}

function makeTask(overrides: Partial<Task> = {}): Task {
    return {
        taskId: 't1',
        taskType: 'polygonArea',
        status: TaskStatus.Queued,
        workflow: { workflowId: 'w1' } as Workflow,
        ...overrides
    } as Task;
}

describe('TaskRunner', () => {
    it('marks task Completed and creates Result on success', async () => {
        // given
        const workflow = { workflowId: 'w1', tasks: [makeTask({ status: TaskStatus.Completed })], status: WorkflowStatus.InProgress } as unknown as Workflow;
        const { repo, resultRepo } = createMockTaskRepo(workflow);
        mockGetJob.mockReturnValue({ run: jest.fn().mockResolvedValue('12345') });
        const task = makeTask();

        // when
        const runner = new TaskRunner(repo);
        await runner.run(task);

        // then
        expect(resultRepo.save).toHaveBeenCalledWith(expect.objectContaining({ taskId: 't1' }));
        expect(task.status).toBe(TaskStatus.Completed);
    });

    it('marks task as Failed with error message on job failure', async () => {
        // given
        const workflow = { workflowId: 'w1', tasks: [makeTask({ status: TaskStatus.Failed })], status: WorkflowStatus.InProgress } as unknown as Workflow;
        const { repo } = createMockTaskRepo(workflow);
        mockGetJob.mockReturnValue({ run: jest.fn().mockRejectedValue(new Error('bad input')) });
        const task = makeTask();

        // when
        const runner = new TaskRunner(repo);
        await runner.run(task);

        // then
        expect(task.status).toBe(TaskStatus.Failed);
        expect(task.progress).toBe('bad input');
    });

    it('settles workflow to Completed when all tasks become terminal', async () => {
        // given
        const tasks = [
            makeTask({ taskId: 't1', status: TaskStatus.Completed, resultId: 'r1' }),
            makeTask({ taskId: 't2', status: TaskStatus.Completed, resultId: 'r2' })
        ];
        const workflow = { workflowId: 'w1', tasks, status: WorkflowStatus.InProgress } as unknown as Workflow;
        const { repo, workflowRepo } = createMockTaskRepo(workflow);
        mockGetJob.mockReturnValue({ run: jest.fn().mockResolvedValue('ok') });

        // when
        const runner = new TaskRunner(repo);
        await runner.run(makeTask());

        // then
        expect(workflowRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: WorkflowStatus.Completed }));
    });

    it('settles workflow to Failed when any task fails', async () => {
        // given
        const tasks = [
            makeTask({ taskId: 't1', status: TaskStatus.Completed, resultId: 'r1' }),
            makeTask({ taskId: 't2', status: TaskStatus.Failed })
        ];
        const workflow = { workflowId: 'w1', tasks, status: WorkflowStatus.InProgress } as unknown as Workflow;
        const { repo, workflowRepo } = createMockTaskRepo(workflow);
        mockGetJob.mockReturnValue({ run: jest.fn().mockResolvedValue('ok') });

        // when
        const runner = new TaskRunner(repo);
        await runner.run(makeTask());

        // then
        expect(workflowRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: WorkflowStatus.Failed }));
    });
});
