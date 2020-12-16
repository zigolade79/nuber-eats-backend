import { Module, Response } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Restaurant } from './entities/restaurant.entity';
import { CategoryRepository } from './repositories/category.repository';
import { RestaurantService } from './restaurant.service';
import { CategoryResolver, RestaurantResolver } from './restaurants.resolver';

@Module({
    imports:[TypeOrmModule.forFeature([Restaurant, CategoryRepository])],
    providers:[RestaurantResolver, RestaurantService, CategoryResolver]
})
export class RestaurantsModule {
  
}
