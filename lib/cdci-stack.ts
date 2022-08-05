import { Stack, StackProps, RemovalPolicy, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Function, Code, Runtime, FunctionUrlAuthType, HttpMethod, CfnParametersCode, Alias } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { CreateSthree } from './s3';
import { LambdaDeploymentGroup, LambdaDeploymentConfig } from 'aws-cdk-lib/aws-codedeploy';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { HttpApi } from '@aws-cdk/aws-apigatewayv2-alpha';
import { TreatMissingData, Statistic } from 'aws-cdk-lib/aws-cloudwatch';
//import { HttpApi } from '@aws-cdk/aws-apigatewayv2-alpha;
//import { HttpApi} from 'aws-cdk-lib/aws-apigatewayv2'
// import * as sqs from 'aws-cdk-lib/aws-sqs';
interface ServiceStackProps extends StackProps
{
  stageName: string;
}

export class CdciStack extends Stack {
  public readonly serviceCode: CfnParametersCode;

  constructor(scope: Construct, id: string, props: ServiceStackProps) {
    super(scope, id, props);

    this.serviceCode = Code.fromCfnParameters();
    const s3bucket = new CreateSthree(this, 'MySthree');

    //resource generated by the construct
    const helloFunction = new Function(this,'HelloHandler', {
    runtime: Runtime.NODEJS_16_X,
    code: this.serviceCode, //Folder name
    handler: 'index.handler',
    functionName: 'simple-lambda-function',
    memorySize: 128,
    logRetention: RetentionDays.THREE_DAYS,
    currentVersionOptions: {
      removalPolicy: RemovalPolicy.DESTROY
    },
    description: `Generated on ${new Date().toISOString}` //to update lambda all the time
  });

  const alias = new Alias(this, 'serviceLambdaAlias', {
    version: helloFunction.latestVersion,
    aliasName: 'ServiceLambdaAliasProd'
  })

  // const alislFnUrl = alias.addFunctionUrl({
  //   authType: FunctionUrlAuthType.NONE,
  //   cors: {
  //     allowedMethods: [HttpMethod.GET],
  //     allowedOrigins: ["*"],
  //     maxAge: Duration.minutes(1)
  //   }
  // });

  const httpApi = new HttpApi(this, "ServiceApi", {
    defaultIntegration: new HttpLambdaIntegration('LambdaIntegration', alias),
    apiName: 'MyServiceProd'
  });

  //Do this in production so do it in stageName Prod
  if(props.stageName === 'Prod')
  {
    new LambdaDeploymentGroup(this, "DeploymentGroup", {
      alias: alias,
      deploymentConfig: LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
      autoRollback: {
        deploymentInAlarm: true //if any of the alarms returns true, rollback
      },
      alarms: [
        httpApi.metricServerError()
        .with({
          period:Duration.minutes(1), //if error stop deployment within a minute  
          statistic: Statistic.SUM        
        })
        .createAlarm(this, 'alarm1', {
          threshold: 1,
          alarmDescription: 'Service is experiencing errors',
          alarmName: 'ServiceErrorAlarmProd',
          evaluationPeriods: 1, //number of datapoint
          treatMissingData: TreatMissingData.NOT_BREACHING
        })
      ]
    });
  }
 
  // const fnurl = helloFunction.addFunctionUrl({
  //   authType: FunctionUrlAuthType.NONE,
  //   cors: {
  //     allowedMethods: [HttpMethod.GET],
  //     allowedOrigins: ["*"],
  //     maxAge: Duration.minutes(1)
  //   }
  // });
  }
}
