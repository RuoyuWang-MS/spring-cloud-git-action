"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const core = __importStar(require("@actions/core"));
const parameterParserUtility_1 = require("azure-actions-utility/parameterParserUtility");
class DeploymentHelper {
    static getStagingDeploymentName(client, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const deployments = yield client.deployments.list(params.ResourceGroupName, params.ServiceName, params.AppName);
            let ret;
            deployments.forEach(deployment => {
                core.debug('deployment str: ' + JSON.stringify(deployment));
                if (deployment.properties.active == false) {
                    core.debug("inactive deployment name:" + deployment.name);
                    ret = deployment.name;
                }
                else {
                    core.debug("active deployment name:" + deployment.name);
                }
            });
            // for (const deploymentAny in deployments) {
            //     const deployment = deploymentAny as Models.DeploymentResource;
            //     console.log("deploymentAny:" + deploymentAny);
            //     console.log("deployment:" + deployment);
            //     console.log('Task parameters: ' + JSON.stringify(deployment));
            //     if (deployment?.properties?.active == false) {
            //         return deployment.name;
            //     }
            // }
            return ret;
        });
    }
    static getAllDeploymentsName(client, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let names = [];
            const deployments = yield client.deployments.list(params.ResourceGroupName, params.ServiceName, params.AppName);
            deployments.forEach(deployment => {
                console.log("deployment:" + deployment);
                console.log('deployment str: ' + JSON.stringify(deployment));
                names.push(deployment.name);
            });
            // for (const deploymentAny in deployments) {
            //     const deployment = deploymentAny as Models.DeploymentResource;
            //     names.push(deployment.name);
            // }
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
            yield client.apps.update(params.ResourceGroupName, params.ServiceName, params.AppName, appResource);
            return;
        });
    }
    static deploy(client, params, sourceType, fileToUpload) {
        return __awaiter(this, void 0, void 0, function* () {
            let uploadResponse = yield client.apps.getResourceUploadUrl(params.ResourceGroupName, params.ServiceName, params.AppName);
            yield (0, azure_storage_1.uploadFileToSasUrl)(uploadResponse.uploadUrl, fileToUpload);
            let transformedEnvironmentVariables = {};
            if (params.EnvironmentVariables) {
                core.debug("Environment variables modified.");
                const parsedEnvVariables = (0, parameterParserUtility_1.parse)(params.EnvironmentVariables);
                //Parsed pairs come back as  {"key1":{"value":"val1"},"key2":{"value":"val2"}}
                Object.keys(parsedEnvVariables).forEach(key => {
                    transformedEnvironmentVariables[key] = parsedEnvVariables[key]['value'];
                });
                core.debug('Environment Variables: ' + JSON.stringify(transformedEnvironmentVariables));
            }
            // todo trans envs
            // let envs : Array<string> = params.EnvironmentVariables.split(',');
            // let envVars = {};
            // for(let env in envs) {
            //     let index: number = env.indexOf(':');
            //     let key: string = env.substring(0, index);
            //     let value: string = env.substring(index+1);
            //     envVars[key] = value;
            // }
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
                        environmentVariables: transformedEnvironmentVariables
                    }
                }
            };
            core.debug("deploymentResource:" + JSON.stringify(deploymentResource));
            const response = yield client.deployments.createOrUpdate(params.ResourceGroupName, params.ServiceName, params.AppName, params.DeploymentName, deploymentResource);
            core.debug("deployment response:\n" + response._response.bodyAsText);
            return;
        });
    }
}
exports.DeploymentHelper = DeploymentHelper;
