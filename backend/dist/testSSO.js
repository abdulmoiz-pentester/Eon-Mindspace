"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const credential_providers_1 = require("@aws-sdk/credential-providers");
const client_sts_1 = require("@aws-sdk/client-sts");
async function testSSO() {
    const client = new client_sts_1.STSClient({
        region: "us-west-1",
        credentials: (0, credential_providers_1.fromIni)({ profile: "bedrock-dev" }),
    });
    try {
        const response = await client.send(new client_sts_1.GetCallerIdentityCommand({}));
        console.log("SSO profile works. Identity:", response);
    }
    catch (err) {
        console.error("Error with SSO profile:", err);
    }
}
testSSO();
