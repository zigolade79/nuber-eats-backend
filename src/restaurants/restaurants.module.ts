import { Module, Response } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurant.service';
import { RestaurantResolver } from './restaurants.resolver';

@Module({
    imports:[TypeOrmModule.forFeature([Restaurant, Category])],
    providers:[RestaurantResolver, RestaurantService]
})
export class RestaurantsModule {
  
}
