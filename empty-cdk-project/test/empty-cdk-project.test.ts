import * as cdk from 'aws-cdk-lib';
import * as EmptyCdkProject from '../lib/empty-cdk-project-stack';

test('SQS Queue Created', () => {
    const app = new cdk.App();
    const stack = new EmptyCdkProject.EmptyCdkProjectStack(app, 'MyTestStack');
    expect(stack).toMatchSnapshot();
});
