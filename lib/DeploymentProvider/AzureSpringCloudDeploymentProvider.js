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
exports.SourceType = exports.AzureSpringCloudDeploymentProvider = void 0;
const core = __importStar(require("@actions/core"));
const uuid_1 = require("uuid");
const packageUtility_1 = require("azure-actions-utility/packageUtility");
const taskparameters_1 = require("../operations/taskparameters");
const arm_appplatform_1 = require("@azure/arm-appplatform");
const identity_1 = require("@azure/identity");
const DeploymentHelper_1 = require("./DeploymentHelper");
const tar = require("tar");
class AzureSpringCloudDeploymentProvider {
    constructor() {
        this.defaultInactiveDeploymentName = 'staging';
        this.params = taskparameters_1.TaskParametersUtility.getParameters();
    }
    PreDeploymentStep() {
        return __awaiter(this, void 0, void 0, function* () {
            const token = (0, identity_1.getDefaultAzureCredential)();
            this.client = new arm_appplatform_1.AppPlatformManagementClient(token, this.params.AzureSubscription);
            var serviceResponse = this.client.services.get(this.params.ResourceGroupName, this.params.AzureSpringCloud);
            //todo verify services
        });
    }
    DeployAppStep() {
        return __awaiter(this, void 0, void 0, function* () {
            switch (this.params.Action) {
                case taskparameters_1.Actions.deploy: {
                    yield this.performDeployAction();
                    break;
                }
                case taskparameters_1.Actions.setProduction: {
                    yield this.performSetProductionAction();
                    break;
                }
                case taskparameters_1.Actions.deleteStagingDeployment: {
                    yield this.performDeleteStagingDeploymentAction();
                    break;
                }
                default:
                    throw Error('UnknownOrUnsupportedAction' + this.params.Action);
            }
        });
    }
    performDeleteStagingDeploymentAction() {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug('Delete staging deployment action');
            const deploymentName = yield DeploymentHelper_1.DeploymentHelper.getStagingDeploymentName(this.client, this.params);
            if (deploymentName) {
                yield this.client.deployments.deleteMethod(this.params.ResourceGroupName, this.params.AzureSpringCloud, this.params.AppName, deploymentName);
            }
            else {
                throw Error('NoStagingDeploymentFound');
            }
            return deploymentName;
        });
    }
    performSetProductionAction() {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug('Set production action for app ' + this.params.AppName);
            let deploymentName;
            if (this.params.UseStagingDeployment) {
                core.debug('Targeting inactive deployment');
                deploymentName = yield DeploymentHelper_1.DeploymentHelper.getStagingDeploymentName(this.client, this.params);
                this.params.DeploymentName = deploymentName;
                if (!deploymentName) { //If no inactive deployment exists, we cannot continue as instructed.
                    throw Error('NoStagingDeploymentFound');
                }
            }
            else {
                //Verify that the named deployment actually exists.
                deploymentName = this.params.DeploymentName;
                let existingStagingDeploymentName = yield DeploymentHelper_1.DeploymentHelper.getStagingDeploymentName(this.client, this.params);
                if (deploymentName != existingStagingDeploymentName) {
                    throw Error('StagingDeploymentWithNameDoesntExist' + deploymentName);
                }
            }
            yield DeploymentHelper_1.DeploymentHelper.setActiveDeployment(this.client, this.params);
        });
    }
    performDeployAction() {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug('Deployment action');
            let sourceType = this.determineSourceType(this.params.Package);
            //If uploading a source folder, compress to tar.gz file.
            let fileToUpload = sourceType == exports.SourceType.SOURCE_DIRECTORY ?
                yield this.compressSourceDirectory(this.params.Package.getPath()) :
                this.params.Package.getPath();
            let deploymentName;
            if (this.params.UseStagingDeployment) {
                deploymentName = yield DeploymentHelper_1.DeploymentHelper.getStagingDeploymentName(this.client, this.params);
                if (!deploymentName) { //If no inactive deployment exists
                    core.debug('No inactive deployment exists');
                    if (this.params.CreateNewDeployment) {
                        core.debug('New deployment will be created');
                        deploymentName = this.defaultInactiveDeploymentName; //Create a new deployment with the default name.
                        this.params.DeploymentName = deploymentName;
                    }
                    else
                        throw Error('NoStagingDeploymentFound');
                }
            }
            else { //Deploy to deployment with specified name
                core.debug('Deploying with specified name.');
                deploymentName = this.params.DeploymentName;
                let deploymentNames = yield DeploymentHelper_1.DeploymentHelper.getAllDeploymentsName(this.client, this.params);
                if (!deploymentNames || !deploymentNames.includes(deploymentName)) {
                    core.debug(`Deployment ${deploymentName} does not exist`);
                    if (this.params.CreateNewDeployment) {
                        if (deploymentNames.length > 1) {
                            throw Error('TwoDeploymentsAlreadyExistCannotCreate' + deploymentName);
                        }
                        else {
                            core.debug('Deployment will be created.');
                        }
                    }
                    else {
                        throw Error('DeploymentDoesntExist' + deploymentName);
                    }
                }
            }
            try {
                yield DeploymentHelper_1.DeploymentHelper.deploy(this.client, this.params, sourceType, fileToUpload);
            }
            catch (error) {
                throw error;
            }
        });
    }
    /**
     * Compresses sourceDirectoryPath into a tar.gz
     * @param sourceDirectoryPath
     */
    compressSourceDirectory(sourceDirectoryPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileName = `${(0, uuid_1.v4)()}.tar.gz`;
            console.log('CompressingSourceDirectory', sourceDirectoryPath, fileName);
            yield tar.c({
                gzip: true,
                file: fileName,
                sync: true,
                cwd: sourceDirectoryPath,
                onWarn: warning => {
                    console.warn(warning);
                }
            }, ['.']);
            return fileName;
        });
    }
    determineSourceType(pkg) {
        var sourceType;
        switch (pkg.getPackageType()) {
            case packageUtility_1.PackageType.folder:
                sourceType = exports.SourceType.SOURCE_DIRECTORY;
                break;
            case packageUtility_1.PackageType.zip:
                sourceType = exports.SourceType.DOT_NET_CORE_ZIP;
                break;
            case packageUtility_1.PackageType.jar:
                sourceType = exports.SourceType.JAR;
                break;
            default:
                throw Error('UnsupportedSourceType' + pkg.getPath());
        }
        return sourceType;
    }
}
exports.AzureSpringCloudDeploymentProvider = AzureSpringCloudDeploymentProvider;
exports.SourceType = {
    JAR: "Jar",
    SOURCE_DIRECTORY: "Source",
    DOT_NET_CORE_ZIP: "NetCoreZip"
};
