import { Construct } from "constructs";
import { Pipeline, Artifact, IStage } from "aws-cdk-lib/aws-codepipeline";
import { GitHubSourceAction, CodeBuildAction, CloudFormationCreateUpdateStackAction } from "aws-cdk-lib/aws-codepipeline-actions";
import { SecretValue, Stack, StackProps } from "aws-cdk-lib";
import { PipelineProject, LinuxBuildImage, BuildSpec } from "aws-cdk-lib/aws-codebuild";// import * as sqs from 'aws-cdk-lib/aws-sqs';
import { CdciStack } from "./cdci-stack";


export class MyPipelineStack extends Stack{

    private readonly pipeline: Pipeline;
    private readonly cdkBuildOutput: Artifact;
    private readonly serviceBuildOutput: Artifact;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);
    
    
        this.pipeline = new Pipeline(this, 'Pipeline', {
            pipelineName: 'pipeline',
            crossAccountKeys: false,
            restartExecutionOnUpdate: true
        });

        const sourceOutput = new Artifact('SourceOutput');
        const ServiceSourceOutput = new Artifact('ServiceSourceOutput');


        this.pipeline.addStage({
            stageName: 'Source',
            actions: [
                new GitHubSourceAction({
                  owner: 'yomex4life',
                  repo: 'cdci',
                  branch: 'main',
                  actionName: 'Pipeline_Source',
                  oauthToken: SecretValue.secretsManager('github-token'),
                  output: sourceOutput
                }),
                new GitHubSourceAction({
                    owner: 'yomex4life',
                    repo: 'service-lambda',
                    branch: 'main',
                    actionName: 'Service_Source',
                    oauthToken: SecretValue.secretsManager('github-token'),
                    output: ServiceSourceOutput
                  })
              ]
        })

        this.cdkBuildOutput = new Artifact('cdkBuildOutput');
        this.serviceBuildOutput = new Artifact('serviceBuildOutput');


        this.pipeline.addStage({
            stageName: "Build",
            actions: [
                new CodeBuildAction({
                actionName: "CDK_build",
                input: sourceOutput,
                outputs: [this.cdkBuildOutput],
                project: new PipelineProject(this, 'CdkBuildProject', {
                    environment: {
                    buildImage: LinuxBuildImage.STANDARD_6_0
                    },
                    buildSpec:BuildSpec.fromSourceFilename('build-specs/cdk-build-spec.yml')
                    })
                }),
                new CodeBuildAction({
                    actionName: "Service_Build",
                    input: ServiceSourceOutput,
                    outputs: [this.serviceBuildOutput],
                    project: new PipelineProject(this, 'ServiceBuildProject', {
                        environment: {
                        buildImage: LinuxBuildImage.STANDARD_6_0
                        },
                        buildSpec:BuildSpec.fromSourceFilename('build-specs/service-build-spec.yml')
                        })
                    }),
        
            ]
        });

        this.pipeline.addStage({
            stageName: 'My_Pipeline_Update',
            actions: [
                new CloudFormationCreateUpdateStackAction({
                    actionName: 'My_Pipeline_Update',
                    stackName: 'MyPipelineStack',
                    templatePath: this.cdkBuildOutput.atPath('MyPipelineStack.template.json'),
                    adminPermissions: true
                })
            ]
        });
    }

    public addServiceStage(serviceStack: CdciStack, stageName: string) : IStage
    {
        return this.pipeline.addStage({
            stageName: stageName,
            actions: [
                new CloudFormationCreateUpdateStackAction({
                    actionName: 'Service_Update',
                    stackName: serviceStack.stackName,
                    templatePath: this.cdkBuildOutput.atPath(`${serviceStack.stackName}.template.json`),
                    adminPermissions: true,
                    parameterOverrides: {
                        ...serviceStack.serviceCode.assign(this.serviceBuildOutput.s3Location)
                    },
                    extraInputs: [this.serviceBuildOutput]
                })
            ]
        })
    }
}