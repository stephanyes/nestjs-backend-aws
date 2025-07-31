import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('books')
export class Book {
  @PrimaryColumn()
  bookId: string;

  @Column()
  title: string;

  @Column()
  author: string;

  @Column()
  publicationYear: number;

  @Column({ default: 0 })
  views: number;
}