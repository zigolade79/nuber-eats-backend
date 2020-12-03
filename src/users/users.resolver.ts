import { Query, Resolver, Mutation, Args, Context } from "@nestjs/graphql";
import { User } from "./entities/user.entity";
import { UsersService } from "./users.service";
import { CreateAccountOutput, CreateAccountInput } from "./dtos/create-account.dto";
import { LoginOutput, LoginInput } from "./dtos/login.dto";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "src/auth/auth.guard";
import { AuthUser } from "src/auth/auth-user.decorator";
import { UserProfileInput, UserProfileOutput } from "./dtos/user-profile.dto";
import { EditProfileInput, EditProfileOutput } from "./dtos/edit-profile.dto";
import { VerifyEmailInput, VerifyEmailOutput } from "./dtos/verify-email.dto";

@Resolver(of => User)
export class UsersResolver {
    constructor(
        private readonly usersService: UsersService
    ) { }

 
    @Query(returns=>User)
    @UseGuards(AuthGuard)
    me( @AuthUser() authUser:User ) {
        return authUser;       
    }

    @Mutation(returns => CreateAccountOutput)
    async createAccount(
        @Args("input") createAccountInput: CreateAccountInput
        ):Promise<CreateAccountOutput> {
        return  this.usersService.createAccount(createAccountInput);        
    }

    @Mutation(returns => LoginOutput)
    async login(
        @Args('input') loginInput: LoginInput
        ):Promise<LoginOutput>{
        return this.usersService.login(loginInput);          
    }

    @UseGuards(AuthGuard)
    @Query(returns => UserProfileOutput)
    async getUser(
        @Args() userProfileInput:UserProfileInput
        ) :Promise<UserProfileOutput>{
            return await this.usersService.getUserById(userProfileInput.userId);
    }

    @UseGuards(AuthGuard)
    @Mutation(returns => EditProfileOutput)
    async editProfile(
        @AuthUser() authUser:User, @Args("input") editProfileInput :EditProfileInput
        ) :Promise<EditProfileOutput>{
            return this.usersService.editProfile(authUser.id, editProfileInput)       
    }
    
    @Mutation(returns => VerifyEmailOutput)
    async verifyEmail(
        @Args("input") verifyEmailInput: VerifyEmailInput
        ):Promise<VerifyEmailOutput>{
            return this.usersService.verifyEmail(verifyEmailInput.code);       
    }

}