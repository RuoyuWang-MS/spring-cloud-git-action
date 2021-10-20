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
exports.main = void 0;
const taskparameters_1 = require("./operations/taskparameters");
const AzureSpringCloudDeploymentProvider_1 = require("./DeploymentProvider/AzureSpringCloudDeploymentProvider");
var prefix = !!process.env.AZURE_HTTP_USER_AGENT ? `${process.env.AZURE_HTTP_USER_AGENT}` : "";
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        let isDeploymentSuccess = true;
        console.log('Starting deployment task execution');
        let taskParams = taskparameters_1.TaskParametersUtility.getParameters();
        let deploymentProvider = new AzureSpringCloudDeploymentProvider_1.AzureSpringCloudDeploymentProvider();
        console.debug("Pre-deployment Step Started");
        yield deploymentProvider.PreDeploymentStep();
        console.debug("Deployment Step Started");
        yield deploymentProvider.DeployAppStep();
    });
}
exports.main = main;
main();
