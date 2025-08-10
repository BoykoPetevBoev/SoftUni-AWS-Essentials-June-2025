import * as cdk from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, BillingMode, StreamViewType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { DynamoEventSource, StartingPosition } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Subscription, SubscriptionProtocol, Topic } from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import * as path from 'path';

export class RegularExamStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Amazon SNS
    const topic = new Topic(this, 'RegularExamTopic');
    const subscription = new Subscription(this, 'RegularExamSubscription', {
      endpoint: 'BoykoBoev@students.softuni.bg',
      protocol: SubscriptionProtocol.EMAIL,
      topic: topic,
    });

    // Amazon DynamoDB
    const table = new Table(this, 'RegularExamTable', {
      partitionKey: {
        name: 'PK',
        type: AttributeType.STRING
      },
      sortKey: {
        name: 'SK',
        type: AttributeType.STRING
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'TTL',
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
    });

    table.addGlobalSecondaryIndex({
      indexName: 'TTL-Index',
      partitionKey: {
        name: 'TTL',
        type: AttributeType.NUMBER
      },
    });

    // AWS Lambda 
    const lambdaFunction = new NodejsFunction(this, 'RegularExamFunction', {
      handler: 'handler',
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../src/regularExamHandler.ts'),
      environment: {
        TOPIC_ARN: topic.topicArn,
        TABLE_NAME: table.tableName,
      },
    });
    lambdaFunction.addPermission('InvokeLambdaFunction', {
      action: 'lambda:InvokeFunction',
      principal: new ServicePrincipal('events.amazonaws.com'),
      sourceArn: `arn:aws:events:${this.region}:${this.account}:rule/*`,
    });
    topic.grantPublish(lambdaFunction);
    table.grantWriteData(lambdaFunction);

    // Deletion Handler Lambda Function
    const deletionHandler = new NodejsFunction(this, 'DeletionHandlerFunction', {
      handler: 'handler',
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../src/deletionHandler.ts'),
      environment: {
        TOPIC_ARN: topic.topicArn,
      },
    });
    
    // Grant SNS publish permissions to deletion handler
    topic.grantPublish(deletionHandler);
    
    // Grant DynamoDB Stream read permissions to deletion handler
    table.grantStreamReadData(deletionHandler);
    
    // Create DynamoDB Stream trigger
    deletionHandler.addEventSource(new DynamoEventSource(table, {
      startingPosition: StartingPosition.LATEST,
    }));

    // API Gateway
    const api = new RestApi(this, 'RegularExamApi');
    const resource = api.root.addResource('todochangethis');
    resource.addMethod('POST', new LambdaIntegration(lambdaFunction, {
      proxy: true
    }));
  }
}
