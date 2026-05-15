import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from "@mui/material";
import {
  AutoAwesome as MagicIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useNotificationStore } from "../../stores/notificationStore";
import { useValidateAITimetable, useGenerateAITimetable, useGetAIDraft } from "../../queries/Timetable";
import type { Subject } from "../../types";
import { AppButton } from "../shared/AppButton";

interface AITimetableGenerateDialogProps {
  open: boolean;
  onClose: () => void;
  schoolId: string;
  subjects: Subject[];
  currentClassId?: string;
  currentSectionId?: string;
}

const steps = ["Configure Subject Quotas", "Validation", "Generate"];

const AITimetableGenerateDialog = ({
  open,
  onClose,
  schoolId,
  subjects,
  currentClassId = "",
  currentSectionId = "",
}: AITimetableGenerateDialogProps) => {
  const [activeStep, setActiveStep] = useState(0);

  // Map of subjectId to { periodsPerWeek: number, morningPriority: boolean, maxPeriodsPerDay: number }
  const [rules, setRules] = useState<Record<string, { periodsPerWeek: number, morningPriority: boolean, maxPeriodsPerDay: number }>>(() => {
    const initialRules: Record<string, { periodsPerWeek: number, morningPriority: boolean, maxPeriodsPerDay: number }> = {};
    subjects.forEach((s) => {
      // Default: Math/Science often get priority and max 2/day, others max 2/day
      initialRules[s.subjectId] = {
        periodsPerWeek: 1,
        morningPriority: false,
        maxPeriodsPerDay: 2
      };
    });
    return initialRules;
  });

  const [halfDaySaturday, setHalfDaySaturday] = useState(true);
  const [saturdayPeriods, setSaturdayPeriods] = useState(4);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const { showNotification } = useNotificationStore();
  const validateMutation = useValidateAITimetable(schoolId);
  const generateMutation = useGenerateAITimetable(schoolId);
  const { data: draftData, isLoading: draftLoading } = useGetAIDraft(schoolId);
  const navigate = useNavigate();

  const existingDraft = draftData?.data?.status === "draft" ? draftData.data : null;

  // If user clicks "Resume", navigate to draft with pre-selected class + section in router state
  const handleResumeDraft = () => {
    onClose();
    navigate("/school-admin/timetable/draft", {
      state: {
        classId: currentClassId,
        sectionId: currentSectionId,
      },
    });
  };

  // If user clicks "Generate New", clear the flag to show the stepper
  const [forceNew, setForceNew] = useState(false);

  const showDraftWarning = !forceNew && !!existingDraft && !draftLoading;

  const handleNext = async () => {
    if (activeStep === 0) {
      // Transition to validation
      setActiveStep(1);

      const payloadRules = Object.entries(rules).map(([subjectId, config]) => ({
        subjectId,
        periodsPerWeek: config.periodsPerWeek,
        morningPriority: config.morningPriority,
        maxPeriodsPerDay: config.maxPeriodsPerDay
      }));

      const options = {
        dayLimits: halfDaySaturday ? { saturday: saturdayPeriods } : {}
      };

      try {
        const res = await validateMutation.mutateAsync({ rules: payloadRules, options });
        if (res.data?.isValid) {
          setValidationErrors([]);
        } else {
          setValidationErrors(res.data?.errors || ["Unknown validation error"]);
        }
      } catch (err: any) {
        setValidationErrors([err?.message || "Failed to validate"]);
      }
    } else if (activeStep === 1) {
      if (validationErrors.length > 0) {
        showNotification("Please resolve validation errors first", "error");
        return;
      }
      setActiveStep(2);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleGenerate = async () => {
    const payloadRules = Object.entries(rules).map(([subjectId, config]) => ({
      subjectId,
      periodsPerWeek: config.periodsPerWeek,
      morningPriority: config.morningPriority,
      maxPeriodsPerDay: config.maxPeriodsPerDay
    }));

    const options = {
      dayLimits: halfDaySaturday ? { saturday: saturdayPeriods } : {}
    };

    try {
      await generateMutation.mutateAsync({ rules: payloadRules, options });
      showNotification("AI successfully generated timetable draft", "success");
      onClose();
      setActiveStep(0);
      setForceNew(false);
      navigate("/school-admin/timetable/draft", {
        state: { classId: currentClassId, sectionId: currentSectionId },
      });
    } catch (err: any) {
      showNotification(err?.message || "Generation failed", "error");
    }
  };

  const handleRuleChange = (subjectId: string, field: string, value: any) => {
    setRules(prev => ({
      ...prev,
      [subjectId]: {
        ...prev[subjectId],
        [field]: value
      }
    }));
  };

  return (
    <Dialog open={open} onClose={() => { if (!generateMutation.isPending) { onClose(); setForceNew(false); } }} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MagicIcon color="primary" /> AI Timetable Generation
        </Box>
        <IconButton
          aria-label="close"
          onClick={() => { if (!generateMutation.isPending) { onClose(); setForceNew(false); } }}
          sx={{
            color: (theme: any) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* ---- Draft Exists Warning Screen ---- */}
      {showDraftWarning ? (
        <>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', py: 4, gap: 3 }}>
              <MagicIcon color="secondary" sx={{ fontSize: 64 }} />
              <Typography variant="h6">You have an existing draft (v{existingDraft?.version})</Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
                A school-wide timetable draft already exists. Would you like to resume reviewing it, or generate a brand new one for the entire school?
              </Typography>
              <Alert severity="warning" sx={{ width: '100%', textAlign: 'left' }}>
                Generating a new draft will archive the current one (Version {existingDraft?.version} → archived). The new draft will be generated for ALL active classes in the school.
              </Alert>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button onClick={() => { onClose(); setForceNew(false); }}>Cancel</Button>
            <Box sx={{ flex: '1 1 auto' }} />
            <Button variant="outlined" color="secondary" onClick={handleResumeDraft}>
              Resume Existing Draft (v{existingDraft?.version})
            </Button>
            <AppButton variant="contained" startIcon={<MagicIcon />} onClick={() => setForceNew(true)}>
              Generate New Draft
            </AppButton>
          </DialogActions>
        </>
      ) : (
        <>
          <Box sx={{ width: '100%', pt: 2, px: 3 }}>
            <Stepper activeStep={activeStep}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          <DialogContent sx={{ minHeight: '400px' }}>
            {activeStep === 0 && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Configure the AI rules. Set how many periods per week each subject should get, and check if it should be prioritized for morning slots (e.g., Mathematics).
                </Alert>

                <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.lighter', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={halfDaySaturday}
                        onChange={(e) => setHalfDaySaturday(e.target.checked)}
                      />
                    }
                    label={<Typography variant="body2" fontWeight="bold">Half-Day Saturday</Typography>}
                  />
                  {halfDaySaturday && (
                    <TextField
                      label="Saturday Periods"
                      type="number"
                      size="small"
                      InputProps={{ inputProps: { min: 1, max: 8 } }}
                      value={saturdayPeriods}
                      onChange={(e) => setSaturdayPeriods(parseInt(e.target.value) || 0)}
                      sx={{ width: '130px', bgcolor: 'white' }}
                    />
                  )}
                </Box>

                <List>
                  {subjects.map(subject => (
                    <ListItem key={subject.subjectId} sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 1, border: '1px solid #eee', px: 2 }}>
                      <ListItemText
                        primary={subject.name}
                        secondary={subject.code}
                        sx={{ flex: 1 }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <TextField
                          label="P/Week"
                          type="number"
                          size="small"
                          InputProps={{ inputProps: { min: 0, max: 15 } }}
                          value={rules[subject.subjectId]?.periodsPerWeek || 0}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleRuleChange(subject.subjectId, 'periodsPerWeek', parseInt(e.target.value) || 0)}
                          sx={{ width: '100px' }}
                        />
                        <TextField
                          label="Max / Day"
                          type="number"
                          size="small"
                          title="Max periods of this subject in a single day"
                          InputProps={{ inputProps: { min: 1, max: 8 } }}
                          value={rules[subject.subjectId]?.maxPeriodsPerDay || 1}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleRuleChange(subject.subjectId, 'maxPeriodsPerDay', parseInt(e.target.value) || 1)}
                          sx={{ width: '100px' }}
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={rules[subject.subjectId]?.morningPriority || false}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleRuleChange(subject.subjectId, 'morningPriority', e.target.checked)}
                            />
                          }
                          label={<Typography variant="caption">Morning</Typography>}
                          labelPlacement="bottom"
                        />
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {activeStep === 1 && (
              <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                {validateMutation.isPending ? (
                  <>
                    <CircularProgress sx={{ mb: 2 }} />
                    <Typography>Analyzing school resources & teachers...</Typography>
                  </>
                ) : validationErrors.length > 0 ? (
                  <Box sx={{ width: '100%' }}>
                    <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
                    <Typography variant="h6" color="error" gutterBottom>Validation Failed</Typography>
                    <Alert severity="error" sx={{ textAlign: 'left', mb: 2 }}>
                      The AI cannot mathematically fulfill your requirements based on current teacher assignments.
                    </Alert>
                    <List sx={{ width: '100%', bgcolor: 'error.lighter', borderRadius: 1 }}>
                      {validationErrors.map((err, i) => (
                        <ListItem key={i}>
                          <ListItemText primary={err} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ) : (
                  <Box>
                    <CheckIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
                    <Typography variant="h6" color="success.main" gutterBottom>Perfect!</Typography>
                    <Typography>You have enough teachers to fulfill all subject quotas. The AI is ready to generate the timetable.</Typography>
                  </Box>
                )}
              </Box>
            )}

            {activeStep === 2 && (
              <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                {!generateMutation.isPending ? (
                  <>
                    <MagicIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
                    <Typography variant="h6" gutterBottom>Ready to Generate</Typography>
                    <Typography color="text.secondary">
                      The AI will now build the complete timetable trying its best to avoid any clashes while respecting your morning priorities.
                    </Typography>
                  </>
                ) : (
                  <>
                    <CircularProgress size={60} sx={{ mb: 3 }} />
                    <Typography variant="h6">Generating Schedule...</Typography>
                  </>
                )}
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 3 }}>
            <Button
              disabled={activeStep === 0 || generateMutation.isPending}
              onClick={handleBack}
            >
              Back
            </Button>
            <Box sx={{ flex: '1 1 auto' }} />
            {activeStep === steps.length - 1 ? (
              <AppButton
                variant="contained"
                onClick={handleGenerate}
                loading={generateMutation.isPending}
                startIcon={<MagicIcon />}
              >
                Generate Now
              </AppButton>
            ) : (
              <AppButton
                variant="contained"
                onClick={handleNext}
                loading={validateMutation.isPending}
                disabled={activeStep === 1 && validationErrors.length > 0}
              >
                {activeStep === 0 ? "Validate constraints" : "Next"}
              </AppButton>
            )}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default AITimetableGenerateDialog;
