import { v4 as uuidv4 } from 'uuid';
import { Package, PackageType } from 'azure-actions-utility/packageUtility';
import { Actions, TaskParameters, TaskParametersUtility } from '../operations/taskparameters';
import { AppPlatformManagementClient, AppPlatformManagementModels as Models } from '@azure/arm-appplatform'
import { getDefaultAzureCredential } from '@azure/identity'
import { DeploymentHelper as dh } from "./DeploymentHelper";
import tar = require('tar');

export class AzureSpringCloudDeploymentProvider {

    defaultInactiveDeploymentName = 'staging';

    protected params: TaskParameters;
    protected client: AppPlatformManagementClient;

    constructor() {
        this.params = TaskParametersUtility.getParameters();
    }

    public async PreDeploymentStep() {
        const token = getDefaultAzureCredential();
        this.client = new AppPlatformManagementClient(token, this.params.AzureSubscription);
        var serviceResponse = this.client.services.get(this.params.ResourceGroupName, this.params.AzureSpringCloud);
        //todo verify services
    }

    public async DeployAppStep() {
        switch (this.params.Action) {

            case Actions.deploy: {
                await this.performDeployAction();
                break;
            }

            case Actions.setProduction: {
                await this.performSetProductionAction();
                break;
            }

            case Actions.deleteStagingDeployment: {
                await this.performDeleteStagingDeploymentAction();
                break;
            }

            default:
                throw Error('UnknownOrUnsupportedAction' + this.params.Action);
        }
    }

    private async performDeleteStagingDeploymentAction() {
        console.debug('Delete staging deployment action');
        const deploymentName = await dh.getStagingDeploymentName(this.client, this.params);
        if (deploymentName) {
            await this.client.deployments.deleteMethod(this.params.ResourceGroupName, this.params.AzureSpringCloud, this.params.AppName, deploymentName);
        } else {
            throw Error('NoStagingDeploymentFound');
        }
        return deploymentName;
    }

    private async performSetProductionAction() {
        console.debug('Set production action for app ' + this.params.AppName);
        let deploymentName: string;
        if (this.params.UseStagingDeployment) {
            console.debug('Targeting inactive deployment');
            deploymentName = await dh.getStagingDeploymentName(this.client, this.params);
            this.params.DeploymentName = deploymentName;
            if (!deploymentName) { //If no inactive deployment exists, we cannot continue as instructed.
                throw Error('NoStagingDeploymentFound');
            }
        }
        else {
            //Verify that the named deployment actually exists.
            deploymentName = this.params.DeploymentName;
            let existingStagingDeploymentName: string = await dh.getStagingDeploymentName(this.client, this.params);
            if (deploymentName != existingStagingDeploymentName) {
                throw Error('StagingDeploymentWithNameDoesntExist' + deploymentName);
            }
        }

        await dh.setActiveDeployment(this.client, this.params);
    }

    private async performDeployAction() {
        console.debug('Deployment action');

        let sourceType: string = this.determineSourceType(this.params.Package);

        //If uploading a source folder, compress to tar.gz file.
        let fileToUpload: string = sourceType == SourceType.SOURCE_DIRECTORY ?
            await this.compressSourceDirectory(this.params.Package.getPath()) :
            this.params.Package.getPath();


        let deploymentName: string;
        if (this.params.UseStagingDeployment) {
            deploymentName = await dh.getStagingDeploymentName(this.client, this.params);

            if (!deploymentName) { //If no inactive deployment exists
                console.debug('No inactive deployment exists');
                if (this.params.CreateNewDeployment) {
                    console.debug('New deployment will be created');
                    deploymentName = this.defaultInactiveDeploymentName; //Create a new deployment with the default name.
                    this.params.DeploymentName = deploymentName;
                } else
                    throw Error('NoStagingDeploymentFound');
            }
        } else { //Deploy to deployment with specified name
            console.debug('Deploying with specified name.');
            deploymentName = this.params.DeploymentName;
            let deploymentNames : Array<string> = await dh.getAllDeploymentsName(this.client, this.params);
            if (!deploymentNames || !deploymentNames.includes(deploymentName)) {
                console.debug(`Deployment ${deploymentName} does not exist`);
                if (this.params.CreateNewDeployment) {
                    if (deploymentNames.length > 1) {
                        throw Error('TwoDeploymentsAlreadyExistCannotCreate' + deploymentName);
                    } else {
                        console.debug('Deployment will be created.');
                    }
                } else {
                    throw Error('DeploymentDoesntExist' + deploymentName);
                }

            }
        }
        try {
            await dh.deploy(this.client, this.params, sourceType, fileToUpload);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Compresses sourceDirectoryPath into a tar.gz
     * @param sourceDirectoryPath 
     */
    async compressSourceDirectory(sourceDirectoryPath: string): Promise<string> {
        const fileName = `${uuidv4()}.tar.gz`;
        console.log('CompressingSourceDirectory', sourceDirectoryPath, fileName);
        await tar.c({
            gzip: true,
            file: fileName,
            sync: true,
            cwd: sourceDirectoryPath,
            onWarn: warning => {
                console.warn(warning);
            }
        }, ['.']);
        return fileName;
    }

    private determineSourceType(pkg: Package): string {
        var sourceType: string;
        switch (pkg.getPackageType()) {
            case PackageType.folder:
                sourceType = SourceType.SOURCE_DIRECTORY;
                break;
            case PackageType.zip:
                sourceType = SourceType.DOT_NET_CORE_ZIP;
                break;
            case PackageType.jar:
                sourceType = SourceType.JAR;
                break;
            default:
                throw Error('UnsupportedSourceType' + pkg.getPath());
        }
        return sourceType;
    }
}

export const SourceType = {
    JAR: "Jar",
    SOURCE_DIRECTORY: "Source",
    DOT_NET_CORE_ZIP: "NetCoreZip"
}