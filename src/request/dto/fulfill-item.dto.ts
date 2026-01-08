import { IsString, IsNotEmpty } from 'class-validator';

export class FulfillItemDto {
  @IsString()
  @IsNotEmpty()
  evidenceId: string;

  @IsString()
  @IsNotEmpty()
  versionId: string;
}
