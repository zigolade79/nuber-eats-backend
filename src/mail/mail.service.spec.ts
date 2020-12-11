import { Test } from "@nestjs/testing";
import { CONFIG_OPTIONS } from "src/common/common.constants";
import { MailService } from "./mail.service";
import * as FormData from "form-data"
import got from "got/dist/source";

const TEST_API_KEY =  "dummy";
const TEST_DOMAIN = "dummy.domain.com";
const TEST_FROM_EMAIL = "from@email.com"
const TEST_TO_EMAIL = "to@email.com"
const TEST_VERIFY_CODE ="code"
const sendVerificationEmailArgs = {
    email:TEST_TO_EMAIL,
    code:TEST_VERIFY_CODE
}
jest.mock("got");
jest.mock("form-data");

describe("MailServive", ()=>{
    let service: MailService;
    beforeEach( async () => {
        const module = await Test.createTestingModule({
            providers:[MailService,{
                provide:CONFIG_OPTIONS,
                useValue:{
                    apiKey : TEST_API_KEY,
                    domain: TEST_DOMAIN,
                    fromEmail: TEST_FROM_EMAIL,
                }
            }]
        }).compile();
        service = (await module).get<MailService>(MailService);
    });
    it("should be defined", ()=>{
        expect(service).toBeDefined();
    });

    describe("sendEmail",  ()=>{
        it("send email", async ()=>{
            await service.sendEmail("","","",[]);
            const formSpy = jest.spyOn(FormData.prototype, "append");
            expect(formSpy).toBeCalled();
            expect(got).toBeCalledTimes(1);
            expect(got).toBeCalledWith(`https://api.mailgun.net/v3/${TEST_DOMAIN}/messages`,expect.any(Object));
        });

    });

    describe("sendVerificationEmail", ()=>{
        it("Should call sendemail", async ()=>{
            const sendEmailSpy = jest.spyOn(Object.getPrototypeOf(service), "sendEmail").mockImplementation(async () => {});
            await service.sendVerificationEmail(sendVerificationEmailArgs.email,sendVerificationEmailArgs.code);
            expect(sendEmailSpy).toBeCalledTimes(1);
            expect(sendEmailSpy).toBeCalledWith(
                "Verify your Email!",
                "confirm_account",
                sendVerificationEmailArgs.email,
                [{key:"code", value:sendVerificationEmailArgs.code}, {key:"username",value:sendVerificationEmailArgs.email}]);
        });

    });
    
});