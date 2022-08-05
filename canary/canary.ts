//import { aws_synthetics } from "aws-cdk-lib"

//import * as synthetics from '@aws-cdk/aws-synthetics-alpha';
const synthetics =require('Synthetics');

const canary = async function (){
    await synthetics.executeHttpStep(
        //Verify API returns successful response
        process.env.API_ENDPOINT
    );
}

exports.handler = async() =>
{
    return await canary();
}