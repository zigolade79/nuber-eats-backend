import { ArgsType, Field, InputType, IntersectionType, OmitType, PartialType, PickType } from "@nestjs/graphql";
import { IsBoolean, IsString, Length } from "class-validator";
import { Category } from "../entities/category.entity";
import { Restaurant } from "../entities/restaurant.entity";


@InputType()
export class CreateRestaurantDto extends 
    IntersectionType(
        PickType(Restaurant,["restaurantName","coverImg","address"],InputType),
        PickType(Category,["categoryName"],InputType)
        )/* OmitType(Restaurant,["id"],InputType) */
        {
   
}
