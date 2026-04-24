import { Field, ID, InputType } from '@nestjs/graphql';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

@InputType()
export class CreateAllocationInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  userId: string;

  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @Field()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;
}

@InputType()
export class UpdateAllocationInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
