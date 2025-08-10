import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export class AwsDemoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const queue = new sqs.Queue(this, 'AwsDemoQueue', {
      visibilityTimeout: Duration.seconds(300)
    });

    // SNS topic for success notifications
    const successTopic = new sns.Topic(this, 'SuccessTopic', {
      displayName: 'Success Notifications Topic'
    });

    // SNS topic for error notifications
    const errorTopic = new sns.Topic(this, 'ErrorTopic', {
      displayName: 'Error Notifications Topic'
    });

    successTopic.addSubscription(new subs.SqsSubscription(queue));
    errorTopic.addSubscription(new subs.SqsSubscription(queue));
  }
}
