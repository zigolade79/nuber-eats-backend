import { Injectable, Query } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { User } from "./entities/user.entity";
import { CreateAccountInput } from "./dtos/create-account.dto";
import { LoginInput } from "./dtos/login.dto";
import { JwtService } from "src/jwt/jwt.service";
import { EditProfileInput } from "./dtos/edit-profile.dto";
import { Verification } from "./entities/verification.entity";
import { MailService } from "src/mail/mail.service";

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private readonly usersRepository: Repository<User>,
        @InjectRepository(Verification)
        private readonly verifyRepository: Repository<Verification>,
        private readonly jwtService : JwtService,
        private readonly mailService : MailService,
    ) { }

    async createAccount({ email, password, role }: CreateAccountInput) :Promise<{ok:boolean,error?:string}> {
        try {
            //check new
            const exist = await this.usersRepository.findOne({email});            
            if (exist) {                
                return {
                    ok:false,
                    error:"There is a user with that email already"};
            }
            const user  = await this.usersRepository.save(this.usersRepository.create({ email, password, role }));
            const verification = await this.verifyRepository.save(this.verifyRepository.create({user}));
            this.mailService.sendVerificationEmail(user.email,verification.code);
            return {
                ok:true,                
            }
        } catch (e) {
            return {
                ok:false,
                error: "Could not create account"
            }
        }
    }

    async login({email, password}:LoginInput) :Promise<{ok:boolean,error?:string,token?:string}>{
        try{
            const user = await this.usersRepository.findOne({email},{select:["id","password"]});
            if(!user){
                return {
                    ok: false,
                    error:"User not found"
                }
            }
            const checkPassword = await user.checkPassword(password);
            if(!checkPassword){
                return {
                    ok: false,
                    error:"Password is incorrect"
                }
            }
            const token = this.jwtService.sign(user.id);
            return {
                ok: true,
                token,
            }
        }catch(error){
            return{
                ok:false,
                error
            }

        }
    }

    async getUserById(id :number) :Promise<{ok:boolean,error?:string,user?:User}> {        
        try{
            const user = await this.usersRepository.findOne({id});
            if(!user){
                throw Error();
            }
            return{
                ok:true,
                user,                
            }
        }catch(e){
            return{
                ok:false,
                error:"User Not Found",
            }                
        }      
    }

    async editProfile(userId:number, {email, password}:EditProfileInput):Promise<{ok:boolean,error?:string,user?:User}>  {
        try{
            const user = await this.usersRepository.findOne(userId);
            if(email){
                user.email = email;
                user.isVerified = false;
                const verification = await this.verifyRepository.save(this.verifyRepository.create({user}));
                this.mailService.sendVerificationEmail(user.email,verification.code);
            }
            if(password){
                user.password = password;
            }
            if(await this.usersRepository.save(user)){
                return {
                    ok:true,
                }
            }
            throw Error();
        }catch(error){
            return {
                ok:false,
                error
            }
        }
        
    } 

    async verifyEmail(code:string) :Promise<{ok:boolean,error?:string}>{
        try{
            const verification = await this.verifyRepository.findOne({code},{relations:["user"]});
            if(verification){
                await this.usersRepository.update(verification.user.id,{isVerified:true});
                await this.verifyRepository.delete(verification.id);
                return {
                    ok:true
                };
            }else{
                return {
                    ok:false,
                }
            }
        }catch(error){
            return{
                ok:false,
                error
            }
        } 
    }

}