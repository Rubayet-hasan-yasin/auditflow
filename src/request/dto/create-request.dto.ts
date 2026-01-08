import { IsString, IsNotEmpty, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class RequestItemDto {
  @IsString()
  @IsNotEmpty()
  docType: string;
}

export class CreateRequestDto {
  @IsString()
  @IsNotEmpty()
  factoryId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RequestItemDto)
  items: RequestItemDto[];
}
