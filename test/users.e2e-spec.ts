import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getConnection, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { ok } from 'assert';
import { any } from 'joi';
import { Verify } from 'crypto';
import { Verification } from 'src/users/entities/verification.entity';

const GRAPHQL_ENDPOINT ="/graphql";
const testUser = {
  email: "user1@test.com",
  password: "12345"
}

jest.mock("got", ()=>{
  return {
    post:jest.fn(),
  }
})

describe('User Module (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;
  let userRepository : Repository<User>;
  let verificationRepository : Repository<Verification>;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    verificationRepository = module.get<Repository<Verification>>(getRepositoryToken(Verification));
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await getConnection().dropDatabase();
    app.close();
  })

  describe('createAccount',()=>{
    it("Should create account", async ()=>{
      return await request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).send({
        query: `
        mutation{
          createAccount(input:{
            email:"${testUser.email}",
            password:"${testUser.password}",
            role:Client
          }){
            ok
            error
          }
        }`
      }).expect(200)
      .expect(res=>{
        expect(res.body.data.createAccount.ok).toBe(true);
        expect(res.body.data.createAccount.error).toBe(null);
      });
    });
    it("Should fial if the account arleady exist", async ()=>{
      return await request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).send({
        query: `
        mutation{
          createAccount(input:{
            email:"${testUser.email}",
            password:"${testUser.password}",
            role:Client
          }){
            ok
            error
          }
        }`
      }).expect(200)
      .expect(res=>{
        expect(res.body.data.createAccount.ok).toBe(false);
        expect(res.body.data.createAccount.error).toEqual("There is a user with that email already");
      });
    });

  });
  describe('login', ()=>{
    it("Should login with correct cridential", async ()=>{
      return await request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).send({
        query: `
        mutation{
          login( input:{
            email:"${testUser.email}",
            password:"${testUser.password}", 
          }    
          ){
            ok
            error
            token
          }
        }`
      }).expect(200)
      .expect(res=>{
        expect(res.body.data.login.ok).toBe(true);
        expect(res.body.data.login.error).toBe(null);
        expect(res.body.data.login.token).toEqual(expect.any(String));
        jwtToken = res.body.data.login.token;
      });
    });
    it("Should not be able to login with wrong cridential", async ()=>{
      return await request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).send({
        query: `
        mutation{
          login( input:{
            email:"${testUser.email}",
            password:"543453535", 
          }    
          ){
            ok
            error
            token
          }
        }`
      }).expect(200)
      .expect(res=>{
        expect(res.body.data.login.ok).toBe(false);
        expect(res.body.data.login.error).toBe("Password is incorrect");
        expect(res.body.data.login.token).toBe(null);
      });
    });
  });
  
  describe('getUser', ()=>{
    let userId : number;
    beforeAll(async () =>  {
      const [user] = await userRepository.find();
      userId = user.id;
    });
    it("should return user", async ()=>{
      return await (await request(app.getHttpServer())
      .post(GRAPHQL_ENDPOINT)
      .set("X-JWT",jwtToken)
      .send(
        {query: `
          {
            getUser(userId: ${userId}){
              ok
              error
              user{
                id
              }
            }
          }`
        }).expect(200)
        .expect(res=>{
          const {
            body:{
              data:{
                getUser:{
                  ok,
                  error,
                  user:{id}
                },
              },
            },
           } = res;
           expect(ok).toBe(true);
           expect(error).toBe(null);
           expect(id).toBe(userId);
        })
      );
    })
    it("Should fail with wriong cridential", async ()=>{
      return await (await request(app.getHttpServer())
      .post(GRAPHQL_ENDPOINT)
      .set("X-JWT",jwtToken)
      .send(
        {query: `
          {
            getUser(userId: 444){
              ok
              error
              user{
                id
              }
            }
          }`
        }).expect(200)
        .expect(res=>{
          const {
            body:{
              data:{
                getUser:{
                  ok,
                  error,
                },
              },
            },
           } = res;
           expect(ok).toBe(false);
           expect(error).toEqual(expect.any(String));
        })
      );
    })  
  });

  describe('me', ()=>{
    it("Should find my profile when loged in", async ()=>{
      return await request(app.getHttpServer()).post(GRAPHQL_ENDPOINT)
      .set("X-JWT",jwtToken)
      .send({
        query:`
        {
          me {
            email
          }
        }`
      }).expect(200)
      .expect(res=>{
        const {body: {data: {me: {email}}}}=res;
        expect(email).toBe(testUser.email);
      });
    });
    it("Should don't allow logedout user", ()=>{
      return request(app.getHttpServer()).post(GRAPHQL_ENDPOINT)
      .send({
        query:`
        {
          me {
            email
          }
        }`
      }).expect(200)
      .expect(res=>{
        const{
          body:{ errors}
        }=res;
        const [error] = errors;
        expect(error.message).toBe('Forbidden resource');
      })
    });
  });
  
  
  describe('editProfile',()=>{
    it("Should change email", async ()=>{
      const newEmail = "user2@test.com";
      return await request(app.getHttpServer()).post(GRAPHQL_ENDPOINT)
      .set("X-JWT",jwtToken)
      .send({
        query:`
          mutation{
            editProfile(input:{
              email:"${newEmail}"
            }){
              ok
              error
            }
          }`
      }).expect(200)
      .expect(res=>{
        const{
          body:{
            data:{
              editProfile:{
                ok
              }
            }
          }
        } = res;
        expect(ok).toBe(true);
      })
    });
  });

  describe('verifyEmail', ()=>{
    let verificationCode : string;
    beforeAll(async () => {
      const [verification] = await verificationRepository.find();
      verificationCode = verification.code;
    })
    it("Should verify email", ()=>{
      return request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).send({
        query:`
          mutation{
            verifyEmail(input:{
              code:"${verificationCode}"
            }){
              ok
              error
            }
          }`
      }).expect(200)
      .expect(res=>{
        const {
          body:{
            data:{
              verifyEmail:{
                ok,
                error
              }
            }
          }
        } = res;
        expect(ok).toBe(true);
        expect(error).toBe(null);
      });
    });
    it("Should fail on long verification code", ()=>{
      return request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).send({
        query:`
          mutation{
            verifyEmail(input:{
              code:"gdgdfgdfgdf"
            }){
              ok
              error
            }
          }`
      }).expect(200)
      .expect(res=>{
        const {
          body:{
            data:{
              verifyEmail:{
                ok,
                error
              }
            }
          }
        } = res;
        expect(ok).toBe(false);
        expect(error).toEqual("Verification is failed");
      });
    });
  });
});
