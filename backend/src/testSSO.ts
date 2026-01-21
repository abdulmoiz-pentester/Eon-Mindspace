import { fromIni } from "@aws-sdk/credential-providers";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

async function testSSO() {
  const client = new STSClient({
    region: "us-west-1",
    credentials: fromIni({ profile: "bedrock-dev" }),
  });

  try {
    const response = await client.send(new GetCallerIdentityCommand({}));
    console.log("SSO profile works. Identity:", response);
  } catch (err) {
    console.error("Error with SSO profile:", err);
  }
}

testSSO();
