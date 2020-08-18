import { IS_MOCK } from "../../config";
import { CampaignConfig, ConfigHashes } from "../../types";
import { fetchWithValidator, ValidationError } from "../helpers";
import { Sentry } from "../../utils/errorTracking";

export class CampaignConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CampaignConfigError";
  }
}

const liveGetCampaignConfig = async (
  token: string,
  endpoint: string,
  configHashes: ConfigHashes
): Promise<CampaignConfig> => {
  try {
    const response = await fetchWithValidator(
      CampaignConfig,
      `${endpoint}/client-config`,
      {
        method: "POST",
        headers: {
          Authorization: token
        },
        body: JSON.stringify(configHashes)
      }
    );
    return response;
  } catch (e) {
    if (e instanceof ValidationError) {
      Sentry.captureException(e);
    }
    throw new CampaignConfigError(e.message);
  }
};

const mockGetCampaignConfig = async (
  _token: string,
  _endpoint: string,
  configHashes: ConfigHashes
): Promise<CampaignConfig> => {
  return {
    features: {
      minAppBinaryVersion: "3.0.0",
      minAppBuildVersion: 0,
      campaignName: "Test campaign"
    }
  };
};

export const getCampaignConfig = IS_MOCK
  ? mockGetCampaignConfig
  : liveGetCampaignConfig;