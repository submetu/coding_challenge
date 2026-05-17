import { buildTaskResults } from './buildTaskResults';
import { Task } from '../models/Task';
import { Result } from '../models/Result';
import { TaskStatus } from '../workers/enums';
import { Repository } from 'typeorm';

function mockResultRepo(result: Result | null): Repository<Result> {
    return { findOne: jest.fn().mockResolvedValue(result) } as unknown as Repository<Result>;
}

describe('buildTaskResults', () => {
    it('returns parsed output for completed task with result', async () => {
        // given
        const task = { taskId: 't1', taskType: 'analysis', status: TaskStatus.Completed, resultId: 'r1' } as Task;
        const result = { resultId: 'r1', taskId: 't1', data: JSON.stringify({ country: 'France' }) } as Result;

        // when
        const out = await buildTaskResults([task], mockResultRepo(result));

        // then
        expect(out).toEqual([{ taskId: 't1', type: 'analysis', output: { country: 'France' } }]);
    });

    it('returns error for failed task', async () => {
        // given
        const task = { taskId: 't2', taskType: 'polygonArea', status: TaskStatus.Failed, progress: 'bad geometry' } as Task;

        // when
        const out = await buildTaskResults([task], mockResultRepo(null));

        // then
        expect(out).toEqual([{ taskId: 't2', type: 'polygonArea', output: null, error: 'bad geometry' }]);
    });
});
