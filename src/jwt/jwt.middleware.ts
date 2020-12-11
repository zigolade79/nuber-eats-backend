import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { UsersService } from "src/users/users.service";
import { JwtService } from "./jwt.service";

@Injectable()
export class JwtMiddleware implements NestMiddleware {
    constructor (
        private readonly userService: UsersService,
        private readonly jwt: JwtService,
    ){}
    async use(req:Request, rew: Response, next:NextFunction){
        try{
            if("x-jwt" in req.headers){
                const token = req.headers['x-jwt'];
                const decoded = this.jwt.verify(token.toString());
                if(typeof decoded === "object" && decoded.hasOwnProperty("id")){
                    const {user} = await this.userService.getUserById(+decoded["id"]);
                    req['user'] = user;
                }
            }        
            next();
        }catch(e){
            
        }
    }
}