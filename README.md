# code-deploy-set-target-group
Lambda function to fix code deploy issues

## Setting the target group

Blue/green codedeploy deployments create a copy of the auto scaling group with replacement instances. These then get added to the target group of the load balancer and the old instances get removed. After which the original ASG gets deleted. 

The final step would be to set the target group on the new auto scaling group which does not happen. (Scale in events happening outside of code deploys would not drain instances before shutting them down.) This lambda function fixes that. 

It receives deployment SNS notifications and, on a successfull blue/green deploy, updates the new ASG's target group with the target group configured in the deployment group. This will only set the target group if there isn't already one set. It also always assumes one target group.

## Usage

Use the aws sam cli. The template takes a parameter "CodeDeploySnsTopic" of an existing sns topic that receives code deploy notifications. The topic should exist and needs to be configured as a trigger in all deployment groups that should be updated by this lambda. And you need to have permissions in AWS to have sam configure the role for this lambda.

`npm test` runs tests and linting. 

other things go through `sam` commands work as well, of course

