import { IsInt, IsString, Min, Max, Length } from 'class-validator';

export class CreateBookDto {
  @IsString()
  @Length(1, 100)
  author: string;

  @IsString()
  @Length(1, 200)
  title: string;

  @IsInt()
  @Min(1000)
  @Max(new Date().getFullYear())
  publicationYear: number;
}
