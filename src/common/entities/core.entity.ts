import { CreateDateColumn, PrimaryGeneratedColumn } from "typeorm";
import { Field, ObjectType } from "@nestjs/graphql";
@ObjectType()
export class CoreEntity {

    @Field(type => Number)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(type => Date)
    @CreateDateColumn()
    createdAt: Date;

    @Field(type => Date)
    @CreateDateColumn()
    updatedAt: Date;


}