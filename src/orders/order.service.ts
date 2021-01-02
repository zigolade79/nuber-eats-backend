import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PubSub } from "graphql-subscriptions";
import { NEW_COOKED_ORDER, NEW_ORDER_UPDATE, NEW_PENDING_ORDER, PUB_SUB } from "src/common/common.constants";
import { Dish } from "src/restaurants/entities/dish.entity";
import { Restaurant } from "src/restaurants/entities/restaurant.entity";
import { User, UserRole } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import { CreateOrderInput, CreateOrderOutput } from "./dtos/create-order.dto";
import { EditOrderInput, EditOrderOutput } from "./dtos/edit-order.dto";
import { GetOrderInput, GetOrderOutput } from "./dtos/get-order.dto";
import { GetOrdersOutput, GetOrdersInput } from "./dtos/get-orders.dto";
import { TakeOrderInput, TakeOrderOutput } from "./dtos/take-order.dto";
import { OrderItem } from "./entities/order-item.entity";
import { Order, OrderStatus } from "./entities/order.entity";


@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(OrderItem)
        private readonly orderItemRepository: Repository<OrderItem>,
        @InjectRepository(Restaurant)
        private readonly restaurantRepository: Repository<Restaurant>,
        @InjectRepository(Dish)
        private readonly dishRepository: Repository<Dish>,
        @Inject(PUB_SUB) private readonly pubSub: PubSub,
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
            let totalOrderPrice = 0;
            const orderItems : OrderItem[] =[];
            for( const item of items){
                const dish = await this.dishRepository.findOne(item.dishId);
                if(!dish){
                    return{
                        ok:false,
                        error:'Dish not found'
                    }
                }
                
                let totalDishPrice = dish.price;
                if(item.options){
                    for(const itemOption of item.options){
                        const dishOption = dish.options.find(dishOption => dishOption.name === itemOption.name);
                        if(dishOption){
                            if(dishOption.extra){
                                totalDishPrice = totalDishPrice + dishOption.extra;
                            }else{
                                const dishOptionChoice = dishOption.choices.find(choice => choice.name === itemOption.choice);
                                if(dishOptionChoice){
                                    totalDishPrice = totalDishPrice + dishOptionChoice.extra;
                                }
                            }
                        }
                    }
                }
                const orderItem = await this.orderItemRepository.save(this.orderItemRepository.create({
                    dish,
                    options: item.options}));
                orderItems.push(orderItem);
                totalOrderPrice = totalOrderPrice + totalDishPrice;
            };
            const order = await this.orderRepository.save(this.orderRepository.create({
                customer,
                restaurant,
                total:totalOrderPrice,
                orderItems,
            }));
            await this.pubSub.publish(NEW_PENDING_ORDER, {pendingOrders: {order, ownerId:restaurant.ownerId}} );
            return{
                ok:true
            }
        }catch(error){
            console.log(error)
            return{
                ok:false,
                error:"Could not create order"
            }
            
        }
    }

    async getOrders(user:User, {status}:GetOrdersInput) : Promise<GetOrdersOutput>{
        let orders : Order[];
        try{
            if(user.role === UserRole.Client){
                orders = await this.orderRepository.find({where:{customer:user, ...status&&{status}}});
                console.log(orders);
            }else if(user.role === UserRole.Delivery){
                orders = await this.orderRepository.find({where:{driver:user, ...status&&{status}}});
            }else if(user.role === UserRole.Owner){
                const restaurants = await this.restaurantRepository.find({where:{owner:user},relations:['orders']});
                orders = restaurants.map(restaurant => restaurant.orders).flat(1);
                if(status){
                    orders = orders.filter(order => order.status === status);
                }
            }
            return{
                ok:true,
                orders,
            }
            
        }catch(error){
            console.log(error);
            return{
                ok:false,
                error:"Order not found",
            }
        }
    }

    canSeeOrder(user:User, order:Order):boolean{
        let canSee = true;
        if(user.role === UserRole.Client && user.id !== order.customerId){
            canSee = false;
        }
        if(user.role === UserRole.Delivery && user.id !== order.driverId){
            canSee = false;
        }
        if(user.role === UserRole.Owner && user.id !== order.restaurant.ownerId){
            canSee = false;
        }
        return canSee;
    }

    async getOrder(user:User, {id}:GetOrderInput) : Promise<GetOrderOutput>{
        
        try{
            const order = await this.orderRepository.findOne(id, {relations:["restaurant"]});
            if(!order){
                return{
                    ok:false,
                    error:"Order not found",
                }
            }
            if(!this.canSeeOrder(user,order)){
                return{
                    ok:false,
                    error:"You cannot see the order",
                }
            }
            return{
                ok:true,
                order
            }
            
        }catch(error){
            console.log(error);
            return{
                ok:false,
                error:"Order not found",
            }
        }
    }

    async editOrder(user:User, {id, status}:EditOrderInput) : Promise<EditOrderOutput>{
        
        try{
            const order = await this.orderRepository.findOne(id);
            if(!order){
                return{
                    ok:false,
                    error:"Order not found",
                }
            }
            if(!this.canSeeOrder(user,order)){
                return{
                    ok:false,
                    error:"You cannot edit  the order",
                }
            }
            let canEditOrder = true;
            if(user.role === UserRole.Client) canEditOrder = false;
            if(user.role === UserRole.Owner){
                if(status !== OrderStatus.Cooked && status !== OrderStatus.Cooking){
                    canEditOrder = false;
                }
            }
            if(user.role === UserRole.Delivery){
                if(status !== OrderStatus.PickedeUp && status !== OrderStatus.Delivered){
                    canEditOrder = false;
                }
            }
            if(!canEditOrder){
                return{
                    ok:false,
                    error:"You cannot edit  the order",
                }
            }
            await this.orderRepository.save([{id,status}]);
            const newOrder = {...order,status};

            if(user.role === UserRole.Owner){
                if(status === OrderStatus.Cooked){
                    await this.pubSub.publish(NEW_COOKED_ORDER, {cookedOrders: newOrder});
                }
            }
            await this.pubSub.publish(NEW_ORDER_UPDATE, {orderUpdates: newOrder});
            return{
                ok:true,
            }
        }catch(error){
            console.log(error);
            return{
                ok:false,
                error:"Order not found",
            }
        }
    }

    async takeOrder(driver:User, {id}:TakeOrderInput) :Promise<TakeOrderOutput>{
        try{
            const order = await this.orderRepository.findOne(id);
            if(!order){
                return{
                    ok:false,
                    error:"Order not found",
                }
            }
            if(order.driver){
                return{
                    ok:false,
                    error:"This order alread has a driver",
                }
            }
            await this.orderRepository.save({id, status: OrderStatus.PickedeUp,driver});
            await this.pubSub.publish(NEW_ORDER_UPDATE,{orderUpdates:{...order, driver, status: OrderStatus.PickedeUp}});
            return{
                ok:true,
            }
        }catch(error){
            console.log(error);
            return{
                ok:false,
                error:"Order not found",
            }
        }
    }
       
}