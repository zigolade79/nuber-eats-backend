import { Injectable } from "@nestjs/common";
import { Cron, Interval, SchedulerRegistry } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Restaurant } from "src/restaurants/entities/restaurant.entity";
import { User } from "src/users/entities/user.entity";
import { LessThan, Repository } from "typeorm";
import { CreatePaymentInput, CreatePaymentOutput } from "./dtos/create-payment.dto";
import { GetPaymentOutput } from "./dtos/get-payment.dto";
import { Payment } from "./entities/payment.entity";


@Injectable()
export class PaymentService{
    constructor(
        @InjectRepository(Payment)
        private readonly paymentRepository: Repository<Payment>,
        @InjectRepository(Restaurant)
        private readonly restaurantRepository: Repository<Restaurant>,
        private schedulerRegistry: SchedulerRegistry,
    ){}

    async createPayment(owner:User, {transactionId, restaurantId}:CreatePaymentInput) : Promise<CreatePaymentOutput>{
        try{
            const restaurant = await this.restaurantRepository.findOne(restaurantId);
            if(!restaurant){
                return{
                    ok:false,
                    error:"Restaurant not found",
                }   
            }
            if(restaurant.ownerId !== owner.id){
                return{
                    ok:false,
                    error:"You are not allowed to do this",
                }  
            }
            restaurant.isPromoted = true;
            const date = new Date();
            date.setDate(date.getDate()+7);
            restaurant.promotedUntil = date;
            this.restaurantRepository.save(restaurant);
            await this.paymentRepository.save(this.paymentRepository.create({
                transactionId, user: owner, restaurant
            }));
            return{
                ok:true
            }

        }catch(error){
            console.log(error);
            return{
                ok:false,
                error:"Cannot create payment",
            }     
        }

    }

    async getPayments(owner:User) : Promise<GetPaymentOutput>{
        try{
            const payments = await this.paymentRepository.find({user:owner});
            if(!payments){
                return{
                    ok:false,
                    error:"Payments not found",
                }   
            }
            return{
                ok:true,
                payments,
            }
        }catch(error){
            console.log(error);
            return{
                ok:false,
                error:"Cannot create payment",
            }     
        }

    }

    @Interval(10000)
    async checkPromote(){
        const restaurants = await this.restaurantRepository.find({isPromoted:true, promotedUntil:LessThan(new Date())});
        restaurants.forEach(async restaurant =>{
            restaurant.isPromoted= false;
            restaurant.promotedUntil = null;
            await this.restaurantRepository.save(restaurant);
        });
    }

}