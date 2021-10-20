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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskParametersUtility = exports.Actions = exports.Inputs = void 0;
const core = __importStar(require("@actions/core"));
const packageUtility_1 = require("azure-actions-utility/packageUtility");
class Inputs {
}
exports.Inputs = Inputs;
Inputs.azureSubscription = 'azure-subscription';
Inputs.connectedServiceName = 'connected-service-name';
Inputs.resourceGroupName = 'resource-group-name';
Inputs.azureSpringCloud = 'azure-spring-cloud';
Inputs.action = 'action';
Inputs.appName = 'app-name';
Inputs.useStagingDeployment = 'use-staging-deployment';
Inputs.createNewDeployment = 'create-new-deployment';
Inputs.deploymentName = 'deployment-name';
Inputs.environmentVariables = 'environment-variables';
Inputs.jvmOptions = 'jvm-options';
Inputs.runtimeVersion = 'runtime-version';
Inputs.dotNetCoreMainEntryPath = 'dotnetcore-mainentry-path';
Inputs.version = 'version';
Inputs.package = 'package';
class Actions {
}
exports.Actions = Actions;
Actions.deploy = 'Deploy';
Actions.setProduction = 'Set Production';
Actions.deleteStagingDeployment = 'Delete Staging Deployment';
class TaskParametersUtility {
    static getParameters() {
        console.log('Started getParameters');
        var taskParameters = {
            AzureSubscription: core.getInput(Inputs.azureSubscription, { "required": true }),
            //ConnectedServiceName: core.getInput(Inputs.connectedServiceName, {"required":true}),
            ResourceGroupName: core.getInput(Inputs.resourceGroupName, { "required": true }),
            AzureSpringCloud: core.getInput(Inputs.azureSpringCloud, { "required": true }),
            Action: core.getInput(Inputs.action, { "required": true }),
            AppName: core.getInput(Inputs.appName, { "required": true }),
            UseStagingDeployment: core.getInput(Inputs.useStagingDeployment, { "required": true }) == "true",
            CreateNewDeployment: core.getInput(Inputs.createNewDeployment, { "required": false }) == "true",
            DeploymentName: core.getInput(Inputs.deploymentName, { "required": !(core.getInput(Inputs.useStagingDeployment, { "required": true }) == "true") }),
            EnvironmentVariables: core.getInput(Inputs.environmentVariables, { "required": false }),
            JvmOptions: core.getInput(Inputs.jvmOptions, { "required": false }),
            RuntimeVersion: core.getInput(Inputs.runtimeVersion, { "required": false }),
            DotNetCoreMainEntryPath: core.getInput(Inputs.dotNetCoreMainEntryPath, { "required": false }),
            Version: core.getInput(Inputs.version, { "required": false })
        };
        //Do not attempt to parse package in non-deployment steps. This causes variable substitution errors.
        if (taskParameters.Action == Actions.deploy) {
            taskParameters.Package = new packageUtility_1.Package(core.getInput(Inputs.package, { "required": true }));
        }
        core.debug('Task parameters: ' + JSON.stringify(taskParameters));
        return taskParameters;
    }
}
exports.TaskParametersUtility = TaskParametersUtility;
