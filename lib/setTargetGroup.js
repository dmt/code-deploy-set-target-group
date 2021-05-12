"use strict"

const awsCalls = require("./aws")

module.exports.handle = async (deploymentId, deploymentGroupName, status) => {
  if (shouldHandleEvent(status)) {
    const { deploymentInfo } = await awsCalls.lookupDeployment(deploymentId)
    console.log(JSON.stringify(deploymentInfo, null, 2))

    if (isBlueGreenDeployment(deploymentInfo) && isCorrectDeploymentGroup(deploymentInfo, deploymentGroupName)) {
      const updateResult = await awsCalls.updateAsgTargetGroup(
        deploymentInfo.targetInstances.autoScalingGroups[0],
        deploymentInfo.loadBalancerInfo.targetGroupInfoList[0].name
      )
      console.log(JSON.stringify(updateResult, null, 2))
      return updateResult
    }
  }
  return {
    message: "Ignored event",
    deploymentId,
    deploymentGroupName,
    status,
  }
}

const isBlueGreenDeployment = ({ creator, deploymentStyle }) => {
  return creator === "user" && deploymentStyle.deploymentType === "BLUE_GREEN"
}

const isCorrectDeploymentGroup = ({ targetInstances, deploymentGroupName }, eventDeploymentGroupName) => {
  return (
    targetInstances && targetInstances.autoScalingGroups.length == 1 && deploymentGroupName === eventDeploymentGroupName
  )
}
const shouldHandleEvent = (status) => {
  return status === "SUCCEEDED"
}
