import { ArgsType, Field, InputType, Int, IntersectionType, ObjectType, OmitType, PartialType, PickType } from "@nestjs/graphql";
import { CoreOutput } from "src/common/dtos/output.dto";
import { Dish } from "../entities/dish.entity";


@InputType()
export class CreateDishInput extends PickType(Dish,["dishName", "price", "description", "options"]){
    @Field(type=>Int)
    restaurantId:number;
}

@ObjectType()
export class CreateDishOutput extends CoreOutput{
    
}