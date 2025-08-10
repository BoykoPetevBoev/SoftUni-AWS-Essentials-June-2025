import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { RetakeExamStack } from '../lib/retake-exam-stack';

test('Stack Snapshot Test', () => {
    const app = new cdk.App();
    const stack = new RetakeExamStack(app, 'MyTestStack');
    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
});
