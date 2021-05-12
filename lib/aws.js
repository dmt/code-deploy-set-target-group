"use strict"

const AWS = require("aws-sdk")
const updateAsgTargetGroup = async (asg, targetGroupName) => {
  const autoscaling = new AWS.AutoScaling()
  const existing = await autoscaling
    .describeLoadBalancerTargetGroups({
      AutoScalingGroupName: asg,
    })
    .promise()
  if (existing.LoadBalancerTargetGroups.length === 0) {
    const {
      TargetGroups: [targetGroup],
    } = await lookupTargetGroupArn(targetGroupName)
    const params = {
      AutoScalingGroupName: asg,
      TargetGroupARNs: [targetGroup.TargetGroupArn],
    }
    console.log("Updating autoscaling group with ", params)
    return autoscaling.attachLoadBalancerTargetGroups(params).promise()
  }
  return Promise.resolve({
    message: "Ignored event",
    existing,
  })
}
const lookupDeployment = async (deploymentId) => {
  const codedeploy = new AWS.CodeDeploy()
  return codedeploy
    .getDeployment({
      deploymentId,
    })
    .promise()
}
const lookupTargetGroupArn = async (targetGroupName) => {
  const elbv2 = new AWS.ELBv2()
  return elbv2
    .describeTargetGroups({
      Names: [targetGroupName],
    })
    .promise()
}

module.exports = {
  updateAsgTargetGroup,
  lookupDeployment,
}
