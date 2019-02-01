# code-deploy-set-target-group
Lambda function to fix code deploy issues

## Setting the target group

Blue/green codedeploy deploymnets create a copy of the auto scaling group with replacement instances. These then get added to the target group of the load balancer and the old instances get removed. After which the original ASG gets deleted. 

The final step would be to set the target group on the new auto scaling group which does not happen. (Scale in events happening outside of code deploys would not drain instances before shutting them down.) This lambda function fixes that. 

It receives deployment SNS notifications and, on a successfull blue/green deploy, updates the new ASG's target group with the target group configured in the deployment group. This will only set the target group if there isn't already one set. It also always assumes one target group.

## Usage

Set environment variables for `AWS_REGION` and `AWS_ACCOUNT` and `SNS_TOPIC`. The topic should exist and needs to be configured as a trigger in all deployment groups that should be updated by this lambda. And you need to have permissions in AWS to have `serverless` configure the role for this lambda.

E.g.
```
export AWS_REGION=eu-central-1
export AWS_ACCOUNT=1234567890
export SNS_TOPIC=codedeploy
```

`npm run release` tests and deploys
other `sls` commands work as well, of course

