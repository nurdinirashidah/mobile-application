import React, {
  FunctionComponent,
  useState,
  useEffect,
  useContext,
  useCallback
} from "react";
import {
  View,
  StyleSheet,
  Keyboard,
  Vibration,
  BackHandler
} from "react-native";
import { size, fontSize, borderRadius } from "../../common/styles";
import { Card } from "../Layout/Card";
import { AppText } from "../Layout/AppText";
import { TopBackground } from "../Layout/TopBackground";
import { Credits } from "../Credits";
import { useConfigContext } from "../../context/config";
import {
  withNavigationFocus,
  NavigationFocusInjectedProps
} from "react-navigation";
import { IdScanner } from "../IdScanner/IdScanner";
import { BarCodeScanner, BarCodeScannedCallback } from "expo-barcode-scanner";
import { validateAndCleanId } from "../../utils/validateIdentification";
import { InputIdSection } from "./InputIdSection";
import { AppHeader } from "../Layout/AppHeader";
import { Sentry } from "../../utils/errorTracking";
import { HelpButton } from "../Layout/Buttons/HelpButton";
import { HelpModalContext } from "../../context/help";
import { FeatureToggler } from "../FeatureToggler/FeatureToggler";
import { Banner } from "../Layout/Banner";
import { ImportantMessageContentContext } from "../../context/importantMessage";
import { useCheckUpdates } from "../../hooks/useCheckUpdates";
import { KeyboardAvoidingScrollView } from "../Layout/KeyboardAvoidingScrollView";
import { CampaignConfigContext } from "../../context/campaignConfig";
import { AlertModalContext, wrongFormatAlertProps } from "../../context/alert";
import { InputSelection, SelectionDetails } from "./InputSelection";
import { ManualPassportInput } from "./ManualPassportInput";

const styles = StyleSheet.create({
  content: {
    position: "relative",
    padding: size(2),
    paddingVertical: size(8),
    height: "100%",
    width: 512,
    maxWidth: "100%"
  },
  headerText: {
    marginBottom: size(4)
  },
  bannerWrapper: {
    marginBottom: size(1.5)
  },
  campaignName: {
    fontFamily: "brand-bold",
    fontSize: fontSize(3),
    marginBottom: size(3),
    flexGrow: 1,
    flexShrink: 1
  },
  manageButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius(2),
    padding: size(1),
    marginRight: -size(1),
    marginTop: -size(0.5)
  }
});

