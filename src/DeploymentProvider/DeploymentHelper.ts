import { Actions, TaskParameters } from '../operations/taskparameters';
import { AppPlatformManagementClient, AppPlatformManagementModels as Models } from '@azure/arm-appplatform'
import {uploadFileToSasUrl} from "./azure-storage";

export class DeploymentHelper {
    public static async getStagingDeploymentName(client: AppPlatformManagementClient, params: TaskParameters): Promise<string> {
        const deployments: Models.DeploymentsListResponse = await client.deployments.list(params.ResourceGroupName, params.AzureSpringCloud, params.AppName);
        for (const deploymentAny in deployments) {
            const deployment = deploymentAny as Models.DeploymentResource;
            if (deployment.properties.active == false) {
                return deployment.name;
            }
        }
        return null;
    }

    public static async getAllDeploymentsName(client: AppPlatformManagementClient, params: TaskParameters): Promise<Array<string>> {
        let names: Array<string> = [];
        const deployments: Models.DeploymentsListResponse = await client.deployments.list(params.ResourceGroupName, params.AzureSpringCloud, params.AppName);
        for (const deploymentAny in deployments) {
            const deployment = deploymentAny as Models.DeploymentResource;
            names.push(deployment.name);
        }
        return names;
    }

    public static async setActiveDeployment(client: AppPlatformManagementClient, params: TaskParameters) {
        let appResource: Models.AppResource = {
            properties: {
                activeDeploymentName: params.DeploymentName
            }
        };
        await client.apps.update(params.ResourceGroupName, params.AzureSpringCloud, params.AppName, appResource);
        return;
    }

    public static async deploy(client: AppPlatformManagementClient, params: TaskParameters, sourceType: string, fileToUpload: string) {
        let uploadResponse : Models.AppsGetResourceUploadUrlResponse = await client.apps.getResourceUploadUrl(params.ResourceGroupName, params.AzureSpringCloud, params.AppName);
        await uploadFileToSasUrl(uploadResponse.uploadUrl, fileToUpload);
        let envs : Array<string> = params.EnvironmentVariables.split(',');
        let envVars = {};
        for(let env in envs) {
            let index: number = env.indexOf(':');
            let key: string = env.substring(0, index);
            let value: string = env.substring(index+1);
            envVars[key] = value;
        }
        let deploymentResource: Models.DeploymentResource = {
            properties: {
                source: {
                    relativePath: uploadResponse.relativePath,
                    type: sourceType as Models.UserSourceType,
                    version: params.Version
                },
                deploymentSettings: {
                    jvmOptions: params.JvmOptions,
                    netCoreMainEntryPath: params.DotNetCoreMainEntryPath,
                    runtimeVersion: params.RuntimeVersion as Models.RuntimeVersion,
                    environmentVariables: envVars
                }
            }
        }
        await client.deployments.createOrUpdate(params.ResourceGroupName, params.AzureSpringCloud, params.AppName, params.DeploymentName, deploymentResource);
        return;
    }

}