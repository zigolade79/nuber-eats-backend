import { Field, ObjectType } from "@nestjs/graphql";
import { IsBoolean, IsOptional, IsString, Length } from "class-validator";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
@ObjectType()
export class Restaurant{
    @Field(type => Number)
    @PrimaryGeneratedColumn()
    id: number;

    @Field(type => String)
    @Column()
    @IsString()
    @Length(5)
    name:String;
    
    @Field(type => Boolean, {defaultValue: true})
    @Column({default:true})
    @IsBoolean()
    @IsOptional()
    isVegan:Boolean;

    @Field(type => String)
    @Column()
    @IsString()
    address:String;

    @Field(type => String)
    @Column()
    @IsString()
    ownerName:String;

    @Field(type => String)
    @Column()
    @IsString()
    category:String;
}