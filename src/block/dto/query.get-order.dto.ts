import {
  IsOptional,
  IsString,
  IsNumberString,
  IsBoolean,
} from 'class-validator';

export class GetOrderOptionsDto {
  @IsOptional()
  @IsString()
  tokenA?: string;

  @IsOptional()
  @IsString()
  tokenB?: string;

  @IsOptional()
  @IsString()
  user?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
