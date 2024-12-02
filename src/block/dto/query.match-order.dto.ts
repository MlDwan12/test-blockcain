import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class GetMatchOrderOptionsDto {
  @IsOptional()
  @IsString()
  tokenA?: string;

  @IsOptional()
  @IsString()
  tokenB?: string;

  @IsOptional()
  @IsNumberString()
  amountA?: string;

  @IsOptional()
  @IsNumberString()
  amountB?: string;
}
