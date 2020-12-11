import { ArgsType, Field, InputType, IntersectionType, ObjectType, OmitType, PartialType, PickType } from "@nestjs/graphql";
import { IsBoolean, IsString, Length } from "class-validator";
import { CoreOutput } from "src/common/dtos/output.dto";
import { Category } from "../entities/category.entity";
import { Restaurant } from "../entities/restaurant.entity";


@InputType()
export class CreateRestaurantInput extends 
    IntersectionType(
        PickType(Restaurant,["restaurantName","coverImg","address"],InputType),
        PickType(Category,["categoryName"],InputType)
        )/* OmitType(Restaurant,["id"],InputType) */
        {
}

@ObjectType()
export class CreateRestaurantOutput extends CoreOutput{
    
}