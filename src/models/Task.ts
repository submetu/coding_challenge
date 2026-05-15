import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { Workflow } from './Workflow';
import { TaskStatus } from '../workers/enums';

@Entity({ name: 'tasks' })
export class Task {
    @PrimaryGeneratedColumn('uuid')
    taskId!: string;

    @Column()
    clientId!: string;

    @Column('text')
    geoJson!: string;

    @Column()
    status!: TaskStatus;

    @Column({ nullable: true, type: 'text' })
    progress?: string | null;

    @Column({ nullable: true })
    resultId?: string;

    @Column()
    taskType!: string;

    @Column({ default: 1 })
    stepNumber!: number;

    @ManyToOne(() => Workflow, workflow => workflow.tasks)
    workflow!: Workflow;

    @ManyToMany(() => Task)
    @JoinTable({
        name: 'task_dependencies',
        joinColumn: { name: 'task_id', referencedColumnName: 'taskId' },
        inverseJoinColumn: { name: 'depends_on_task_id', referencedColumnName: 'taskId' }
    })
    dependsOn?: Task[];
}