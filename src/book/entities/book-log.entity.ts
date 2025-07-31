import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum BookOperation {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  READ = 'READ',
  SYNC = 'SYNC',
}

@Entity('book_logs')
export class BookLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bookId: string;

  @Column()
  operation: BookOperation;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ nullable: true })
  author?: string;

  @Column({ nullable: true })
  title?: string;
}
