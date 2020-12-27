import { Field, InputType, Int, ObjectType, PartialType, PickType } from "@nestjs/graphql";
import { extend } from "joi";
import { CoreOutput } from "src/common/dtos/output.dto";
import { Dish } from "../entities/dish.entity";


@InputType()
export class EditDishInput extends PickType(PartialType(Dish),['dishName','options','price','description']){
    @Field(type => Int)
    dishId:number;
}

@ObjectType()
export class  EditDishOutput extends CoreOutput{

}