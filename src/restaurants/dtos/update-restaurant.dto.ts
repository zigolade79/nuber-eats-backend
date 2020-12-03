import { ArgsType, Field, InputType, OmitType, PartialType } from "@nestjs/graphql";
import { IsBoolean, IsString, Length } from "class-validator";
import { Restaurant } from "../entities/restaurant.entity";
import { CreateRestaurantDto } from "./create-restaurant.dto";


@InputType()
class UpdateRestaurantInputType extends PartialType(CreateRestaurantDto) {
   
}

@ArgsType()
export class UpdateRestaurantDto {
    
    @Field(type => Number)
    id: number;

    @Field(type => UpdateRestaurantInputType)
    data: UpdateRestaurantInputType;

}
