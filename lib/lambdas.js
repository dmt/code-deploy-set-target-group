"use strict"

const setTargetGroup = require("./setTargetGroup")

module.exports.setTargetGroup = async (event, _context) => {
  try {
    const message = event.Records[0].Sns.Message
    const { deploymentId, deploymentGroupName, status } = JSON.parse(message)

    const result = await setTargetGroup.handle(deploymentId, deploymentGroupName, status)
    return {
      event,
      result,
    }
  } catch (e) {
    console.log({
      error: e,
      event,
    })
    return {
      message: "Failed running lambda",
      error: e,
      event,
    }
  }
}
