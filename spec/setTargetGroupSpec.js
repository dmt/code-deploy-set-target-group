const baseDeploymentInfo = {
  applicationName: "application name",
  deploymentGroupName: "deployment group name",
  deploymentId: "d-OCBK17UKW",
  status: "Succeeded",
  creator: "user",
  deploymentStyle: {
    deploymentType: "BLUE_GREEN",
    deploymentOption: "WITH_TRAFFIC_CONTROL"
  },
  targetInstances: {
    autoScalingGroups: ["asg name"]
  },
  loadBalancerInfo: {
    targetGroupInfoList: [
      {
        name: "target group name"
      }
    ]
  }
}
const withPromiseFunction = result => {
  return { promise: () => Promise.resolve(result) }
}
const deploymentInfo = (merge = {}) => {
  const result = Object.assign({}, baseDeploymentInfo, merge)
  return withPromiseFunction({ deploymentInfo: result })
}
const asgTargetGroups = (merge = {}) => {
  const result = Object.assign(
    {},
    {
      LoadBalancerTargetGroups: []
    },
    merge
  )
  return withPromiseFunction(result)
}
const targetGroups = merge => {
  const result = Object.assign({}, merge)
  return withPromiseFunction({ TargetGroups: [result] })
}

describe("setTargetGroup", () => {
  let aws,
    setTargetGroup,
    mocks = {}
  beforeEach(() => {
    aws = require("aws-sdk")
    mocks = jasmine.createSpyObj("aws", [
      "getDeployment",
      "describeLoadBalancerTargetGroups",
      "attachLoadBalancerTargetGroups",
      "describeTargetGroups"
    ])
    aws.ELBv2 = function ELBv2() {
      this.describeTargetGroups = mocks.describeTargetGroups
    }
    aws.AutoScaling = function AutoScaling() {
      this.describeLoadBalancerTargetGroups = mocks.describeLoadBalancerTargetGroups
      this.attachLoadBalancerTargetGroups = mocks.attachLoadBalancerTargetGroups
    }
    aws.CodeDeploy = function CodeDeploy() {
      this.getDeployment = mocks.getDeployment
    }
    setTargetGroup = require("../lib/setTargetGroup").handle
  })

  describe("updates the auto scaling groups target group", () => {
    it("on successful deployment if previously unset", async () => {
      const updateResult = "update result"
      const targetGroupArn = "expected target group arn"
      mocks.getDeployment.and.returnValue(deploymentInfo())
      mocks.describeLoadBalancerTargetGroups.and.returnValue(asgTargetGroups())
      mocks.attachLoadBalancerTargetGroups.and.returnValue(withPromiseFunction(updateResult))
      mocks.describeTargetGroups.and.returnValue(
        targetGroups({
          TargetGroupArn: targetGroupArn
        })
      )

      let result = await setTargetGroup(
        baseDeploymentInfo.deploymentId,
        baseDeploymentInfo.deploymentGroupName,
        "SUCCEEDED"
      )

      expect(result).toBe(updateResult)
      expect(mocks.attachLoadBalancerTargetGroups).toHaveBeenCalledWith({
        AutoScalingGroupName: baseDeploymentInfo.targetInstances.autoScalingGroups[0],
        TargetGroupARNs: [targetGroupArn]
      })
    })
  })

  describe("ignores event if", () => {
    it("status is not SUCCEEDED", async () => {
      let result = await setTargetGroup("deploymentId", "deployment group name", "CREATED")

      expect(result.message).toBe("Ignored event")
      expect(mocks.getDeployment).not.toHaveBeenCalled()
    })

    it("if asg already has target group set", async () => {
      mocks.getDeployment.and.returnValue(deploymentInfo())
      mocks.describeLoadBalancerTargetGroups.and.returnValue(
        asgTargetGroups({
          LoadBalancerTargetGroups: ["something"]
        })
      )

      let result = await setTargetGroup(
        baseDeploymentInfo.deploymentId,
        baseDeploymentInfo.deploymentGroupName,
        "SUCCEEDED"
      )

      expect(result.message).toBe("Ignored event")
      expect(mocks.attachLoadBalancerTargetGroups).not.toHaveBeenCalled()
    })
  })
})
