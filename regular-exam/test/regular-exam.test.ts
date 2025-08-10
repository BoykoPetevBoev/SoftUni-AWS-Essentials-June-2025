import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { RegularExamStack } from '../lib/regular-exam-stack';

test('Stack Snapshot Test', () => {
    const app = new cdk.App();
    const stack = new RegularExamStack(app, 'MyTestStack');
    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
});
