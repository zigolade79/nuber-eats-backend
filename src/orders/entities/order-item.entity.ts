import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";
import { CoreEntity } from "src/common/entities/core.entity";
import { Dish,  DishChoice } from "src/restaurants/entities/dish.entity";
import { Column, Entity, ManyToOne } from "typeorm";


@InputType('OrderItemOptionInput',{isAbstract:true})
@ObjectType()
export class OrderItemOption {
    @Field(type => String)
    name:string;

    @Field(type => DishChoice, {nullable:true})
    choice?:DishChoice;

    @Field(type => Int,{nullable:true})
    extra?:number;
}


@InputType("OrderItemInputType",{isAbstract:true})
@ObjectType()
@Entity()
export class OrderItem extends CoreEntity{

    @Field(type=>Dish,{nullable:true})
    @ManyToOne(type => Dish, {nullable:true, onDelete:'CASCADE'})
    dish:Dish;

    @Field(type=>[OrderItemOption],{nullable:true})
    @Column({type:"json", nullable:true})
    options?:OrderItemOption[];

}
