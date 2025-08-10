import * as cdk from 'aws-cdk-lib';
import { Duration } from 'aws-cdk-lib';
import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Subscription, SubscriptionProtocol, Topic } from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import * as path from 'path';

export class RetakeExamStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // AWS S3
    const siteBucket = new Bucket(this, 'CatWebsiteBucket', {
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    new BucketDeployment(this, 'DeployWebsite', {
      sources: [Source.asset('./src')],
      destinationBucket: siteBucket,
    });

    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: siteBucket.bucketWebsiteUrl,
    });


    // Amazon SNS
    const topic = new Topic(this, 'FavoriteCatTopic');
    const subscription = new Subscription(this, 'FavoriteCatSubscription', {
      endpoint: 'BoykoBoev@students.softuni.bg',
      protocol: SubscriptionProtocol.EMAIL,
      topic: topic,
    });


    // Amazon DynamoDB
    const table = new Table(this, 'CatTable', {
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
    });


    // AWS Lambda 
    const saveCatFunction = new NodejsFunction(this, 'SaveCatFunction', {
      handler: 'handler',
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../src/saveCatHandler.ts'),
      environment: {
        TOPIC_ARN: topic.topicArn,
        TABLE_NAME: table.tableName,
      },
    });
    saveCatFunction.addPermission('InvokeLambdaFunction', {
      action: 'lambda:InvokeFunction',
      principal: new ServicePrincipal('events.amazonaws.com'),
      sourceArn: `arn:aws:events:${this.region}:${this.account}:rule/*`,
    });
    topic.grantPublish(saveCatFunction);
    table.grantWriteData(saveCatFunction);


    // API Gateway
    const api = new RestApi(this, 'RetakeExamApi', {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
        allowCredentials: true,
        maxAge: Duration.seconds(300),
      }
    });
    const resource = api.root.addResource('saveCat');
    resource.addMethod('POST', new LambdaIntegration(saveCatFunction, {
      proxy: true
    }));
  }
}
