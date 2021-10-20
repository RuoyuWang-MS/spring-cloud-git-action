"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentHelper = void 0;
const azure_storage_1 = require("./azure-storage");
class DeploymentHelper {
    static getStagingDeploymentName(client, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const deployments = yield client.deployments.list(params.ResourceGroupName, params.AzureSpringCloud, params.AppName);
            for (const deploymentAny in deployments) {
                const deployment = deploymentAny;
                if (deployment.properties.active == false) {
                    return deployment.name;
                }
            }
            return null;
        });
    }
    static getAllDeploymentsName(client, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let names = [];
            const deployments = yield client.deployments.list(params.ResourceGroupName, params.AzureSpringCloud, params.AppName);
            for (const deploymentAny in deployments) {
                const deployment = deploymentAny;
                names.push(deployment.name);
            }
            return names;
        });
    }
    static setActiveDeployment(client, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let appResource = {
                properties: {
                    activeDeploymentName: params.DeploymentName
                }
            };
            yield client.apps.update(params.ResourceGroupName, params.AzureSpringCloud, params.AppName, appResource);
            return;
        });
    }
    static deploy(client, params, sourceType, fileToUpload) {
        return __awaiter(this, void 0, void 0, function* () {
            let uploadResponse = yield client.apps.getResourceUploadUrl(params.ResourceGroupName, params.AzureSpringCloud, params.AppName);
            yield (0, azure_storage_1.uploadFileToSasUrl)(uploadResponse.uploadUrl, fileToUpload);
            let envs = params.EnvironmentVariables.split(',');
            let envVars = {};
            for (let env in envs) {
                let index = env.indexOf(':');
                let key = env.substring(0, index);
                let value = env.substring(index + 1);
                envVars[key] = value;
            }
            let deploymentResource = {
                properties: {
                    source: {
                        relativePath: uploadResponse.relativePath,
                        type: sourceType,
                        version: params.Version
                    },
                    deploymentSettings: {
                        jvmOptions: params.JvmOptions,
                        netCoreMainEntryPath: params.DotNetCoreMainEntryPath,
                        runtimeVersion: params.RuntimeVersion,
                        environmentVariables: envVars
                    }
                }
            };
            yield client.deployments.createOrUpdate(params.ResourceGroupName, params.AzureSpringCloud, params.AppName, params.DeploymentName, deploymentResource);
            return;
        });
    }
}
exports.DeploymentHelper = DeploymentHelper;