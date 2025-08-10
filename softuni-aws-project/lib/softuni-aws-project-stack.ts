import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export class SoftuniAwsProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const softuniAwsBucket = new s3.Bucket(this, 'softuniAwsBucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    new s3deploy.BucketDeployment(this, 'softuniAwsBucketDeployment', {
      sources: [s3deploy.Source.asset('./assets')],
      destinationBucket: softuniAwsBucket,
    });

    const softuniAwsStorage = new s3.Bucket(this, 'softuniAwsStorage', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'softuniAwsStorageLifecycleRule',
          expiration: cdk.Duration.days(1),
        },
      ],
    });

    const storageNotificationTopic = new sns.Topic(this, 'StorageNotificationTopic', {
      displayName: 'SoftUni AWS Storage Notification Topic',
    });

    softuniAwsStorage.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.SnsDestination(storageNotificationTopic)
    );

    storageNotificationTopic.addSubscription(
      new subs.EmailSubscription('boykopetevboev@gmail.com')
    );


    const nraAuditTable = new dynamodb.Table(this, 'nraAuditTable', {
      partitionKey: { 
        name: 'PK', 
        type: dynamodb.AttributeType.STRING 
      },
      sortKey: { 
        name: 'SK',
        type: dynamodb.AttributeType.STRING 
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    nraAuditTable.addGlobalSecondaryIndex({
      indexName: 'RandomNumberIndex',
        partitionKey: { 
        name: 'randomNumber', 
        type: dynamodb.AttributeType.NUMBER 
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const fillTableFunction = new NodejsFunction(this, "FillTableFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: __dirname + '/../src/fillTable.ts',
      handler: "handler",
      environment: {
        TABLE_NAME: nraAuditTable.tableName,
        TOPIC_ARN: storageNotificationTopic.topicArn
      },
    })
    nraAuditTable.grantWriteData(fillTableFunction)
    storageNotificationTopic.grantPublish(fillTableFunction)
    
    const getOrderFunction = new NodejsFunction(this, "GetOrderFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: __dirname + '/../src/getOrder.ts',
      handler: "handler",
      environment: {
        TABLE_NAME: nraAuditTable.tableName,
        
      },
    })
    nraAuditTable.grantReadData(getOrderFunction)

    const ordersHandler = new lambda.Function(this, 'OrdersHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Orders API root' })
          };
        };
      `),
    });

    const ordersApi = new apigateway.RestApi(this, 'OrdersApi', {
      restApiName: 'Orders',
    });

    const ordersResource = ordersApi.root.addResource('orders');
    ordersResource.addMethod('GET', new apigateway.LambdaIntegration(getOrderFunction));
    ordersResource.addMethod('POST', new apigateway.LambdaIntegration(fillTableFunction));

    const cfnOutput = new cdk.CfnOutput(this, 'url', {
      key: "websiteUrl",
      value: softuniAwsBucket.bucketWebsiteUrl + "/index.html"
    }) 
  }

}
