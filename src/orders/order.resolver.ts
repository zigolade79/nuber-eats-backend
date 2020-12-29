import { Args, Mutation, Resolver, Query } from "@nestjs/graphql";
import { AuthUser } from "src/auth/auth-user.decorator";
import { Role } from "src/auth/role.decorator";
import { User } from "src/users/entities/user.entity";
import { CreateOrderInput, CreateOrderOutput } from "./dtos/create-order.dto";
import { EditOrderInput, EditOrderOutput } from "./dtos/edit-order.dto";
import { GetOrderOutput,  GetOrderInput} from "./dtos/get-order.dto";
import { GetOrdersOutput, GetOrdersInput } from "./dtos/get-orders.dto";
import { Order } from "./entities/order.entity";
import { OrderService } from "./order.service";


@Resolver(of => Order)
export class OrderResolver{
    constructor( private readonly orderService:OrderService){}

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


}