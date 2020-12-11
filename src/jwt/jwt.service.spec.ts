import { Test } from "@nestjs/testing";
import { CONFIG_OPTIONS } from "src/common/common.constants";
import { JwtService } from "./jwt.service";
import * as jwt from "jsonwebtoken"


const TEST_KEY = "testkey";
const USER_ID = 1

jest.mock("jsonwebtoken", ()=>{
    return{
        sign: jest.fn(()=>"signed toekn"),
        verify: jest.fn(()=>({id:USER_ID,}))
    }
});

describe("JwtServive", ()=>{
    let service: JwtService;
    beforeEach( async () => {
        const module = await Test.createTestingModule({
            providers:[JwtService,{
                provide:CONFIG_OPTIONS,
                useValue:{privateKey: TEST_KEY}
            }]
        }).compile();
        service = (await module).get<JwtService>(JwtService);
    });

    it("should be defined", ()=>{
        expect(service).toBeDefined();
    });
    describe("sign", ()=>{
        it("Should return signed token", ()=>{
            const token = service.sign(USER_ID);
            expect(typeof token).toBe('string');
            expect(jwt.sign).toBeCalledTimes(1);
            expect(jwt.sign).toBeCalledWith({id:USER_ID},TEST_KEY);
        });
    });

    describe("verify", ()=>{
        it("Should return decoded token", ()=>{
            const decodedtoken = service.verify("alalalal");
            expect(jwt.verify).toBeCalledTimes(1);
            expect(jwt.verify).toBeCalledWith("alalalal",TEST_KEY);
            expect(decodedtoken).toEqual({id:USER_ID,});
        });
    });


});