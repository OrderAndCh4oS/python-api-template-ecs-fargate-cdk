import {PutParameterCommand, SSMClient} from "@aws-sdk/client-ssm";

import {config} from "dotenv";
config({path: '../.env'})

const ssmClient = new SSMClient({ region: 'eu-west-1' }); // Replace 'us-east-1' with your desired AWS region

const parameters = [
    {
        Name: '/api/certificateDomainName',
        Value: process.env.CERTIFICATE_DOMAIN_NAME,
        Type: 'SecureString'
    },
    {
        Name: '/api/hostedZoneId',
        Value: process.env.HOSTED_ZONE_ID,
        Type: 'SecureString'
    },
    {
        Name: '/api/hostedZoneName',
        Value: process.env.HOSTED_ZONE_NAME,
        Type: 'SecureString'
    },
    {
        Name: '/api/aRecordName',
        Value: process.env.A_RECORD_NAME,
        Type: 'SecureString'
    }
];

console.log(parameters);

async function createParameters(parameters) {
    for (const param of parameters) {
        try {
            const command = new PutParameterCommand(param);
            await ssmClient.send(command);
            console.log(`Parameter created successfully: ${param.Name}`);
        } catch (err) {
            console.error(`Error creating parameter: ${param.Name}`, err);
        }
    }
}

await createParameters(parameters);
