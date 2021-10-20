import * as core from '@actions/core';
import * as crypto from "crypto";
import {TaskParameters, TaskParametersUtility} from "./operations/taskparameters";
import {AzureSpringCloudDeploymentProvider} from "./DeploymentProvider/AzureSpringCloudDeploymentProvider";

var prefix = !!process.env.AZURE_HTTP_USER_AGENT ? `${process.env.AZURE_HTTP_USER_AGENT}` : "";

export async function main() {
  let isDeploymentSuccess: boolean = true;

  console.log('Starting deployment task execution');
  let taskParams: TaskParameters = TaskParametersUtility.getParameters();
  let deploymentProvider = new AzureSpringCloudDeploymentProvider();
  console.debug("Pre-deployment Step Started");
  await deploymentProvider.PreDeploymentStep();

  console.debug("Deployment Step Started");
  await deploymentProvider.DeployAppStep();
}

main();
