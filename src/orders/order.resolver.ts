import { Inject } from "@nestjs/common";
import { Args, Mutation, Resolver, Query, Subscription } from "@nestjs/graphql";
import { PubSub } from "graphql-subscriptions";
import { AuthUser } from "src/auth/auth-user.decorator";
import { Role } from "src/auth/role.decorator";
import { NEW_COOKED_ORDER, NEW_PENDING_ORDER, PUB_SUB, NEW_ORDER_UPDATE} from "src/common/common.constants";
import { User, UserRole } from "src/users/entities/user.entity";
import { CreateOrderInput, CreateOrderOutput } from "./dtos/create-order.dto";
import { EditOrderInput, EditOrderOutput } from "./dtos/edit-order.dto";
import { GetOrderOutput,  GetOrderInput} from "./dtos/get-order.dto";
import { GetOrdersOutput, GetOrdersInput } from "./dtos/get-orders.dto";
import { OrderUpdtateInput } from "./dtos/order-updates.dto";
import { TakeOrderOutput, TakeOrderInput } from "./dtos/take-order.dto";
import { Order, OrderStatus } from "./entities/order.entity";
import { OrderService } from "./order.service";


@Resolver(of => Order)
export class OrderResolver{
    constructor( private readonly orderService:OrderService,
        @Inject(PUB_SUB) private readonly pubSub: PubSub){}

    @Mutation(returns => CreateOrderOutput)
    @Role(['Client'])
    createOrder(@AuthUser() customer:User, @Args('input') createOrderInput:CreateOrderInput) : Promise<CreateOrderOutput>{
        return this.orderService.createOrder(customer, createOrderInput);

    }

    @Mutation(returns => EditOrderOutput)
    @Role(['Any'])
    editOrder(@AuthUser() user:User, @Args('input') editOrderInput:EditOrderInput) : Promise<EditOrderOutput>{
        return this.orderService.editOrder(user, editOrderInput);

    }

    @Query(returns => GetOrdersOutput)
    @Role(['Any'])
    getOrders(@AuthUser() user:User, @Args('input') getOrdersInput:GetOrdersInput) :Promise<GetOrdersOutput>{
        return this.orderService.getOrders(user, getOrdersInput);
    }

    @Query(returns => GetOrderOutput)
    @Role(['Any'])
    getOrder(@AuthUser() user:User, @Args('input') getOrderInput:GetOrderInput) :Promise<GetOrderOutput>{
        return this.orderService.getOrder(user, getOrderInput);
    }

    @Subscription(returns => Order,
        {filter:(payload, _, context) =>{
            return payload.pendingOrders.ownerId === context.user.id;
        },resolve:({pendingOrders:{order}}) => order
    })
    @Role(['Owner'])
    pendingOrders(){
        return this.pubSub.asyncIterator(NEW_PENDING_ORDER);
    }

    @Subscription(returns => Order)
    @Role(['Delivery'])
    cookedOrders(){
        return this.pubSub.asyncIterator(NEW_COOKED_ORDER);
    }

    @Subscription(returns => Order,
        {filter:( {orderUpdates:order}:{orderUpdates:Order},
             {input}:{input:OrderUpdtateInput},
             {user}:{user:User}) =>{
                 if(order.customerId !== user.id && order.restaurant.ownerId !== user.id  && order.driverId !== user.id){
                     return false;
                 }
            return order.id === input.id;
        }
    })
    @Role(['Any'])
    orderUpdates(@Args('input') orderUpdateInput:OrderUpdtateInput){
        return this.pubSub.asyncIterator(NEW_ORDER_UPDATE);
    }

    @Mutation(returns =>TakeOrderOutput)
    @Role(['Delivery'])
    takeOrder(@AuthUser() user:User, @Args('input') takeOrderInput:TakeOrderInput) :Promise<TakeOrderOutput>{
        return this.orderService.takeOrder(user, takeOrderInput);
    }



}