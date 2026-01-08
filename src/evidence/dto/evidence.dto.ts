import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateEvidenceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  docType: string;

  @IsDateString()
  @IsNotEmpty()
  expiry: string;

  @IsString()
  notes?: string;
}

export class AddEvidenceVersionDto {
  @IsString()
  notes?: string;

  @IsString()
  expiry?: string;
}
