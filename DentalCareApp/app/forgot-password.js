import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Image
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors } from "./theme/colors";

const { height: H } = Dimensions.get("window");
const isSmallPhone = H < 760;

const ForgotPassword = () => {
  const router = useRouter();

  // email | otp | password
  const [currentStep, setCurrentStep] = useState("email");

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const otpInputs = useRef([]);

  const [countdown, setCountdown] = useState(60);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Resend OTP countdown
  useEffect(() => {
    if (currentStep !== "otp" || countdown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setCountdown((previousValue) => {
        if (previousValue <= 1) {
          clearInterval(timer);
          return 0;
        }

        return previousValue - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentStep, countdown]);

  const isValidEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const handleEmailContinue = () => {
    setEmailError("");

    if (!email.trim()) {
      setEmailError("Please enter your email address.");
      return;
    }

    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    // Frontend only:
    // No real OTP is being sent.
    setOtp(["", "", "", "", "", ""]);
    setCountdown(60);
    setCurrentStep("otp");

    setTimeout(() => {
      otpInputs.current[0]?.focus();
    }, 300);
  };

  const handleOtpChange = (value, index) => {
    const cleanValue = value.replace(/[^0-9]/g, "");

    // Support pasting the complete OTP
    if (cleanValue.length > 1) {
      const pastedOtp = cleanValue.slice(0, 6).split("");
      const updatedOtp = ["", "", "", "", "", ""];

      pastedOtp.forEach((digit, digitIndex) => {
        updatedOtp[digitIndex] = digit;
      });

      setOtp(updatedOtp);
      setOtpError("");

      if (pastedOtp.length === 6) {
        setTimeout(() => {
          setCurrentStep("password");
        }, 250);
      } else {
        otpInputs.current[pastedOtp.length]?.focus();
      }

      return;
    }

    const updatedOtp = [...otp];
    updatedOtp[index] = cleanValue;
    setOtp(updatedOtp);
    setOtpError("");

    if (cleanValue && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }

    // Automatically continue after entering the sixth digit
    if (index === 5 && cleanValue) {
      const completedOtp = [...updatedOtp];
      const otpCode = completedOtp.join("");

      if (otpCode.length === 6) {
        setTimeout(() => {
          setCurrentStep("password");
        }, 250);
      }
    }
  };

  const handleOtpKeyPress = (event, index) => {
    if (
      event.nativeEvent.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = () => {
    if (countdown > 0) {
      return;
    }

    // Frontend only:
    // This only resets the countdown.
    setOtp(["", "", "", "", "", ""]);
    setOtpError("");
    setCountdown(60);

    setTimeout(() => {
      otpInputs.current[0]?.focus();
    }, 100);
  };

  const validatePassword = () => {
    if (!newPassword) {
      return "Please enter your new password.";
    }

    if (newPassword.length < 8) {
      return "Password must contain at least 8 characters.";
    }

    if (!/[A-Z]/.test(newPassword)) {
      return "Password must contain at least one uppercase letter.";
    }

    if (!/[a-z]/.test(newPassword)) {
      return "Password must contain at least one lowercase letter.";
    }

    if (!/[0-9]/.test(newPassword)) {
      return "Password must contain at least one number.";
    }

    if (newPassword !== confirmPassword) {
      return "Passwords do not match.";
    }

    return "";
  };

  const handlePasswordContinue = () => {
    setPasswordError("");

    const validationError = validatePassword();

    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    // Frontend only:
    // No password is being updated in the database.
    router.replace({
      pathname: "/login",
      params: {
        passwordChanged: "true",
      },
    });
  };

  const handleBack = () => {
    if (currentStep === "password") {
      setCurrentStep("otp");

      setTimeout(() => {
        otpInputs.current[0]?.focus();
      }, 200);

      return;
    }

    if (currentStep === "otp") {
      setCurrentStep("email");
      return;
    }

    router.back();
  };

  const renderProgress = () => {
    let activeStep = 1;

    if (currentStep === "otp") {
      activeStep = 2;
    }

    if (currentStep === "password") {
      activeStep = 3;
    }

    return (
      <View style={styles.progressContainer}>
        {[1, 2, 3].map((step) => (
          <React.Fragment key={step}>
            <View
              style={[
                styles.progressCircle,
                activeStep >= step && styles.progressCircleActive,
              ]}
            >
              {activeStep > step ? (
                <Feather name="check" size={14} color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.progressNumber,
                    activeStep >= step && styles.progressNumberActive,
                  ]}
                >
                  {step}
                </Text>
              )}
            </View>

            {step < 3 && (
              <View
                style={[
                  styles.progressLine,
                  activeStep > step && styles.progressLineActive,
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };

  const renderEmailStep = () => {
    return (
      <>
        <View style={styles.iconContainer}>
          <Feather name="mail" size={30} color={colors.primary} />
        </View>

        <Text style={styles.title}>Forgot Password?</Text>

        <Text style={styles.description}>
          Enter your registered email address and we will send you a
          six-digit verification code.
        </Text>

        <Text style={styles.inputLabel}>Email Address</Text>

        <View
          style={[
            styles.inputContainer,
            emailError ? styles.inputContainerError : null,
          ]}
        >
          <Feather
            name="mail"
            size={18}
            color={emailError ? "#D94A4A" : colors.textGray}
          />

          <TextInput
            style={styles.textInput}
            placeholder="Enter your email"
            placeholderTextColor={colors.textGray}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setEmailError("");
            }}
            returnKeyType="done"
            onSubmitEditing={handleEmailContinue}
          />
        </View>

        {!!emailError && (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={14} color="#D94A4A" />
            <Text style={styles.errorText}>{emailError}</Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleEmailContinue}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </Pressable>
      </>
    );
  };

  const renderOtpStep = () => {
    return (
      <>
        <View style={styles.iconContainer}>
          <Feather name="shield" size={30} color={colors.primary} />
        </View>

        <Text style={styles.title}>Verify Your Email</Text>

        <Text style={styles.description}>
          We sent a six-digit verification code to
        </Text>

        <Text style={styles.emailText}>{email}</Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(reference) => {
                otpInputs.current[index] = reference;
              }}
              style={[
                styles.otpInput,
                digit ? styles.otpInputFilled : null,
                otpError ? styles.otpInputError : null,
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(event) => handleOtpKeyPress(event, index)}
              keyboardType="number-pad"
              maxLength={index === 0 ? 6 : 1}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        <Text style={styles.otpHelperText}>
          Entering the sixth digit will automatically continue.
        </Text>

        {!!otpError && (
          <View style={styles.errorContainerCenter}>
            <Feather name="alert-circle" size={14} color="#D94A4A" />
            <Text style={styles.errorText}>{otpError}</Text>
          </View>
        )}

        <View style={styles.resendContainer}>
          <Text style={styles.resendQuestion}>
            Didn&apos;t receive the code?
          </Text>

          <Pressable
            onPress={handleResendOtp}
            disabled={countdown > 0}
            style={styles.resendButton}
          >
            <Text
              style={[
                styles.resendText,
                countdown > 0 && styles.resendTextDisabled,
              ]}
            >
              {countdown > 0
                ? `Resend in 00:${String(countdown).padStart(2, "0")}`
                : "Resend OTP"}
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.changeEmailButton}
          onPress={() => setCurrentStep("email")}
        >
          <Feather name="edit-2" size={14} color={colors.primary} />
          <Text style={styles.changeEmailText}>Change email address</Text>
        </Pressable>
      </>
    );
  };

  const renderPasswordStep = () => {
    return (
      <>
        <View style={styles.iconContainer}>
          <Feather name="lock" size={30} color={colors.primary} />
        </View>

        <Text style={styles.title}>Create New Password</Text>

        <Text style={styles.description}>
          Your new password must be different from your previous password.
        </Text>

        <Text style={styles.inputLabel}>New Password</Text>

        <View
          style={[
            styles.inputContainer,
            passwordError ? styles.inputContainerError : null,
          ]}
        >
          <Feather
            name="lock"
            size={18}
            color={passwordError ? "#D94A4A" : colors.textGray}
          />

          <TextInput
            style={styles.textInput}
            placeholder="Enter new password"
            placeholderTextColor={colors.textGray}
            secureTextEntry={!showNewPassword}
            value={newPassword}
            onChangeText={(value) => {
              setNewPassword(value);
              setPasswordError("");
            }}
          />

          <Pressable
            style={styles.eyeButton}
            onPress={() => setShowNewPassword((previous) => !previous)}
          >
            <Feather
              name={showNewPassword ? "eye" : "eye-off"}
              size={18}
              color={colors.textGray}
            />
          </Pressable>
        </View>

        <Text style={styles.inputLabelSecond}>Confirm Password</Text>

        <View
          style={[
            styles.inputContainer,
            passwordError ? styles.inputContainerError : null,
          ]}
        >
          <Feather
            name="lock"
            size={18}
            color={passwordError ? "#D94A4A" : colors.textGray}
          />

          <TextInput
            style={styles.textInput}
            placeholder="Confirm new password"
            placeholderTextColor={colors.textGray}
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              setPasswordError("");
            }}
            returnKeyType="done"
            onSubmitEditing={handlePasswordContinue}
          />

          <Pressable
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword((previous) => !previous)}
          >
            <Feather
              name={showConfirmPassword ? "eye" : "eye-off"}
              size={18}
              color={colors.textGray}
            />
          </Pressable>
        </View>

        {!!passwordError && (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={14} color="#D94A4A" />
            <Text style={styles.errorText}>{passwordError}</Text>
          </View>
        )}

        <View style={styles.passwordRequirements}>
          <Text style={styles.requirementsTitle}>
            Password requirements:
          </Text>

          <RequirementItem
            completed={newPassword.length >= 8}
            text="At least 8 characters"
          />

          <RequirementItem
            completed={/[A-Z]/.test(newPassword)}
            text="At least one uppercase letter"
          />

          <RequirementItem
            completed={/[a-z]/.test(newPassword)}
            text="At least one lowercase letter"
          />

          <RequirementItem
            completed={/[0-9]/.test(newPassword)}
            text="At least one number"
          />

          <RequirementItem
            completed={
              confirmPassword.length > 0 &&
              newPassword === confirmPassword
            }
            text="Passwords match"
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handlePasswordContinue}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </Pressable>
      </>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.page}>
          <Pressable style={styles.backRow} onPress={handleBack}>
            <Feather
              name="chevron-left"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <Image
            source={require("../assets/logo.png")}
            style={styles.logo}
            />

          <View style={styles.card}>
            {renderProgress()}

            {currentStep === "email" && renderEmailStep()}
            {currentStep === "otp" && renderOtpStep()}
            {currentStep === "password" && renderPasswordStep()}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const ImageLogo = () => {
  return (
    <View style={styles.logoWrapper}>
      <View style={styles.logoBackground}>
        <Feather name="smile" size={42} color={colors.primary} />
      </View>
    </View>
  );
};

const RequirementItem = ({ completed, text }) => {
  return (
    <View style={styles.requirementRow}>
      <Feather
        name={completed ? "check-circle" : "circle"}
        size={14}
        color={completed ? colors.primary : colors.textGray}
      />

      <Text
        style={[
          styles.requirementText,
          completed && styles.requirementTextCompleted,
        ]}
      >
        {text}
      </Text>
    </View>
  );
};

export default ForgotPassword;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  page: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    paddingTop: Platform.OS === "ios" ? 54 : 28,
    paddingBottom: 30,
  },

  backRow: {
    height: 36,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  backText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "800",
  },

  logoWrapper: {
    alignItems: "center",
    marginTop: isSmallPhone ? 8 : 14,
    marginBottom: isSmallPhone ? 14 : 20,
  },

  logoBackground: {
    width: isSmallPhone ? 82 : 94,
    height: isSmallPhone ? 82 : 94,
    borderRadius: 47,
    backgroundColor: "#FFF0F6",
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    paddingHorizontal: isSmallPhone ? 20 : 24,
    paddingTop: 25,
    paddingBottom: 30,
    borderWidth: 1,
    borderColor: "#F7E3EC",
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 5,
  },

  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    paddingHorizontal: 20,
  },

  progressCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E7CAD7",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  progressCircleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },

  progressNumber: {
    fontSize: 11,
    color: colors.textGray,
    fontWeight: "800",
  },

  progressNumberActive: {
    color: "#FFFFFF",
  },

  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#E7CAD7",
  },

  progressLineActive: {
    backgroundColor: colors.primary,
  },

  iconContainer: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#FFF0F6",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 17,
  },

  title: {
    fontSize: isSmallPhone ? 22 : 25,
    fontWeight: "900",
    color: colors.primary,
    textAlign: "center",
  },

  description: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: "#858585",
    textAlign: "center",
    fontWeight: "600",
    paddingHorizontal: 6,
  },

  emailText: {
    marginTop: 4,
    fontSize: 12,
    color: colors.primary,
    textAlign: "center",
    fontWeight: "900",
  },

  inputLabel: {
    marginTop: 28,
    marginBottom: 8,
    marginLeft: 3,
    fontSize: 11,
    color: colors.textDark,
    fontWeight: "800",
  },

  inputLabelSecond: {
    marginTop: 14,
    marginBottom: 8,
    marginLeft: 3,
    fontSize: 11,
    color: colors.textDark,
    fontWeight: "800",
  },

  inputContainer: {
    minHeight: isSmallPhone ? 46 : 50,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F2D7E3",
    backgroundColor: "#FFF9FB",
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  inputContainerError: {
    borderColor: "#D94A4A",
    backgroundColor: "#FFF7F7",
  },

  textInput: {
    flex: 1,
    height: "100%",
    marginLeft: 10,
    fontSize: 12,
    color: colors.textDark,
  },

  eyeButton: {
    paddingLeft: 10,
    paddingVertical: 8,
  },

  errorContainer: {
    marginTop: 10,
    paddingHorizontal: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  errorContainerCenter: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  errorText: {
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 16,
    color: "#D94A4A",
    fontWeight: "700",
  },

  continueButton: {
    marginTop: 26,
    height: isSmallPhone ? 48 : 52,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 6,
  },

  buttonPressed: {
    opacity: 0.85,
  },

  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  otpContainer: {
    marginTop: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },

  otpInput: {
    flex: 1,
    maxWidth: 48,
    height: isSmallPhone ? 48 : 53,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#F2D7E3",
    backgroundColor: "#FFF9FB",

    fontSize: isSmallPhone ? 18 : 20,
    color: colors.textDark,
    fontWeight: "900",

    textAlign: "center",
    textAlignVertical: "center",
    paddingHorizontal: 0,
    paddingVertical: 0,
    includeFontPadding: false,
    },

  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: "#FFF0F6",
  },

  otpInputError: {
    borderColor: "#D94A4A",
  },

  otpHelperText: {
    marginTop: 10,
    fontSize: 10,
    color: colors.textGray,
    textAlign: "center",
  },

  resendContainer: {
    marginTop: 24,
    alignItems: "center",
  },

  resendQuestion: {
    fontSize: 11,
    color: colors.textGray,
  },

  resendButton: {
    marginTop: 7,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },

  resendText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "900",
  },

  resendTextDisabled: {
    color: "#AAAAAA",
  },

  changeEmailButton: {
    marginTop: 20,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  changeEmailText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "800",
  },

  passwordRequirements: {
    marginTop: 18,
    padding: 14,
    borderRadius: 15,
    backgroundColor: "#FFF9FB",
    borderWidth: 1,
    borderColor: "#F4DEE8",
  },

  requirementsTitle: {
    marginBottom: 8,
    fontSize: 11,
    color: colors.textDark,
    fontWeight: "900",
  },

  requirementRow: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  requirementText: {
    fontSize: 10,
    color: colors.textGray,
    fontWeight: "600",
  },

  requirementTextCompleted: {
    color: colors.primary,
    fontWeight: "700",
  },

  logo: {
  width: isSmallPhone ? 110 : 130,
  height: isSmallPhone ? 110 : 130,
  resizeMode: "contain",
  alignSelf: "center",
  marginTop: isSmallPhone ? 8 : 14,
  marginBottom: isSmallPhone ? 8 : 14,
},
});