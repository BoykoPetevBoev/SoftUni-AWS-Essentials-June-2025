import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { BaseFunctions } from './functions';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class EmptyCdkProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // SNS topic for success notifications
    const successTopic = new sns.Topic(this, 'SuccessTopic', {
      displayName: 'Success Notifications Topic'
    });

    // SNS topic for error notifications
    const errorTopic = new sns.Topic(this, 'ErrorTopic', {
      displayName: 'Error Notifications Topic'

    });

    const softUniFunction = new lambda.Function(this, 'SoftUniFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(`${__dirname}/../src/one.ts`),
    });
    

    const environentProps = {
      errorTipicArn: errorTopic.topicArn,
      bucketName: 'softuni-bucket',
    }

    const softUniFunctionOne= new BaseFunctions(this, 'one', {
      environment: environentProps,
    });

    const softUniFunctionTwo= new BaseFunctions(this, 'two', {
      environment: environentProps,
    });

    // CloudFormation Outputs for SNS Topic ARNs
    new cdk.CfnOutput(this, 'SuccessTopicArn', {
      value: successTopic.topicArn,
      description: 'ARN of the Success SNS Topic',
      exportName: 'SuccessTopicArn',
    });

    new cdk.CfnOutput(this, 'ErrorTopicArn', {
      value: errorTopic.topicArn,
      description: 'ARN of the Error SNS Topic',
      exportName: 'ErrorTopicArn',
    });

    // example resource
    // const queue = new sqs.Queue(this, 'EmptyCdkProjectQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
