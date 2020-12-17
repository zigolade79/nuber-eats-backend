import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { type } from "os";
import { PaginationInput, PaginationOutput } from "src/common/dtos/pagination.dto";
import { Restaurant } from "../entities/restaurant.entity";


@InputType()
export class SearchRestaurantInput extends PaginationInput{
    @Field(type => String)
    qeury: string;
}

@ObjectType()
export class SearchResturantOutput extends PaginationOutput{
    @Field(type => [Restaurant], {nullable:true})
    restaurants?:Restaurant[];
}
