import { Construct } from 'constructs';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Duration } from 'aws-cdk-lib';

interface BaseFunctionsProps extends NodejsFunctionProps {
    environment?: {
        errorTipicArn?: string;
        bucketName?: string;
    }
}

export class BaseFunctions extends NodejsFunction {
    constructor(scope: Construct, id: string, props: BaseFunctionsProps) {
        super(scope, id, {
            ...props,
            handler: 'handler',
            timeout: Duration.seconds(30),
            entry: `${__dirname}/../src/${id}.ts`,
        });
    }
}