import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { string } from "joi";
import { JwtService } from "src/jwt/jwt.service";
import { MailService } from "src/mail/mail.service";
import { Repository } from "typeorm";
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
    sign: jest.fn(),
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

    beforeAll(async () => {
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
    });

    it.todo('createAccount');
    it.todo('login');
    it.todo('getUserById');
    it.todo('editProfile');
    it.todo('verifyEmail');
})