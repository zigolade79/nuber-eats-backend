import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Restaurant } from "src/restaurants/entities/restaurant.entity";
import { User } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import { CreateOrderInput, CreateOrderOutput } from "./dtos/create-order.dto";
import { Order } from "./entities/order.entity";


@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(Restaurant)
        private readonly restaurantRepository: Repository<Restaurant>,
    ){}

    async createOrder(customer:User, {restaurantId,items}:CreateOrderInput) :Promise<CreateOrderOutput>{
        try{
            const restaurant = await this.restaurantRepository.findOne(restaurantId);
            if(!restaurant){
                return{
                    ok:false,
                    error:'Restaurant not found'
                }
            }
            const order = await this.orderRepository.save(this.orderRepository.create({
                customer,
                restaurant,
                ...items,
            }));
            console.log(order);
            return{
                ok:true
            }
        }catch(error){
            console.log(error)
        }
    }
}