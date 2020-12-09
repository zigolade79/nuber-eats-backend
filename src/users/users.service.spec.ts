import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { number } from "joi";
import { JwtService } from "src/jwt/jwt.service";
import { MailService } from "src/mail/mail.service";
import { Repository } from "typeorm";
import { EditProfileInput } from "./dtos/edit-profile.dto";
import { User } from "./entities/user.entity";
import { Verification } from "./entities/verification.entity";
import { UsersService } from "./users.service";


const mockRepository = () => ({
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
})

const mockJwtService = {
    sign: jest.fn(()=>"Signed-token-baby"),
    verify: jest.fn(),
}

const mockMailService = {
    sendVerificationEmail: jest.fn()
}

type MockReRepository<T = any> = Partial<Record < keyof Repository<T>, jest.Mock>>
describe("UserService", ()=>{
    let service: UsersService;
    let userRepository: MockReRepository<User>;
    let verificationRepository: MockReRepository<Verification>;
    let mailService: MailService;
    let jwtService: JwtService;

    beforeEach(async () => {
        const modules = await Test.createTestingModule({
            providers:[
                UsersService, 
                {
                    provide: getRepositoryToken(User),
                    useValue: mockRepository(),
                },
                {
                    provide: getRepositoryToken(Verification),
                    useValue: mockRepository(),
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
                {
                    provide: MailService,
                    useValue: mockMailService,
                },
        ],
        }).compile();
        service = (await modules).get<UsersService>(UsersService);
        userRepository = modules.get(getRepositoryToken(User));
        verificationRepository = modules.get(getRepositoryToken(Verification));
        mailService = modules.get<MailService>(MailService);
        jwtService = modules.get<JwtService>(JwtService);
    })

    it("should be defined", ()=>{
        expect(service).toBeDefined();
    });

    describe("Create Account", ()=>{
        const createAccountArgs = {
            email: "retwe",
            password: "erwtret",
            role:0,
        }
        it("Should fail if user exist", async ()=>{
            userRepository.findOne.mockResolvedValue({
                id:1,
                email: 'fdsfdsfdsafs',                
            });
            const result = await service.createAccount(createAccountArgs);
            expect(result).toMatchObject({
                ok:false,
                error:"There is a user with that email already"
            });
        })
        
        it("Should create a new user", async ()=>{
            userRepository.findOne.mockResolvedValue(undefined);
            userRepository.create.mockReturnValue(createAccountArgs);
            userRepository.save.mockReturnValue(createAccountArgs);
            verificationRepository.create.mockReturnValue({
                user:createAccountArgs,
                code:"temp"
            });
            verificationRepository.save.mockResolvedValue({
                user:createAccountArgs,
                code:"temp"
            });
            const result = await service.createAccount(createAccountArgs);
            expect(userRepository.create).toHaveBeenCalledTimes(1);
            expect(userRepository.create).toHaveBeenCalledWith(createAccountArgs);
            expect(userRepository.save).toHaveBeenCalledTimes(1);
            expect(userRepository.save).toHaveBeenCalledWith(createAccountArgs);
            expect(verificationRepository.create).toHaveBeenCalledTimes(1);
            expect(verificationRepository.create).toHaveBeenCalledWith({
                user:createAccountArgs,
            });
            expect(verificationRepository.save).toHaveBeenCalledTimes(1);
            expect(verificationRepository.save).toHaveBeenCalledWith({
                user:createAccountArgs,
                code:"temp"
            });
            expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
            expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(expect.any(String),expect.any(String));
            expect(result).toEqual({ok:true});
        })
        
        it("Should fail on exception", async ()=>{
            userRepository.findOne.mockRejectedValue(new Error("error"));
            const result = await service.createAccount(createAccountArgs);
            expect(result).toEqual({
                ok:false,
                error: "Could not create account"
            });
          
        });
    });

    describe('login', ()=>{
        const loginArgs = {
            email: "retwe",
            password: "erwtret",
        }
        it("Should fail if user does not exist", async ()=>{
            userRepository.findOne.mockResolvedValue(undefined);
            const result = await service.login(loginArgs);
            expect(userRepository.findOne).toHaveBeenCalledTimes(1);
            expect(userRepository.findOne).toHaveBeenCalledWith(expect.any(Object),expect.any(Object));
            expect(result).toEqual({
                ok: false,
                error:"User not found"
            });
        });
        it("Should fail if the password is wrong", async ()=>{
            const mockedUser ={
                id:1,
                checkPassword: jest.fn(()=>Promise.resolve(false)),
            };
            userRepository.findOne.mockResolvedValue(mockedUser);
            const result = await service.login(loginArgs);
            expect(result).toEqual( {
                ok: false,
                error:"Password is incorrect"
            });
        });
        it("Should return token if the password is correct", async ()=>{
            const mockedUser ={
                id:1,
                checkPassword: jest.fn(()=>Promise.resolve(true)),
            };
            userRepository.findOne.mockResolvedValue(mockedUser);
            const result = await service.login(loginArgs);            
            expect(jwtService.sign).toHaveBeenCalledTimes(1);
            expect(jwtService.sign).toHaveBeenCalledWith(expect.any(Number));
            expect(result).toEqual({
                ok: true,
                token:"Signed-token-baby",
            });
        });
        it("Should fail on exception", async ()=>{
            userRepository.findOne.mockRejectedValue("error123");
            const result = await service.login(loginArgs); 
            expect(result).toEqual({
                ok:false,
                error: "error123",
            });
        });
    });
    describe('getUserById', ()=>{
        it("Should fail if user does not exist", async ()=>{
            userRepository.findOne.mockResolvedValue(undefined);
            const result = await service.getUserById(1);
            expect(result).toEqual({
                ok:false,
                error:"User Not Found",
            });
        });
        it("Should return existing user", async ()=>{
            userRepository.findOne.mockResolvedValue({
                id:1,
                email: 'fdsfdsfdsafs',                
            });
            const result = await service.getUserById(1);
            expect(result).toEqual({
                ok:true,
                user:{
                    id:1,
                    email: 'fdsfdsfdsafs',
                },                
            });
        });
    });
    describe('editProfile', ()=>{
        it("Should change Email", async ()=>{
            const oldUser = {
                email:"bs@old.com",
                isVerified:true,
            };
            const newUser = {
                email:"bs@new.com",
                isVerified:false,
            };
            const editProfileArgs = {
                userId : 1,
                input: {email:"bs@new.com",
               }
            };
            const newVarification = {
                code:"code"
            }
            userRepository.findOne.mockResolvedValue(oldUser);//using when return promise
            verificationRepository.create.mockReturnValue(newVarification);//using when return no promise
            verificationRepository.save.mockResolvedValue(newVarification);

            const result = await service.editProfile(editProfileArgs.userId,editProfileArgs.input);

            expect(jwtService.sign).toHaveBeenCalledTimes(1);
            expect(userRepository.findOne).toHaveBeenCalledWith(editProfileArgs.userId);
            expect(verificationRepository.create).toHaveBeenCalledWith({user:newUser});
            expect(verificationRepository.save).toHaveBeenCalledWith(newVarification);

            expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
            expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(editProfileArgs.input.email,newVarification.code);
            console.log(result);
        });
    });
    it.todo('verifyEmail');
})