import * as cdk from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Subscription, SubscriptionProtocol, Topic } from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import * as path from 'path';

export class ExamPreparationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    const bucket = new Bucket(this, 'SongBucket');

    const topic = new Topic(this, 'SongTopic');
    const subscription = new Subscription(this, 'SongSubscription', {
      endpoint: 'BoykoBoev@students.softuni.bg',
      protocol: SubscriptionProtocol.EMAIL,
      topic: topic,
    });

    const table = new Table(this, 'SongTable', {
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
    table.addGlobalSecondaryIndex({
      indexName: 'GSI',
      partitionKey: {
        name: 'GSI-PK',
        type: AttributeType.STRING
      },
    });

    const addSongFunction = new NodejsFunction(this, 'AddSongFunction', {
      handler: 'handler',
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../src/addSongHandler.ts'),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });
    table.grantWriteData(addSongFunction);

    const playSongFunction = new NodejsFunction(this, 'PlaySongFunction', {
      handler: 'handler',
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../src/playSongHandler.ts'),
      environment: {
        TOPIC_ARN: topic.topicArn,
      },
    });
    playSongFunction.addPermission('InvokePlaySongFunction', {
      action: 'lambda:InvokeFunction',
      principal: new ServicePrincipal('events.amazonaws.com'),
      sourceArn: `arn:aws:events:${this.region}:${this.account}:rule/*`,
    });
    topic.grantPublish(playSongFunction);


    const api = new RestApi(this, 'AddSongApi');
    const resource = api.root.addResource('songs');
    resource.addMethod('POST', new LambdaIntegration(addSongFunction, {
      proxy: true
    }));
  }
}