const CollectCustomerDetailsScreen: FunctionComponent<NavigationFocusInjectedProps> = ({
  navigation,
  isFocused
}) => {
  useEffect(() => {
    Sentry.addBreadcrumb({
      category: "navigation",
      message: "CollectCustomerDetailsScreen"
    });
  }, []);

  const messageContent = useContext(ImportantMessageContentContext);
  const [shouldShowCamera, setShouldShowCamera] = useState(false);
  const [isScanningEnabled, setIsScanningEnabled] = useState(true);
  const [idInput, setIdInput] = useState("");
  const { config } = useConfigContext();
  const showHelpModal = useContext(HelpModalContext);
  const checkUpdates = useCheckUpdates();
  const { showAlert } = useContext(AlertModalContext);
  const { features, policies } = useContext(CampaignConfigContext);

  // to shift to context once tested to preserve across screen
  const [selectedIdType, setSelectedIdType] = useState<SelectionDetails>({
    label: "DEFAULT",
    scannerType: "NONE"
  });

  const getSelectionArray = useCallback((): SelectionDetails[] => {
    const selectionArray = [];
    const defaultLabelName = "DEFAULT";
    const defaultScannerType = "NONE";
    selectionArray.push({
      label: features?.id.label || defaultLabelName,
      scannerType: features?.id.scannerType || defaultScannerType
    });
    features?.alternateIds &&
      features.alternateIds.map(alternateId =>
        selectionArray.push({
          label: alternateId.label,
          scannerType: alternateId.scannerType
        })
      );
    return selectionArray;
  }, [features]);

  useEffect(() => {
    if (isFocused) {
      setIsScanningEnabled(true);
    }
  }, [isFocused]);

  useEffect(() => {
    if (isFocused) {
      checkUpdates();
    }
  }, [isFocused, checkUpdates]);

  // Close camera when back action is triggered
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (shouldShowCamera) {
          setShouldShowCamera(false);
          return true;
        }
        return false;
      }
    );
    return () => {
      backHandler.remove();
    };
  }, [shouldShowCamera]);

  useEffect(() => {
    if (shouldShowCamera) {
      Keyboard.dismiss();
    }
  }, [shouldShowCamera]);

  // take from context after testing
  useEffect(() => {
    const selectionDetails = getSelectionArray();
    setSelectedIdType(selectionDetails[0]); // temp test.. will be shifted to context
  }, [getSelectionArray]);

  const onCheck = async (input: string): Promise<void> => {
    try {
      setIsScanningEnabled(false);
      if (!features) {
        return;
      }
      const id = validateAndCleanId(
        input,
        features.id.validation,
        features.id.validationRegex
      );
      Vibration.vibrate(50);
      const defaultProducts = policies?.filter(
        policy =>
          policy.categoryType === undefined || policy.categoryType === "DEFAULT"
      );

      navigation.navigate("CustomerQuotaProxy", {
        id,
        products: defaultProducts
      });
      setIdInput("");
    } catch (e) {
      setIsScanningEnabled(false);
      showAlert({
        ...wrongFormatAlertProps,
        description: e.message,
        onOk: () => setIsScanningEnabled(true)
      });
    }
  };

  const onBarCodeScanned: BarCodeScannedCallback = event => {
    if (isFocused && isScanningEnabled && event.data) {
      onCheck(event.data);
    }
  };

  const onInputSelection = (inputType: SelectionDetails): void => {
    console.log(inputType);
    setSelectedIdType(inputType);
  };

  const hasMultiInputSelection = (): boolean => {
    return getSelectionArray().length > 1;
  };

  const getInputComponent = (): JSX.Element => {
    return selectedIdType.label === "Passport" &&
      selectedIdType.scannerType === "NONE" ? (
      <ManualPassportInput />
    ) : (
      <InputIdSection
        openCamera={() => setShouldShowCamera(true)}
        idInput={idInput}
        setIdInput={setIdInput}
        submitId={() => onCheck(idInput)}
        keyboardType={features?.id.type === "NUMBER" ? "numeric" : "default"}
      />
    );
  };

  console.log("tmd lah");
  console.log(selectedIdType);
  return (
    <>
      <Credits style={{ bottom: size(3) }} />
      <KeyboardAvoidingScrollView
        scrollable={selectedIdType.label !== "Passport"}
      >
        <TopBackground mode={config.appMode} />
        <View style={styles.content}>
          <View style={styles.headerText}>
            <AppHeader mode={config.appMode} />
          </View>
          {hasMultiInputSelection() && (
            <InputSelection
              selectionArray={getSelectionArray()}
              currentSelection={selectedIdType}
              onInputSelection={onInputSelection}
            />
          )}
          {messageContent && (
            <View style={styles.bannerWrapper}>
              <Banner {...messageContent} />
            </View>
          )}
          <Card>
            {features?.campaignName && (
              <AppText style={styles.campaignName}>
                {features.campaignName}
              </AppText>
            )}
            <AppText>
              Check the number of item(s) eligible for redemption
            </AppText>
            {getInputComponent()}
          </Card>
          <FeatureToggler feature="HELP_MODAL">
            <HelpButton onPress={showHelpModal} />
          </FeatureToggler>
        </View>
      </KeyboardAvoidingScrollView>
      {shouldShowCamera && (
        <IdScanner
          isScanningEnabled={isScanningEnabled}
          onBarCodeScanned={onBarCodeScanned}
          onCancel={() => setShouldShowCamera(false)}
          cancelButtonText="Enter ID manually"
          barCodeTypes={
            features?.id.scannerType === "QR"
              ? [BarCodeScanner.Constants.BarCodeType.qr]
              : [BarCodeScanner.Constants.BarCodeType.code39]
          }
        />
      )}
    </>
  );
};

export const CollectCustomerDetailsScreenContainer = withNavigationFocus(
  CollectCustomerDetailsScreen
);
